// Avatar del remitente con sus iniciales, teñido con el color del nivel de riesgo del correo.
import type { RiskLevel } from "../../types/contracts";
import { RISK } from "../ui";

export function senderInitials(name: string | null, address: string): string {
  const base = (name ?? "").replace(/[<>"]/g, "").trim() || address.split("@")[0] || "?";
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : (parts[0]?.[1] ?? ""))).toUpperCase();
}

export function SenderAvatar({ name, address, level, size = "md" }: { name: string | null; address: string; level: RiskLevel | null; size?: "md" | "lg" }) {
  const tone = level ? RISK[level].tone : "text-ink-2 bg-surface-2 border-line-strong";
  return (
    <span aria-hidden className={`flex shrink-0 items-center justify-center rounded-full border font-semibold ${tone} ${size === "lg" ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs"}`}>
      {senderInitials(name, address)}
    </span>
  );
}
