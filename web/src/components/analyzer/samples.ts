// Ejemplos sintéticos del Analizador (X3). No contienen datos de personas reales.
import type { AnalyzeRequest } from "../../types/contracts";

export interface AnalyzerSample {
  id: string;
  label: string;
  email: AnalyzeRequest;
}

export const ANALYZER_SAMPLES: AnalyzerSample[] = [
  {
    id: "falso-sudeban",
    label: "Falso SUDEBAN",
    email: {
      from_address: "notificaciones@sudeban-gob.com",
      from_name: "SUDEBAN - Supervisión",
      reply_to: "atencion.sudeban@gmail.com",
      subject: "URGENTE: Actualice sus credenciales antes de la inspección",
      body:
        "Estimado funcionario, su usuario será suspendido en 24 horas. " +
        "Ingrese en http://sudeban-gob.com/validar con su clave corporativa. " +
        "Cédula registrada: V-00.000.001.",
      auth_results: "spf=fail; dkim=none; dmarc=fail",
      attachments: ["Resolucion_actualizada.pdf.exe"],
    },
  },
  {
    id: "fraude-ceo",
    label: "Fraude del CEO",
    email: {
      from_address: "presidencia.ejecutiva@banco-demo-corp.net",
      from_name: "Dr. Ricardo Alarcón — Presidencia",
      reply_to: "r.alarcon.presidencia@outlook.com",
      subject: "CONFIDENCIAL: Transferencia inmediata a proveedor internacional",
      body:
        "Necesito que procese hoy mismo una transferencia urgente al nuevo proveedor. " +
        "Cambiamos la cuenta bancaria; use los datos adjuntos. No lo comente con nadie.",
      auth_results: "spf=softfail; dkim=none; dmarc=fail",
      attachments: ["datos_bancarios_proveedor.pdf"],
    },
  },
  {
    id: "legitimo",
    label: "Correo legítimo",
    email: {
      from_address: "talento.humano@banco-demo.com.ve",
      from_name: "Dirección de Talento Humano",
      subject: "Recibo de pago quincenal disponible en portal interno",
      body: "Su recibo de pago quincenal ya está disponible en el portal interno del banco.",
      auth_results: "spf=pass; dkim=pass; dmarc=pass",
      attachments: [],
    },
  },
];
