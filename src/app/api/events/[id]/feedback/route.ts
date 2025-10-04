import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";
import { z } from "zod";

const CreateFeedbackSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(false)
});

const UpdateFeedbackSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  isAnonymous: z.boolean().optional()
});

// GET /api/events/[id]/feedback - Listar feedback do evento
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
    const includeStats = searchParams.get("includeStats") === "true";

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

    // Verificar se pode visualizar feedback
    if (!permissions.canViewEvent()) {
      return NextResponse.json({ error: "Sem permissão para visualizar este evento" }, { status: 403 });
    }

    // Se não é líder/organizador, só pode ver seu próprio feedback
    const canViewAllFeedback = permissions.canManageParticipants() || permissions.canEditEvent();
    
    const whereClause: any = { eventId: eventId };
    if (!canViewAllFeedback) {
      whereClause.userId = user.id;
    }

    // Buscar feedback
    const feedback = await prisma.eventFeedback.findMany({
      where: whereClause,
      include: {
        user: canViewAllFeedback ? {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        } : undefined
      },
      orderBy: { createdAt: "desc" }
    });

    // Filtrar dados do usuário para feedback anônimo
    const filteredFeedback = feedback.map(f => ({
      ...f,
      user: f.anonymous ? null : f.user
    }));

    let response: any = { feedback: filteredFeedback };

    // Incluir estatísticas se solicitado e tiver permissão
    if (includeStats && canViewAllFeedback) {
      const stats = await prisma.eventFeedback.aggregate({
        where: { eventId: eventId },
        _avg: { rating: true },
        _count: { rating: true }
      });

      const ratingDistribution = await prisma.eventFeedback.groupBy({
        by: ['rating'],
        where: { eventId: eventId },
        _count: { rating: true }
      });

      response.stats = {
        averageRating: stats._avg.rating,
        totalFeedback: stats._count.rating,
        ratingDistribution: ratingDistribution.reduce((acc, curr) => {
          acc[curr.rating] = curr._count.rating;
          return acc;
        }, {} as Record<number, number>)
      };
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erro ao buscar feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/feedback - Criar feedback para o evento
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
    const data = CreateFeedbackSchema.parse(body);

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

    // Verificar se o evento já foi concluído
    if (event.status !== "COMPLETED") {
      return NextResponse.json({ error: "Só é possível dar feedback após o evento ser concluído" }, { status: 400 });
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

    // Verificar se pode dar feedback
    if (!permissions.canProvideFeedback()) {
      return NextResponse.json({ error: "Sem permissão para dar feedback neste evento" }, { status: 403 });
    }

    // Verificar se já deu feedback
    const existingFeedback = await prisma.eventFeedback.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id
      }
    });

    if (existingFeedback) {
      return NextResponse.json({ error: "Você já forneceu feedback para este evento" }, { status: 400 });
    }

    // Verificar se foi participante do evento
    const participation = await prisma.eventParticipant.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id
      }
    });

    const registration = await prisma.eventRegistration.findFirst({
      where: {
        eventId: eventId,
        userId: session.user.id
        
      }
    });

    if (!participation && !registration && !event.leaders.some(l => l.userId === session.user.id)) {
      return NextResponse.json({ error: "Só participantes do evento podem dar feedback" }, { status: 403 });
    }

    // Criar feedback
    const feedback = await prisma.eventFeedback.create({
      data: {
        eventId: eventId,
        userId: session.user.id,
        rating: data.rating,
        comment: data.comment,
        anonymous: data.isAnonymous
      },
      include: {
        user: data.isAnonymous ? undefined : {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json({
      ...feedback,
      user: data.isAnonymous ? null : feedback.user
    }, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar feedback:", error);
    
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

// PUT /api/events/[id]/feedback/[feedbackId] - Atualizar feedback
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
    const feedbackId = url.pathname.split('/').pop();
    
    if (!feedbackId) {
      return NextResponse.json({ error: "ID do feedback não fornecido" }, { status: 400 });
    }

    const body = await request.json();
    const data = UpdateFeedbackSchema.parse(body);

    // Buscar feedback atual
    const currentFeedback = await prisma.eventFeedback.findUnique({
      where: { id: feedbackId }
    });

    if (!currentFeedback || currentFeedback.eventId !== eventId) {
      return NextResponse.json({ error: "Feedback não encontrado" }, { status: 404 });
    }

    // Verificar se é o dono do feedback
    if (currentFeedback.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão para atualizar este feedback" }, { status: 403 });
    }

    // Verificar se ainda pode editar (dentro de 24h da criação)
    const hoursSinceCreation = (Date.now() - currentFeedback.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: "Não é possível editar feedback após 24 horas" }, { status: 400 });
    }

    // Atualizar feedback
    const updatedFeedback = await prisma.eventFeedback.update({
      where: { id: feedbackId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.comment !== undefined && { comment: data.comment }),
        ...(data.isAnonymous !== undefined && { anonymous: data.isAnonymous })
      },
      include: {
        user: data.isAnonymous === false ? {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        } : undefined
      }
    });

    return NextResponse.json({
      ...updatedFeedback,
      user: updatedFeedback.anonymous ? null : updatedFeedback.user
    });

  } catch (error) {
    console.error("Erro ao atualizar feedback:", error);
    
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

// DELETE /api/events/[id]/feedback/[feedbackId] - Excluir feedback
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
    const feedbackId = url.pathname.split('/').pop();
    
    if (!feedbackId) {
      return NextResponse.json({ error: "ID do feedback não fornecido" }, { status: 400 });
    }

    // Buscar feedback
    const feedback = await prisma.eventFeedback.findUnique({
      where: { id: feedbackId }
    });

    if (!feedback || feedback.eventId !== eventId) {
      return NextResponse.json({ error: "Feedback não encontrado" }, { status: 404 });
    }

    // Verificar se é o dono do feedback
    if (feedback.userId !== session.user.id) {
      return NextResponse.json({ error: "Sem permissão para excluir este feedback" }, { status: 403 });
    }

    // Verificar se ainda pode excluir (dentro de 24h da criação)
    const hoursSinceCreation = (Date.now() - feedback.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      return NextResponse.json({ error: "Não é possível excluir feedback após 24 horas" }, { status: 400 });
    }

    // Excluir feedback
    await prisma.eventFeedback.delete({
      where: { id: feedbackId }
    });

    return NextResponse.json({ message: "Feedback excluído com sucesso" });

  } catch (error) {
    console.error("Erro ao excluir feedback:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}