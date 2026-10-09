import type { HttpContext } from "alfa/http";
import { create, list } from "../../../lib/store";

export default async (ctx: HttpContext) => {
  const method = ctx.req.method.toUpperCase();

  if (method === "GET") {
    const limit = ctx.query.limit ? Number(ctx.query.limit) : undefined;
    return Response.json(list(Number.isFinite(limit) ? limit : undefined));
  }

  if (method === "POST") {
    const body = (await ctx.req.json()) as { name?: unknown };
    if (typeof body.name !== "string" || body.name.trim() === "") {
      return Response.json({ error: "name is required" }, { status: 422 });
    }
    return Response.json(create(body.name.trim()), { status: 201 });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "GET, POST" },
  });
};
