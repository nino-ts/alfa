import type { HttpContext } from "alfa/http";
import { redirect } from "alfa/http";
import { session } from "../lib/session";
import { findById } from "../lib/users";

export default (ctx: HttpContext) => {
  const userId = session.get<string>(ctx, "userId");
  if (!userId) {
    return redirect("/login");
  }
  const user = findById(userId);
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>dashboard</title></head>
  <body>
    <h1>Dashboard</h1>
    <p>Private page for ${user?.email ?? "unknown"}.</p>
    <p><a href="/">&larr; home</a></p>
  </body>
</html>`;
};
