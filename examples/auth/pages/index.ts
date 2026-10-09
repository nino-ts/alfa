import type { HttpContext } from "alfa/http";
import { session } from "../lib/session";
import { findById } from "../lib/users";

export default (ctx: HttpContext) => {
  const userId = session.get<string>(ctx, "userId");
  const user = userId ? findById(userId) : undefined;
  const nav = user
    ? `<a href="/dashboard">dashboard</a> · <form method="post" action="/logout" style="display:inline"><button type="submit">logout</button></form>`
    : `<a href="/login">login</a>`;

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>auth</title></head>
  <body>
    <h1>alfa auth</h1>
    <p>${user ? `Signed in as ${user.email}` : "Signed out"}</p>
    <nav>${nav}</nav>
  </body>
</html>`;
};
