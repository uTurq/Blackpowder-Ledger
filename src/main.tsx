import "./styles/fonts.css";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/surfaces.css";
import "./components/Shell.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
