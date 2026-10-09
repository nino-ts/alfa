import type { HttpContext } from "alfa/http";
import { posts } from "../../../lib/db";

export default async (ctx: HttpContext) => {
  if (ctx.req.method.toUpperCase() === "GET") {
    return Response.json(await posts.select().get());
  }

  const body = (await ctx.req.json()) as { title?: unknown; body?: unknown };
  if (typeof body.title !== "string" || typeof body.body !== "string") {
    return Response.json(
      { error: "title and body are required" },
      { status: 422 },
    );
  }

  const created = await posts.insert({ title: body.title, body: body.body });
  return Response.json(created, { status: 201 });
};
