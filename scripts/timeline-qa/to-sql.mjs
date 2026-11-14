// MÓDULO ELIMINABLE "timeline-qa" — convierte timeline.json en un UPSERT para D1.
import { readFileSync } from "node:fs";
const json = readFileSync(process.argv[2], "utf8");
const escaped = JSON.stringify(JSON.parse(json)).replaceAll("'", "''");
process.stdout.write(`INSERT INTO timeline_qa (id, payload, updated_at) VALUES (1, '${escaped}', strftime('%Y-%m-%dT%H:%M:%fZ','now')) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at;\n`);
