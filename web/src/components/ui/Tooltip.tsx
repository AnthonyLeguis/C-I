// Tooltip moderno (reemplaza al `title` nativo del navegador): respeta el tema claro/oscuro, aparece con
// fundido y leve desplazamiento, se muestra al pasar el mouse o con el foco del teclado, y se dibuja en
// un portal con posición fija para que nunca lo recorte una tabla o un contenedor con scroll.
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: TooltipSide;
  /** Retraso antes de mostrarse (ms). */
  delay?: number;
  /** Texto largo: el globo envuelve en varias líneas. */
  wide?: boolean;
  disabled?: boolean;
  /** Clases del contenedor (por defecto `inline-flex`). */
  className?: string;
}

const GAP = 8;

export function Tooltip({ content, children, side = "top", delay = 250, wide = false, disabled = false, className = "" }: TooltipProps) {
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const id = useId();

  const place = useCallback(() => {
    const r = anchor.current?.getBoundingClientRect();
    if (!r) return;
    const x = side === "left" ? r.left - GAP : side === "right" ? r.right + GAP : r.left + r.width / 2;
    const y = side === "top" ? r.top - GAP : side === "bottom" ? r.bottom + GAP : r.top + r.height / 2;
    setPos({ x, y });
  }, [side]);

  const show = () => {
    if (disabled || content === null || content === undefined || content === "") return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { place(); requestAnimationFrame(() => setVisible(true)); }, delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setVisible(false);
    timer.current = window.setTimeout(() => setPos(null), 160);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    if (!pos) return;
    const close = () => hide();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [pos]);
  useEffect(() => { if (disabled) hide(); }, [disabled]);

  // Desplazamiento del globo según el lado (se anima hacia su posición final).
  const base: Record<TooltipSide, string> = {
    top: "-translate-x-1/2 -translate-y-full",
    bottom: "-translate-x-1/2",
    left: "-translate-x-full -translate-y-1/2",
    right: "-translate-y-1/2",
  };
  const enter: Record<TooltipSide, string> = { top: "mt-1", bottom: "-mt-1", left: "ml-1", right: "-ml-1" };
  const arrow: Record<TooltipSide, string> = {
    top: "left-1/2 top-full -translate-x-1/2 -translate-y-1/2 border-b border-r",
    bottom: "left-1/2 bottom-full -translate-x-1/2 translate-y-1/2 border-l border-t",
    left: "left-full top-1/2 -translate-x-1/2 -translate-y-1/2 border-r border-t",
    right: "right-full top-1/2 translate-x-1/2 -translate-y-1/2 border-b border-l",
  };

  return (
    <>
      <span ref={anchor} className={className || "inline-flex"} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} aria-describedby={pos ? id : undefined}>
        {children}
      </span>
      {pos && createPortal(
        <div role="tooltip" id={id} style={{ left: pos.x, top: pos.y }}
          className={`pointer-events-none fixed z-[90] ${base[side]}`}>
          <div className={`relative rounded-control border border-line-strong bg-surface px-2.5 py-1.5 text-xs font-medium leading-snug text-ink shadow-[0_10px_30px_-10px_rgba(2,6,23,0.4)] transition-[opacity,margin] duration-150 ease-out ${wide ? "w-max max-w-[min(22rem,calc(100vw-2rem))] whitespace-normal" : "whitespace-nowrap"} ${visible ? "m-0 opacity-100" : `opacity-0 ${enter[side]}`}`}>
            {content}
            <span aria-hidden className={`absolute h-2 w-2 rotate-45 border-line-strong bg-surface ${arrow[side]}`} />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
