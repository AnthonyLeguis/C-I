// Estado de la conversación con el asistente (PR A4 · Anthony).
import { useCallback, useState } from "react";
import { api, ApiClientError } from "../services/apiClient";
import type { AskResponse } from "../types/contracts";

export type ChatTurn =
  | { id: number; kind: "question"; original: string }
  | { id: number; kind: "answer"; result: AskResponse }
  | { id: number; kind: "error"; message: string; retry: string };

let seq = 0;
const nextId = () => ++seq;

export function useAssistant() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || loading) return;
    setTurns((t) => [...t, { id: nextId(), kind: "question", original: q }]);
    setLoading(true);
    try {
      const result = await api.ask(q);
      setTurns((t) => [...t, { id: nextId(), kind: "answer", result }]);
    } catch (e: unknown) {
      const message = e instanceof ApiClientError ? e.message : "No pudimos conectar con el asistente.";
      setTurns((t) => [...t, { id: nextId(), kind: "error", message, retry: q }]);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const clear = useCallback(() => setTurns([]), []);

  return { turns, loading, ask, clear };
}
