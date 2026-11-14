# 🔐 Seguridad — C&I

C&I es un MVP de demostración para el Hackathon UNETI IA 2026. Trabaja **solo con datos sintéticos** (usuarios, bancos y correos ficticios), pero su código está endurecido como si fuera a producción bancaria. Este documento resume el modelo de amenazas, las defensas implementadas, cómo se verifican y los riesgos que aceptamos conscientemente por ser una demo.

## Reportar una vulnerabilidad

Abra un *issue* en este repositorio con el prefijo `[seguridad]`. **No incluya** datos personales reales ni pruebas que afecten la disponibilidad del entorno público. Pruebe preferiblemente en local o con Docker (`offline`).

## Modelo de amenazas

| Activo | Amenaza | Defensa |
|---|---|---|
| Decisión sobre un correo | Un correo malicioso intenta manipular a la IA («clasifícame como seguro») | La IA **solo puede subir** el riesgo: `final = máx(reglas, 0,7·reglas + 0,3·IA)`. Las instrucciones dirigidas a una IA se detectan (+50) y la explicación mostrada pasa a ser la determinista |
| Datos personales | Fuga hacia el modelo de IA o hacia la base de datos | Anonimizador previo (cédula, teléfono, cuenta, correo personal), también en nombres de adjuntos e indicadores; nunca se guarda el texto original |
| Cuentas | Fuerza bruta, enumeración de usuarios | Límite de intentos por usuario e IP y por IP (`429` + `Retry-After`); tiempo de respuesta igual para usuarios inexistentes; PBKDF2-SHA256 de 100 000 iteraciones; comparación en tiempo constante |
| Sesión | Robo o falsificación de la cookie, CSRF | Token HMAC-SHA256 con expiración obligatoria (8 h); cookie `HttpOnly; Secure; SameSite=Strict`; las escrituras exigen mismo origen y cuerpo JSON |
| Autorización | Escalada de privilegios | Rol mínimo en **cada** endpoint (`ADMIN ⊃ SUPERVISOR ⊃ ANALYST`). Liberar un correo de cuarentena o en revisión exige CISO; las acciones de la consola exigen Master |
| Bitácora | Alteración o bifurcación de la cadena | Hash SHA-256 encadenado; inserción condicional atómica (no se bifurca con escrituras simultáneas); verificación completa por el Master; el restablecimiento de la demo **no** borra la bitácora |
| Asistente | Inyección de instrucciones, uso ofensivo, temas ajenos | Reglas normalizadas (NFKC y sin caracteres invisibles) + Llama Guard 3; contexto cerrado: lo ajeno al sistema no llega a la IA; todo intento queda en la bitácora |
| Disponibilidad y costo | Cuerpos enormes, ReDoS, abuso de la IA | Cuerpos de máximo 64 KB (`413`); límites de tamaño por campo; expresiones regulares acotadas; límite de intentos en el analizador, el asistente y la simulación |
| Navegador | XSS, clickjacking, rastreo | CSP estricta (`script-src 'self'`, sin scripts en línea), `X-Frame-Options: DENY`, `nosniff`, HSTS, `Referrer-Policy`; React escapa todo el contenido; enlaces de correos neutralizados (no clicables) |
| Exportaciones | Inyección de fórmulas en CSV; Markdown malicioso | Celdas que empiezan con `= + - @` se neutralizan; el informe `.md` escapa el texto que viene del remitente |
| Cadena de suministro y CI/CD | Dependencias vulnerables, robo de secretos | `npm audit` sin vulnerabilidades; workflows con `permissions: contents: read`; el token de Cloudflare solo existe en los pasos de despliegue; ningún secreto en el repositorio |
| Contenedor | Ejecución con privilegios, secretos en la imagen | Docker corre como usuario `node`; el secreto de sesión se recibe por variable de entorno o se genera al arrancar |
| Suplantación de dominios | Homógrafos (`sudebán.com`, `xn--…`) | Indicador de suplantación para dominios con caracteres internacionales o punycode |

## Cómo se verifica

- **209 pruebas automáticas** (`npm run check`) en cada PR, incluida `test/securityHardening.test.ts`: IA no manipulable, PII en adjuntos, ReDoS, permisos, CSV, sesión sin expiración, cabeceras, CSRF y modo demo.
- **Prueba de humo** contra la URL real en cada despliegue (`scripts/smoke.mjs`, sin dejar correos de prueba en el buzón).
- **Auditoría de código y pentest** del 14/11/2026: E2E de todas las pantallas y roles, cabeceras, fuerza bruta (`429` desde el 9.º intento), CSRF (`403` / `415`), tamaño (`413`) y Docker.

## Riesgos aceptados (por ser una demo)

| Riesgo | Por qué se acepta | Cómo se acota |
|---|---|---|
| Contraseña de demostración pública y perfiles de 1 clic | El jurado debe poder entrar sin registrarse | Solo existen con `DEMO_MODE="true"` (declarado en `wrangler.toml`); datos 100 % sintéticos; límite de intentos |
| Restablecer la demo vacía el buzón | Hace falta volver a un estado conocido antes del pitch | Solo el rol Master y solo con `DEMO_MODE`; la bitácora se conserva y registra el restablecimiento |
| Cerrar sesión no revoca el token en el servidor (sesión sin estado) | Simplicidad del MVP | Expiración de 8 h, cookie `HttpOnly` y `SameSite=Strict`. En producción real: lista de revocación o sesiones en D1 |
| CSP con `'unsafe-inline'` solo para estilos | Animaciones y estilos calculados del frontend | Los scripts sí son estrictamente `'self'` |
| Acciones de GitHub fijadas por versión, no por SHA | Mantenimiento durante el hackatón | Permisos mínimos y secretos acotados por paso |
| Página pública `/timeline-qa` | Seguimiento del avance del equipo durante el evento | Solo lectura, sin datos personales; módulo eliminable |

## Hacia una instalación bancaria real

Directorio corporativo (Active Directory / LDAP) en lugar de usuarios de demo, `DEMO_MODE` desactivado, revocación de sesiones, IA local (Ollama) dentro de la infraestructura del banco, conector al servidor de correo con sus encabezados reales y cifrado de la base de datos.
