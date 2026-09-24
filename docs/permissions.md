# Permisos — SmartRiego MX

Complementa `constitution.md` #3 y #4. Dos roles v1: **Agricultor** y **Administrador**.

## Diseño (RBAC simple, sin permisos dinámicos)

- `User.role: 'AGRICULTOR' | 'ADMIN'` — enum fijo en Prisma, no una tabla `Role`/`Permission` configurable. Suficiente para el alcance del hackathon; evolucionar solo si el reto lo exige.
- `Parcela.ownerId → User.id` — el Agricultor solo ve/opera parcelas donde es owner. El Administrador ve/opera cualquiera, chequeado por rol (`@Roles('ADMIN')`), no por ownership.
- El Administrador es **superset** del Agricultor: nada que el Agricultor pueda hacer le está vetado al Administrador.

## Matriz de permisos

| Acción | Agricultor | Administrador |
|---|:---:|:---:|
| Ver sus propias parcelas | ✅ | ✅ (todas, de cualquier Agricultor) |
| CRUD de parcelas propias (cultivo, ubicación, umbral por parcela) | ✅ (solo las suyas) | ✅ (cualquiera) |
| Operar riego manual / paro de emergencia | ✅ (solo en sus parcelas) | ✅ (en cualquier parcela) |
| Recibir notificaciones/alertas | ✅ (de sus parcelas) | ✅ (de todas) |
| Ver histórico y reportes | ✅ (de sus parcelas) | ✅ (de todas) |
| Gestionar usuarios (alta/edición/baja de Agricultores) | ❌ | ✅ |
| Configurar umbrales globales (fuga crítico, defaults del motor de decisión) | ❌ | ✅ |
| Vincular/gestionar dispositivos ESP32 (registrar, reasignar, revocar) | ❌ | ✅ |
| Configurar integraciones (API key de clima, credenciales de push) | ❌ | ✅ |

Ver `constitution.md`.
