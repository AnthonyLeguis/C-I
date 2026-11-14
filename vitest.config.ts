// Vitest: solo los tests del proyecto (excluye copias de trabajo de otras sesiones en .claude/).
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    exclude: [...configDefaults.exclude, ".claude/**", "worktrees/**"],
  },
});
