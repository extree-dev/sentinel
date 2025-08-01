import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom"; // Импорт
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Router> {/* Обёртка для роутера */}
      <App />
    </Router>
  </StrictMode>
);