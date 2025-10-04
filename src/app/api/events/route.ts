import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateEventSchema, EventFiltersSchema, validateSpecificData } from "@/lib/events/validations";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";
import { getDefaultEventConfig } from "@/lib/events/utils";

// GET /api/events - Listar eventos
export async function GET(request: NextRequest) {
  try {
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Parse dos parâmetros de consulta
    const { searchParams } = new URL(request.url);
    
    const filters = EventFiltersSchema.parse({
      ministryId: searchParams.get("ministryId"),
      type: searchParams.get("type"),
      status: searchParams.get("status"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      search: searchParams.get("search"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });
    

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        permissions: {
          include: { feature: true }
        }
      }
    });

    
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar ministérios do usuário
    const userMinistryIds: string[] = [];
    if (user.ministryId) {
      userMinistryIds.push(user.ministryId);
    }
    if (user.masterMinistryId) {
      userMinistryIds.push(user.masterMinistryId);
    }

    // Criar contexto de permissões
    const permissionContext = createEventPermissionContext(
      user,
      userMinistryIds
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar se pode visualizar eventos
    if (!permissions.canViewEvents()) {
      return NextResponse.json({ error: "Sem permissão para visualizar eventos" }, { status: 403 });
    }

    // Construir filtros de consulta
    const where: any = {};

    // Filtrar por ministérios que o usuário pode ver
    if (user.role !== "ADMIN") {
      const allowedMinistryIds = [];
      
      if (user.role === "MASTER" && user.masterMinistryId) {
        allowedMinistryIds.push(user.masterMinistryId);
      }
      
      if (user.role === "LEADER") {
        allowedMinistryIds.push(...userMinistryIds);
      }

      if (allowedMinistryIds.length > 0) {
        where.ministryId = { in: allowedMinistryIds };
      }
    }

    // Aplicar filtros específicos
    if (filters.ministryId) {
      where.ministryId = filters.ministryId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.startDate = {};
      if (filters.startDate) {
        where.startDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate;
      }
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } }
      ];
    }

    // Calcular paginação
    const skip = (filters.page - 1) * filters.limit;

    // Buscar eventos
    const [events, totalCount] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          ministry: {
            select: { id: true, name: true }
          },
          leaders: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: {
              participants: true,
              registrations: true,
              feedback: true
            }
          }
        },
        orderBy: { startDate: "asc" },
        skip,
        take: filters.limit
      }),
      prisma.event.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / filters.limit);

    return NextResponse.json({
      events,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        totalCount,
        totalPages,
        hasNext: filters.page < totalPages,
        hasPrev: filters.page > 1
      }
    });

  } catch (error) {
    console.error("Erro ao listar eventos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/events - Criar evento
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const data = CreateEventSchema.parse(body);

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        permissions: {
          include: { feature: true }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Buscar ministérios do usuário
    const userMinistryIds: string[] = [];
    if (user.ministryId) {
      userMinistryIds.push(user.ministryId);
    }
    if (user.masterMinistryId) {
      userMinistryIds.push(user.masterMinistryId);
    }

    // Criar contexto de permissões
    const permissionContext = createEventPermissionContext(
      user,
      userMinistryIds
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar se pode criar eventos no ministério especificado
    if (!permissions.canCreateEventInMinistry(data.ministryId)) {
      return NextResponse.json(
        { error: "Sem permissão para criar eventos neste ministério" },
        { status: 403 }
      );
    }

    // Verificar se o ministério existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: data.ministryId }
    });

    if (!ministry) {
      return NextResponse.json({ error: "Ministério não encontrado" }, { status: 404 });
    }

    // Validar dados específicos do tipo de evento
    let validatedSpecificData = null;
    if (data.specificData) {
      try {
        validatedSpecificData = validateSpecificData(data.type, data.specificData);
      } catch (error) {
        return NextResponse.json(
          { error: "Dados específicos do evento inválidos", details: error },
          { status: 400 }
        );
      }
    }

    // Obter configurações padrão para o tipo de evento
    const defaultConfig = getDefaultEventConfig(data.type);

    // Criar evento
    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: defaultConfig.status,
        ministryId: data.ministryId,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants ?? defaultConfig.maxParticipants,
        registrationDeadline: data.registrationDeadline ?? defaultConfig.registrationDeadline,
        cep: data.cep,
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        specificData: validatedSpecificData,
        // Adicionar o criador como líder do evento
        leaders: {
          create: {
            userId: user.id,
            role: "CREATOR"
          }
        }
      },
      include: {
        ministry: {
          select: { id: true, name: true }
        },
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: {
            participants: true,
            registrations: true,
            feedback: true
          }
        }
      }
    });

    return NextResponse.json(event, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar evento:", error);
    
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Dados inválidos", details: error },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}