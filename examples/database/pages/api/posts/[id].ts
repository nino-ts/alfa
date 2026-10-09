import { eq } from "alfa/database";
import type { HttpContext } from "alfa/http";
import { posts } from "../../../lib/db";

export default async (ctx: HttpContext) => {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }

  const row = await posts.select().where(eq("id", id)).first();
  if (!row) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json(row);
};
