import type { HttpContext } from "alfa/http";
import { parse, ValidationError } from "alfa/validation";
import { posts } from "../../src/db";
import { readBody } from "../../src/request";
import { postSchema } from "../../src/schema";

/** Normalize a form checkbox into a boolean. */
function normalize(value: unknown): unknown {
  if (value === "on" || value === "true") return true;
  if (value === "off" || value === "false") return false;
  return value;
}

export default async (ctx: HttpContext) => {
  const method = ctx.req.method.toUpperCase();

  if (method === "GET") {
    const all = await posts.select().get();
    const published = all.filter((post) => post.published);
    return Response.json(published);
  }

  if (method === "POST") {
    const body = await readBody(ctx.req);
    const input = body as Record<string, unknown>;
    try {
      const parsed = await parse(postSchema, {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt,
        content: input.content,
        published: normalize(input.published),
      });
      const [created] = await posts.insert(parsed);
      // A form post gets the browser back to the blog; a fetch gets JSON.
      if (ctx.req.headers.get("content-type")?.includes("form")) {
        return new Response(null, { status: 303, headers: { location: "/" } });
      }
      return Response.json(created, { status: 201 });
    } catch (error) {
      if (error instanceof ValidationError) {
        return Response.json({ errors: error.issues }, { status: 422 });
      }
      throw error;
    }
  }

  return new Response("Method Not Allowed", {
    status: 405,
    headers: { allow: "GET, POST" },
  });
};
