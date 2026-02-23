import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force update stale service workers to ensure OAuth routes and latest code are served
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => {
      reg.update().catch(() => {});
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
