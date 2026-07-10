# DECRYPT TEBEX

Loja e central de ferramentas digitais para projetos próprios ou autorizados. O frontend original foi preservado e agora é servido pelo Express.

## Requisitos e instalação

- Node.js 20+
- MySQL 8+

```bash
npm install
copy config.example.json config.json
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Acesse `http://localhost:3000`. Em produção, use `npm start`, HTTPS e `NODE_ENV=production`.

## Configuração

`config.json` é ignorado pelo Git. Configure URL MySQL, segredo de sessão com pelo menos 32 caracteres, origens CORS, IDs Discord administradores, OAuth Discord e Mercado Pago. Tokens nunca devem ser colocados em `js/config.js`.

Credenciais ainda necessárias para o fluxo real:

- app Discord: client ID, secret e callback exatamente cadastrado;
- access token Mercado Pago e URL pública HTTPS para webhook;
- banco MySQL acessível;
- arquivos comerciais dos produtos, quando houver.

`mercadoPago.sandbox: true` usa a URL sandbox retornada pelo provedor. Mesmo no sandbox, o webhook consulta o pagamento na API e compara pedido e valor antes de liberar.

## API principal

- `GET /api/products` e `GET /api/products/:slug`
- `POST /api/orders` e `GET /api/me/orders`
- `POST /payments/orders/:id/preference`
- `POST /payments/webhook`
- `POST /api/jobs` (multipart, campo `file`)
- `GET /api/me/jobs` e `GET /api/me/downloads`
- `GET /api/admin/stats`

Rotas privadas exigem sessão Discord. Administração exige Discord ID presente em `adminDiscordIds`.

## Segurança e operação

Helmet, CORS restrito, rate limit, cookies HTTP-only/SameSite Lax, validação Zod, Prisma, limites de upload, nomes UUID e transação idempotente no pagamento estão ativos. Arquivos enviados nunca são executados. Para produção ainda é recomendado trocar o armazenamento padrão de sessão por um store persistente, configurar backup MySQL, HTTPS, rotação/limpeza de arquivos e um worker separado para processar jobs `QUEUED`.

O schema completo está em `prisma/schema.prisma`. A migration inicial é criada contra seu MySQL por `npm run prisma:migrate`; isso evita gerar SQL incompatível sem conhecer a versão/configuração do banco.
