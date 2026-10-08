# Utils

Helpers pequenos que o Bun não oferece como primitivas. Est Deliberadamente curto: o resto deve ser JavaScript nativo (`map`, `filter`, `structuredClone`, `URLPattern`, `Intl`).

## escapeHtml

```ts
import { escapeHtml } from "alfa/utils";

escapeHtml('<script>alert("x")</script>');
// &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;
```

Escapa `&`, `<`, `>`, `"` e `'`. Use ao interpolar dado do usuário em HTML construído por template string.

Com TSX/JSX o escape é do próprio React — `escapeHtml` é para templates `.html` escritos à mão (stack HTMX).

## slugify

```ts
import { slugify } from "alfa/utils";

slugify("Ação & Reação"); // "acao-reacao"
slugify("  Olá, Mundo!  "); // "ola-mundo"
```

Remove diacríticos (normalização NFD), passa a minúsculas, troca separadores por hífen e remove hífens das pontas.

## assert

```ts
import { assert } from "alfa/utils";

const port = Number(process.env.PORT);
assert(port > 0, "PORT must be positive");
```

`asserts value` do TypeScript: após a chamada, o valor é estreitado no escopo, sem `!` ou cast.

## toJson

```ts
import { toJson } from "alfa/utils";

toJson({ a: 1 });      // '{"a":1}'
toJson(undefined);     // "null"
toJson(data, 2);       // formatado com 2 espaços
```

`toJson` normaliza `undefined` para `null`, evitando omissão acidental de campo em logs.

## Regras

- Prefira JavaScript nativo antes de adicionar helper: `Object.fromEntries`, `Array.prototype.at`, `String.replaceAll` cobrem a maioria dos casos.
- `escapeHtml` não substitui CSP nem sanitização de HTML rico. Para HTML vindo de usuário, use uma lib de sanitização dedicada.