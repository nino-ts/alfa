# Deployment

## Binário compilado

`alfa` é framework Bun-first: o caminho mais direto para produção é um executável único.

```json
{
  "scripts": {
    "build": "bun build --compile --minify index.ts --outfile app"
  }
}
```

```bash
bun run build
./app
```

O binário carrega `.env` por padrão; para usar apenas variáveis do host:

```bash
./app --no-env-file
```

## Docker

```dockerfile
FROM oven/bun:1.4 AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

FROM base AS release
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun build --compile --minify index.ts --outfile /app/app

EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["/app/app"]
```

```bash
docker build -t myapp .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=postgres://user:pass@host:5432/db \
  myapp
```

Para SQLite, monte um volume:

```bash
docker run --rm -p 3000:3000 \
  -e DATABASE_URL=sqlite:///data/app.db \
  -v "$PWD/data:/app/data" \
  myapp
```

## Variáveis de ambiente

| Variável | Uso |
|---|---|
| `PORT` | Porta HTTP (padrão 3000) |
| `APP_SECRET` | HMAC de sessão e CSRF |
| `DATABASE_URL` | `postgres://`, `mysql://` ou `sqlite://` |
| `REDIS_URL` | Necessária apenas com `redisSession` |
| `NODE_ENV` | `production` desabilita `secure: false` implícito |

Segredos vêm do host, nunca do repositório.

## Checklist de produção

- [ ] `APP_SECRET` forte e exclusivo do ambiente
- [ ] `secure: true` em cookies de sessão (HTTPS obrigatório)
- [ ] `NODE_ENV=production` e `--no-env-file` quando as variáveis vierem do host
- [ ] `bun run typecheck` e `bun test` verdes antes do build
- [ ] `alfa migrate` executado como passo separado do deploy
- [ ] Health check em `/api/health` exposto para o orquestrador

## Notas

- O runtime é **apenas Bun**. Deploy em plataformas Node não é suportado.
- `Bun.serve` pode servir assets estáticos via `routes` com `Bun.file`, sem servidor de arquivos externo.
- Para múltiplas réplicas com sessão em cookie, o segredo precisa ser o mesmo em todas.