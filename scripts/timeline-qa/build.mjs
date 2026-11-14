// MÓDULO ELIMINABLE "timeline-qa" — calcula el avance leyendo GitHub y genera el JSON.
// Un punto está COMPLETADO solo cuando su commit llegó a `development` (pasó QA con éxito).
// Uso: GITHUB_TOKEN=... GITHUB_REPOSITORY=owner/repo node scripts/timeline-qa/build.mjs > timeline.json
import { DEVELOPERS } from "./points.mjs";

const repo = process.env.GITHUB_REPOSITORY ?? "AnthonyLeguis/C-I";
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
const headers = { accept: "application/vnd.github+json", "user-agent": "c-i-timeline-qa", ...(token ? { authorization: `Bearer ${token}` } : {}) };

async function gh(path) {
  const r = await fetch(`https://api.github.com/repos/${repo}${path}`, { headers });
  if (!r.ok) throw new Error(`GitHub ${r.status} en ${path}`);
  return r.json();
}

// Código del punto al inicio del título: "feat(W1): …", "docs(X0): …", "W1: …"
const CODE = /^(?:[a-z]+\()?([AWGX]\d)\)?\s*:/i;
const codeOf = (line) => line.match(CODE)?.[1]?.toUpperCase() ?? null;

async function branchCodes(branch) {
  const found = new Map();
  for (let page = 1; page <= 3; page++) {
    const commits = await gh(`/commits?sha=${branch}&per_page=100&page=${page}`);
    for (const c of commits) {
      const code = codeOf(c.commit.message.split("\n")[0]);
      if (code && !found.has(code)) found.set(code, { sha: c.sha.slice(0, 7), date: c.commit.committer.date, message: c.commit.message.split("\n")[0] });
    }
    if (commits.length < 100) break;
  }
  return found;
}

const [dev, qa, open] = await Promise.all([branchCodes("development"), branchCodes("qa"), gh("/pulls?state=open&per_page=100")]);
const openByCode = new Map();
for (const pr of open) {
  const code = codeOf(pr.title);
  if (code && pr.base.ref === "qa") openByCode.set(code, { number: pr.number, url: pr.html_url, title: pr.title, created: pr.created_at });
}

const developers = DEVELOPERS.map((d) => {
  const points = d.points.map((p) => {
    if (dev.has(p.code)) return { ...p, status: "DEVELOPMENT", detail: dev.get(p.code) };
    if (qa.has(p.code)) return { ...p, status: "QA", detail: qa.get(p.code) };
    if (openByCode.has(p.code)) return { ...p, status: "PR_ABIERTO", detail: openByCode.get(p.code) };
    return { ...p, status: "PENDIENTE", detail: null };
  });
  const done = points.filter((p) => p.status === "DEVELOPMENT").length;
  return { id: d.id, name: d.name, github: d.github, total: points.length, done, percent: Math.round((done / points.length) * 100), points };
});

const total = developers.reduce((n, d) => n + d.total, 0);
const done = developers.reduce((n, d) => n + d.done, 0);
const devHead = (await gh("/commits/development")).sha.slice(0, 7);

process.stdout.write(JSON.stringify({ generated_at: new Date().toISOString(), development_sha: devHead, team: { total, done, percent: Math.round((done / total) * 100) }, developers }, null, 2));
