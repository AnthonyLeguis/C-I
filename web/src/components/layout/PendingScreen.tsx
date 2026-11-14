// Pantalla aún no construida: muestra quién la hace y el diseño del prototipo.
import { ImageIcon, Wrench } from "lucide-react";
import { EmptyState } from "../ui";

export function PendingScreen({ name, owner, mock }: { name: string; owner: string; mock: string }) {
  return (
    <EmptyState icon={Wrench} title={`${name}: en construcción`} text={`La construye ${owner}. Mientras tanto, puedes ver el diseño del prototipo.`}
      action={<a className="inline-flex items-center gap-1 text-sm font-semibold text-ai" href={`https://github.com/AnthonyLeguis/C-I/blob/qa/docs/design/prototipo/${mock}`} target="_blank" rel="noreferrer"><ImageIcon size={15} aria-hidden /> Ver diseño</a>} />
  );
}
