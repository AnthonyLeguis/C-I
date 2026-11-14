# C&I · Entorno reproducible y Plan B sin internet (env "offline": sin Workers AI → motor determinista)
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN echo 'SESSION_SECRET="docker-local"' > .dev.vars \
 && npm run build:web \
 && npx wrangler d1 migrations apply c-i-db-offline --local --env offline \
 && npx wrangler d1 execute c-i-db-offline --local --env offline --file=seed/seed_mailbox.sql
EXPOSE 8787
CMD ["npx", "wrangler", "dev", "--env", "offline", "--ip", "0.0.0.0", "--port", "8787"]
