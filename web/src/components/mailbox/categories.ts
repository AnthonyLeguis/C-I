// Iconos y nombres de las categorías de indicadores (PLAN_UX §3.5).
import { EyeOff, KeyRound, Link2Off, Megaphone, Paperclip, ShieldCheck, Tag, UserX, type LucideIcon } from "lucide-react";
import type { IndicatorCategory } from "../../types/contracts";

export const CATEGORY: Record<IndicatorCategory | "CONFIANZA", { label: string; icon: LucideIcon }> = {
  REMITENTE: { label: "Remitente / suplantación", icon: UserX },
  AUTENTICACION: { label: "Autenticación", icon: KeyRound },
  ENLACES: { label: "Enlaces", icon: Link2Off },
  ADJUNTOS: { label: "Adjuntos", icon: Paperclip },
  INGENIERIA_SOCIAL: { label: "Ingeniería social", icon: Megaphone },
  DATOS_PERSONALES: { label: "Datos personales", icon: EyeOff },
  OTROS: { label: "Otros", icon: Tag },
  CONFIANZA: { label: "Señal de confianza", icon: ShieldCheck },
};
