import dashboardPage from "./pages/dashboard.html";
import indexPage from "./pages/index.html";

Bun.serve({
  routes: {
    "/": indexPage,
    "/dashboard": dashboardPage,
  },
  fetch() {
    return new Response("Not Found", { status: 404 });
  },
});
