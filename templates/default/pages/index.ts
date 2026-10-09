export default () => `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>alfa</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
    <script defer src="https://unpkg.com/alpinejs@3.14.7/dist/cdn.min.js"></script>
  </head>
  <body>
    <main x-data="{ count: 0 }">
      <h1>alfa</h1>
      <button type="button" x-on:click="count++">
        count: <span x-text="count"></span>
      </button>
      <section hx-get="/api/health" hx-trigger="load" hx-target="#health"></section>
      <div id="health"></div>
    </main>
  </body>
</html>`;
