# 📊 Arquitectura de Observabilidad — PristinoPlant

Documento que define qué datos del sistema se registran, dónde se almacenan, y qué se puede hacer con ellos para generar valor.

---

## 1. Fuentes de Eventos del Sistema

El servicio de ingesta (`ingest`) registra en InfluxDB todos los eventos de status de la infraestructura:

| Fuente | Tópico MQTT | Tag `source` | Tag `event_type` | Tag adicional | Estado |
| --- | --- | --- | --- | --- | --- |
| **Nodo Sensors** (por zona) | `PristinoPlant/Environmental_Monitoring/{Zona}/status` | `Environmental_Monitoring` | `Device_Status` | `zone` = `ZONA_A`, `ZONA_B`... | ✅ Implementado |
| **Nodo Actuador** | `PristinoPlant/Actuator_Controller/status` | `Actuator_Controller` | `Device_Status` | — | ✅ Implementado |
| **Servicios Backend** | `PristinoPlant/Services/{Nombre}/status` | `Services` | `Service_Status` | `service_name` = `Scheduler-CLOUD`, `Ingest-CLOUD`... | ✅ Implementado |

> [!NOTE]
> El nodo Sensors es flexible por zona. Cuando se habiliten nodos adicionales (ej: `Zona_B`, `EXTERIOR`), sus tópicos de status serán capturados automáticamente porque el routing del ingest ya parsea la zona como segmento dinámico del tópico.

---

## 2. Measurements en InfluxDB

| Measurement | Qué contiene | Frecuencia |
| --- | --- | --- |
| `environment_metrics` | Temperatura, humedad, iluminancia por zona | Cada ~30s |
| `rain_events` | Eventos de lluvia (duración, intensidad) | Por evento |
| `system_events` | Online/offline de nodos y servicios | Por cambio de estado (LWT + heartbeats) |

---

## 3. Valor de los Datos: Intenciones Futuras

### 3.1 Correlación de Eventos con Fallos de Tareas

**Problema que resuelve:** Actualmente, cuando una tarea falla con "El Nodo Actuador perdió conexión", no se sabe si fue un corte momentáneo o una caída prolongada.

**Con `system_events`:** Se puede consultar InfluxDB para enriquecer las notas del historial:

```text
Tarea "Humectación Suelo" FALLÓ a las 14:30.
→ Correlación: El Nodo Actuador se desconectó a las 14:28 y reconectó a las 14:35 (7 min offline).
→ Causa: Corte eléctrico (el nodo Sensors también se desconectó en el mismo período).
```

**Ruta:** `/history` → Detalle de tarea → Sección "Diagnóstico" con timeline de eventos correlacionados.

### 3.2 Notificaciones de Desconexión/Reconexión

**Problema que resuelve:** El administrador no se entera si un nodo se cae hasta que abre la app.

**Con `system_events` + Sistema de Notificaciones (Fase 4):**

- Enviar alerta vía Telegram/WhatsApp cuando un nodo pasa a `offline`.
- Enviar confirmación cuando vuelve a `online`.
- Agrupar desconexiones simultáneas: "Posible corte eléctrico: 3 nodos desconectados a las 14:28."

### 3.3 Dashboard de Resumen General (`/orchidarium`)

**Problema que resuelve:** No hay un lugar centralizado para ver el estado de salud de toda la infraestructura.

**Propuesta de widgets:**

| Widget | Fuente | Descripción |
| --- | --- | --- |
| **Estado de Nodos** | `system_events` (last value) | Cards con indicador online/offline y "hace cuánto" |
| **Uptime** | `system_events` (agregación) | % de disponibilidad últimas 24h/7d |
| **Última Lectura** | `environment_metrics` (last value) | Temp, humedad, lux actuales (resumen) |
| **Próxima Tarea** | Base de datos (Prisma) | Card con la próxima ejecución programada |
| **Resumen de Riego** | Base de datos (Prisma) | Tareas completadas/fallidas del día |

### 3.4 Análisis de Fiabilidad del Sistema

**Con datos históricos de `system_events`:**

- **MTBF** (Mean Time Between Failures): ¿Cada cuánto se cae cada nodo?
- **MTTR** (Mean Time To Recovery): ¿Cuánto tarda en recuperarse?
- **Correlación con clima:** ¿Las caídas coinciden con tormentas eléctricas?

---

## 4. Escalabilidad por Zona

Cuando se habiliten nuevos nodos Sensors:

```topic
PristinoPlant/Environmental_Monitoring/Zona_A/status  → zone=ZONA_A ✅
PristinoPlant/Environmental_Monitoring/Zona_B/status  → zone=ZONA_B ✅ (automático)
PristinoPlant/Environmental_Monitoring/Exterior/status → zone=EXTERIOR ✅ (automático)
```

El ingest parsea la zona del tópico dinámicamente (`topicParts[2]`) y la mapea al enum `ZoneType` del schema Prisma. Solo se necesita:

1. Agregar el valor al enum `ZoneType` en `schema.prisma` si no existe.
2. El nodo publica su status → el ingest lo captura automáticamente.

---

## 5. Próximos Pasos (Priorizados)

1. **Correlación básica** — Query InfluxDB desde el historial para enriquecer notas de tareas fallidas
2. **Widget de estado** — Cards online/offline en `/orchidarium` usando el last value de `system_events`
3. **Notificaciones de desconexión** — Telegram/WhatsApp cuando un nodo pasa a offline (requiere Sistema de Notificaciones, Fase 4)
4. **Dashboard de uptime** — Métricas de fiabilidad con agregaciones semanales/mensuales
