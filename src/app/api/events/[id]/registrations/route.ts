import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";
import { z } from "zod";

const CreateRegistrationSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório").optional(),
  registrationData: z.record(z.any()).optional(),
  notes: z.string().optional()
});

const UpdateRegistrationSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
  registrationData: z.record(z.any()).optional(),
  notes: z.string().optional(),
  adminNotes: z.string().optional()
});

// GET /api/events/[id]/registrations - Listar inscrições do evento
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

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

    // Buscar evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leaders: {
          select: { userId: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
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
      userMinistryIds,
      event
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar se pode visualizar inscrições
    if (!permissions.canManageRegistrations() && !permissions.canViewEvent()) {
      return NextResponse.json({ error: "Sem permissão para visualizar inscrições" }, { status: 403 });
    }

    // Se não pode gerenciar inscrições, só pode ver suas próprias
    const whereClause: any = { eventId: eventId };
    if (!permissions.canManageRegistrations()) {
      whereClause.userId = user.id;
    }

    // Filtrar por status se fornecido
    if (status) {
      whereClause.status = status;
    }

    // Buscar inscrições
    const registrations = await prisma.eventRegistration.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            celular: true,
            dataNascimento: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(registrations);

  } catch (error) {
    console.error("Erro ao buscar inscrições:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/registrations - Criar inscrição no evento
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();
    const data = CreateRegistrationSchema.parse(body);

    // Se não fornecido userId, usar o do usuário logado
    const targetUserId = data.userId || session.user.id;

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

    // Buscar evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leaders: {
          select: { userId: true }
        },
        _count: {
          select: {
            registrations: {
              where: { status: "APPROVED" }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Verificar se o evento ainda aceita inscrições
    if (event.status === "CANCELLED") {
      return NextResponse.json({ error: "Evento foi cancelado" }, { status: 400 });
    }

    if (event.status === "COMPLETED") {
      return NextResponse.json({ error: "Evento já foi concluído" }, { status: 400 });
    }

    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      return NextResponse.json({ error: "Prazo de inscrição expirado" }, { status: 400 });
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
      userMinistryIds,
      event
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar permissões
    if (targetUserId !== session.user.id && !permissions.canManageRegistrations()) {
      return NextResponse.json({ error: "Sem permissão para inscrever outros usuários" }, { status: 403 });
    }

    if (targetUserId === session.user.id && !permissions.canRegisterForEvent()) {
      return NextResponse.json({ error: "Sem permissão para se inscrever neste evento" }, { status: 403 });
    }

    // Verificar se o usuário alvo existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se já existe inscrição
    const existingRegistration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: targetUserId
        
      }
    });

    if (existingRegistration) {
      return NextResponse.json({ error: "Usuário já possui inscrição neste evento" }, { status: 400 });
    }

    // Verificar limite de inscrições aprovadas
    if (event.maxParticipants && event._count.registrations >= event.maxParticipants) {
      return NextResponse.json(
        { error: "Evento já atingiu o limite máximo de inscrições" },
        { status: 400 }
      );
    }

    // Criar inscrição
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: eventId,
        userId: targetUserId,
        registrationData: data.registrationData || {},
        notes: data.notes,
        status: "PENDING"
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            celular: true,
            dataNascimento: true
          }
        }
      }
    });

    return NextResponse.json(registration, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar inscrição:", error);
    
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

// PUT /api/events/[id]/registrations/[registrationId] - Atualizar inscrição
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventId = params.id;
    const url = new URL(request.url);
    const registrationId = url.pathname.split('/').pop();
    
    if (!registrationId) {
      return NextResponse.json({ error: "ID da inscrição não fornecido" }, { status: 400 });
    }

    const body = await request.json();
    const data = UpdateRegistrationSchema.parse(body);

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

    // Buscar evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leaders: {
          select: { userId: true }
        },
        _count: {
          select: {
            registrations: {
              where: { status: "APPROVED" }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Buscar inscrição atual
    const currentRegistration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!currentRegistration || currentRegistration.eventId !== eventId) {
      return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
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
      userMinistryIds,
      event
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar permissões
    const isOwnRegistration = currentRegistration.userId === session.user.id;
    const canManage = permissions.canManageRegistrations();

    if (!isOwnRegistration && !canManage) {
      return NextResponse.json({ error: "Sem permissão para atualizar esta inscrição" }, { status: 403 });
    }

    // Se não pode gerenciar, só pode atualizar dados próprios (não status ou adminNotes)
    if (!canManage) {
      if (data.status !== undefined || data.adminNotes !== undefined) {
        return NextResponse.json({ error: "Sem permissão para alterar status ou notas administrativas" }, { status: 403 });
      }
    }

    // Verificar limite se aprovando inscrição
    if (data.status === "APPROVED" && 
        currentRegistration.status !== "APPROVED" && 
        event.maxParticipants) {
      if (event._count.registrations >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Evento já atingiu o limite máximo de inscrições aprovadas" },
          { status: 400 }
        );
      }
    }

    // Atualizar inscrição
    const updatedRegistration = await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.registrationData !== undefined && { registrationData: data.registrationData }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            celular: true,
            dataNascimento: true
          }
        }
      }
    });

    return NextResponse.json(updatedRegistration);

  } catch (error) {
    console.error("Erro ao atualizar inscrição:", error);
    
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

// DELETE /api/events/[id]/registrations/[registrationId] - Cancelar inscrição
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const eventId = params.id;
    const url = new URL(request.url);
    const registrationId = url.pathname.split('/').pop();
    
    if (!registrationId) {
      return NextResponse.json({ error: "ID da inscrição não fornecido" }, { status: 400 });
    }

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

    // Buscar evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leaders: {
          select: { userId: true }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
    }

    // Buscar inscrição
    const registration = await prisma.eventRegistration.findUnique({
      where: { id: registrationId }
    });

    if (!registration || registration.eventId !== eventId) {
      return NextResponse.json({ error: "Inscrição não encontrada" }, { status: 404 });
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
      userMinistryIds,
      event
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar permissões
    const isOwnRegistration = registration.userId === session.user.id;
    const canManage = permissions.canManageRegistrations();

    if (!isOwnRegistration && !canManage) {
      return NextResponse.json({ error: "Sem permissão para cancelar esta inscrição" }, { status: 403 });
    }

    // Cancelar inscrição (marcar como CANCELLED ao invés de deletar)
    await prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: "CANCELLED" }
    });

    return NextResponse.json({ message: "Inscrição cancelada com sucesso" });

  } catch (error) {
    console.error("Erro ao cancelar inscrição:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}