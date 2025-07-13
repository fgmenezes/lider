import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Importar authOptions do arquivo centralizado
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role, Feature, MinistryFeature, UserPermission } from '@prisma/client'; // Importando tipos do Prisma

// Estendendo tipos para incluir relações selecionadas na query do Prisma
type MinistryFeatureWithFeature = MinistryFeature & { feature: Feature };
type UserPermissionWithFeature = UserPermission & { feature: Feature };

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      role: true,
      ministryId: true,
      permissions: {
        select: {
          feature: {
            select: {
              name: true,
              // Selecionar o id também para garantir que o tipo Feature esteja completo o suficiente
              id: true,
              description: true,
              isActive: true,
            },
          },
          level: true,
        },
      },
      masterOf: { // Para Líderes Master, pegar as features do ministério
        select: {
          features: {
            select: {
              feature: {
                select: {
                   name: true,
                   id: true,
                   description: true,
                   isActive: true,
                },
              },
              isEnabled: true,
              id: true, // Incluir id para corresponder ao tipo MinistryFeature
              ministryId: true,
              featureId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
  }

  // Para Admin, todas as features são consideradas habilitadas e com permissão total,
  // mas apenas se a feature estiver globalmente ativa
  if (user.role === Role.ADMIN) {
    const allFeatures = await prisma.feature.findMany({
      where: { isActive: true }, // Adicionado filtro por isActive
      select: { name: true }
    });
    const adminPermissions = allFeatures.map((feature: { name: string }) => ({
      name: feature.name,
      isEnabled: true, // Para Admin, consideramos habilitado no ministério (globalmente)
      level: 'FULL', // Admins têm acesso total
    }));
    return NextResponse.json(adminPermissions);
  }

  // Para Líder Master e Líder, filtrar baseado nas features do ministério,
  // se a feature global estiver ativa, e permissões do usuário
  const ministryFeatures = (user.masterOf?.features || []) as MinistryFeatureWithFeature[];

  const userFeatures = ministryFeatures
    .filter(mf => mf.feature.isActive) // Adicionado filtro: verificar se a feature global está ativa
    .filter(mf => mf.isEnabled) // Manter filtro: verificar se a feature está habilitada no ministério
    .map((mf) => {
    // Encontrar a permissão do usuário para esta feature específica, tratando o array como tipo estendido
    const userPermission = (user.permissions as UserPermissionWithFeature[]).find(
      (p) => p.feature.name === mf.feature.name
    );

    return {
      name: mf.feature.name,
      isEnabled: mf.isEnabled, // Manter esta informação, embora já filtrada
      level: userPermission?.level || 'NONE', // Permissão específica do usuário ou NONE
    };
  })
  .filter(feature => feature.level !== 'NONE'); // Manter filtro final por nível de permissão

  return NextResponse.json(userFeatures);
} 