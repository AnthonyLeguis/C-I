// MÓDULO ELIMINABLE "timeline-qa" — catálogo de puntos (PR) por desarrollador, según docs/PLAN_PRS.md §2.
// Para quitar el módulo completo, ver docs/TIMELINE_QA.md.
export const DEVELOPERS = [
  {
    id: "anthony",
    name: "Anthony Leguisamo",
    github: "AnthonyLeguis",
    points: [
      { code: "A0", title: "Base del proyecto (F0)", cp: "CP0" },
      { code: "A1", title: "Anonimizador de PII venezolana", cp: "CP1" },
      { code: "A2", title: "Adaptador de Workers AI con fallback", cp: "CP1" },
      { code: "A3", title: "Guardián ético y asistente real", cp: "CP2" },
      { code: "X0", title: "Prototipo de Alejandro en docs/design", cp: "CP0" },
      { code: "X1", title: "Paleta claro/oscuro, fuentes y tema", cp: "CP1" },
      { code: "X2", title: "Kit de componentes UI y movimiento", cp: "CP2" },
      { code: "A4", title: "Pantalla del Asistente IA", cp: "CP3" },
      { code: "A6", title: "Consola de Soporte", cp: "CP4" },
      { code: "X5", title: "README y guion del pitch", cp: "CP5" },
      { code: "A5", title: "SPEC.md final y declaración de IA", cp: "CP5" },
    ],
  },
  {
    id: "williams",
    name: "Williams Mejía",
    github: "ApKTecnicell",
    points: [
      { code: "W1", title: "Catálogo legal y dominios oficiales", cp: "CP1" },
      { code: "W2", title: "Parser de correo", cp: "CP1" },
      { code: "W3", title: "Reglas y puntaje de riesgo", cp: "CP2" },
      { code: "W4", title: "Análisis completo y POST /mail/analyze real", cp: "CP2" },
      { code: "W5", title: "Correos de demo y casos", cp: "CP3" },
      { code: "X3", title: "Pantalla del Analizador", cp: "CP3" },
    ],
  },
  {
    id: "gabriel",
    name: "Gabriel Flores",
    github: "gabo18flores8",
    points: [
      { code: "G1", title: "Login y roles (RBAC)", cp: "CP1" },
      { code: "G2", title: "Repositorios D1 y bitácora con hash", cp: "CP1" },
      { code: "G3", title: "API del buzón", cp: "CP2" },
      { code: "G4", title: "API del panel", cp: "CP2" },
      { code: "G5", title: "Pantallas de Login y Buzón", cp: "CP3" },
      { code: "G7", title: "Acciones CISO y bloqueo de dominio", cp: "CP3" },
      { code: "G6", title: "Pantalla del Panel", cp: "CP4" },
      { code: "X4", title: "Pulido final de UI", cp: "CP5" },
    ],
  },
];
