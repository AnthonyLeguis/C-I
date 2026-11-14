// Aplica el tema guardado antes de pintar (evita el destello claro→oscuro).
// Va en un archivo propio (no en línea) para que la Política de Seguridad de Contenido solo permita scripts del propio sitio.
try { if (localStorage.getItem("ci-theme") === "dark") document.documentElement.dataset.theme = "dark"; } catch (e) { /* almacenamiento bloqueado */ }
