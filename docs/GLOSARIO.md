# 📖 Glosario — C&I SENTINEL

> Términos y siglas que van a escuchar durante el hackathon, en orden alfabético y con palabras sencillas.
> 🔷 = término que usamos directamente en nuestro proyecto.
> Vista previa en VS Code: `Ctrl + Shift + V`.

[A](#a) · [B](#b) · [C](#c) · [D](#d) · [E](#e) · [F](#f) · [G](#g) · [H](#h) · [I](#i) · [J](#j) · [K](#k) · [L](#l) · [M](#m) · [N](#n) · [O](#o) · [P](#p) · [Q](#q) · [R](#r) · [S](#s) · [T](#t) · [U](#u) · [V](#v) · [W](#w) · [X](#x) · [Z](#z)

---

## A

- **Acortador de URL:** servicio que convierte un enlace largo en uno corto (bit.ly, tinyurl). Los atacantes los usan para esconder el destino real. 🔷 *Nuestro motor anti-phishing lo marca como indicador de riesgo.*
- **Adjunto con doble extensión:** archivo que finge ser un documento pero es un programa (`Resolucion.pdf.exe`). 🔷 *Indicador de alto riesgo.*
- **Agente de IA:** programa con IA que no solo responde, sino que **hace tareas**: lee archivos, ejecuta comandos o escribe código. Ejemplos: Claude Code, Antigravity, DeepSeek Harness.
- **Air-gapped / aislado:** equipo o red sin conexión a internet. 🔷 *Visión on-premise de Williams para producción.*
- **Alucinación (IA):** cuando la IA inventa algo con total seguridad, aunque sea falso. 🔷 *Por eso en C&I "las reglas deciden y la IA explica".*
- **Anonimizar:** quitar o tapar los datos que identifican a una persona. 🔷 *Cambiamos "V-00.000.001" por `[CEDULA_PROTEGIDA]`.*
- **`any` (TypeScript):** tipo que significa "cualquier cosa" y desactiva las revisiones de TypeScript. 🔷 *Prohibido en el proyecto.*
- **API (Application Programming Interface):** puerta por la que dos programas se comunican. El frontend le pide datos al backend a través de la API. *Analogía: el mesero que lleva tu pedido a la cocina y te trae el plato.*
- **API key / token:** contraseña que identifica a un programa ante un servicio. **Nunca** se sube al repositorio.
- **Arquitectura limpia (Clean Architecture):** forma de organizar el código en capas, donde el núcleo (las reglas del negocio) no depende de herramientas externas. 🔷 *Nuestras 4 capas: domain, application, infrastructure, presentation.*
- **Async / await:** forma de escribir código que **espera** algo lento (internet, base de datos) sin congelar el programa.
- **Auditoría:** registro de qué pasó, cuándo y por qué, para poder revisarlo después. 🔷 *Tabla `audit_events`.*
- **Authentication-Results:** 🔷 *encabezado del correo donde el servidor anota si pasaron SPF, DKIM y DMARC.*

## B

- **Backend:** la parte del sistema que **no se ve**: procesa datos, aplica reglas y guarda información. *La cocina del restaurante.*
- **Badge:** etiqueta visual pequeña. 🔷 *"Generado por IA".*
- **Base de datos (BD):** lugar donde se guarda la información de forma organizada. 🔷 *Usamos D1.*
- **BEC / Fraude del CEO (Business Email Compromise):** correo que suplanta a un jefe o proveedor para pedir una transferencia urgente o un cambio de cuenta bancaria. 🔷 *Lo detecta el motor de Williams.*
- **Binding:** en Cloudflare, la "conexión" que le da al Worker acceso a un servicio (DB, AI). 🔷 *`env.DB`, `env.AI`.*
- **Bitácora encadenada (hash chain):** 🔷 *cada registro guarda el hash del anterior; si alguien altera uno, la cadena se rompe.*
- **Branch (rama):** copia paralela del código donde alguien trabaja sin afectar a los demás. 🔷 *`main`, `development`, `feat/...`.*
- **Bug:** error en el programa.
- **Build:** proceso que convierte el código fuente en la versión lista para publicar. 🔷 *`npm run build:web`.*

## C

- **C&I:** 🔷 *Creatividad e Innovación, nombre de nuestro equipo.*
- **Caché:** copia guardada de algo para no volver a pedirlo y ahorrar tiempo.
- **Checkpoint:** 🔷 *pausa de 15 minutos cada 2 horas para integrar y probar todo junto (Sección 9.7 del plan).*
- **CI/CD (Continuous Integration / Continuous Deployment):** integración y despliegue continuos. Cada vez que alguien sube código, un robot lo prueba (CI) y, si todo está bien, lo publica (CD). 🔷 *Lo hacemos con GitHub Actions.*
- **CISO (Chief Information Security Officer):** responsable máximo de seguridad de la información en una organización.
- **CLI (Command Line Interface):** programa que se usa escribiendo comandos en la terminal. Ejemplos: `git`, `gh`, `wrangler`.
- **Clonar:** descargar una copia completa de un repositorio a tu PC. `git clone ...`
- **Cloudflare:** empresa que ofrece servidores, seguridad y servicios en la nube. 🔷 *Donde publicamos C&I.*
- **Commit:** "foto" guardada de tus cambios en Git, con un mensaje que describe lo que hiciste.
- **Componente (React):** pieza reutilizable de una pantalla (un botón, una tarjeta, una tabla).
- **Conflicto (merge conflict):** cuando dos personas cambian la misma línea y Git no sabe cuál dejar. 🔷 *Lo evitamos con "cada quien en sus archivos".*
- **Contrato (de API):** acuerdo exacto de qué datos se envían y se reciben. 🔷 *Sección 4 del plan: "inmutable".*
- **Cookie HttpOnly:** cookie que el navegador guarda pero que el JavaScript de la página no puede leer; protege la sesión. 🔷 *Así guardamos la sesión.*
- **CORS:** regla de los navegadores que bloquea pedidos entre sitios distintos. 🔷 *No nos afecta porque frontend y API están en la misma URL.*
- **Credenciales:** usuario y contraseña (o tokens) para entrar a un sistema.
- **CSIRT (Computer Security Incident Response Team):** equipo que responde a incidentes de ciberseguridad.
- **CSS:** lenguaje para dar estilo a una página (colores, tamaños, posiciones).
- **Cuarentena:** 🔷 *carpeta donde se aíslan los correos críticos hasta que un humano decida; el trabajador no los ve.*

## D

- **D1:** 🔷 *base de datos de Cloudflare basada en SQLite. Ahí se guarda la auditoría.*
- **Dashboard:** panel con indicadores y gráficos. 🔷 *Panel de auditoría (M3).*
- **Dataset:** conjunto de datos.
- **Datos sintéticos:** datos **inventados** que parecen reales, pero no pertenecen a nadie. 🔷 *Obligatorio en todo el proyecto.*
- **Deepfake:** video, audio o imagen falsos generados con IA.
- **Deploy (desplegar):** publicar la aplicación en un servidor para que se pueda usar desde internet. 🔷 *`wrangler deploy`.*
- **Determinista:** que con la misma entrada **siempre** da el mismo resultado. Lo contrario de la IA, que puede variar. 🔷 *Nuestro motor de reglas y el respaldo (fallback).*
- **Development (rama):** 🔷 *rama de integración donde se unen los trabajos de todos antes de pasar a producción.*
- **DKIM (DomainKeys Identified Mail):** firma digital que prueba que el correo no fue alterado y viene del dominio que dice. 🔷 *Si falla, sube el riesgo.*
- **DMARC:** política del dominio que dice qué hacer si fallan SPF o DKIM (aceptar, mandar a spam o rechazar). 🔷 *`dmarc=fail` es indicador fuerte.*
- **Docker Compose:** archivo (`docker-compose.yml`) que levanta varios contenedores juntos con un solo comando.
- **Docker:** herramienta que empaqueta una aplicación con todo lo que necesita en un **contenedor**, para que funcione igual en cualquier computadora.
- **Dominio:** nombre de un sitio web (`saime.gob.ve`). 🔷 *El motor revisa si el dominio es oficial o falso.*
- **DPIA (Data Protection Impact Assessment):** evaluación del impacto de un sistema sobre la privacidad de las personas.

## E

- **.eml:** archivo que contiene un correo completo (encabezados + cuerpo + adjuntos).
- **Encabezados (headers) del correo:** datos técnicos ocultos del correo: remitente real, ruta, autenticación. 🔷 *Los lee el parser.*
- **Endpoint:** una dirección específica de la API que hace una cosa. 🔷 *`POST /api/v1/phishing/analyze`.*
- **Entorno (environment):** lugar donde corre la aplicación. 🔷 *Local (tu PC), staging (pruebas) y producción (la del jurado).*
- **Entropía de Shannon:** medida de qué tan "aleatorio" es un texto. Los dominios falsos generados automáticamente suelen tener entropía alta (`xk7q9z.com`).
- **Enum:** lista cerrada de valores permitidos. 🔷 *`SAFE`, `LOW`, `HIGH`, `CRITICAL`.*
- **ESLint / linter:** herramienta que revisa el código buscando errores y malas prácticas.
- **Explicabilidad:** capacidad de un sistema de decir **por qué** tomó una decisión. Ver *XAI*.

## F

- **Fallback (respaldo):** plan B automático cuando algo falla. 🔷 *Si la IA no responde, el motor de reglas da la respuesta igual.*
- **Falso negativo:** algo peligroso que el sistema dejó pasar como seguro.
- **Falso positivo:** algo seguro que el sistema marcó como peligroso.
- **FastAPI:** framework de Python para construir APIs (estaba en el plan original y lo reemplazamos por Hono).
- **`feat/` (rama feature):** 🔷 *prefijo de las ramas de trabajo de cada integrante (`feat/phishing-engine`).*
- **`fetch()`:** función de JavaScript que hace pedidos por internet. 🔷 *Solo se permite dentro de `apiClient.ts`.*
- **Fintech:** empresa que ofrece servicios financieros con tecnología (pagos, billeteras digitales). En Venezuela las regula SUDEBAN.
- **Firewall:** barrera que filtra el tráfico permitido y el bloqueado.
- **Fork:** copia de un repositorio ajeno en tu propia cuenta.
- **Framework:** conjunto de herramientas que da una estructura lista para construir algo (React, Hono).
- **Frontend:** la parte que **sí se ve**: pantallas, botones y colores. *El salón del restaurante.*

## G

- **gh (GitHub CLI):** programa para manejar GitHub desde la terminal (crear repos, PR, ver el CI).
- **Git:** sistema que guarda el historial de cambios del código y permite trabajar en equipo.
- **GitHub Actions:** 🔷 *el "robot" de GitHub que ejecuta nuestras pruebas y despliegues automáticos.*
- **GitHub:** sitio web donde se guardan repositorios Git en internet.
- **`.gitignore`:** archivo con la lista de cosas que Git **no** debe subir (claves, carpetas pesadas).
- **GLM-4.7 Flash:** 🔷 *modelo de IA que usamos en Workers AI para redactar las explicaciones.*

## H

- **Hackathon:** competencia de desarrollo intensivo, normalmente de 24 a 48 horas.
- **Hash (SHA-256):** "huella digital" de un dato: si cambia una sola letra, el hash cambia por completo. 🔷 *Integridad de la bitácora.*
- **Heurística:** regla práctica que detecta algo "con buena probabilidad" (por ejemplo: "si dice 'urgente' y trae un enlace raro, sospecha").
- **HMAC:** firma que usa un secreto para probar que un dato (como un token de sesión) no fue falsificado. 🔷 *Firma de la sesión.*
- **Hono:** 🔷 *framework liviano para crear la API dentro de Cloudflare Workers.*
- **Hook (React):** función especial de React para manejar estado o datos. 🔷 *`useMailbox`, `useDashboard`.*
- **HTML:** lenguaje que define la estructura de una página web.
- **HTTP / HTTPS:** protocolo con el que se comunican navegador y servidor. La "S" significa que la conexión va cifrada (segura).
- **Human-in-the-loop:** un humano revisa y aprueba las decisiones importantes de la IA. 🔷 *Bandeja de revisión humana (M3).*

## I

- **IA (Inteligencia Artificial):** sistemas que realizan tareas que normalmente requieren inteligencia humana (entender texto, clasificar, redactar).
- **IAM (Identity and Access Management):** gestión de quién puede entrar a qué.
- **IDE:** editor de código con herramientas extra. Ejemplo: VS Code.
- **IDS / IPS (Intrusion Detection / Prevention System):** sistemas que detectan o bloquean intrusos en una red.
- **Indicador (IoC, Indicator of Compromise):** pista técnica de que algo es malicioso. 🔷 *Campo `indicators` en la respuesta.*
- **Ingeniería social:** manipular a las personas (con miedo, urgencia o autoridad) para que entreguen datos o hagan algo indebido.
- **Inmutable:** que no se puede cambiar.
- **Integración:** unir el trabajo de varias personas y comprobar que funciona en conjunto.
- **Interfaz (TypeScript):** "molde" que describe qué forma tiene un objeto. 🔷 *`AuditEvent`.*

## J

- **Jailbreak:** intento de "liberar" a una IA de sus reglas para que haga lo que no debe. Es un tipo de *prompt injection*.
- **JavaScript (JS):** lenguaje de programación de la web. Corre en el navegador y, con Node.js, también en servidores.
- **JSON:** formato de texto para intercambiar datos: `{ "nombre": "valor" }`. 🔷 *Todos nuestros contratos de API.*
- **JWT (JSON Web Token):** token de sesión firmado muy usado en APIs (el plan de Williams lo usaba; nosotros usamos un token HMAC equivalente y más simple).

## K

- **KPI (Key Performance Indicator):** número clave para medir algo. 🔷 *Total analizado, amenazas bloqueadas, etc.*
- **KV (Workers KV):** almacenamiento clave-valor de Cloudflare (no lo usamos en el MVP).

## L

- **Levenshtein (distancia de):** cuántas letras hay que cambiar para convertir una palabra en otra. `saime` → `sainne` = 2. 🔷 *Detecta dominios casi iguales a los oficiales (typosquatting).*
- **Ley Especial contra los Delitos Informáticos:** ley venezolana (2001) que tipifica delitos como acceso indebido, fraude y violación de la privacidad de datos. 🔷 *Base del fundamento legal.*
- **Ley sobre Mensajes de Datos y Firmas Electrónicas:** ley venezolana (2001) que da valor legal a los mensajes electrónicos, como los correos.
- **Llama Guard 3:** 🔷 *modelo de IA de Meta especializado en detectar contenido peligroso; lo usamos como segunda opinión contra la manipulación.*
- **LLM (Large Language Model):** modelo de lenguaje grande, el tipo de IA que entiende y genera texto (ChatGPT, Claude, Llama, GLM, DeepSeek).
- **Localhost:** tu propia computadora vista como servidor (`http://localhost:8787`).

## M

- **Main (rama):** 🔷 *rama principal; lo que está aquí es lo que se publica en producción y ve el jurado.*
- **Malware:** software malicioso (virus, troyanos, ransomware).
- **Markdown (.md):** formato de texto simple con símbolos (`#`, `**`, `-`) para títulos, negritas y listas. Este archivo es Markdown.
- **Merge:** unir los cambios de una rama con otra.
- **Middleware:** código que se ejecuta "en medio" de cada pedido (para validar, registrar, etc.).
- **Migración:** archivo que crea o cambia tablas de la base de datos de forma ordenada. 🔷 *`0001_audit_events.sql`.*
- **Mock:** versión falsa de algo que devuelve datos de ejemplo, para poder avanzar sin la pieza real. 🔷 *Las rutas mock del F0.*
- **Modelo (IA):** el "cerebro" entrenado de la IA.
- **Módulo:** 🔷 *parte del proyecto asignada a una persona (M0 a M4).*
- **MVP (Minimum Viable Product):** la versión más pequeña del producto que ya funciona y demuestra el valor. 🔷 *Lo que entregamos en 48 horas.*

## N

- **Neurons (Workers AI):** unidad con la que Cloudflare mide el consumo de IA. El plan gratuito incluye 10 000 al día.
- **Next.js:** framework de React (estaba en el plan original; lo cambiamos por Vite).
- **NLP (Natural Language Processing):** procesamiento de lenguaje natural; IA que trabaja con texto humano.
- **Node.js:** programa que permite ejecutar JavaScript fuera del navegador. 🔷 *Necesario para todas nuestras herramientas.*
- **npm:** gestor de paquetes de Node. Instala librerías (`npm install`) y ejecuta scripts (`npm run check`).
- **`npx`:** ejecuta una herramienta de npm sin instalarla de forma permanente (`npx wrangler`).

## O

- **OAuth:** sistema para iniciar sesión dando permiso a otra app sin darle tu contraseña ("Iniciar sesión con Google").
- **Ollama:** programa para ejecutar modelos de IA en tu propia computadora o servidor, sin internet. 🔷 *Futura versión on-premise.*
- **On-premise:** instalado en los servidores propios de la institución y no en la nube.
- **OSINT (Open Source Intelligence):** inteligencia obtenida de fuentes públicas.
- **OWASP Top 10:** lista de los 10 riesgos de seguridad más comunes en aplicaciones web.

## P

- **Package.json:** archivo que describe el proyecto Node: sus dependencias y sus scripts.
- **Payload:** el contenido (los datos) que viaja en un pedido.
- **PBKDF2:** algoritmo para guardar contraseñas de forma segura (las convierte en un hash lento de romper). 🔷 *Contraseñas de los usuarios de demo.*
- **PCI-DSS:** estándar internacional de seguridad para quienes manejan tarjetas de pago.
- **Phishing:** engaño por correo, SMS, WhatsApp o web falsa para robar datos. Variantes: *smishing* (SMS) y *spear phishing* (dirigido a una persona concreta). 🔷 *Problema principal que resolvemos.*
- **PII (Personally Identifiable Information):** datos personales que identifican a alguien: cédula, teléfono, correo, cuenta bancaria. 🔷 *Nunca salen sin anonimizar.*
- **Pipeline:** cadena de pasos automáticos (instalar → probar → construir → desplegar).
- **Pitch:** presentación corta y convincente del proyecto ante el jurado.
- **Plantilla (template):** documento o código base que se rellena.
- **Port / puerto (arquitectura):** 🔷 *"enchufe" definido en el dominio para conectar algo externo (IA o base de datos) sin depender de cuál sea.*
- **POST / GET:** tipos de pedido HTTP. GET = "dame información"; POST = "toma estos datos y procésalos".
- **PR (Pull Request):** solicitud para unir los cambios de tu rama con otra. Ahí corre el QA automático y el Líder revisa. 🔷 *Así entra el trabajo a `development`.*
- **Producción:** 🔷 *el entorno real y público, el que usa el jurado.*
- **Prompt injection:** ataque en el que alguien escribe instrucciones maliciosas para que la IA desobedezca sus reglas ("ignora tus instrucciones anteriores…"). 🔷 *El Guardián LLM lo bloquea.*
- **Prompt:** el texto o instrucción que se le da a una IA.
- **Puerto (red):** número que identifica un servicio en una computadora (`:8787`).
- **Pull (`git pull`):** traer a tu PC los cambios más recientes del repositorio.
- **Push (`git push`):** subir tus commits al repositorio en GitHub.

## Q

- **QA (Quality Assurance):** aseguramiento de calidad: probar que todo funcione como debe. 🔷 *El QA automático corre en cada push.*

## R

- **Ransomware:** malware que cifra tus archivos y pide un rescate.
- **RBAC (Role-Based Access Control):** control de acceso por roles: cada usuario puede hacer solo lo que su rol permite. 🔷 *ANALYST, SUPERVISOR, ADMIN.*
- **React:** librería de JavaScript para construir interfaces con componentes. 🔷 *Nuestro frontend.*
- **README:** archivo de presentación del repositorio: qué hace, cómo se instala y cómo se usa. 🔷 *Obligatorio en el hackathon.*
- **Refactorizar:** mejorar el código sin cambiar lo que hace.
- **Regex (expresión regular):** patrón para buscar texto. `\d{7}` = "siete dígitos seguidos". 🔷 *Así detectamos cédulas y teléfonos.*
- **Reply-To:** dirección a la que se envía la respuesta; si es distinta al remitente (y gratuita), es sospechosa. 🔷 *Indicador del motor.*
- **Repositorio (repo):** carpeta del proyecto con todo su historial en Git.
- **Request / Response:** pedido y respuesta entre el cliente y el servidor.
- **REST:** estilo de diseño de APIs que usa URLs y métodos HTTP (GET, POST).
- **Revert:** deshacer un commit creando otro que lo anula.
- **Rollback:** volver a la versión anterior publicada. 🔷 *`wrangler rollback` si producción falla.*
- **Ruta (route):** dirección de una página o endpoint (`/api/v1/health`).

## S

- **Sandbox:** entorno aislado para ejecutar algo peligroso sin riesgo.
- **Sanitizar:** limpiar un texto de datos sensibles o peligrosos. 🔷 *`piiSanitizer`.*
- **SCADA:** sistemas que controlan infraestructura industrial (electricidad, agua).
- **Schema (esquema):** estructura que define cómo deben ser los datos. 🔷 *Validamos con zod.*
- **Script:** pequeño programa que automatiza una tarea. 🔷 *`npm run check`, `smoke.mjs`.*
- **SDD (Specification-Driven Development):** desarrollo guiado por especificación: **primero** se escribe qué debe hacer el sistema (spec) y **después** se programa. 🔷 *Metodología oficial del hackathon.*
- **Seed:** datos iniciales de ejemplo cargados en la base de datos. 🔷 *`seed.sql` con 25 eventos sintéticos.*
- **Serverless:** modelo donde no administras servidores: subes tu código y la plataforma lo ejecuta y escala sola. 🔷 *Cloudflare Workers.*
- **SIEM:** sistema que reúne y analiza los registros de seguridad de una organización.
- **Smoke test:** prueba rápida que verifica que lo esencial funciona ("¿enciende sin echar humo?"). 🔷 *`npm run smoke`.*
- **SOC (Security Operations Center):** centro que vigila la seguridad las 24 horas.
- **SPA (Single Page Application):** página web que funciona como app sin recargar.
- **Spam:** correo no deseado. 🔷 *Carpeta para correos de riesgo alto.*
- **SPEC.md:** 🔷 *documento obligatorio con la especificación del proyecto (problema, alcance, requisitos, uso de IA, ética).*
- **SPF (Sender Policy Framework):** lista publicada por un dominio con los servidores autorizados a enviar sus correos. 🔷 *`spf=fail` = posible suplantación.*
- **SQL:** lenguaje para consultar y modificar bases de datos.
- **SQLite:** base de datos liviana guardada en un solo archivo. D1 se basa en ella.
- **Squash:** unir varios commits en uno solo al hacer merge.
- **SSL / TLS:** cifrado que protege la conexión (el candado del navegador).
- **Stack:** el conjunto de tecnologías que usa un proyecto.
- **Staging:** 🔷 *entorno de pruebas idéntico a producción, donde probamos antes de mostrarle al jurado.*
- **Static assets:** archivos que no cambian (HTML, CSS, JS, imágenes). 🔷 *Así se sirve nuestro frontend.*
- **SUDEBAN:** Superintendencia de las Instituciones del Sector Bancario de Venezuela; regula y supervisa a los bancos. 🔷 *Entidad más suplantada en nuestra demo.*
- **Suplantación (spoofing):** hacerse pasar por otra persona o entidad (cambiando el nombre visible o usando un dominio parecido).

## T

- **Tailwind CSS:** herramienta para dar estilo usando clases cortas (`bg-red-500`, `p-4`).
- **Terminal / consola:** ventana donde se escriben comandos.
- **Test (prueba):** código que comprueba automáticamente que otro código funciona. Unitario = prueba una pieza pequeña.
- **Timeout:** tiempo máximo de espera; si se supera, se cancela.
- **Tríada CIA:** los tres pilares de la seguridad: Confidencialidad, Integridad y Disponibilidad (*Confidentiality, Integrity, Availability*).
- **Typecheck:** revisión de que los tipos de datos son correctos (TypeScript).
- **TypeScript (TS):** JavaScript con **tipos**, que avisa los errores antes de ejecutar. 🔷 *Lenguaje del proyecto.*
- **Typosquatting:** registrar un dominio con una falta de ortografía o variación de uno oficial para engañar (`saime-gob.com`, `tsj-gob-ve.com`). 🔷 *Lo detecta nuestro motor.*

## U

- **UI / UX:** UI (User Interface) = cómo se ve; UX (User Experience) = qué tan fácil y agradable es usarlo.
- **URL:** dirección de una página web.
- **UUID:** identificador único y aleatorio (`550e8400-e29b-…`). 🔷 *`event_id`.*

## V

- **Validación:** comprobar que los datos que llegan tienen el formato correcto antes de usarlos.
- **Variable de entorno:** valor de configuración que se lee desde fuera del código (por ejemplo, una clave).
- **Vite:** 🔷 *herramienta que compila y sirve el frontend React de forma muy rápida.*
- **Vitest:** 🔷 *herramienta para ejecutar los tests del proyecto.*
- **VS Code (Visual Studio Code):** editor de código gratuito de Microsoft.
- **Vulnerabilidad:** debilidad que un atacante puede aprovechar.

## W

- **Webhook:** aviso automático que un sistema envía a otro cuando ocurre algo.
- **Workers (Cloudflare Workers):** 🔷 *servicio serverless de Cloudflare donde corre nuestra API y se publica la página.*
- **Workers AI:** 🔷 *servicio de Cloudflare para usar modelos de IA sin sacar los datos a terceros.*
- **workers.dev:** 🔷 *dominio gratuito donde se publica nuestra app (`c-i.<subdominio>.workers.dev`).*
- **Workflow:** 🔷 *archivo `.yml` que define los pasos automáticos de GitHub Actions.*
- **Wrangler:** 🔷 *herramienta de terminal de Cloudflare para probar, publicar y administrar Workers y D1.*

## X

- **XAI (Explainable AI):** IA explicable; que justifica sus decisiones en lenguaje entendible. 🔷 *Campo `xai_explanation`.*
- **XSS (Cross-Site Scripting):** ataque que inyecta código malicioso en una página web.

## Z

- **Zero-Trust:** modelo de seguridad que no confía en nadie por defecto, ni siquiera dentro de la red; todo se verifica.
- **Zero-day:** vulnerabilidad desconocida para el fabricante y que todavía no tiene parche.
- **Zero-Leak PII:** 🔷 *regla del proyecto: ningún dato personal sale sin anonimizar.*
- **Zod:** 🔷 *librería que valida que los datos de entrada tengan la forma correcta.*
- **Zona `.gob.ve`:** 🔷 *dominio oficial del Estado venezolano. Un sitio que imita a una institución y no termina en `.gob.ve` es sospechoso.*
