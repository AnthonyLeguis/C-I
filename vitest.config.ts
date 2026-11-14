// Vitest: solo los tests del proyecto (excluye copias de trabajo de otras sesiones en .claude/).
import { readFileSync } from "node:fs";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  // Igual que Wrangler: `import x from "./archivo.sql"` entrega el texto del archivo.
  plugins: [{
    name: "sql-as-text",
    load(id) {
      return id.endsWith(".sql") ? `export default ${JSON.stringify(readFileSync(id, "utf8"))};` : null;
    },
  }],
  test: {
    include: ["test/**/*.test.ts"],
    exclude: [...configDefaults.exclude, ".claude/**", "worktrees/**"],
  },
});
