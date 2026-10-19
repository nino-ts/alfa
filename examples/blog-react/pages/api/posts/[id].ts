import { eq } from "alfa/database";
import type { HttpContext } from "alfa/http";
import { posts } from "../../../src/db";

export default async (ctx: HttpContext) => {
  const method = ctx.req.method.toUpperCase();
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  if (method === "GET") {
    const post = await posts.select().where(eq("id", id)).first();
    if (!post) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(post);
  }

  if (method === "DELETE") {
    const removed = await posts.delete().where(eq("id", id)).exec();
    if (removed.length === 0) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return new Response(null, { status: 204 });
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "GET, DELETE" },
  });
};
