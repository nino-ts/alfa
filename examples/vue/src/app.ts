import { createApp, h, ref } from "vue";

// Render function (no SFC, no build plugin) — works with the runtime-only build.
createApp({
  setup() {
    const count = ref(0);
    return () =>
      h("main", [
        h("h1", "alfa + Vue"),
        h(
          "button",
          { type: "button", onClick: () => (count.value += 1) },
          `count: ${count.value}`,
        ),
      ]);
  },
}).mount("#root");
