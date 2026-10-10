import { defineApp } from "alfa";

defineApp().listen(Number(process.env.PORT ?? 3000));
