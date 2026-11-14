// Escenarios SINTÉTICOS para "Simular llegada de correo" (apoyo a G3, basados en el prototipo de Alejandro).
// W5 (Williams) puede ampliar o reemplazar esta lista. Ningún dato pertenece a personas reales.
import type { EmailInput } from "../domain/types";

export interface DemoScenario { id: string; label: string; email: EmailInput }

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "sudeban-credenciales",
    label: "Falso SUDEBAN (crítico)",
    email: {
      fromAddress: "notificaciones@sudeban-portal-seguro.com", fromName: "SUDEBAN - Supervisión Bancaria", replyTo: "validacion.sudeban@gmail.com",
      subject: "URGENTE: Actualice sus credenciales de reporte bancario antes de 2 horas",
      body: "Estimado oficial: se detectó una inconsistencia en su certificado de reporte semanal. Debe validar sus credenciales de acceso institucional antes de las 13:00 para evitar la suspensión operativa. Ingrese aquí: https://sudeban-portal-seguro.com/auth/login-banco",
      authResults: "spf=fail; dkim=fail; dmarc=fail", attachments: [],
    },
  },
  {
    id: "fraude-ceo",
    label: "Fraude del CEO (crítico)",
    email: {
      fromAddress: "presidencia.ejecutiva@banco-demo-corp.net", fromName: "Dr. Ricardo Alarcón — Presidencia", replyTo: "r.alarcon.presidencia@outlook.com",
      subject: "CONFIDENCIAL: Transferencia inmediata a proveedor internacional",
      body: "Necesito que procese hoy mismo una transferencia urgente al nuevo proveedor. Cambiamos la cuenta bancaria del proveedor, use los datos adjuntos. No lo comente con nadie, es confidencial.",
      authResults: "spf=softfail; dkim=none; dmarc=fail", attachments: ["datos_bancarios_proveedor.pdf"],
    },
  },
  {
    id: "factura-macro",
    label: "Factura con macro (alto)",
    email: {
      fromAddress: "cobranzas@servicios-integrales-ve.info", fromName: "Facturación Proveedores",
      subject: "Factura vencida #FAC-2026-8841 — Evite suspensión de servicio",
      body: "Su factura está vencida. Último aviso: descargue el detalle y habilite el contenido para evitar la suspensión del servicio.",
      authResults: "spf=none; dkim=none; dmarc=none", attachments: ["FAC-2026-8841.xlsm"],
    },
  },
  {
    id: "tarjeta-acortador",
    label: "Alerta de tarjeta con enlace acortado (alto)",
    email: {
      fromAddress: "seguridad-tarjetas@bancodemo-alerta.org", fromName: "Centro de Seguridad Tarjetas",
      subject: "Bloqueo preventivo en tarjeta corporativa terminada en 4491",
      body: "Detectamos un movimiento inusual en su tarjeta corporativa. Puede revisar el detalle en https://bit.ly/bd-movimientos",
      authResults: "spf=pass; dkim=pass; dmarc=none", attachments: [],
    },
  },
  {
    id: "rrhh-legitimo",
    label: "Recibo de pago legítimo (seguro)",
    email: {
      fromAddress: "talento.humano@banco-demo.com.ve", fromName: "Dirección de Talento Humano",
      subject: "Recibo de pago quincenal disponible en portal interno",
      body: "Su recibo de pago quincenal ya está disponible en el portal interno del banco.",
      authResults: "spf=pass; dkim=pass; dmarc=pass", attachments: [],
    },
  },
  {
    id: "conciliacion-legitima",
    label: "Conciliación diaria legítima (seguro)",
    email: {
      fromAddress: "operaciones@banco-demo.com.ve", fromName: "Operaciones Internacionales",
      subject: "Confirmación de conciliación diaria lote #20261113",
      body: "Se confirma la conciliación del lote del día. No se requieren acciones adicionales.",
      authResults: "spf=pass; dkim=pass; dmarc=pass", attachments: [],
    },
  },
];

export const findScenario = (id: string) => DEMO_SCENARIOS.find((s) => s.id === id) ?? null;
