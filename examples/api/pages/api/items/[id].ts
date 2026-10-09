import type { HttpContext } from "alfa/http";
import { find, remove, update } from "../../../lib/store";

export default async (ctx: HttpContext) => {
  const id = ctx.params.id;
  if (!id) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const item = find(id);
  if (!item) {
    return Response.json({ error: "not found" }, { status: 404 });
  }

  const method = ctx.req.method.toUpperCase();

  if (method === "GET") {
    return Response.json(item);
  }
  if (method === "PATCH") {
    const patch = (await ctx.req.json()) as { name?: string; done?: boolean };
    return Response.json(update(id, patch));
  }
  if (method === "DELETE") {
    remove(id);
    return new Response(null, { status: 204 });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "GET, PATCH, DELETE" },
  });
};
