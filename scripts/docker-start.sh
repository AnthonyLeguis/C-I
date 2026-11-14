#!/bin/sh
# Arranque del contenedor C&I (Plan B sin internet). El secreto de sesión NUNCA va dentro de la imagen:
# se recibe por variable de entorno o se genera uno aleatorio en cada arranque.
set -e
SECRET="${SESSION_SECRET:-$(node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))")}"
printf 'SESSION_SECRET="%s"\n' "$SECRET" > .dev.vars
chmod 600 .dev.vars
exec npx wrangler dev --env offline --ip 0.0.0.0 --port 8787
