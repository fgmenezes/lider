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
    const { memberId } = await request.json();
    
    if (!memberId) {
      return NextResponse.json({ error: 'ID do membro não informado' }, { status: 400 });
    }
    
    // Verificar se o membro está associado ao grupo
    const association = await prisma.smallGroupMember.findFirst({
      where: { smallGroupId, memberId },
    });
    
    if (!association) {
      return NextResponse.json({ error: 'Membro não encontrado neste grupo' }, { status: 404 });
    }
    
    // Remover associação
    await prisma.smallGroupMember.delete({
      where: { id: association.id },
    });
    
    return NextResponse.json({ message: 'Membro removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}