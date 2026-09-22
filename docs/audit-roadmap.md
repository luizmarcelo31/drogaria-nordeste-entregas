# Auditoria e Roadmap

Data da auditoria: 2026-09-22  
Produto: Drogaria Nordeste Entregas  
Escopo: MVP inicial para validação com cliente

## Resumo executivo

A interface já apresenta uma boa base operacional para a portaria: entrada e saída estão explícitas, as rotas principais existem, o layout é responsivo e há suporte para alertas, histórico, ocorrências, relatórios e impressão.

O principal risco atual não é visual. É a confiabilidade do registro operacional quando houver concorrência, grande volume de dados ou necessidade de auditoria formal. Por isso, o MVP deve priorizar consistência básica, mensagens claras e fluxos demonstráveis. Segurança avançada, roles e controles administrativos ficam para depois da contratação.

## Ranking atual

| Dimensão | Nota | Diagnóstico |
| --- | ---: | --- |
| Navegação e organização | 7/10 | Sidebar desktop e navegação mobile cobrem as rotas principais. |
| Fluxo de portaria | 6/10 | Entrada, saída, busca e presença estão claros, mas a presença ainda é inferida no frontend. |
| Cadastro de entregadores | 6/10 | Cadastro, bloqueio e inativação existem; ainda falta edição e validação mais forte. |
| Alertas | 6/10 | Fila e resolução existem; a criação de acesso e alerta ainda não é atômica. |
| Histórico | 5/10 | Possui filtros, mas ainda depende de limite fixo de eventos. |
| Relatórios | 6/10 | PDF e impressão existem; o escopo temporal ainda é limitado. |
| Ocorrências | 5/10 | O fluxo existe, mas precisava impedir vínculo inexistente. |
| Acessibilidade | 7/10 | Há labels, aria-live, estados semânticos e áreas de toque adequadas. |
| Segurança e auditoria | 4/10 | RLS amplo, histórico alterável e ausência de transações server-side. |
| Prontidão para produção | 5/10 | Adequado para Preview/MVP controlado, ainda não para livro oficial de portaria. |

Nota geral estimada: **5,7/10**.

## MVP atual: aplicar antes do cliente testar

- Fluxo de entrada e saída com ação explícita.
- Sidebar desktop com todas as funções.
- Navegação mobile sem duplicidade.
- Alertas com fila, filtros e resolução.
- Histórico com busca, filtros e períodos.
- Relatórios com PDF e impressão.
- Timezone da unidade centralizado em `America/Recife`.
- Contagem de relatórios considerando apenas eventos registrados.
- Ocorrência exige entregador encontrado, evitando registros silenciosamente sem vínculo.
- Mensagens de erro orientam o operador sobre a próxima tentativa.
- Build e verificação de tipos executados antes do Preview.

## Roadmap do MVP

### MVP-1: confiabilidade básica

Status: concluído.

1. Corrigir divergência de datas entre dashboard e histórico.
2. Corrigir contagem de saídas no relatório.
3. Evitar ocorrência vinculada a entregador inexistente.
4. Manter feedback de erro dentro do fluxo da ação.
5. Validar build e diff antes de cada Preview.

### MVP-2: demonstração com cliente

Status: pronto para execução em Preview.

1. Criar manualmente no Preview dados de teste controlados para entrada, saída, bloqueio e ocorrência; não inserir seed automático em produção.
2. Validar desktop e mobile em Preview.
3. Testar impressão e PDF com dados reais de demonstração.
4. Confirmar com o cliente o significado de “presente”, “bloqueado” e “resolvido”.
5. Registrar limitações conhecidas no manual operacional.

### MVP-3: acabamento antes do contrato

Status: concluído para o escopo viável do MVP.

1. Editar cadastro de entregador. [concluído]
2. Validar CPF, telefone e placa no salvamento. [concluído]
3. Exibir usuário autenticado em vez de nome fixo. [fase 2, depende de roles]
4. Aumentar a janela inicial do histórico para 1.000 eventos. [concluído parcialmente; paginação completa na fase 2]
5. Melhorar feedback e atualização local após operações. [concluído no cadastro e portaria]

## Fase 2: aplicar após contrato

### Segurança e usuários

- Criar usuários reais e perfis de acesso: portaria, supervisão e administração.
- Remover criação automática indiscriminada de operador.
- Restringir criação de operadores por convite ou administrador.
- Separar políticas RLS por operação.
- Impedir exclusão e adulteração do histórico de acessos.

### Integridade operacional

- Criar RPCs transacionais para entrada, saída, bloqueio e ocorrência com alerta.
- Validar presença no banco para evitar duas entradas ou saídas concorrentes.
- Criar regras server-side para saída sem entrada.
- Garantir idempotência em cliques repetidos e duas abas.

### Escala e auditoria

- Remover a janela fixa de 1.000 eventos.
- Implementar paginação e filtros server-side.
- Adicionar atualização em tempo real.
- Registrar quem criou, alterou ou resolveu cada item.
- Criar trilha de auditoria imutável.

### Produto e gestão

- Ficha completa do entregador com histórico, ocorrências e documentos.
- Documentos com validade e alertas de vencimento.
- Indicadores de pico, permanência e frequência.
- Relatórios por período e exportação formal.
- Testes de integração para RLS, concorrência, timezone e relatórios.

## Riscos conhecidos do MVP

- A presença ainda é calculada a partir dos eventos carregados no frontend.
- A leitura de acessos ainda usa uma janela inicial de 1.000 registros; paginação server-side fica para a fase 2.
- As políticas atuais são adequadas para ambiente controlado, não para múltiplos perfis administrativos.
- A criação de alerta ocorre depois do acesso em uma segunda operação.
- O operador exibido na interface ainda é estático.

## Critério para considerar o MVP pronto

O MVP está pronto para Preview quando:

- O operador consegue registrar entrada em até três interações.
- O operador consegue registrar saída em até três interações.
- Um bloqueio gera feedback visível.
- Uma ocorrência exige vínculo válido.
- Histórico e relatório exibem datas coerentes.
- O relatório pode ser impresso.
- A interface funciona sem corte em desktop e mobile.
- O build de produção passa sem erros.

## Decisão de escopo

Não implementar roles, permissões avançadas ou auditoria completa antes do contrato. O objetivo desta fase é provar o fluxo operacional e coletar feedback do cliente sem criar uma arquitetura administrativa prematura.
