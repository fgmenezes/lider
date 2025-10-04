import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Role } from '@prisma/client';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== Role.ADMIN) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 403 });
  }
  try {
    const ministryId = params.id;
    const { userId } = await req.json();
    if (!userId || !ministryId) {
      return NextResponse.json({ message: 'Dados obrigatórios não informados' }, { status: 400 });
    }
    // Busca o ministério e igreja
    const ministry = await prisma.ministry.findUnique({
      where: { id: ministryId },
      include: { church: true }
    });
    if (!ministry) {
      return NextResponse.json({ message: 'Ministério não encontrado' }, { status: 404 });
    }
    // Atualiza o usuário: role MASTER, masterMinistryId, churchId
    await prisma.user.update({
      where: { id: userId },
      data: {
        role: 'MASTER',
        masterMinistryId: ministry.id,
        churchId: ministry.churchId,
      }
    });
    // Concede permissões de master (exemplo: adicionar permissões específicas)
    // Aqui você pode criar registros em UserPermission para o usuário, se necessário
    // Exemplo:
    // await prisma.userPermission.createMany({
    //   data: [
    //     { userId, featureId: '...', level: 'MASTER' },
    //     ...
    //   ]
    // });
    return NextResponse.json({ message: 'Líder master associado com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao associar líder master:', error);
    return NextResponse.json({ message: error?.message || 'Erro ao associar líder master' }, { status: 500 });
  }
} 