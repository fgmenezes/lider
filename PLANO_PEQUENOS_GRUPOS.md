# Plano do Módulo de Pequenos Grupos (PGs) - Ministério Atos

## Objetivos
- Controlar frequência dos membros nos PGs e Encontrao
- Atribuir membros e líderes aos PGs
- Registrar visitantes, pedidos de oração, etc
- Gerenciar regiões, encontros especiais e relatórios

## Observação Importante
> O exemplo e estrutura deste plano são baseados no Ministério Atos (adolescentes, encontros semanais e quinzenais), mas o módulo pode ser adaptado para outros ministérios, faixas etárias e dinâmicas de encontros.

## Página Principal de Pequenos Grupos

### Fluxo ao clicar em “Pequenos Grupos” no menu lateral
1. Usuário clica em “Pequenos Grupos” no menu lateral
2. É direcionado para a página principal dos PGs do ministério
3. A página mostra uma visão geral dos PGs, com informações e ações rápidas

### Estrutura Sugerida da Página
- **Cabeçalho**: Título “Pequenos Grupos do Ministério” e botão “Criar Novo PG” (para líderes)
- **Filtros e Busca**: Campo de busca (nome, região, líder), filtro por região, filtro por status
- **Lista de PGs**: Tabela ou cards mostrando nome, região, dia/horário, líder(es), número de membros, status, ações rápidas
- **Indicadores rápidos**: Total de PGs ativos, total de membros, frequência média, próximos encontros
- **Ações rápidas**: Exportar lista, visualizar relatório geral

#### Exemplo Visual (Wireframe simplificado)
```
---------------------------------------------------------
| Pequenos Grupos do Ministério   [Criar Novo PG]       |
---------------------------------------------------------
| [Buscar por nome, região, líder...] [Filtro Região]   |
---------------------------------------------------------
| Nome PG | Região | Dia/Hora | Líder | Membros | Ações |
|-------------------------------------------------------|
| Zona Norte | Norte | Qui 19h | João | 12 | [Gerenciar]|
| Zona Sul   | Sul   | Sex 20h | Ana  | 10 | [Gerenciar]|
| ...                                               ... |
---------------------------------------------------------
| Total PGs: 3 | Total membros: 32 | Próx. encontro: ...|
---------------------------------------------------------
```

- Ao clicar em “Gerenciar” ou “Ver detalhes”, abre a página do PG específico com lista de membros, próximos encontros, frequência, visitantes, pedidos de oração e ações de gestão.

### Funcionalidades da Página
- Visualizar todos os PGs do ministério
- Buscar/filtrar PGs por região, líder, status
- Criar, editar ou excluir PGs (conforme permissão)
- Acessar rapidamente a gestão de membros, reuniões e relatórios de cada PG
- Visualizar indicadores gerais do ministério

## Entidades Principais
- PequenoGrupo (PG): id, nome, região, endereço, dia, periodicidade, líder(es), anfitrião, status, observações
- MembroPG: id, membroId, pequenoGrupoId, papel, data de entrada/saída
- ReuniaoPG: id, pequenoGrupoId, data, local, tipo, tema, presenças, visitantes, pedidos de oração, observações
- Encontrao: id, data, local, tema, presenças, visitantes, pedidos de oração, observações
- Retiro: id, data início/fim, local, participantes, observações

## Funcionalidades
- CRUD de PGs
- Atribuição de membros/líderes
- Registro de reuniões (PG, Encontrao, Retiro)
- Relatórios de frequência, engajamento, visitantes, pedidos de oração
- Exportação de dados

## Fluxo de Registro de Frequência

### Habilitação da Lista de Chamada/Frequência
- A lista de chamada fica disponível no dia do encontro (ou algumas horas antes, se desejado)
- O líder acessa o sistema e encontra o botão “Registrar Frequência” para o encontro agendado
- O sistema mostra encontros futuros e destaca o próximo a ser registrado

### Registro
- O líder abre o formulário de frequência para o encontro do dia
- O sistema exibe a lista de membros atribuídos ao PG (ou todos os adolescentes no Encontrao)
- Para cada membro, há um checkbox ou botão para marcar presença
- Campos para adicionar visitantes (nome, contato, observações)
- Campos para pedidos de oração e observações gerais
- O líder pode salvar parcialmente e finalizar depois

### Encerramento
- O registro pode ser encerrado manualmente pelo líder (botão “Finalizar Frequência”) ou automaticamente após um período (ex: até meia-noite do dia do encontro)
- Após o encerramento:
  - A lista fica bloqueada para edição (apenas visualização)
  - Os dados ficam salvos para relatórios e histórico
  - O sistema pode enviar aviso de “Frequência registrada com sucesso”

### Personalizações Possíveis
- Permitir reabrir frequência com permissão especial
- Notificações automáticas para líderes/supervisores
- Registro de justificativas de ausência

## Telas/Páginas Sugeridas
- Dashboard dos PGs
- Gestão de PGs
- Gestão de membros
- Registro de reuniões
- Relatórios
- Gestão de Encontrao
- Gestão de Retiro

## Relatórios e Indicadores
- Frequência média por PG, por membro, por evento
- Lista de membros ausentes/visitantes recorrentes
- Evolução do número de participantes
- Pedidos de oração por período
- Participação em eventos especiais

---

> Este planejamento pode ser ajustado conforme novas necessidades surgirem ou prioridades mudarem. 