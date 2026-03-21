import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { GameAudioProvider } from "./context/GameAudioContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GameAudioProvider>
      <App />
    </GameAudioProvider>
  </StrictMode>,
);
