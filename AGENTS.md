# AGENTS.md — SmartRiego MX

## Proyecto
SmartRiego MX es una plataforma IoT de agricultura de precisión: se instala sobre infraestructura de riego existente, decide cuándo/cuánto regar **por zona** dentro de cada parcela, y detecta un foco de **una plaga objetivo** mediante visión artificial (YOLO) sobre una cámara cenital que simula un dron — actuando directamente (válvulas/bombas, tratamiento simulado con agua) en vez de solo recomendar. Monorepo: backend NestJS+Prisma+Postgres, web Next.js+shadcn, móvil Expo+Expo Router, firmware ESP32 (C++/Arduino), y un microservicio Python (FastAPI) para el pipeline de visión, desplegado junto al resto del backend.

`site/` es un **mockup estático navegable** (HTML+JS vanilla generado por un script Python), no la implementación real en Next.js — sirve para validar flujos/UI antes de construir `apps/web`. `design/canvas/` son los prototipos de diseño (`.dc.html`) de referencia, tampoco es código de producción.

## Comandos
- Ejecutar: `pnpm dev` (turbo — levanta `apps/api` y `apps/web` en paralelo)
- Tests: `pnpm test` (unitarios) / `pnpm test:integration` (Postgres real vía `docker-compose.test.yml`)
- Lint/formato: `pnpm lint`
- Servicio de visión: `python -m pytest` dentro de `apps/vision` (una vez creado)
- Mockup estático: `cd site && python3 build.py` regenera los 13 HTML a partir de `build.py` (solo stdlib, sin dependencias). Los tokens de diseño se sincronizan automáticamente desde `design/canvas/ds/smartriego/tokens.css` en cada build — **no editar `site/assets/tokens.css` directamente**, se sobreescribe.
- QA visual del mockup (opcional): `cd site && npm install && npx playwright install chromium && npm run shots`

## Estilo y convenciones
- TypeScript estricto en backend, web y móvil; Python 3.11+ en el pipeline de visión y en `site/build.py`.
- Identificadores de código en inglés; documentación, specs y mensajes de commit en español.
- Arquitectura por dominio: `modules/`/`features/` agrupados por negocio (parcelas, zonas, riego, plagas), `common/`/`shared/` solo para lo realmente transversal — ver la nota "Arquitectura de referencia" del vault.

## Reglas
- Lee `docs/constitution.md` y la spec activa en `docs/specs/` antes de tocar código.
- No agregar frameworks nuevos, especies de plaga adicionales, ni un dron físico real sin actualizar la constitución primero (constitution.md #1, #7, #17).
- El tratamiento contra plaga se simula siempre con agua — nunca pesticida real, ni en hardware ni en software (constitution.md #9).
- Ninguna intervención (riego o tratamiento) actúa sobre toda la parcela: siempre está acotada a la zona detectada (constitution.md #9).
- El botón de activar tratamiento manualmente es exclusivo del **Agricultor dueño de la parcela**; el Administrador nunca lo ve ni puede llamarlo (constitution.md #9, spec-005 RF-9/RF-10).
- No implementar detección/prevención de fugas: quedó fuera de alcance (constitution.md #17).
- No implementar multi-tenant/organización ni permisos dinámicos: los roles son fijos por enum (`Agricultor`/`Administrador`, ver `docs/permissions.md`).

## Al terminar cualquier tarea
- Ejecutar `pnpm lint` y `pnpm test` (y `pnpm test:integration` si se tocó persistencia) y mostrar el resultado.
- Si se tocó el motor de decisión de riego por zona o la confirmación temporal de plaga: correr también sus tests específicos y verificar contra los RF de la spec activa antes de marcar la tarea como hecha.
- Si se tocó `site/build.py`: correr `python3 build.py` y confirmar que las 13 páginas se regeneran sin error antes de dar la tarea por terminada.
