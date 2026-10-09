import { posts } from "../lib/posts";

export default () => {
  const items = posts
    .map((post) => `<li><a href="/blog/${post.slug}">${post.title}</a></li>`)
    .join("");
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>blog</title></head>
  <body>
    <h1>Blog</h1>
    <ul>${items}</ul>
  </body>
</html>`;
};
