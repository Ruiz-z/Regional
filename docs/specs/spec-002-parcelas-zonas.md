# Spec 002 — Gestión de parcelas y zonas

## Contexto y objetivo
Cada Agricultor necesita registrar sus parcelas y dividirlas en zonas independientes — es la base de datos sobre la que operan riego y plagas (constitution.md #5).

## Usuarios / actores
Agricultor (CRUD de las suyas), Administrador (lectura/edición de cualquiera).

## Historias de usuario
- H1: Como Agricultor quiero crear una parcela con su cultivo y ubicación para empezar a monitorearla.
- H2: Como Agricultor quiero dividir mi parcela en zonas con su propio umbral de humedad para regar distinto por zona.
- H3: Como Administrador quiero ver las parcelas de cualquier Agricultor para dar soporte o configurar el sistema.

## Requisitos funcionales (EARS)
- RF-1: CUANDO un Agricultor crea una parcela (`POST /parcels` con nombre, ubicación, cultivo), EL SISTEMA la asocia a su `ownerId`.
- RF-2: CUANDO un Agricultor agrega una zona a su parcela (`POST /parcels/:id/zones` con nombre y umbral de humedad objetivo), EL SISTEMA la crea asociada a esa parcela.
- RF-3: EL SISTEMA impide que un Agricultor lea, edite o borre una parcela/zona cuyo `ownerId` no sea el suyo (403).
- RF-4: EL SISTEMA permite a un Administrador leer y editar cualquier parcela/zona sin importar el `ownerId`.
- RF-5: CUANDO se borra una parcela, EL SISTEMA borra en cascada sus zonas y desvincula (no borra) los dispositivos IoT asignados a ellas.

## Requisitos no funcionales
- N/A específicos más allá de los generales de la constitución.

## Casos límite
- Parcela sin zonas todavía → estado "sin zonas configuradas" en vez de error.
- Intento de crear zona en una parcela ajena → 403 (RF-3).

## Fuera de alcance
- Geolocalización real en mapa (coordenadas se guardan como texto/dirección, no se valida contra un mapa).

## Criterios de finalización
- RF-1 a RF-5 con test en verde + demo manual: un Agricultor crea una parcela con 2 zonas, un segundo Agricultor no puede verla, el Administrador sí.

## Diagrama — todos los casos de acceso y CRUD

```mermaid
flowchart TD
    S0(["Request sobre /parcels/:id o /parcels/:id/zones/:zid"]) --> S1{"¿Rol del usuario?"}
    S1 -- ADMIN --> S2["Acceso permitido\nsin importar ownerId (RF-4)"]
    S1 -- AGRICULTOR --> S3{"¿ownerId de la parcela\n== userId del request?"}
    S3 -- No --> S4["403 (RF-3)"]
    S3 -- Sí --> S2

    C0(["POST /parcels\n{name, location, crop}"]) --> C1["Crea Parcel{ownerId: userId del Agricultor}"]
    C1 --> C2["201, parcela sin zonas todavía\n(estado 'sin zonas configuradas')"]

    Z0(["POST /parcels/:id/zones\n{name, humidityThreshold}"]) --> Z1{"¿Agricultor es owner\nde :id? (o es Admin)"}
    Z1 -- No --> Z2["403"]
    Z1 -- Sí --> Z3["Crea Zone asociada a la parcela"]

    D0(["DELETE /parcels/:id"]) --> D1{"¿Owner o Admin?"}
    D1 -- No --> D2["403"]
    D1 -- Sí --> D3["Borra parcela\n+ borra en cascada sus zonas (RF-5)"]
    D3 --> D4["Desvincula (no borra)\nlos dispositivos IoT de esas zonas"]
```

## Dudas abiertas
- Ninguna bloqueante.
