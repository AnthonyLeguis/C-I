// Fondo vivo de ciberseguridad (login y plataforma), al estilo del Dashboard_RC pero con motivos de C&I:
// red de nodos como el globo del logo, paquetes que viajan por la red, escudo y candado tenues,
// rejilla de puntos y un barrido de escaneo muy lento. Todo pasivo y casi transparente; los colores y
// opacidades salen de tokens `--bg-*` que cambian con el tema. Respeta «reducir movimiento».

// Nodos de la red (coordenadas en un lienzo de 1200×800).
const NODES: [number, number][] = [
  [90, 140], [260, 90], [420, 190], [210, 300], [80, 430], [330, 470], [520, 360],
  [690, 120], [860, 210], [1010, 110], [1130, 260], [960, 400], [780, 470], [1100, 560],
  [880, 650], [640, 640], [430, 700], [200, 650], [60, 720], [1180, 720],
];
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [3, 2], [3, 4], [4, 5], [5, 3], [5, 6], [2, 6], [2, 7], [7, 8], [8, 9], [9, 10],
  [8, 11], [10, 11], [11, 12], [6, 12], [11, 13], [13, 14], [12, 14], [14, 15], [12, 15], [15, 16], [16, 17],
  [5, 16], [17, 18], [4, 17], [13, 19], [14, 19], [6, 7],
];
// Rutas por donde «viajan» los paquetes (secuencias de nodos).
const ROUTES = [[0, 3, 5, 6, 12, 11, 13], [9, 8, 7, 2, 1], [18, 17, 16, 15, 14, 19]];
const pt = (i: number): [number, number] => NODES[i] ?? [0, 0];
const routePath = (r: number[]) => r.map((n, i) => `${i ? "L" : "M"}${pt(n)[0]} ${pt(n)[1]}`).join(" ");
const HEX = ["0x7F 3A 9C E1 04 B2", "SPF=pass DKIM=pass DMARC=pass", "SHA-256 · 9f3c…a71e", "0x1D 88 C4 0B 5E 27"];

export function CyberBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" style={{ background: "var(--bg-grad)" }}>
      {/* Orbes de color que flotan despacio */}
      <div className="cy-float absolute -left-28 top-6 h-[26rem] w-[26rem] rounded-full blur-[70px]" style={{ background: "var(--bg-orb-a)" }} />
      <div className="cy-float-2 absolute right-[-8rem] top-[24%] h-[28rem] w-[28rem] rounded-full blur-[70px]" style={{ background: "var(--bg-orb-b)" }} />
      <div className="absolute bottom-[-8rem] left-[30%] h-[22rem] w-[22rem] rounded-full blur-[70px]" style={{ background: "var(--bg-orb-c)" }} />

      {/* Rejilla de puntos */}
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(var(--bg-dots) 0.9px, transparent 0.9px)", backgroundSize: "26px 26px" }} />

      {/* Red de nodos, paquetes y símbolos de seguridad */}
      <svg className="cy-drift absolute inset-0 h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <g stroke="var(--bg-net)" strokeWidth="1.1" style={{ opacity: "var(--bg-net-op)" }}>
          {EDGES.map(([a, b]) => <line key={`${a}-${b}`} x1={pt(a)[0]} y1={pt(a)[1]} x2={pt(b)[0]} y2={pt(b)[1]} />)}
        </g>
        <g style={{ opacity: "var(--bg-node-op)" }}>
          {NODES.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 4.5 : 3.2} fill={i % 2 ? "var(--bg-node-a)" : "var(--bg-node-b)"} className={i % 4 === 0 ? "cy-node-pulse" : undefined} style={{ animationDelay: `${(i % 5) * 0.9}s` }} />
          ))}
        </g>
        {/* Paquetes de datos recorriendo la red (inspección del tráfico) */}
        <g className="cy-packets" style={{ opacity: "var(--bg-packet-op)" }}>
          {ROUTES.map((r, i) => (
            <circle key={i} r="3.4" fill="var(--bg-packet)">
              <animateMotion dur={`${16 + i * 5}s`} repeatCount="indefinite" path={routePath(r)} begin={`${i * 3}s`} />
            </circle>
          ))}
        </g>
        {/* Escudo con verificación y candado, muy tenues */}
        <g fill="none" stroke="var(--bg-net)" strokeWidth="5" strokeLinejoin="round" strokeLinecap="round" style={{ opacity: "var(--bg-glyph-op)" }}>
          <path d="M1030 470 l60 -24 l60 24 v52 c0 44 -28 74 -60 88 c-32 -14 -60 -44 -60 -88 Z" />
          <path d="M1062 532 l20 20 l36 -40" />
          <rect x="120" y="230" width="62" height="50" rx="9" />
          <path d="M134 230 v-16 a17 17 0 0 1 34 0 v16" />
        </g>
        <g fill="var(--bg-net)" fontFamily="JetBrains Mono, ui-monospace, monospace" fontSize="13" style={{ opacity: "var(--bg-hex-op)" }}>
          {HEX.map((t, i) => <text key={t} x={[560, 720, 120, 860][i]} y={[70, 560, 560, 760][i]}>{t}</text>)}
        </g>
      </svg>

      {/* Barrido de escaneo vertical, lento y casi invisible */}
      <div className="cy-scan absolute inset-x-0 h-40" style={{ background: "linear-gradient(180deg, transparent, var(--bg-scan), transparent)" }} />

      <div className="absolute inset-0" style={{ background: "var(--bg-vign)" }} />
    </div>
  );
}
