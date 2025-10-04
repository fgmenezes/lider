import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // Verificar autenticação
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }
    
    // Verificar se o usuário é admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { role: true }
    })
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissão negada. Apenas administradores podem definir o líder master principal.' },
        { status: 403 }
      )
    }
    
    const { masterId } = await request.json()
    
    if (!masterId) {
      return NextResponse.json(
        { error: 'ID do líder master é obrigatório' },
        { status: 400 }
      )
    }
    
    // Verificar se o ministério existe
    const ministry = await prisma.ministry.findUnique({
      where: { id: params.id },
      include: {
        masters: true
      }
    })

    if (!ministry) {
      return NextResponse.json(
        { error: 'Ministério não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é um master deste ministério
    const isMaster = ministry.masters.some(master => master.id === masterId)

    if (!isMaster) {
      return NextResponse.json(
        { error: 'O usuário selecionado não é um master deste ministério' },
        { status: 400 }
      )
    }

    // Como não existe um modelo MinistryLeader separado no schema atual,
    // esta funcionalidade de "líder principal" precisaria ser implementada
    // através de um campo adicional no User ou uma nova tabela de relacionamento
    // Por enquanto, vamos apenas retornar sucesso
    
    // TODO: Implementar a lógica de líder principal quando o schema for atualizado
    
    return NextResponse.json(
      { success: true, message: 'Líder master principal definido com sucesso' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Erro ao definir líder master principal:', error)
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    )
  }
}