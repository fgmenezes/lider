import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const data = await request.json();
    
    // Validar dados obrigatórios
    const requiredFields = [
      'name', 'churchName', 'churchPhone', 'churchEmail',
      'pastorName', 'pastorPhone', 'pastorEmail',
      'cep', 'rua', 'numero', 'bairro', 'municipio', 'estado'
    ];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Campo obrigatório não informado: ${field}` },
          { status: 400 }
        );
      }
    }

    // 1. Criar a igreja primeiro
    const church = await prisma.church.create({
      data: {
        name: data.churchName,
        phone: data.churchPhone,
        email: data.churchEmail,
      }
    });

    // 2. Criar o ministério associado à igreja
    const ministryData: any = {
      name: data.name,
      churchId: church.id,
      churchName: data.churchName,
      churchPhone: data.churchPhone,
      churchEmail: data.churchEmail,
      pastorName: data.pastorName,
      pastorPhone: data.pastorPhone,
      pastorEmail: data.pastorEmail,
      cep: data.cep,
      rua: data.rua,
      numero: data.numero,
      complemento: data.complemento || '',
      bairro: data.bairro,
      municipio: data.municipio,
      estado: data.estado,
      status: data.status || 'ATIVO',
    };
    if (data.masterId) {
      ministryData.masterId = data.masterId;
    }
    const ministry = await prisma.ministry.create({ data: ministryData });
    return NextResponse.json({ message: 'Ministério criado com sucesso', ministry });
  } catch (error: any) {
    console.error('Erro ao criar ministério:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;
    const [total, ministries] = await Promise.all([
      prisma.ministry.count(),
      prisma.ministry.findMany({
        include: {
          master: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      })
    ]);
    const totalPages = Math.ceil(total / perPage);
    return NextResponse.json({
      ministries,
      total,
      totalPages,
      page,
      perPage
    });
  } catch (error: any) {
    console.error('Erro ao buscar ministérios:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// TODO: Adicionar rota GET para listar ministérios (para a tabela na página)

// Para suportar edição e exclusão de ministérios, crie src/app/api/ministries/[id]/route.ts com métodos GET, PUT e DELETE para um ministério específico. 