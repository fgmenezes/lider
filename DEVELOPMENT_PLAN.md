# Plano de Desenvolvimento - Sistema de Gerenciamento de Ministérios

## 1. Estrutura do Sistema

### Hierarquia de Usuários
1. **Administrador Geral**
   - Acesso total ao sistema
   - Criação de contas de ministérios
   - Gerenciamento de features flags globais
   - Acesso a todos os ministérios (somente visualização)

2. **Líder Master (por Ministério)**
   - Acesso total ao seu ministério
   - Gerenciamento de líderes do ministério
   - Configuração de permissões por líder
   - Gerenciamento de features do ministério
   - Associação com igreja

3. **Líder (por Ministério)**
   - Acesso baseado em permissões configuradas
   - Permissões granulares por feature
   - Níveis de acesso configuráveis

### Níveis de Permissão
```typescript
enum PermissionLevel {
  NONE = 'NONE',
  READ = 'READ',
  WRITE = 'WRITE',
  FULL = 'FULL'
}
```

### Estrutura da Dashboard por Perfil
Com base na hierarquia de usuários, a estrutura da dashboard será adaptada para cada perfil, visando clareza e relevância:

1.  **Administrador Geral:**
    - Dashboard dedicada com visão de alto nível e global do sistema.
    - Rota sugerida: `/admin` (ou similar).
    - Conteúdo: Métricas globais, gerenciamento de ministérios, usuários (Líderes Master), etc.

2.  **Líder Master:**
    - Dashboard principal com foco nas informações e gerenciamento do ministério ao qual está associado.
    - Rota sugerida: `/dashboard`.
    - Conteúdo: Resumo de membros do ministério, finanças do ministério, acesso rápido a configurações e módulos do ministério.

3.  **Líder:**
    - Sem uma página de dashboard dedicada e complexa.
    - O foco é na **navegação permissionada** através da sidebar e acesso direto às páginas dos módulos relevantes.
    - A página inicial após o login pode ser a rota `/dashboard` com um conteúdo simplificado ou um redirecionamento automático para a primeira área acessível (ex: `/dashboard/members` se tiver permissão para Membros).
    - A sidebar será dinâmica, exibindo apenas os links para os módulos/funcionalidades que o Líder tem permissão de acesso (READ ou superior).

## 2. Tecnologias Utilizadas

- Next.js 14 (App Router)
- TailwindCSS
- Shadcn/ui
- Prisma (ORM)
- PostgreSQL
- NextAuth.js
- React Hook Form
- Zod (validação)
- React Query
- ViaCEP API

## 3. Estrutura de Pastas

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── members/
│   │   ├── leaders/
│   │   ├── groups/
│   │   ├── finance/
│   │   └── events/
│   └── layout.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   └── shared/
├── lib/
│   ├── utils/
│   └── validations/
├── prisma/
│   └── schema.prisma
└── types/
```

## 4. Schema do Banco de Dados

```prisma
model Church {
  id          String      @id @default(cuid())
  name        String
  ministries  Ministry[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model Ministry {
  id          String      @id @default(cuid())
  name        String
  church      Church      @relation(fields: [churchId], references: [id])
  churchId    String
  master      User        @relation("MinistryMaster", fields: [masterId], references: [id])
  masterId    String
  leaders     User[]      @relation("MinistryLeaders")
  members     Member[]
  smallGroups SmallGroup[]
  finances    Finance[]
  events      Event[]
  features    MinistryFeature[]
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
}

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  role          Role
  ministry      Ministry? @relation("MinistryLeaders", fields: [ministryId], references: [id])
  ministryId    String?
  masterOf      Ministry? @relation("MinistryMaster")
  permissions   UserPermission[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model UserPermission {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  feature     Feature   @relation(fields: [featureId], references: [id])
  featureId   String
  level       PermissionLevel
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, featureId])
}

model Feature {
  id          String    @id @default(cuid())
  name        String
  description String?
  isActive    Boolean   @default(true)
  permissions UserPermission[]
  ministries  MinistryFeature[]
}

model MinistryFeature {
  id          String    @id @default(cuid())
  ministry    Ministry  @relation(fields: [ministryId], references: [id])
  ministryId  String
  feature     Feature   @relation(fields: [featureId], references: [id])
  featureId   String
  isEnabled   Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([ministryId, featureId])
}

model AssistantChat {
  id          String    @id @default(cuid())
  user        User      @relation(fields: [userId], references: [id])
  userId      String
  ministry    Ministry? @relation(fields: [ministryId], references: [id])
  ministryId  String?
  messages    AssistantMessage[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model AssistantMessage {
  id          String    @id @default(cuid())
  chat        AssistantChat @relation(fields: [chatId], references: [id])
  chatId      String
  content     String
  role        MessageRole
  context     MessageContext
  createdAt   DateTime  @default(now())
}

enum Role {
  ADMIN
  MASTER
  LEADER
}

enum PermissionLevel {
  NONE
  READ
  WRITE
  FULL
}

enum MessageRole {
  USER
  ASSISTANT
}

enum MessageContext {
  SYSTEM
  MINISTRY
}
```

## 5. Features do Sistema

### 5.1 Gestão de Membros
- Cadastro completo de membros
- Perfil individual
- Histórico de participação
- Status de membro

### 5.2 Gestão de Pequenos Grupos
- Criação de grupos
- Atribuição de líderes
- Controle de membros
- Relatórios de grupo

### 5.3 Gestão Financeira
- Controle de receitas
- Controle de despesas
- Relatórios financeiros
- Orçamento

### 5.4 Gestão de Eventos
- Calendário
- Controle de presença
- Recursos
- Feedback

### 5.5 Assistente Virtual
- Suporte para Líder Master e Líderes
- Suporte para Administrador Geral
- Contexto específico por role
- Interface de chat

## 6. Fases de Desenvolvimento

### Fase 1: Estrutura Base e Autenticação
1. Configuração do projeto
2. Implementação da tela de login
3. Sistema de autenticação
4. Middleware de proteção de rotas

### Fase 2: Sistema de Formulários
1. Configuração do React Hook Form
2. Implementação de validações com Zod
3. Integração com ViaCEP
4. Componentes de formulário reutilizáveis

### Fase 3: Assistente Virtual
1. Implementação do chat
2. Integração com IA
3. Contexto específico por role
4. Interface do assistente

### Fase 4: Módulos Principais
1. Desenvolvimento das features principais
2. Implementação de formulários
3. Integração com o assistente
4. Testes de usabilidade

## 7. Considerações de Segurança

### 7.1 Autenticação
- 2FA para Administrador Geral e Líder Master
- Tokens JWT com refresh
- Sessões seguras

### 7.2 Autorização
- Middleware de verificação de permissões
- Validação em nível de API
- Proteção de rotas

### 7.3 Auditoria
- Log de todas as ações
- Histórico de alterações de permissões
- Rastreamento de acessos

## 8. Design System

### 8.1 Cores
- Primária: Azul (#2563EB)
- Secundária: Verde (#10B981)
- Acento: Laranja (#F97316)
- Neutro: Cinza (#6B7280)

### 8.2 Tipografia
- Títulos: Inter
- Corpo: Roboto

### 8.3 Componentes
- Cards modernos com sombras suaves
- Botões com estados de hover e active
- Formulários com validação visual
- Tabelas responsivas
- Modais e diálogos
- Navegação lateral fixa

## 9. Considerações de UX/UI

### 9.1 Interface
- Design minimalista
- Hierarquia visual clara
- Espaçamento adequado
- Feedback visual imediato

### 9.2 Responsividade
- Layout adaptativo
- Componentes mobile-first
- Navegação otimizada para mobile

### 9.3 Acessibilidade
- Contraste adequado
- Navegação por teclado
- Screen readers
- ARIA labels

### 9.4 Performance
- Lazy loading
- Otimização de imagens
- Caching eficiente
- Code splitting

## 10. Estratégia de Testes

### 10.1 Testes Unitários
- Jest para testes unitários
- Cobertura de código
- Testes de componentes
- Testes de hooks
- Testes de utilitários

### 10.2 Testes de Integração
- Testes de API
- Testes de banco de dados
- Testes de autenticação
- Testes de permissões

### 10.3 Testes E2E
- Cypress para testes E2E
- Fluxos críticos
- Cenários de usuário
- Testes de regressão

### 10.4 Testes de Acessibilidade
- Testes WCAG 2.1
- Testes de screen readers
- Testes de navegação por teclado
- Testes de contraste

## 11. Estratégia de Deploy

### 11.1 Ambientes
- Desenvolvimento
- Staging
- Produção

### 11.2 CI/CD
- GitHub Actions
- Build automatizado
- Testes automatizados
- Deploy automatizado

### 11.3 Backup
- Backup do banco de dados
- Backup de arquivos
- Estratégia de recuperação
- Testes de restauração

## 12. Documentação

### 12.1 Documentação Técnica
- Arquitetura do sistema
- Diagramas
- Fluxos de dados
- APIs

### 12.2 Documentação de API
- Swagger/OpenAPI
- Endpoints
- Parâmetros
- Respostas

### 12.3 Documentação de Usuário
- Manual do usuário
- Guias de uso
- FAQs
- Vídeos tutoriais

### 12.4 Changelog
- Versões
- Mudanças
- Correções
- Novas features

## 13. Monitoramento

### 13.1 Logs
- Logs de erro
- Logs de acesso
- Logs de performance
- Logs de segurança

### 13.2 Métricas
- Performance
- Uso de recursos
- Tempo de resposta
- Taxa de erro

### 13.3 Alertas
- Monitoramento de erros
- Monitoramento de performance
- Monitoramento de segurança
- Notificações

## 14. Internacionalização

### 14.1 Suporte a Idiomas
- Português (BR)
- Inglês
- Espanhol

### 14.2 Formatação
- Datas
- Números
- Moeda
- Endereços

## 15. Estratégia de Cache

### 15.1 Cache de API
- Cache de respostas
- Cache de queries
- Invalidação de cache
- TTL

### 15.2 Cache de Frontend
- Cache de assets
- Cache de dados
- Service Workers
- PWA

## 16. DevOps

### 16.1 Containerização
- Docker
- Docker Compose
- Imagens otimizadas
- Multi-stage builds

### 16.2 Orquestração
- Kubernetes
- Deployments
- Services
- Ingress

### 16.3 Infraestrutura como Código
- Terraform
- Ansible
- Scripts de automação
- Documentação de infraestrutura

## 17. Segurança

### 17.1 Análise de Vulnerabilidades
- Scan de dependências
- Pentest
- Análise de código
- Auditoria de segurança

### 17.2 Políticas
- Política de senhas
- Política de backup
- Política de retenção
- Política de acesso

## 18. Escalabilidade

### 18.1 Arquitetura
- Microserviços
- Load balancing
- CDN
- Cache distribuído

### 18.2 Performance
- Otimização de queries
- Indexação
- Particionamento
- Sharding

## 19. Compliance

### 19.1 LGPD
- Política de privacidade
- Termos de uso
- Política de cookies
- Consentimento

### 19.2 Auditoria
- Logs de acesso
- Logs de alterações
- Logs de segurança
- Relatórios

## 20. Versionamento

### 20.1 Estratégia
- Versionamento semântico
- Chan      o-     Releases
-ack

### 20.2 Controle
- Git Flow
- Branches
- Tags
- Releases

## 21. SEO

### 21.1 Meta Tags
- Title
- Description
- Keywords
- Open Graph

### 21.2 Estrutura
- Sitemap
- Robots.txt
- URLs amigáveis
- Breadcrumbs

## 22. Acessibilidade

### 22.1 WCAG 2.1
- Perceptível
- Operável
- Compreensível
- Robusto

### 22.2 Implementação
- ARIA labels
- Navegação por teclado
- Contraste
- Screen readers 

## Plano de Refatoração do Modal de Cadastro de Ministério (do zero)

### Objetivo
Refatorar completamente o modal de cadastro de ministério para eliminar bugs de estado, garantir previsibilidade, manutenibilidade e aderência ao padrão dos formulários de membros/usuários.

---

### Etapas do Plano

1. **Criação de Novo Componente**
   - Criar `src/components/forms/MinistryCreateModal.tsx`.
   - Estruturar o modal usando o padrão dos formulários de membros/usuários.
   - Garantir que o estado do formulário seja **local ao modal** (useState dentro do modal).

2. **Implementação do Formulário**
   - Reutilizar o componente `Input` para todos os campos.
   - Implementar steps (wizard) conforme as etapas abaixo.
   - Garantir navegação por TAB e acessibilidade.
   - Adicionar validação básica (campos obrigatórios, formatos, etc).

3. **Ciclo de Estado**
   - O estado do formulário deve ser inicializado ao abrir o modal e resetado apenas ao fechar.
   - Nenhum reset de estado deve ocorrer durante a digitação ou navegação entre campos.
   - Garantir que o modal não é desmontado/remontado indevidamente.

4. **Integração com a Página de Ministérios**
   - Substituir o uso do modal antigo pelo novo componente.
   - Passar callbacks de sucesso/cancelamento para atualizar a lista de ministérios.

5. **Testes e Validação**
   - Testar o fluxo completo de cadastro, navegação por TAB, e fechamento do modal.
   - Garantir que o bug do campo resetando não ocorre mais.
   - Validar responsividade e acessibilidade.

6. **Limpeza e Documentação**
   - Remover código antigo e componentes não utilizados.
   - Documentar o novo fluxo no README ou no próprio código.

---

### Etapas e Campos do Cadastro de Ministério

1. **Dados do Ministério**
   - Nome do Ministério (`ministryName`)

2. **Dados da Igreja**
   - Nome da Igreja (`churchName`)

3. **Endereço da Igreja**
   - CEP (`cep`)
   - Rua (`rua`)
   - Número (`numero`)
   - Complemento (`complemento`)
   - Bairro (`bairro`)
   - Município (`municipio`)
   - Estado (`estado`)

4. **Contato da Igreja**
   - Telefone da Igreja (`churchPhone`)
   - Email da Igreja (`churchEmail`)

5. **Dados do Pastor**
   - Nome do Pastor (`pastorName`)
   - Telefone do Pastor (`pastorPhone`)
   - Email do Pastor (`pastorEmail`)

6. **Líder Master**
   - Opção: Novo líder ou Selecionar existente (`masterOption`)
   - Se novo: formulário completo do líder master (nome, email, senha, telefone, data de nascimento, sexo, estado civil, endereço, etc.)
   - Se existente: seleção do líder master já cadastrado (`masterId`)

7. **Resumo e Confirmação**
   - Exibir todos os dados preenchidos para conferência antes de salvar.

---

### Edição de Ministério

- **Fluxo Atual:**
  - A edição de ministério é feita por um modal separado, que recebe os dados do ministério selecionado e permite alterar os campos em abas (tabs) ou formulário único.
  - O estado do formulário de edição é inicializado com os dados do ministério a ser editado.
  - Ao salvar, é feita uma requisição para atualizar o ministério no backend.
  - O modal é fechado e a lista de ministérios é atualizada.

- **Sugestão para o Novo Modal:**
  - Unificar o fluxo de cadastro e edição no mesmo componente/modal, recebendo um prop `ministry` (opcional) para edição.
  - Se `ministry` for passado, inicializar o estado do formulário com os dados existentes.
  - Permitir navegação entre steps para edição, igual ao cadastro.
  - Ao salvar, diferenciar entre POST (novo) e PUT/PATCH (edição) conforme o caso.
  - Garantir que o modal reseta o estado ao fechar, tanto para cadastro quanto para edição.

---

### Boas Práticas
- Estado local e isolado.
- Componentização e reutilização de UI.
- Sem efeitos colaterais inesperados.
- Acessibilidade e UX priorizados.
- Código limpo e comentado.

---

### Entregáveis
- `src/components/forms/MinistryCreateModal.tsx` (novo modal funcional, para cadastro e edição)
- Página de ministérios usando o novo modal
- Código antigo removido
- Testes manuais validados
- Documentação do fluxo 