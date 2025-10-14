import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "./theme";        // ⬅️ nuestro theme unificado
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// ——— Tu lógica existente para ocultar el banner de Google Translate ———
document.addEventListener("DOMContentLoaded", () => {
  const translateFrame = document.querySelector(".goog-te-banner-frame");
  if (translateFrame) translateFrame.remove();

  const observer = new MutationObserver(() => {
    const bodyStyle = getComputedStyle(document.body);
    if (bodyStyle.marginTop !== "0px") {
      document.body.style.marginTop = "0px";
    }
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });
});

// ——— Construimos el theme (podés cambiar a 'dark' para probar) ———
const theme = getTheme("light");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
