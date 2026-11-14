// Informe técnico de un correo en Markdown (se descarga desde el modal de hallazgos del Buzón).
// Usa solo datos ya anonimizados: el cuerpo y los indicadores vienen sanitizados desde la API.
import type { EmailDto } from "../../types/contracts";
import { CATEGORY } from "./categories";

const LEVEL: Record<string, string> = { SAFE: "SEGURO", LOW: "BAJO", HIGH: "ALTO", CRITICAL: "CRÍTICO" };
const FOLDER: Record<string, string> = { INBOX: "Bandeja", SPAM: "Spam", QUARANTINE: "Cuarentena" };
/** Escapa Markdown en textos que vienen del remitente (asunto, nombre, explicación): sin enlaces, imágenes ni HTML activos. */
const md = (t: string) => t.replace(/\r?\n/g, " ").replace(/([\\`*_{}[\]()#+!<>|~])/g, "\\$1");
const esc = md;

export function findingsMarkdown(email: EmailDto, action: string): string {
  const out: string[] = [];
  out.push(`# Informe técnico · C&I`, "");
  out.push(`**Asunto:** ${md(email.subject)}  `);
  out.push(`**De:** ${md(email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address)}  `);
  if (email.reply_to) out.push(`**Reply-To:** ${md(email.reply_to)}  `);
  out.push(`**Para:** ${md(email.recipient)}  `);
  out.push(`**Recibido:** ${new Date(email.received_at).toLocaleString("es-VE")}  `);
  out.push(`**Carpeta:** ${FOLDER[email.folder] ?? email.folder} · **Revisión:** ${email.review_status}  `);
  if (email.risk_level) out.push(`**Riesgo:** ${LEVEL[email.risk_level] ?? email.risk_level} · ${email.risk_score ?? "—"}/100`);
  out.push("", "## Hallazgos técnicos", "");
  const rows = email.indicators;
  if (rows.length === 0) out.push("_Sin hallazgos._");
  else {
    out.push("| Categoría | Hallazgo | Peso |", "|---|---|---|");
    for (const f of rows) {
      const cat = (f.weight ?? 1) < 0 ? CATEGORY.CONFIANZA : CATEGORY[f.category] ?? CATEGORY.OTROS;
      out.push(`| ${cat.label} | ${esc(f.text)} | ${f.weight ?? "—"} |`);
    }
  }
  if (email.legal_basis.length > 0) {
    out.push("", "## Fundamento legal", "");
    for (const l of email.legal_basis) out.push(`- **${l.norma}** (${l.referencia}): ${l.relacion}`);
  }
  if (email.xai_explanation) out.push("", "## Explicación del dictamen", "", `_Origen: ${email.ai_used ? `generada por IA (${email.ai_model ?? "modelo no informado"})` : "análisis determinista por reglas"}._`, "", md(email.xai_explanation));
  out.push("", "## Acción recomendada", "", action, "");
  out.push("---", `_Generado por C&I el ${new Date().toLocaleString("es-VE")}. Datos personales protegidos. Orientativo; no constituye asesoría jurídica._`, "");
  return out.join("\n");
}

/** Descarga un texto como archivo .md en el navegador. */
export function downloadMarkdown(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const reportFilename = (email: EmailDto) =>
  `hallazgos-${email.subject.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || email.id}.md`;
