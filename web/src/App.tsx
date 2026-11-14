// Enrutado temporal por ruta. G5 (Gabriel) lo reemplaza por el enrutado real con sesión.
import { UiShowcase } from "./pages/UiShowcase";
import { AssistantPreview } from "./pages/AssistantPreview";
import { TimelineQa } from "./pages/TimelineQa"; // MÓDULO ELIMINABLE
import { Home } from "./pages/Home";

export function App() {
  const path = window.location.pathname;
  if (path === "/ui") return <UiShowcase />;
  if (path === "/asistente") return <AssistantPreview />;
  if (path === "/timeline-qa") return <TimelineQa />; // MÓDULO ELIMINABLE
  return <Home />;
}
