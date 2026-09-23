# Constitución — SmartRiego MX

1. **Stack fijo**: backend NestJS+Prisma+Postgres; web Next.js+shadcn; móvil Expo+Expo Router; firmware ESP32 en C++/Arduino (PlatformIO); Raspberry Pi 5 (u equivalente) corriendo el pipeline de visión artificial (YOLO) del módulo de plagas en Python. No se introducen frameworks nuevos sin actualizar esta constitución primero.
2. **Arquitectura por dominio** en las tres capas (parcelas, zonas, riego, plagas, clima, notificaciones), nunca por capa técnica — ver la nota "Arquitectura de referencia" del vault de notas.
3. **Dos roles v1**: Agricultor/dueño de parcela y Administrador. El Administrador es superset del Agricultor (puede todo lo suyo + gestión de usuarios, umbrales globales, dispositivos ESP32 e integraciones) — ver `docs/permissions.md` para la matriz completa. Sin rol Técnico de campo en esta iteración.
4. **Autenticación de usuarios**: JWT simple (email+password, hash con bcrypt), sin OAuth externo en v1 — mismo patrón de `Arquitectura de referencia` (NestJS+Passport).
5. **N parcelas configurables** por Agricultor vía CRUD (cultivo, ubicación), cada una con un `ownerId` y dividida en **N zonas independientes**; cada zona tiene su propio estado de humedad, umbral y decisión de riego — la parcela nunca se trata como uniforme. El Administrador opera sobre cualquier parcela/zona sin importar el owner.
6. **Decisión de riego explicable por zona**: reglas ponderadas + score de un modelo entrenado con dataset; toda recomendación muestra su razón (humedad, pronóstico, score) — nunca una caja negra.
7. **Detección de una sola plaga objetivo** mediante visión artificial (YOLO) sobre una cámara cenital fija que simula un dron. No se reconocen múltiples especies en v1.
8. **Confirmación temporal antes de actuar**: una detección aislada de plaga nunca dispara una intervención; se exige persistencia sobre varios frames/umbral configurable, clasificando el nivel por zona como Normal / Monitoreo / Intervención.
9. **Intervención siempre localizada por zona**: tanto el riego como el tratamiento contra plaga se aplican solo en la zona afectada, nunca a toda la parcela. El tratamiento de plaga se simula siempre con agua — nunca pesticida real, ni en hardware ni en software.
10. **Comunicación IoT por HTTP REST con autenticación por dispositivo**: cada ESP32/Raspberry Pi se registra y recibe una API key fija que envía en cada request; el backend rechaza cualquier lectura/comando sin key válida. ESP32 y Raspberry Pi solo miden/detectan y obedecen comandos; el backend es la única fuente de verdad del estado de válvulas, bombas y tratamiento.
11. **Notificaciones** push (móvil) y en dashboard (web) ante foco de plaga confirmado o recomendación de riego pendiente.
12. **Histórico**: toda lectura, decisión de riego y evento de plaga se persiste para graficar consumo de agua, ahorro e intervenciones en el tiempo.
13. **Clima real** vía OpenWeather; mock solo permitido en tests automatizados.
14. **Despliegue**: una VM de Azure con Docker Compose (postgres+api+web) + CI/CD con GitHub Actions (lint/build/test en PR, deploy por SSH en push a `main`) — ver `Recursos/Despliegue y CI-CD` del vault.
15. **Manejo de secretos**: ninguna credencial, API key o llave se commitea al repo; todo vía `.env` (no versionado) en local y GitHub Secrets en CI/CD.
16. **Tests obligatorios** en: motor de decisión de riego por zona, confirmación temporal de plaga (umbral anti falso-positivo), endpoint de ingestión de lecturas/detecciones, y rechazo de requests IoT sin API key válida.
17. **Fuera de alcance v1**: detección/prevención de fugas (descartado), dron físico real (se simula con cámara cenital fija), reconocimiento de más de una especie de plaga, aplicación real de pesticida, rol Técnico de campo, sistema de permisos dinámico, control de válvulas reales más allá del prototipo de mesa.
18. **Idioma**: código e identificadores en inglés, documentación y specs en español.
19. **Antes de tocar código**: leer esta constitución y la spec activa en `docs/specs/`; cualquier cambio de alcance actualiza primero la spec, nunca el código directo.

## Criterios de "listo para demo"
- [ ] Las 2 zonas físicas del prototipo riegan de forma automática según su propia lectura de humedad.
- [ ] Una plaga simulada se detecta, se confirma (no por 1 solo frame) y dispara tratamiento simulado con agua solo en su zona.
- [ ] El dashboard muestra en vivo el estado de riego y de plagas por zona, y el historial de eventos.
- [ ] Login funcional para Agricultor y Administrador con sus permisos diferenciados.
