# create-alfa

Scaffold de novas aplicações [alfa](https://github.com/nino-ts/alfa).

> ⏳ **Ainda não publicado no npm.** O nome `alfa` no registry pertence a um pacote
> de terceiro (`alfa@0.7.0`, "Effortless React State Management") — por isso o
> framework **não** pode ser publicado com esse nome ainda, e o scaffolder nunca
> deve apontar para `alfa@latest` no registry.

## Como usar (antes de publicar)

Três caminhos, todos testados:

### 1. direto do clone (mais simples)

```bash
git clone https://github.com/nino-ts/alfa
cd alfa
bun packages/create-alfa/index.ts myapp
cd myapp && bun install && bun run dev
```

### 2. link global (`bunx create-alfa` funciona)

```bash
cd alfa
bun run link:all          # linka `alfa` e `create-alfa`
```

Em qualquer lugar:

```bash
bunx create-alfa myapp
cd myapp && bun install && bun run dev
```

Para deslinkar: `bun run unlink:all`.

### 3. de dentro do monorepo

```bash
cd alfa
bun packages/create-alfa/index.ts myapp
```

## Como o `alfa` é resolvido

| Situação | `package.json` gerado |
|---|---|
| Rodando a partir do clone (monorepo detectado) | `"alfa": "file:../../alfa/packages/alfa"` (ou caminho absoluto, se o projeto estiver em outro drive) |
| Pacote publicado no registry | `"alfa": "latest"` |
| Forçado | `bunx create-alfa myapp --alfa link:../../alfa/packages/alfa` |

O scaffolder detecta o monorepo a partir da própria localização
(`packages/create-alfa` → `packages/alfa`) e aponta para o framework local.

## Templates

- `hypermedia` (default) — HTMX + Alpine; rotas em `pages/*.ts`.
- `react` — `index.html` + `src/app.tsx`, bundlado pelo Bun; API em `pages/`.
- `vue` — `index.html` + `src/app.ts`; API em `pages/`.

## Opções

```bash
bunx create-alfa myapp --template react
bunx create-alfa myapp --alfa link:../../alfa/packages/alfa
```

## Licença

MIT
