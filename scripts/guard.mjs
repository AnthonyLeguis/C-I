// Reglas del proyecto que el QA automático hace cumplir (C&I.md §4.4).
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (d) => readdirSync(d).flatMap((f) => {
  const p = join(d, f);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const errors = [];
for (const file of [...walk("src"), ...walk("web/src")].filter((f) => /\.tsx?$/.test(f))) {
  const code = readFileSync(file, "utf8");
  const unix = file.replaceAll("\\", "/");
  if (/:\s*any\b|as any\b|<any>/.test(code)) errors.push(`${unix}: uso de 'any'`);
  if (unix.startsWith("src/domain/") && /from\s+["'](?!\.)/.test(code)) errors.push(`${unix}: import externo en domain/`);
  if (unix.startsWith("web/src/") && !unix.endsWith("services/apiClient.ts") && /\bfetch\(/.test(code)) errors.push(`${unix}: fetch fuera de apiClient.ts`);
  const cedulas = code.match(/[VE]-?\d{1,2}\.\d{3}\.\d{3}/g) ?? [];
  if (cedulas.some((c) => !/00\.000\.00\d$/.test(c))) errors.push(`${unix}: posible cédula real (${cedulas.join(", ")})`);
  if (/(api[_-]?key|token|secret)\s*[:=]\s*["'][A-Za-z0-9_\-]{16,}/i.test(code)) errors.push(`${unix}: posible secreto en el código`);
}
if (errors.length) { console.error("❌ GUARD:\n" + errors.join("\n")); process.exit(1); }
console.log("✅ GUARD: reglas del proyecto OK");
