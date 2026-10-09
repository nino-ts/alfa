import type { HttpContext } from "alfa/http";
import { findPost } from "../../lib/posts";

export default (ctx: HttpContext) => {
  const slug = ctx.params.slug;
  const post = slug ? findPost(slug) : undefined;
  if (!post) {
    return new Response("Post not found", { status: 404 });
  }
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>${post.title}</title></head>
  <body>
    <p><a href="/">&larr; back</a></p>
    <h1>${post.title}</h1>
    <p>${post.body}</p>
  </body>
</html>`;
};
