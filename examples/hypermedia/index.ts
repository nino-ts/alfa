const indexPage = Bun.file(new URL("./pages/index.html", import.meta.url));

Bun.serve({
  routes: {
    "/": new Response(indexPage, {
      headers: { "content-type": "text/html; charset=utf-8" },
    }),
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});
