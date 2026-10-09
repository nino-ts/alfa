import { defineApp } from "alfa";

defineApp({ development: true }).listen(Number(process.env.PORT ?? 3000));
