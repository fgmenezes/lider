import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UpdateEventSchema, validateSpecificData } from "@/lib/events/validations";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";

// GET /api/events/[id] - Obter detalhes do evento
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
        ministry: {
          select: { id: true, name: true }
        },
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "asc" }
        },
        smallGroups: {
          include: {
            smallGroup: {
              select: { id: true, name: true }
            }
          }
        },
        materials: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        finances: {
          include: {
            user: {
              select: { id: true, name: true }
            }
          },
          orderBy: { date: "desc" }
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        feedback: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "desc" }
        },
        _count: {
          select: {
            participants: true,
            registrations: true,
            feedback: true,
            materials: true,
            finances: true
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

    // Verificar se pode visualizar o evento
    if (!permissions.canViewEvent()) {
      return NextResponse.json({ error: "Sem permissão para visualizar este evento" }, { status: 403 });
    }

    // Verificar se o usuário tem inscrição no evento
    const userRegistration = event.registrations.find(r => r.userId === user.id);

    return NextResponse.json({
      ...event,
      userRegistration,
      permissions: {
        canEdit: permissions.canEditEvent(),
        canDelete: permissions.canDeleteEvent(),
        canManageParticipants: permissions.canManageParticipants(),
        canManageLeaders: permissions.canManageEventLeaders(),
        canUploadMaterials: permissions.canUploadMaterials(),
        canManageFinances: permissions.canManageEventFinances(),
        canManageRegistrations: permissions.canManageRegistrations(),
        canRegister: permissions.canRegisterForEvent(),
        canProvideFeedback: permissions.canProvideFeedback(),
        canChangeStatus: permissions.canChangeEventStatus()
      }
    });

  } catch (error) {
    console.error("Erro ao buscar evento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PUT /api/events/[id] - Atualizar evento
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
    const body = await request.json();
    const data = UpdateEventSchema.parse({ ...body, id: eventId });

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

    // Buscar evento atual
    const currentEvent = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        leaders: {
          select: { userId: true }
        }
      }
    });

    if (!currentEvent) {
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
      currentEvent
    );
    const permissions = new EventPermissions(permissionContext);

    // Verificar se pode editar o evento
    if (!permissions.canEditEvent()) {
      return NextResponse.json({ error: "Sem permissão para editar este evento" }, { status: 403 });
    }

    // Validar dados específicos do tipo de evento se fornecidos
    let validatedSpecificData = undefined;
    if (data.specificData !== undefined) {
      if (data.specificData === null) {
        validatedSpecificData = null;
      } else {
        try {
          const eventType = data.type || currentEvent.type;
          validatedSpecificData = validateSpecificData(eventType, data.specificData);
        } catch (error) {
          return NextResponse.json(
            { error: "Dados específicos do evento inválidos", details: error },
            { status: 400 }
          );
        }
      }
    }

    // Atualizar evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.maxParticipants !== undefined && { maxParticipants: data.maxParticipants }),
        ...(data.registrationDeadline !== undefined && { registrationDeadline: data.registrationDeadline }),
        ...(data.cep !== undefined && { cep: data.cep }),
        ...(data.street !== undefined && { street: data.street }),
        ...(data.number !== undefined && { number: data.number }),
        ...(data.complement !== undefined && { complement: data.complement }),
        ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(validatedSpecificData !== undefined && { specificData: validatedSpecificData }),
      },
      include: {
        ministry: {
          select: { id: true, name: true }
        },
        leaders: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
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

    return NextResponse.json(updatedEvent);

  } catch (error) {
    console.error("Erro ao atualizar evento:", error);
    
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

// DELETE /api/events/[id] - Excluir evento
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

    // Verificar se pode excluir o evento
    if (!permissions.canDeleteEvent()) {
      return NextResponse.json({ error: "Sem permissão para excluir este evento" }, { status: 403 });
    }

    // Verificar se o evento pode ser excluído (não pode ter participantes confirmados)
    const confirmedParticipants = await prisma.eventParticipant.count({
      where: {
        eventId: eventId,
        status: "CONFIRMED"
      }
    });

    if (confirmedParticipants > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir evento com participantes confirmados" },
        { status: 400 }
      );
    }

    // Excluir evento (cascade irá remover relacionamentos)
    await prisma.event.delete({
      where: { id: eventId }
    });

    // Registrar atividade de exclusão
    await prisma.atividade.create({
      data: {
        tipo: 'EVENTO',
        acao: 'EXCLUIR',
        descricao: `Evento excluído: ${event.title}`,
        detalhes: `Data: ${event.startDate ? new Date(event.startDate).toLocaleDateString('pt-BR') : 'N/A'}, Local: ${event.street || 'N/A'}`,
        entidadeId: eventId,
        usuarioId: session.user.id,
        ministryId: event.ministryId,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      }
    });

    return NextResponse.json({ message: "Evento excluído com sucesso" });

  } catch (error) {
    console.error("Erro ao excluir evento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}