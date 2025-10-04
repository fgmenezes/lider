import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";
import { z } from "zod";

const AddParticipantSchema = z.object({
  userId: z.string().min(1, "ID do usuário é obrigatório"),
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).default("PENDING"),
  notes: z.string().optional()
});

const UpdateParticipantSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]).optional(),
  notes: z.string().optional()
});

// GET /api/events/[id]/participants - Listar participantes do evento
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

    // Verificar se pode visualizar participantes
    if (!permissions.canViewEvent()) {
      return NextResponse.json({ error: "Sem permissão para visualizar este evento" }, { status: 403 });
    }

    // Buscar participantes
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId: eventId },
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
      orderBy: { createdAt: "asc" }
    });

    return NextResponse.json(participants);

  } catch (error) {
    console.error("Erro ao buscar participantes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/participants - Adicionar participante ao evento
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
    const data = AddParticipantSchema.parse(body);

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
            participants: {
              where: { status: "CONFIRMED" }
            }
          }
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

    // Verificar se pode gerenciar participantes
    if (!permissions.canManageParticipants()) {
      return NextResponse.json({ error: "Sem permissão para gerenciar participantes" }, { status: 403 });
    }

    // Verificar se o usuário a ser adicionado existe
    const participantUser = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!participantUser) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Verificar se já é participante
    const existingParticipant = await prisma.eventParticipant.findFirst({
      where: {
        eventId: eventId,
        userId: data.userId
        
      }
    });

    if (existingParticipant) {
      return NextResponse.json({ error: "Usuário já é participante deste evento" }, { status: 400 });
    }

    // Verificar limite de participantes se status for CONFIRMED
    if (data.status === "CONFIRMED" && event.maxParticipants) {
      if (event._count.participants >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Evento já atingiu o limite máximo de participantes" },
          { status: 400 }
        );
      }
    }

    // Adicionar participante
    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: eventId,
        userId: data.userId,
        status: data.status,
        notes: data.notes
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

    return NextResponse.json(participant, { status: 201 });

  } catch (error) {
    console.error("Erro ao adicionar participante:", error);
    
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

// PUT /api/events/[id]/participants/[userId] - Atualizar participante
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
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
    }

    const body = await request.json();
    const data = UpdateParticipantSchema.parse(body);

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
            participants: {
              where: { status: "CONFIRMED" }
            }
          }
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

    // Verificar se pode gerenciar participantes
    if (!permissions.canManageParticipants()) {
      return NextResponse.json({ error: "Sem permissão para gerenciar participantes" }, { status: 403 });
    }

    // Buscar participante atual
    const currentParticipant = await prisma.eventParticipant.findFirst({
      where: {
        eventId: eventId,
        userId: userId
        
      }
    });

    if (!currentParticipant) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }

    // Verificar limite de participantes se mudando para CONFIRMED
    if (data.status === "CONFIRMED" && 
        currentParticipant.status !== "CONFIRMED" && 
        event.maxParticipants) {
      if (event._count.participants >= event.maxParticipants) {
        return NextResponse.json(
          { error: "Evento já atingiu o limite máximo de participantes" },
          { status: 400 }
        );
      }
    }

    // Atualizar participante
    const updatedParticipant = await prisma.eventParticipant.update({
      where: {
        id: currentParticipant.id
      },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes })
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

    return NextResponse.json(updatedParticipant);

  } catch (error) {
    console.error("Erro ao atualizar participante:", error);
    
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

// DELETE /api/events/[id]/participants/[userId] - Remover participante
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
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: "ID do usuário não fornecido" }, { status: 400 });
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

    // Verificar se pode gerenciar participantes
    if (!permissions.canManageParticipants()) {
      return NextResponse.json({ error: "Sem permissão para gerenciar participantes" }, { status: 403 });
    }

    // Verificar se o participante existe
    const participant = await prisma.eventParticipant.findFirst({
      where: {
        eventId: eventId,
        userId: userId
        
      }
    });

    if (!participant) {
      return NextResponse.json({ error: "Participante não encontrado" }, { status: 404 });
    }

    // Remover participante
    await prisma.eventParticipant.deleteMany({
      where: {
        eventId: eventId,
        userId: userId
        
      }
    });

    return NextResponse.json({ message: "Participante removido com sucesso" });

  } catch (error) {
    console.error("Erro ao remover participante:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}