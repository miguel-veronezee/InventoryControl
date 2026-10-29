# Controle de pedidos Shopee — design

Data: 2026-10-28

## Intenção

Um vendedor de produtos importados na Shopee faz até ~300 pedidos por dia e não tem um controle fechado por pedido. O risco é um pedido ficar para trás e estourar o prazo de envio da Shopee.

O sistema organiza o fluxo de cada pedido, da venda até o envio, e responde a uma pergunta ao abrir a tela: **o que precisa ser feito agora, e o que está para atrasar?**

O foco é a rotina de quem separa, embala e despacha. Não é controle de estoque.

Este documento substitui a demo descartável que existe hoje no repositório (`src/app/page.tsx`, `src/lib/pedidos.ts`). A demo serve de referência visual e de lógica para a fila de trabalho.

## Objetivos

- Ver cada pedido na sua etapa: Novo → Separado → Embalado → Enviado.
- Destacar o que precisa de atenção: pedidos atrasados e pedidos que vencem hoje.
- Avançar vários pedidos de etapa de uma vez (o volume torna a ação um a um inviável).
- Trazer os pedidos da Shopee importando a planilha exportada do Seller Centre, sem digitação.
- Mais de um usuário, cada um com o próprio login, com registro de quem moveu cada pedido e quando.
- Base técnica sólida desde o início, construída em etapas pequenas e verificáveis.

## Não-objetivos

- Controle de estoque.
- Integração com a API da Shopee (fase futura; a entrada inicial é a planilha).
- App mobile nativo. A interface web deve funcionar no celular, sem ser o foco.
- Emissão de etiquetas, nota fiscal ou qualquer ação dentro da Shopee.

## Anti-objetivos (seria fracasso mesmo funcionando)

- Uma nova importação apagar ou sobrescrever a etapa interna que a equipe já marcou.
- Um pedido sumir da fila sem ter sido enviado ou cancelado.
- A tela principal exigir cliques ou filtros para descobrir o que está atrasado.
- Duplicar pedidos ao importar a mesma planilha duas vezes.

## Usuários e permissões

| Papel | Pode |
|-------|------|
| Dono | Tudo da equipe + importar planilha, cadastrar/remover usuários, ver histórico completo |
| Equipe | Ver a fila, buscar, avançar pedidos de etapa |

Toda mudança de etapa grava: pedido, etapa anterior, etapa nova, usuário, data/hora. Mudanças causadas pela importação são gravadas com origem "importação" e o dono que importou. *(Decisão do autor do documento.)*

Datas e "vence hoje" usam o fuso `America/Sao_Paulo`, não o fuso do servidor. *(Decisão do autor do documento.)*

Não há cadastro público. O primeiro usuário dono é criado por um script de seed; os demais são cadastrados pelo dono.

## Comportamento

### Fila de trabalho (tela principal)

Baseada na opção B escolhida no brainstorming e implementada na demo:

- Lista única ordenada por urgência: atrasados, depois vence hoje, depois por prazo crescente; enviados no fim.
- Linha vermelha = atrasado; amarela = vence hoje.
- Abas com contagem: Todos, Atrasados, Vence hoje, Novo, Separado, Embalado, Enviado.
- Busca por número do pedido ou produto.
- Seleção múltipla e "Avançar para próxima etapa".
- Paginação ou virtualização é decisão do builder; 300 pedidos/dia acumulam, então a lista padrão não deve carregar enviados antigos.

### Corrigir erros de etapa

Decidido com o usuário:

- **Avanço em lote pede confirmação.** Antes de aplicar, mostra quantos pedidos serão alterados e para qual etapa, e só segue se a pessoa confirmar. Assim um clique errado não tira dezenas de pedidos da fila. *(Confirmar sempre que houver mais de um pedido selecionado é decisão do autor do documento.)*
- **Desfazer logo após o lote.** Depois de um avanço em lote, aparece um botão "Desfazer" que devolve exatamente aqueles pedidos à etapa anterior. Ele fica disponível até a próxima ação ou por alguns segundos *(duração exata a cargo do builder)*.
- **Correção individual.** Qualquer usuário (dono ou equipe) pode voltar um pedido uma etapa.
- **O histórico nunca é apagado.** Desfazer e voltar etapa geram novas entradas, marcadas como correção, com usuário e data/hora. Dá para entender o que aconteceu depois.

Regras de urgência (já testadas em `src/lib/pedidos.ts`):

- `enviado` nunca é urgente.
- `atrasado`: prazo de envio < agora.
- `hoje`: prazo no mesmo dia local.

### Pedidos cancelados

Decidido com o usuário: se a Shopee cancelar um pedido que já foi **separado ou embalado**, ele continua na fila, em destaque, como **"Cancelado — não enviar"**. Existe um pacote físico que não pode ser despachado nem esquecido.

Decisões do autor do documento:

- O pedido sai da fila quando alguém marca "Ciente" (o pacote foi desfeito). Isso fica registrado no histórico.
- Pedido cancelado ainda na etapa **Novo** sai da fila direto, porque não há pacote físico.
- Todos os cancelados continuam no banco e podem ser consultados por uma aba ou filtro "Cancelados".

### Importação da planilha

- Só o dono importa.
- Upload do arquivo exportado no Seller Centre (formato `.xlsx`; confirmar quando houver uma planilha real).
- Chave do pedido = número do pedido da Shopee. Pedido novo é criado; pedido existente tem os dados da Shopee atualizados (status, prazo, itens), **sem tocar na etapa interna**.
- Se a Shopee marcar como enviado/cancelado, isso prevalece sobre a etapa interna.
- Se a Shopee informar um status que contradiz o anterior (ex.: cancelado depois de enviado), o sistema aceita o novo status e registra a mudança no histórico, sem bloquear a importação. *(Decisão do autor do documento.)*
- Ao fim, mostra um resumo: X novos, Y atualizados, Z com erro (linha e motivo).

**Bloqueio conhecido:** ainda não há planilha real. O mapeamento de colunas só pode ser fechado com um arquivo de exemplo. Até lá, a etapa de importação fica bloqueada; as demais seguem.

Decidido com o usuário: as etapas 1 a 3 são preparação interna, usando só pedidos fictícios de seed. Não há entrada manual de pedidos nem deploy antes da importação real.

## Base técnica

Decidido com o usuário (seguindo a aula que ele acompanha):

- Next.js 16 (App Router, Turbopack), TypeScript.
- PostgreSQL rodando em Docker via `compose.yaml` (`npm run db:up`), Drizzle ORM com migrations.
- Dockerfile da aplicação e `.dockerignore`.
- CI no GitHub Actions: lint, typecheck, testes, build.
- shadcn/ui, Tailwind, Prettier, ESLint com regras tipadas.
- Testes automatizados.
- Checagem de acessibilidade (WCAG A/AA) na interface.
- Versão do Node fixada em `.nvmrc` (gerenciada com `fnm`).
- `.env.example` documentando as variáveis; `.env.local` fora do git.
- Arquivos de contexto para agentes de IA: `AGENTS.md`, `CLAUDE.md`, `PRODUCT.md` (o que é o produto, para quem, regras de negócio deste documento).

Escolhas do autor do documento (o builder pode trocar se tiver motivo):

- Autenticação: Better Auth com e-mail e senha, usando o mesmo Postgres via Drizzle.
- Testes: Vitest para unidade; Playwright para fluxo e checagem de acessibilidade com axe.
- Hospedagem: fica para depois; a imagem Docker deve rodar em qualquer lugar.

## Etapas

Cada etapa termina com algo funcionando, testado e commitado.

1. **Base técnica.** Tudo da seção acima, sem tabelas de negócio. Tela inicial "em desenvolvimento" com a identidade do produto. A demo atual é removida (a lógica de `src/lib/pedidos.ts` é guardada para a etapa 3).
2. **Login e usuários.** Better Auth, papéis dono/equipe, seed do primeiro dono, tela de cadastro de usuários para o dono.
3. **Pedidos persistidos e fila.** Tabelas de pedidos, itens e histórico de etapas. Fila de trabalho da demo ligada ao banco. Seed com pedidos fictícios para desenvolvimento.
4. **Importação da planilha.** Bloqueada até existir uma planilha real.
5. **Futuro, fora deste documento:** API da Shopee, hospedagem, notificações.

## Fica a cargo do builder

- Estrutura de pastas, nomes de tabelas e colunas.
- Visual e identidade, mantendo a tela da fila parecida com a demo.
- Estratégia de paginação da fila.
- Como apresentar o histórico de um pedido.
