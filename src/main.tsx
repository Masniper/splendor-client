import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import { GameAudioProvider } from "./context/GameAudioContext.tsx";
import "./index.css";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameAudioProvider>
      <App />
    </GameAudioProvider>
  </StrictMode>,
);
