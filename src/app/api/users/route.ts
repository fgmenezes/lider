import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hash } from 'bcrypt';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const onlyAvailableMasters = searchParams.get('onlyAvailableMasters') === 'true';
    let whereClause: any = {};
    const ministryId = searchParams.get('ministryId');

    // Se o usuário for MASTER, sempre filtrar pelo ministryId do usuário logado
    if (session.user.role === 'MASTER') {
      whereClause.ministryId = session.user.ministryId;
    } else if (ministryId) {
      whereClause.ministryId = ministryId;
    }

    if (role) {
      const roles = role.split(',').map(r => r.trim());
      whereClause.role = { in: roles };
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    // Filtro especial: só usuários que NÃO são líderes master e NÃO têm ministryId
    if (onlyAvailableMasters) {
      whereClause.OR = undefined; // ignora busca textual
      whereClause.AND = [
        { OR: [ { role: null }, { AND: [ { NOT: { role: 'MASTER' } }, { NOT: { role: 'ADMIN' } } ] } ] },
        { ministryId: null }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          celular: true, // telefone
          isActive: true, // status
          ministry: {
            select: {
              id: true,
              name: true,
              church: { select: { name: true } }
            }
          }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      users,
      total,
      page,
    });
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  // Verificar se o usuário está autenticado
  if (!session?.user) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  // Verificar permissões: ADMIN pode criar qualquer usuário, MASTER pode criar LEADER e MASTER
  const userRole = session.user.role;
  if (userRole !== Role.ADMIN && userRole !== Role.MASTER) {
    return NextResponse.json({ message: 'Permissão insuficiente' }, { status: 403 });
  }

  try {
    const body = await req.json();
    
    // Mapear campos do modal para campos do banco
    const {
      // Campos do modal
      nomeCompleto,
      dataNascimento,
      idade, // Calculado automaticamente, não salvar no banco
      sexo,
      estadoCivil,
      celular,
      email, // Email de contato
      cep,
      rua,
      numero,
      complemento,
      bairro,
      municipio,
      estado,
      tipoLider,
      emailLogin, // Email para login
      senha,
      confirmarSenha, // Não salvar no banco
      permissoesGranulares, // Será tratado separadamente
      ministryId, // Será ignorado e substituído pelo ministryId do usuário logado
      // Campos adicionais que podem vir do modal
      dataIngresso,
      isActive,
    } = body;

    // Validações básicas
    if (!nomeCompleto || !emailLogin || !senha) {
      return NextResponse.json({ message: 'Nome completo, email de login e senha são obrigatórios' }, { status: 400 });
    }

    // Validações de permissão baseadas no role
    if (userRole === Role.MASTER) {
      // MASTER só pode criar LEADER ou MASTER
      if (tipoLider && tipoLider !== Role.LEADER && tipoLider !== Role.MASTER) {
        return NextResponse.json({ message: 'Líder master só pode criar líderes ou outros líderes master' }, { status: 403 });
      }
    }

    // Garantir que o ministryId seja sempre o do usuário autenticado
    // Ignorar qualquer ministryId enviado pelo frontend
    const authenticatedUserMinistryId = session.user.ministryId;

    // Gerar hash da senha
    const hashedPassword = await hash(senha, 10);
    
    // Converter datas de string para Date se necessário
    let dataIngressoDate = dataIngresso ? new Date(dataIngresso) : undefined;
    let dataNascimentoDate = dataNascimento ? new Date(dataNascimento) : undefined;
    
    // Criar o usuário com os campos mapeados corretamente
    const user = await prisma.user.create({
      data: {
        // Mapeamento dos campos
        name: nomeCompleto, // nomeCompleto → name
        email: emailLogin, // emailLogin → email (email de login)
        password: hashedPassword, // senha → password (hash)
        role: tipoLider || Role.LEADER, // tipoLider → role
        ministryId: authenticatedUserMinistryId, // Sempre usar o ministryId do usuário autenticado
        
        // Campos de perfil
        isActive: isActive !== undefined ? isActive : true,
        dataIngresso: dataIngressoDate,
        celular,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        municipio,
        estado,
        sexo,
        estadoCivil,
        dataNascimento: dataNascimentoDate,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    // TODO: Se houver permissoesGranulares, criar as permissões granulares
    // Isso seria implementado em uma tabela separada de permissões
    if (permissoesGranulares && tipoLider === 'CUSTOM') {
      // Implementar criação de permissões granulares
      // await createGranularPermissions(user.id, permissoesGranulares);
    }
    
    return NextResponse.json({ user }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ message: error?.message || String(error) || 'Erro ao criar usuário' }, { status: 500 });
  }
} 