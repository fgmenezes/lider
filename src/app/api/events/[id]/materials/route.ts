import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventPermissions, createEventPermissionContext } from "@/lib/events/permissions";
import { z } from "zod";

const CreateMaterialSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  url: z.string().url("URL inválida").optional(),
  fileKey: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional()
});

const UpdateMaterialSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").optional(),
  description: z.string().optional(),
  url: z.string().url("URL inválida").optional(),
  fileKey: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional()
});

// GET /api/events/[id]/materials - Listar materiais do evento
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
    const type = searchParams.get("type");

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

    // Verificar se pode visualizar o evento
    if (!permissions.canViewEvent()) {
      return NextResponse.json({ error: "Sem permissão para visualizar este evento" }, { status: 403 });
    }

    // Filtros para materiais
    const whereClause: any = { eventId: eventId };
    
    // Se não pode gerenciar materiais, só vê materiais públicos
    if (!permissions.canUploadMaterials()) {
      whereClause.isPublic = true;
    }

    // Filtrar por tipo se fornecido
    if (type) {
      whereClause.type = type;
    }

    // Buscar materiais
    const materials = await prisma.eventMaterial.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(materials);

  } catch (error) {
    console.error("Erro ao buscar materiais:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST /api/events/[id]/materials - Adicionar material ao evento
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
    const data = CreateMaterialSchema.parse(body);

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

    // Verificar se pode fazer upload de materiais
    if (!permissions.canUploadMaterials()) {
      return NextResponse.json({ error: "Sem permissão para adicionar materiais" }, { status: 403 });
    }

    // Validar que pelo menos URL ou arquivo foi fornecido
    if (!data.url && !data.fileKey) {
      return NextResponse.json({ error: "URL ou arquivo deve ser fornecido" }, { status: 400 });
    }

    // Criar material
    const material = await prisma.eventMaterial.create({
      data: {
        eventId: eventId,
        uploadedBy: session.user.id,
        name: data.title,
        description: data.description,
        fileUrl: data.url,
        fileKey: data.fileKey,
        mimeType: data.mimeType,
        fileSize: data.fileSize
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(material, { status: 201 });

  } catch (error) {
    console.error("Erro ao criar material:", error);
    
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

// PUT /api/events/[id]/materials/[materialId] - Atualizar material
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
    const materialId = url.pathname.split('/').pop();
    
    if (!materialId) {
      return NextResponse.json({ error: "ID do material não fornecido" }, { status: 400 });
    }

    const body = await request.json();
    const data = UpdateMaterialSchema.parse(body);

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

    // Buscar material atual
    const currentMaterial = await prisma.eventMaterial.findUnique({
      where: { id: materialId }
    });

    if (!currentMaterial || currentMaterial.eventId !== eventId) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
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
    const isOwner = currentMaterial.uploadedBy === session.user.id;
    const canManage = permissions.canUploadMaterials();

    if (!isOwner && !canManage) {
      return NextResponse.json({ error: "Sem permissão para atualizar este material" }, { status: 403 });
    }

    // Atualizar material
    const updatedMaterial = await prisma.eventMaterial.update({
      where: { id: materialId },
      data: {
        ...(data.title !== undefined && { name: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.url !== undefined && { fileUrl: data.url }),
        ...(data.fileKey !== undefined && { fileKey: data.fileKey }),
        ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
        ...(data.mimeType !== undefined && { mimeType: data.mimeType })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    return NextResponse.json(updatedMaterial);

  } catch (error) {
    console.error("Erro ao atualizar material:", error);
    
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

// DELETE /api/events/[id]/materials/[materialId] - Excluir material
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
    const materialId = url.pathname.split('/').pop();
    
    if (!materialId) {
      return NextResponse.json({ error: "ID do material não fornecido" }, { status: 400 });
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

    // Buscar material
    const material = await prisma.eventMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material || material.eventId !== eventId) {
      return NextResponse.json({ error: "Material não encontrado" }, { status: 404 });
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
    const isOwner = material.uploadedBy === session.user.id;
    const canManage = permissions.canUploadMaterials();

    if (!isOwner && !canManage) {
      return NextResponse.json({ error: "Sem permissão para excluir este material" }, { status: 403 });
    }

    // Excluir material
    await prisma.eventMaterial.delete({
      where: { id: materialId }
    });

    return NextResponse.json({ message: "Material excluído com sucesso" });

  } catch (error) {
    console.error("Erro ao excluir material:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}