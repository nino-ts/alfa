import type { HttpContext } from "#alfa/http";

export default (ctx: HttpContext) => `docs:${ctx.params.slug ?? ""}`;
