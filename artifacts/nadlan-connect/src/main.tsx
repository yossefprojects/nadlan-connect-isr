import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initAnalytics } from "./lib/analytics";

// Only load analytics if the visitor previously accepted cookies. New visitors
// see the consent banner and analytics loads on acceptance.
try {
  if (localStorage.getItem("nadlan-cookie-consent") === "accepted") {
    initAnalytics();
  }
} catch {
  /* localStorage unavailable */
}

createRoot(document.getElementById("root")!).render(<App />);
