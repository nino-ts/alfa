import type { HttpContext } from "#alfa/http";

export default (ctx: HttpContext) => `post:${ctx.params.slug}`;
