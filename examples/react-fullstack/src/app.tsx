import { useState } from "react";
import { createRoot } from "react-dom/client";

function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>alfa + React</h1>
      <button type="button" onClick={() => setCount((c) => c + 1)}>
        count: {count}
      </button>
    </main>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
