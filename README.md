# Controle de pedidos

Sistema web para acompanhar pedidos da Shopee da venda até o envio, destacando o que está atrasado e o que vence hoje.

## Início rápido

```bash
fnm use
npm ci
cp .env.example .env.local
npm run db:up
npm run dev
```

Abra http://localhost:3000. A rota http://localhost:3000/api/health confirma a ligação com o banco.

Mais detalhes: [PRODUCT.md](PRODUCT.md) (o produto) e [AGENTS.md](AGENTS.md) (como trabalhar no código).
