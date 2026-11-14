// Wrangler importa los archivos .sql como texto (regla por defecto "Text"); Vitest lo hace con un plugin.
declare module "*.sql" {
  const content: string;
  export default content;
}
