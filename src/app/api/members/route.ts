import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Esquema de validação para criação de membro (sem senha)
const createMemberSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
  estadoCivil: z.string().optional(),
  cep: z.string().optional(),
  rua: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  estado: z.string().optional(),
  batizado: z.boolean().optional(),
  dataIngresso: z.string().optional(),
  status: z.string().optional(),
  responsaveis: z.array(z.object({
    nome: z.string(),
    celular: z.string(),
    tipo: z.string()
  })).optional(),
  irmaosIds: z.array(z.string()).optional(),
  primosIds: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    
    // Obter o corpo da requisição
    const body = await request.json();
    
    // Usar o ministryId do corpo da requisição se disponível
    let ministryId = body.ministryId;
    
    // Se não tiver ministryId nos dados, buscar o primeiro ministério
    if (!ministryId) {
      
      const firstMinistry = await prisma.ministry.findFirst({
        select: { id: true },
      });
      
      if (firstMinistry) {
        ministryId = firstMinistry.id;
      } else {
        return NextResponse.json({ error: 'Configuração do sistema incompleta' }, { status: 500 });
      }
    }
    
    // Validar os dados recebidos
    const validation = createMemberSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }
    
    const validatedData = validation.data;

    // Verifica se já existe um membro com o mesmo e-mail no mesmo ministério (apenas se email foi fornecido)
    if (validatedData.email && validatedData.email.trim()) {
      const existingUser = await prisma.member.findFirst({
        where: {
          email: validatedData.email,
          ministryId: ministryId,
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'Usuário já existe neste ministério' }, { status: 409 });
      }
    }

    // Converte dataNascimento e dataIngresso para DateTime se fornecidos
    let dataNascimento = null;
    if (validatedData.dataNascimento) {
      dataNascimento = new Date(validatedData.dataNascimento);
    }

    let dataIngresso = null;
    if (validatedData.dataIngresso) {
      dataIngresso = new Date(validatedData.dataIngresso);
    }

    // Cria novo membro vinculado ao ministério - VERSÃO SIMPLIFICADA
    try {
      
      // Verificar se o ministério existe
      const ministryExists = await prisma.ministry.findUnique({
        where: { id: ministryId }
      });
      
      if (!ministryExists) {
        return NextResponse.json({ error: 'Ministério não encontrado' }, { status: 404 });
      }
      
      // Converter datas se necessário
      let dataNascimento = null;
      if (validatedData.dataNascimento) {
        dataNascimento = new Date(validatedData.dataNascimento);
      }
      
      let dataIngresso = null;
      if (validatedData.dataIngresso) {
        dataIngresso = new Date(validatedData.dataIngresso);
      }
      
      // Criar membro com todos os dados
      const newMember = await prisma.member.create({
        data: {
          name: validatedData.name,
          email: validatedData.email || '',
          phone: validatedData.phone || '',
          dataNascimento,
          dataIngresso,
          sexo: validatedData.sexo || '',
          estadoCivil: validatedData.estadoCivil || '',
          cep: validatedData.cep || '',
          rua: validatedData.rua || '',
          numero: validatedData.numero || '',
          complemento: validatedData.complemento || '',
          bairro: validatedData.bairro || '',
          municipio: validatedData.municipio || '',
          estado: validatedData.estado || '',
          batizado: validatedData.batizado || false,
          status: validatedData.status || 'ATIVO',
          ministryId: ministryId
        },
      });

      // Processar responsáveis se fornecidos
      if (validatedData.responsaveis && validatedData.responsaveis.length > 0) {
        for (const responsavel of validatedData.responsaveis) {
          await prisma.responsavel.create({
            data: {
              nome: responsavel.nome,
              celular: responsavel.celular,
              tipo: responsavel.tipo,
              memberId: newMember.id
            }
          });
        }
      }
      
      // Processar vínculos de irmãos se fornecidos
      if (validatedData.irmaosIds && validatedData.irmaosIds.length > 0) {
        for (const irmaoId of validatedData.irmaosIds) {
          await prisma.memberIrmao.create({
            data: {
              memberId: newMember.id,
              irmaoId: irmaoId
            }
          });
        }
      }
      
      // Processar vínculos de primos se fornecidos
      if (validatedData.primosIds && validatedData.primosIds.length > 0) {
        for (const primoId of validatedData.primosIds) {
          await prisma.memberPrimo.create({
            data: {
              memberId: newMember.id,
              primoId: primoId
            }
          });
        }
      }
      
      // Registrar atividade de criação
      await prisma.atividade.create({
        data: {
          tipo: 'MEMBRO',
          acao: 'CRIAR',
          descricao: `Membro criado: ${newMember.name}`,
          detalhes: JSON.stringify({
            memberId: newMember.id,
            memberName: newMember.name,
            memberEmail: newMember.email,
            memberPhone: newMember.phone,
            status: newMember.status
          }),
          entidadeId: newMember.id,
          usuarioId: session.user.id,
          ministryId: ministryId,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });

      // Buscar o membro criado com todas as relações para retornar
      const memberWithRelations = await prisma.member.findUnique({
        where: { id: newMember.id },
        include: {
          ministry: true,
          responsaveis: true,
          irmaos: { include: { irmao: true } },
          primos: { include: { primo: true } }
        }
      });
      
      // Retorna o membro criado com todas as relações
      return NextResponse.json(memberWithRelations, { status: 201 });
    } catch (createError) {
      console.error('❌ Erro ao criar membro:', createError);
      return NextResponse.json({ error: 'Erro ao criar membro no banco de dados' }, { status: 500 });
    }

  } catch (error) {
    console.error('Erro ao criar membro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// GET: Lista todos os membros do ministério do usuário autenticado
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Suporte a múltiplos perfis
    let ministryId = session.user.ministryId;
    if (session.user.role === 'MASTER') {
      ministryId = session.user.masterMinistryId;
    }
    
    // Permitir sobrescrever o ministryId para casos específicos (como seleção de membros para grupos)
    const { searchParams } = new URL(req.url);
    const overrideMinistryId = searchParams.get('ministryId');
    if (overrideMinistryId) {
      ministryId = overrideMinistryId;
    }

    if (!ministryId) {
      return NextResponse.json({ error: 'Usuário sem ministério associado' }, { status: 400 });
    }

    // Filtros via query string
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const sortField = searchParams.get('sortField') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const skip = (page - 1) * perPage;

    // Montar where dinâmico
    const where: any = { ministryId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) {
      where.status = status;
    }

    // Ordenação dinâmica
    const orderBy: any = {};
    orderBy[sortField] = sortOrder;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      prisma.member.count({ where }),
    ]);

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      members,
      pagination: {
        page,
        perPage,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Erro ao listar membros:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
