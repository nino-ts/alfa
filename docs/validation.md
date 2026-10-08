# Validation

`alfa` não possui engine de regras própria. A validação usa o contrato [Standard Schema V1](https://standardschema.dev), compatível com Zod, Valibot, ArkType, Yup, Joi e VineJS.

## Contrato

```ts
export interface StandardSchemaV1<TOutput = unknown, TInput = unknown> {
  readonly "~standard": {
    readonly version: 1;
    readonly vendor?: string;
    validate(value: TInput): StandardSchemaResult<TOutput> | Promise<StandardSchemaResult<TOutput>>;
  };
}
```

O tipo é espelhado estruturalmente no repositório — nenhuma dependência é necessária.

## parse

```ts
import { parse, ValidationError } from "alfa/validation";
import * as v from "valibot"; // ou zod, arktype, vinejs…

const UserSchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
});

const user = await parse(UserSchema, input);
```

Sucesso retorna o valor tipado; falha lança `ValidationError` com `issues`.

## parseBody

```ts
import { parseBody } from "alfa/validation";

router.post("/users", async (ctx) => {
  const input = await parseBody(UserSchema, ctx);
  return http.json({ created: input }, { status: 201 });
});
```

JSON inválido produz `ValidationError` com a issue "Request body must be valid JSON".

## Inferência de tipos

```ts
import type { InferOutput } from "alfa/validation";

type User = InferOutput<typeof UserSchema>;
```

O tipo vem do próprio schema — `alfa` não duplica os tipos.

## Tratamento de erro

```ts
import { ValidationError, http } from "alfa/validation";

router.post("/users", async (ctx) => {
  try {
    const input = await parseBody(UserSchema, ctx);
    return http.json({ created: input }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return http.json({ errors: error.issues }, { status: 422 });
    }
    throw error;
  }
});
```

## Middleware

Não há middleware pronto: o padrão é validar no handler com `parseBody` e converter `ValidationError` em `422`.

## Regras

- Nenhuma regra embutida (`required`, `string`, `min`…). Escolha a lib de schema do usuário.
- O framework não instala dependência de schema; `StandardSchemaV1` é espelhado localmente.
- `parse` e `parseBody` são `async` porque a spec permite `validate` retornando `Promise`.