// Pantalla del Analizador de Casos (PR X3 · PLAN_UX §5.4).
import { useState } from "react";
import { AnalyzerForm } from "../components/analyzer/AnalyzerForm";
import { AnalyzerVerdict } from "../components/analyzer/AnalyzerVerdict";
import { ErrorState, SkeletonCard, useToast } from "../components/ui";
import { api } from "../services/apiClient";
import type { AnalyzeRequest, AnalyzeResponse } from "../types/contracts";

const EMPTY: AnalyzeRequest = {
  from_address: "",
  from_name: "",
  reply_to: "",
  subject: "",
  body: "",
  auth_results: "",
  attachments: [],
};

export function AnalyzerPage() {
  const [form, setForm] = useState<AnalyzeRequest>(EMPTY);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const change = (next: AnalyzeRequest) => {
    setForm(next);
    setResult(null);
    setError(null);
  };

  const analyze = async () => {
    if (form.from_address.trim() === "" || form.subject.trim() === "" || form.body.trim() === "") {
      setError("Completa el remitente, el asunto y el cuerpo antes de analizar.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.analyze({
        ...form,
        from_name: form.from_name?.trim() === "" ? undefined : form.from_name,
        reply_to: form.reply_to?.trim() === "" ? undefined : form.reply_to,
        auth_results: form.auth_results?.trim() === "" ? undefined : form.auth_results,
        attachments: form.attachments,
      });
      setResult(response);
      toast.notify(
        "success",
        "Análisis completado",
        `Riesgo ${response.risk_score}/100 · ${response.action_taken}`,
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo analizar el correo.");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setForm(EMPTY);
    setResult(null);
    setError(null);
  };

  // Sin dictamen todavía: el formulario va solo y centrado (sin tarjeta vacía al lado).
  const idle = !loading && error === null && result === null;
  return (
    <div className={`mx-auto grid items-start gap-4 transition-[max-width] duration-300 ${idle ? "max-w-3xl" : "max-w-7xl lg:grid-cols-2"}`}>
      <AnalyzerForm
        value={form}
        onChange={change}
        onSubmit={() => void analyze()}
        loading={loading}
        onClear={clear}
      />

      <div className={`min-w-0 space-y-4 ${idle ? "hidden" : ""}`} aria-live="polite">
        {error !== null && <ErrorState text={error} onRetry={() => void analyze()} />}
        {loading && (
          <div className="space-y-4" role="status" aria-label="Analizando correo">
            <SkeletonCard lines={5} />
            <SkeletonCard lines={4} />
          </div>
        )}
        {!loading && error === null && result !== null && <AnalyzerVerdict result={result} />}
      </div>
    </div>
  );
}
