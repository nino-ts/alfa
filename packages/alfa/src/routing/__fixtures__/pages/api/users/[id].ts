import type { HttpContext } from "#alfa/http";

export default (ctx: HttpContext) => Response.json({ id: ctx.params.id });
