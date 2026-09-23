# AGENTS.md — SmartRiego MX

## Proyecto
SmartRiego MX es una plataforma IoT de agricultura de precisión: se instala sobre infraestructura de riego existente, decide cuándo/cuánto regar **por zona** dentro de cada parcela, y detecta un foco de **una plaga objetivo** mediante visión artificial (YOLO) sobre una cámara cenital que simula un dron — actuando directamente (válvulas/bombas, tratamiento simulado con agua) en vez de solo recomendar. Monorepo: backend NestJS+Prisma+Postgres, web Next.js+shadcn, móvil Expo+Expo Router, firmware ESP32 (C++/Arduino), y pipeline de visión en Python sobre Raspberry Pi 5.

## Comandos
- Ejecutar: `pnpm dev` (turbo — levanta `apps/api` y `apps/web` en paralelo)
- Tests: `pnpm test` (unitarios) / `pnpm test:integration` (Postgres real vía `docker-compose.test.yml`)
- Lint/formato: `pnpm lint`
- Pipeline de visión (Raspberry Pi): `python -m pytest` dentro de `apps/vision` (una vez creado)

## Estilo y convenciones
- TypeScript estricto en backend, web y móvil; Python 3.11+ en el pipeline de visión.
- Identificadores de código en inglés; documentación, specs y mensajes de commit en español.
- Arquitectura por dominio: `modules/`/`features/` agrupados por negocio (parcelas, zonas, riego, plagas), `common/`/`shared/` solo para lo realmente transversal — ver la nota "Arquitectura de referencia" del vault.

## Reglas
- Lee `docs/constitution.md` y la spec activa en `docs/specs/` antes de tocar código.
- No agregar frameworks nuevos, especies de plaga adicionales, ni un dron físico real sin actualizar la constitución primero (constitution.md #1, #6, #14).
- El tratamiento contra plaga se simula siempre con agua — nunca pesticida real, ni en hardware ni en software (constitution.md #8).
- Ninguna intervención (riego o tratamiento) actúa sobre toda la parcela: siempre está acotada a la zona detectada (constitution.md #8).
- No implementar detección/prevención de fugas: quedó fuera de alcance (constitution.md #14).
- No implementar multi-tenant/organización ni permisos dinámicos: los roles son fijos por enum (`Agricultor`/`Administrador`, ver `docs/permissions.md`).

## Al terminar cualquier tarea
- Ejecutar `pnpm lint` y `pnpm test` (y `pnpm test:integration` si se tocó persistencia) y mostrar el resultado.
- Si se tocó el motor de decisión de riego por zona o la confirmación temporal de plaga: correr también sus tests específicos y verificar contra los RF de la spec activa antes de marcar la tarea como hecha.
