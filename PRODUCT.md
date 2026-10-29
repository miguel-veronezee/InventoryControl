# Controle de pedidos

Design completo: [docs/superpowers/specs/2026-10-28-controle-pedidos-design.md](docs/superpowers/specs/2026-10-28-controle-pedidos-design.md).

## O que é

Um sistema web para um vendedor de produtos importados na Shopee (até ~300 pedidos por dia) acompanhar cada pedido da venda até o envio. Ao abrir a tela, responde: **o que precisa ser feito agora, e o que está para atrasar?**

Não é controle de estoque.

## Para quem

| Papel  | Pode                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| Dono   | Tudo da equipe + importar planilha, cadastrar/remover usuários, ver histórico completo |
| Equipe | Ver a fila, buscar, avançar e corrigir etapas de pedidos                               |

Cada pessoa tem o próprio login. Não há cadastro público.

## Regras de negócio

**Etapas:** Novo → Separado → Embalado → Enviado.

**Urgência** (fuso `America/Sao_Paulo`):

- Enviado nunca é urgente.
- Atrasado: prazo de envio já passou.
- Vence hoje: prazo no mesmo dia.
- A fila ordena atrasados, depois vence hoje, depois por prazo; enviados no fim.

**Corrigir erros:**

- Avanço em lote mostra quantos pedidos mudam e pede confirmação.
- Logo após um lote, há "Desfazer".
- Qualquer usuário pode voltar um pedido uma etapa.
- O histórico nunca é apagado: correções viram novas entradas.

**Cancelamentos:**

- Cancelado depois de separado ou embalado fica na fila como **"Cancelado — não enviar"** até alguém marcar "Ciente".
- Cancelado ainda em Novo sai da fila direto.

**Importação:** pela planilha exportada do Seller Centre. A chave é o número do pedido da Shopee. Reimportar nunca apaga a etapa interna nem duplica pedidos.

## Fora do escopo

Estoque, API da Shopee (fase futura), app nativo, etiquetas e nota fiscal.

## Estado atual

Etapa 1 (base técnica) concluída. Próximas: login e usuários, pedidos persistidos e fila, importação (bloqueada até haver uma planilha real).
