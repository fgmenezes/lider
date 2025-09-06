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
    console.log('🔐 POST /api/members - Iniciando criação de membro');
    console.log('📍 Headers recebidos:', JSON.stringify(Object.fromEntries(request.headers), null, 2));
    
    // Obter o corpo da requisição
    const body = await request.json();
    console.log('📦 Dados recebidos:', JSON.stringify(body, null, 2));
    
    // Usar o ministryId do corpo da requisição se disponível
    let ministryId = body.ministryId;
    console.log('🏢 MinistryId dos dados:', ministryId);
    
    // Se não tiver ministryId nos dados, buscar o primeiro ministério
    if (!ministryId) {
      console.log('⚠️ ministryId não encontrado nos dados, buscando primeiro ministério');
      
      const firstMinistry = await prisma.ministry.findFirst({
        select: { id: true },
      });
      
      if (firstMinistry) {
        ministryId = firstMinistry.id;
        console.log('🔧 Usando primeiro ministério:', ministryId);
      } else {
        console.log('❌ Erro: Nenhum ministério encontrado no banco de dados');
        return NextResponse.json({ error: 'Configuração do sistema incompleta' }, { status: 500 });
      }
    }
    
    // Validar os dados recebidos
    const validation = createMemberSchema.safeParse(body);
    if (!validation.success) {
      console.log('❌ Erro de validação:', validation.error.errors);
      return NextResponse.json({ errors: validation.error.errors }, { status: 400 });
    }
    
    const validatedData = validation.data;
    console.log('✅ Dados validados com sucesso');

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
      console.log('🔧 Tentando criar membro com os seguintes dados:');
      console.log('Nome:', validatedData.name);
      console.log('Email:', validatedData.email);
      console.log('MinistryId:', ministryId);
      
      // Verificar se o ministério existe
      const ministryExists = await prisma.ministry.findUnique({
        where: { id: ministryId }
      });
      
      if (!ministryExists) {
        console.error('❌ Ministério não encontrado:', ministryId);
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
      
      console.log('✅ Membro criado com sucesso:', newMember.id);
      
      // Processar responsáveis se fornecidos
      if (validatedData.responsaveis && validatedData.responsaveis.length > 0) {
        console.log('👨‍👩‍👧‍👦 Criando responsáveis...');
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
        console.log(`✅ ${validatedData.responsaveis.length} responsáveis criados`);
      }
      
      // Processar vínculos de irmãos se fornecidos
      if (validatedData.irmaosIds && validatedData.irmaosIds.length > 0) {
        console.log('👫 Criando vínculos de irmãos...');
        for (const irmaoId of validatedData.irmaosIds) {
          await prisma.memberIrmao.create({
            data: {
              memberId: newMember.id,
              irmaoId: irmaoId
            }
          });
        }
        console.log(`✅ ${validatedData.irmaosIds.length} vínculos de irmãos criados`);
      }
      
      // Processar vínculos de primos se fornecidos
      if (validatedData.primosIds && validatedData.primosIds.length > 0) {
        console.log('👬 Criando vínculos de primos...');
        for (const primoId of validatedData.primosIds) {
          await prisma.memberPrimo.create({
            data: {
              memberId: newMember.id,
              primoId: primoId
            }
          });
        }
        console.log(`✅ ${validatedData.primosIds.length} vínculos de primos criados`);
      }
      
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
