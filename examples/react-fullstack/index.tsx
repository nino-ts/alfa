import { FileSystemRouter } from "bun";

const router = new FileSystemRouter({
  dir: `${import.meta.dir}/pages`,
  origin: "http://localhost:3000",
  style: "nextjs",
});

Bun.serve({
  routes: {
    "/api/hello": new Response("hello"),
  },
  fetch(request) {
    const match = router.match(request);
    if (!match) {
      return new Response("Not Found", { status: 404 });
    }
    return new Response(Bun.file(match.filePath));
  },
});
