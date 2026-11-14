// [CAPA 2 — APLICACIÓN] Contexto cerrado del Asistente IA (corrección de Anthony, 14/11).
// El asistente solo atiende dudas del sistema C&I y de la seguridad del correo corporativo del banco.
// Dos capas: (1) filtro determinista por tema, antes de gastar una llamada a la IA; (2) el prompt de sistema
// obliga al modelo a responder la frase fija si, aun así, la pregunta queda fuera del sistema.

export const OUT_OF_SCOPE_ANSWER = "Esta pregunta está fuera de los parámetros. ¿Desea saber algo respecto al sistema?";

const norm = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Vocabulario del sistema y de la seguridad del correo (sin acentos). Palabras cortas con límites de palabra;
// raíces largas como prefijo (suplant → suplantación, suplantan…).
const SCOPE: RegExp[] = [
  // el sistema y sus pantallas
  /\bc\s?&\s?i\b/, /\bc y i\b/, /\bsistema/, /\bplataforma/, /\baplicaci/, /\bpanel/, /\bbuzon/, /\bbandeja/, /\bspam\b/, /\bcuarentena/,
  /\banaliza/, /\basistente/, /\bbitacora/, /\bconsola/, /\bsoporte/, /\bperfil/, /\broles?\b/, /\banalista/, /\bciso\b/, /\bmaster\b/,
  /\bsupervisor/, /\busuario/, /\bsesion/, /\blogin\b/, /\bnotificaci/, /\bmodo (claro|oscuro|reglas)/, /\bexporta/, /\bcsv\b/, /\binforme/, /\breporte/,
  /\bdemo\b/, /\bdemostraci/, /\bescenario/, /\bsimula/, /\bdashboard/, /\bkpi/, /\bmenu\b/, /\bpantalla/, /\bvista/, /\bboton/,
  // correo y phishing
  /\bcorreo/, /\be-?mail/, /\bmensaje/, /\bremitente/, /\breply-?to/, /\basunto/, /\badjunt/, /\barchivo/, /\benlace/, /\blink/, /\burl\b/,
  /\bdominio/, /\bphishing/, /\bsuplant/, /\bfraude/, /\bestafa/, /\bengan/, /\bsmishing/, /\bvishing/, /\bsospechos/, /\bfals[oa]s?\b/,
  /\bsudeban/, /\bseniat/, /\bbanc[oa]s?\b/, /\btransferencia/, /\bproveedor/, /\bfactura/, /\bceo\b/, /\bbec\b/, /\bclave/, /\bcontrasena/,
  /\bcredencial/, /\btoken/, /\bpin\b/, /\bclic/, /\bclick/, /\bdescarg/,
  // seguridad y análisis
  /\bseguridad/, /\bciberseguridad/, /\bamenaza/, /\bataque/, /\bmalware/, /\bvirus/, /\bransomware/, /\briesgo/, /\bpuntaje/, /\bscore/,
  /\bnivel/, /\bcritico/, /\balerta/, /\bindicador/, /\bhallazgo/, /\bspf\b/, /\bdkim\b/, /\bdmarc\b/, /\bautenticaci/, /\bbloque/,
  /\bescal/, /\breportar/, /\brestaur/, /\bconfirmar/, /\bincidente/, /\bhash\b/, /\bauditori/, /\bintegridad/, /\bcadena/,
  // IA, ética, privacidad y ley
  /\bia\b/, /\binteligencia artificial/, /\bmodelo/, /\bllama\b/, /\bguardian/, /\betica/, /\bprivacidad/, /\bdatos personales/, /\bcedula/,
  /\bpii\b/, /\banonimi/, /\bley\b/, /\blegal/, /\barticulo/, /\bnorma/, /\bdelito/, /\bgaceta/,
  // el proyecto
  /\bhackathon/, /\buneti/, /\bequipo\b/,
];

/** ¿La pregunta trata del sistema C&I o de la seguridad del correo del banco? */
export function isInScope(question: string): boolean {
  const t = norm(question);
  return SCOPE.some((re) => re.test(t));
}

/** Si el modelo contestó con la frase de fuera de alcance (aunque agregue algo), se devuelve la frase exacta. */
export function normalizeOutOfScope(reply: string): string | null {
  return norm(reply).includes(norm("fuera de los parametros")) ? OUT_OF_SCOPE_ANSWER : null;
}

// Base de conocimiento (FAQ) del proyecto: contexto cerrado para el modelo y respuesta sin IA (modo offline).
// Orden: de lo más específico a lo más general (en empate de coincidencias gana la primera).
export interface FaqEntry { topic: string; keys: RegExp[]; answer: string }

export const SYSTEM_FAQ: FaqEntry[] = [
  { topic: "Escalar, aprobar y bloquear", keys: [/\bescal/, /\baprobar/, /\bmarcar.*segur/, /\bbloque/, /\brestaur/, /\bconfirm/],
    answer: "En el Buzón, abre el correo: «Aprobar / Marcar seguro» lo devuelve a la bandeja; «Escalar a CISO» lo deja pendiente de revisión; el CISO puede «Confirmar amenaza», «Restaurar a bandeja» o «Bloquear dominio» (los próximos correos de ese dominio irán directo a cuarentena). Todo queda en la bitácora." },
  { topic: "Hallazgos técnicos e informe", keys: [/\bhallazgo/, /\binforme/, /\bmd\b/, /\bdescarg/, /\breporte/],
    answer: "En el Buzón, el botón «Ver hallazgos» abre un modal con cada señal, su categoría y su peso en el puntaje. Desde ahí, «Descargar .md» genera el informe técnico completo (encabezados, hallazgos, fundamento legal, explicación y acción recomendada)." },
  { topic: "Cómo se calcula el riesgo", keys: [/\bpuntaje/, /\bscore/, /\bcalcul/, /\bnivel/, /\b70/],
    answer: "Puntaje final = reglas × 70 % + IA × 30 % (si la IA no responde, cuentan solo las reglas). Niveles: Seguro 0–19 → Bandeja; Bajo 20–49 → Bandeja con aviso; Alto 50–79 → Spam; Crítico 80–100 → Cuarentena con revisión humana." },
  { topic: "Qué hacer con un correo sospechoso", keys: [/\bsospechos/, /\bque hago/, /\bhice clic/, /\bclic/, /\bphishing/, /\bsuplant/],
    answer: "Hallazgo: el correo muestra señales de engaño.\nRiesgo: robo de credenciales o desvío de pagos.\nAcción recomendada: no abras enlaces ni adjuntos, verifica al remitente por un canal oficial, usa «Escalar a CISO» en el Buzón y, si ya hiciste clic, cambia tu clave y avisa a seguridad de inmediato." },
  { topic: "Bitácora e integridad", keys: [/\bbitacora/, /\bhash/, /\bintegridad/, /\bauditori/, /\bcadena/],
    answer: "Cada evento de la bitácora guarda la huella SHA-256 del anterior: si alguien altera un registro, la cadena se rompe. El Master puede verificar la integridad con un botón y el CISO puede exportar la bitácora en CSV." },
  { topic: "Privacidad y datos personales", keys: [/\bprivacidad/, /\bdatos personales/, /\bcedula/, /\bpii/, /\banonimi/],
    answer: "Las cédulas, teléfonos, cuentas y correos personales se tapan antes de llegar a la IA y antes de guardarse (por ejemplo [CEDULA_PROTEGIDA]). Nunca se guarda el texto original con datos personales." },
  { topic: "IA y modo reglas", keys: [/\bia\b/, /\bmodelo/, /\bllama/, /\bmodo reglas/, /\binteligencia artificial/],
    answer: "C&I usa Llama 3.3 70B (con Llama 4 Scout de respaldo) para explicar, y Llama Guard 3 como guardián ético. La IA pesa 30 % y nunca decide sola. Si falla, el Master activa «modo reglas» en la Consola y el sistema sigue funcionando solo con las reglas." },
  { topic: "Fundamento legal", keys: [/\bley\b/, /\blegal/, /\barticulo/, /\bnorma/, /\bdelito/],
    answer: "El fundamento sale de un catálogo verificado: Ley Especial contra los Delitos Informáticos (G.O. 37.313), Constitución (arts. 28, 48 y 60), Ley sobre Mensajes de Datos y Firmas Electrónicas, Ley de Infogobierno y normas de SUDEBAN. La IA nunca inventa artículos." },
  { topic: "Roles y permisos", keys: [/\broles?\b/, /\bperfil/, /\bpermis/, /\banalista/, /\bciso\b/, /\bmaster\b/],
    answer: "Los tres perfiles ven todas las vistas. Analista: simula llegadas, marca como seguro y escala al CISO. CISO: además confirma o restaura, bloquea dominios, exporta la bitácora y retira bloqueos. Master: además verifica la integridad de la cadena y usa la Consola (modo reglas y restablecer datos)." },
  { topic: "Qué es C&I", keys: [/\bque es\b/, /\bpara que sirve/, /\bc\s?&\s?i\b/, /\bsistema\b/],
    answer: "C&I revisa cada correo que llega al personal del banco, detecta phishing y suplantación, lo aparta antes de que alguien haga clic y explica por qué, citando la norma venezolana aplicable. Una persona de seguridad siempre tiene la última palabra." },
];

/** Respuesta sin IA: la entrada del FAQ que más coincide con la pregunta (o null). */
export function faqAnswer(question: string): string | null {
  const t = norm(question);
  let best: FaqEntry | null = null;
  let bestHits = 0;
  for (const e of SYSTEM_FAQ) {
    const hits = e.keys.filter((k) => k.test(t)).length;
    if (hits > bestHits) { best = e; bestHits = hits; }
  }
  return best?.answer ?? null;
}

/** Contexto cerrado para el prompt de sistema del modelo. */
export const FAQ_CONTEXT = SYSTEM_FAQ.map((e) => `- ${e.topic}: ${e.answer.replace(/\n/g, " ")}`).join("\n");
