export default () => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>alfa hypermedia</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <h1>alfa + HTMX + Alpine</h1>
      <button type="button" x-on:click="count++">count: <span x-text="count"></span></button>
      <button type="button" hx-get="/api/health" hx-target="#out">call API</button>
      <pre id="out"></pre>
    </main>
  </body>
</html>`;
