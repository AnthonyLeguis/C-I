# C&I · Entorno reproducible y Plan B sin internet (env "offline": sin Workers AI → motor determinista)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Construcción y datos de demostración. El secreto de sesión no se guarda en la imagen (ver scripts/docker-start.sh).
RUN npm run build:web \
 && npx wrangler d1 migrations apply c-i-db-offline --local --env offline \
 && npx wrangler d1 execute c-i-db-offline --local --env offline --file=seed/seed_mailbox.sql \
 && rm -f .dev.vars \
 && chown -R node:node /app
# Sin privilegios de root en tiempo de ejecución.
USER node
EXPOSE 8787
CMD ["sh", "scripts/docker-start.sh"]
