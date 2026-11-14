// Formulario del Analizador (X3 · PLAN_UX §5.4): pegar un correo o usar un ejemplo.
import { Plus, ScanSearch, Trash2, X } from "lucide-react";
import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { AnalyzeRequest } from "../../types/contracts";
import { Button, Card, CardHeader, Eyebrow } from "../ui";
import { ANALYZER_SAMPLES } from "./samples";

const INPUT =
  "h-10 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/70 focus-visible:border-brand focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/30";

export interface AnalyzerFormProps {
  value: AnalyzeRequest;
  onChange: (next: AnalyzeRequest) => void;
  onSubmit: () => void;
  loading: boolean;
  /** Limpia el formulario y el dictamen. */
  onClear?: () => void;
}

export function AnalyzerForm({ value, onChange, onSubmit, loading, onClear }: AnalyzerFormProps) {
  const [draft, setDraft] = useState("");

  const set = (patch: Partial<AnalyzeRequest>) => onChange({ ...value, ...patch });
  const addAttachment = () => {
    const name = draft.trim();
    if (name === "" || value.attachments.includes(name)) return;
    set({ attachments: [...value.attachments, name] });
    setDraft("");
  };
  const onAttachmentKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addAttachment();
    }
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Card className="min-w-0">
      <CardHeader
        title="Correo a analizar"
        subtitle="Pega el correo crudo o completa los campos. Nada sale del banco sin anonimizar."
        action={
          <div className="flex flex-wrap gap-2">
            {ANALYZER_SAMPLES.map((sample) => (
              <Button
                key={sample.id}
                size="sm"
                variant="secondary"
                onClick={() => {
                  onChange(sample.email);
                  setDraft("");
                }}
              >
                {sample.label}
              </Button>
            ))}
          </div>
        }
      />

      <form className="space-y-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="De (dirección)">
            <input
              className={INPUT}
              value={value.from_address}
              onChange={(event) => set({ from_address: event.target.value })}
              placeholder="notificaciones@sudeban-gob.com"
              autoComplete="off"
              required
            />
          </Field>
          <Field label="Nombre visible">
            <input
              className={INPUT}
              value={value.from_name ?? ""}
              onChange={(event) => set({ from_name: event.target.value })}
              placeholder="SUDEBAN - Supervisión"
              autoComplete="off"
            />
          </Field>
          <Field label="Reply-To">
            <input
              className={INPUT}
              value={value.reply_to ?? ""}
              onChange={(event) => set({ reply_to: event.target.value })}
              placeholder="atencion.sudeban@gmail.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Autenticación (SPF / DKIM / DMARC)">
            <input
              className={INPUT}
              value={value.auth_results ?? ""}
              onChange={(event) => set({ auth_results: event.target.value })}
              placeholder="spf=fail; dkim=none; dmarc=fail"
              autoComplete="off"
            />
          </Field>
        </div>

        <Field label="Asunto">
          <input
            className={INPUT}
            value={value.subject}
            onChange={(event) => set({ subject: event.target.value })}
            placeholder="URGENTE: Actualice sus credenciales"
            required
          />
        </Field>

        <Field label="Cuerpo del correo">
          <textarea
            className={`${INPUT} h-56 resize-y py-3 font-mono text-[13px] leading-relaxed`}
            value={value.body}
            onChange={(event) => set({ body: event.target.value })}
            placeholder="Pega aquí el cuerpo del mensaje…"
            required
          />
        </Field>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Eyebrow>Adjuntos</Eyebrow>
            <span className="text-xs text-ink-muted">{value.attachments.length} archivo(s)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {value.attachments.map((name) => (
              <span key={name} className="inline-flex items-center gap-1 rounded-badge border border-line bg-surface-2 px-2 py-1 font-mono text-xs text-ink-2">
                {name}
                <button
                  type="button"
                  onClick={() => set({ attachments: value.attachments.filter((item) => item !== name) })}
                  className="rounded p-0.5 text-ink-muted hover:text-critical focus-visible:outline-2 focus-visible:outline-critical"
                  aria-label={`Quitar ${name}`}
                >
                  <X size={13} aria-hidden />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className={INPUT}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onAttachmentKey}
              placeholder="nombre-del-archivo.pdf y Enter"
              autoComplete="off"
            />
            <Button variant="secondary" icon={<Plus size={15} />} onClick={addAttachment} aria-label="Agregar adjunto">
              Agregar
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
          <Button type="submit" icon={<ScanSearch size={17} />} loading={loading} disabled={loading}>
            Analizar correo
          </Button>
          {onClear !== undefined && (
            <Button variant="ghost" icon={<Trash2 size={15} />} onClick={onClear} disabled={loading}>
              Limpiar
            </Button>
          )}
          <p className="ml-auto text-xs text-ink-muted">Los enlaces se muestran desactivados en el dictamen.</p>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink-2">{label}</span>
      {children}
    </label>
  );
}
