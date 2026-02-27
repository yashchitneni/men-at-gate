import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { initSentry } from "./lib/sentry";
import App from "./App.tsx";
import "./index.css";

initSentry();

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>,
);
