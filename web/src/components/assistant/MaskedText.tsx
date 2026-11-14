// Muestra un texto resaltando los datos tapados ([CEDULA_PROTEGIDA]…) como chips (PR A4 · PLAN_UX §5.5).
import { EyeOff } from "lucide-react";

const MASK = /(\[[A-Z_]+_PROTEGID[AO]\])/g;
const IS_MASK = /^\[[A-Z_]+_PROTEGID[AO]\]$/;
const NICE: Record<string, string> = {
  "[CEDULA_PROTEGIDA]": "cédula protegida",
  "[TELEFONO_PROTEGIDO]": "teléfono protegido",
  "[CUENTA_BANCARIA_PROTEGIDA]": "cuenta protegida",
  "[CORREO_PERSONAL_PROTEGIDO]": "correo protegido",
};

export function MaskedText({ text }: { text: string }) {
  return (
    <span>
      {text.split(MASK).map((part, i) =>
        IS_MASK.test(part) ? (
          <span key={i} className="mx-0.5 inline-flex items-center gap-1 rounded-badge border border-line-strong bg-surface-2 px-1.5 py-0.5 align-middle font-mono text-[11px] font-medium text-ink-2">
            <EyeOff size={11} aria-hidden /> {NICE[part] ?? "dato protegido"}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
