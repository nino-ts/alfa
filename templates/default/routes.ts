import type { Router } from "#alfa/routing";

export function registerRoutes(router: Router): void {
  router.get("/", () => new Response("OK")).name("home");
  router.get("/dashboard", () => new Response("OK")).name("dashboard");
}
