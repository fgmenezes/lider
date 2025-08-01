import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const { id: smallGroupId } = params;
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não informado' }, { status: 400 });
    }
    
    // Verificar se o líder está associado ao grupo
    const association = await prisma.smallGroupLeader.findFirst({
      where: { smallGroupId, userId },
    });
    
    if (!association) {
      return NextResponse.json({ error: 'Líder não encontrado neste grupo' }, { status: 404 });
    }
    
    // Remover associação
    await prisma.smallGroupLeader.delete({
      where: { id: association.id },
    });
    
    return NextResponse.json({ message: 'Líder removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover líder:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}