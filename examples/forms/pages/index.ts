export default () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>contact</title>
    <script src="https://unpkg.com/htmx.org@2.0.4"></script>
  </head>
  <body>
    <h1>Contact</h1>
    <form hx-post="/contact" hx-target="#result" hx-swap="innerHTML">
      <p><input name="name" placeholder="name" /></p>
      <p><input name="email" placeholder="email" /></p>
      <p><textarea name="message" placeholder="message"></textarea></p>
      <button type="submit">Send</button>
    </form>
    <div id="result"></div>
  </body>
</html>`;
