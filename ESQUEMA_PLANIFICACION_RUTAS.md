# Esquema del Sistema de Planificación de Rutas (EnvSIGTR)

## Objetivo
Definir el flujo funcional y técnico de la **planificación inteligente de rutas** para atención de reportes (tickets) pendientes, tal como está implementado en el proyecto.

Este esquema soporta el pilar: **“Planificación Inteligente de Rutas”** (optimización de recorridos para cuadrillas/camiones).

---

## Alcance
- **Incluye:**
  - Selección de tickets en estado pendiente.
  - Cálculo de un orden lógico de visita (aproximación a TSP).
  - Generación de una ruta “real” por calles mediante un servicio externo (OSRM).
  - Visualización en el panel administrativo.
- **No incluye (por ahora):**
  - Asignación multi-vehículo, turnos, capacidad del camión, restricciones por horario.
  - Persistencia de rutas en base de datos como entidad independiente.

---

## Componentes involucrados

### 1) Fuente de datos (Tickets)
- **Modelo**: `Ticket` en Prisma.
- **Campos relevantes**:
  - `latitude`, `longitude`: ubicación del incidente.
  - `status`: se filtra principalmente `PENDING`.
  - `createdAt`: útil para auditoría/histórico.

### 2) Panel de control (Admin)
- **Responsabilidad:** calcular y visualizar la ruta para tickets pendientes.
- **Implementación:** en el cliente (React) dentro del panel admin.

### 3) Servicio externo de ruteo (OSRM público)
- **Uso:** convertir una secuencia de puntos (ordenados) en una geometría de ruta por calles.
- **Endpoint utilizado:** `https://router.project-osrm.org/route/v1/driving/...`

---

## Flujo general (paso a paso)

### Paso A — Selección de puntos a rutear
1. Se obtienen tickets desde base de datos para el panel admin.
2. Se filtran los tickets con `status === "PENDING"`.
3. Si hay menos de 2 puntos pendientes, no se construye ruta.

**Entrada:** lista de tickets (con lat/lng y status).

**Salida:** lista `pendingTickets`.

---

### Paso B — Orden lógico de visita (aproximación TSP)
1. Se elige un punto inicial.
2. Se construye un recorrido aplicando **Nearest Neighbor**:
   - desde el punto actual se elige el siguiente punto pendiente más cercano.
3. Se calcula distancia estimada acumulada con **Haversine** (distancia geodésica aproximada, en km).

**Entrada:** `pendingTickets`.

**Salida:**
- `routeCoordinates`: arreglo ordenado `[[lat, lng], ...]`.
- `totalDistance`: suma aproximada de distancias entre saltos.

---

### Paso C — Ruta real por calles (OSRM)
Cuando el usuario activa la visualización de ruta:
1. Se serializan coordenadas en formato `lng,lat;lng,lat;...`.
2. Se llama a OSRM con el perfil `driving`.
3. Si la respuesta es correcta (`code === "Ok"`), se extrae la geometría GeoJSON y se convierte a formato Leaflet `[lat, lng]`.
4. **Fallback:** si falla la llamada o hay limitación del servicio, se usa la polilínea simple de `routeCoordinates` (línea recta entre puntos).

**Entrada:** `routeCoordinates`.

**Salida:**
- `realRoutePath`: arreglo `[lat, lng]` listo para pintar con Leaflet.

---

### Paso D — Visualización
- Se muestran puntos (markers) en mapa.
- Se puede mostrar:
  - **Heatmap** de concentración.
  - **Ruta** (Polyline) basada en `realRoutePath`.

---

## Dependencias y consideraciones

### Precisión
- La métrica Haversine sirve para aproximar distancia, pero la ruta real depende de calles (OSRM).

### Conectividad
- El trazado por OSRM requiere Internet y está sujeto a límites del servicio público.

### Determinismo
- El orden de visita con Nearest Neighbor es rápido, pero **no garantiza la ruta óptima global** (es una heurística).

---

## Referencias en el código
- Implementación del ruteo (TSP nearest neighbor + OSRM + fallback): `app/admin/MapComponent.tsx`
- Modelo de datos: `prisma/schema.prisma`
- API de tickets (origen de datos y creación de reportes): `app/api/tickets/route.ts`
