# Guía de Scripts de Utilidad y Mantenimiento

Este documento detalla los scripts reutilizables disponibles en `services/scheduler/src/scripts/`, sus propósitos, parámetros y comandos de ejecución local o en el VPS.

## 🚀 Catálogo de Scripts Reutilizables

| Script | Categoría | Propósito Principal |
| :--- | :--- | :--- |
| `backfill-history.ts` | Historial | Recálculo de `DailyEnvironmentStat` (DLI, VPD, balance hídrico, riesgos) en PostgreSQL desde InfluxDB. *(Utilizado en `pnpm db:seed`)* |
| `rebuild-rain-history.ts` | Historial | Reconstrucción híbrida de eventos de lluvia física y lluvia virtual inferida desde InfluxDB hacia PostgreSQL. *(Utilizado en `pnpm db:seed`)* |
| `backfill-rain-events.ts` | Historial | Backfill específico de eventos de lluvia física desde lecturas de sensor de gotas. |
| `backfill-rain-intensity.ts` | Historial | Cálculo y actualización de categorías de intensidad de lluvia (`low`, `moderate`, `heavy`, `violent`). |
| `deduplicate-rain-events.ts` | Mantenimiento | Detección y consolidación de eventos de lluvia duplicados o solapados en PostgreSQL. |
| `sanitize-rain-events.ts` | Mantenimiento | Corrección y eliminación de eventos de lluvia huérfanos o con incongruencias temporales. |
| `clean-db-rates.ts` | Mantenimiento | Limpieza de tasas de cambio erróneas o duplicadas en la tabla `ExchangeRate`. |
| `adjust-ema-timestamps.ts` | Mantenimiento | Corrección de desfases en estampas de tiempo de la estación EMA en InfluxDB. |
| `clean-and-align-today-telemetry.ts` | Mantenimiento | Limpieza de anomalías de telemetría reciente en InfluxDB. |
| `test-bcv-scrape.ts` | Operaciones | Scraping manual bajo demanda de la tasa del BCV e inserción en PostgreSQL. |
| `check-rates.ts` | Operaciones | Consulta rápida de las tasas de cambio registradas en PostgreSQL. |
| `check-scheduler-activity.ts` | Operaciones | Inspección de las últimas tareas y logs de actividad del scheduler en PostgreSQL. |
| `listen-mqtt.ts` | Diagnóstico | Monitor en tiempo real de los tópicos MQTT del broker para depuración de hardware. |
| `test-evaluate.ts` | Diagnóstico | Disparo manual de la evaluación de la máquina de estados del motor de inferencia. |

## 💻 Comandos de Ejecución Local (Windows)

Para ejecutar cualquiera de estos scripts desde la raíz del repositorio cargando las variables de entorno:

```powershell
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/nombre-del-script.ts
```

### Ejemplos Frecuentes

#### 1. Recalcular Estadísticas Históricas Ambientales

```powershell
# Últimos 30 días (por defecto)
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/backfill-history.ts

# Ventana personalizada de 7 días
$env:BACKFILL_DAYS=7; pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/backfill-history.ts
```

#### 2. Reconstruir Historial de Lluvia

```powershell
# Reconstrucción completa
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/rebuild-rain-history.ts

# Modo prueba (sin escribir en Postgres)
$env:BACKFILL_DRY_RUN="true"; pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/rebuild-rain-history.ts
```

#### 3. Forzar Scraping de Tasa BCV

```powershell
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/test-bcv-scrape.ts
```

#### 4. Consultar Tasas Registradas en Base de Datos

```powershell
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/check-rates.ts
```

#### 5. Escuchar Mensajes MQTT en Vivo

```powershell
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/listen-mqtt.ts
```

## 🛠️ Plantilla para Nuevos Scripts de Utilidad

Si necesitas crear una nueva herramienta reutilizable en `services/scheduler/src/scripts/`:

```typescript
import { prisma } from '@package/database'
import { influxClient } from '../lib/influx'
import { Logger } from '../lib/logger'

async function main() {
  Logger.info('Iniciando script de utilidad...')

  try {
    // Lógica del script aquí
    Logger.success('Proceso completado con éxito.')
  } catch (err) {
    Logger.error('Error durante la ejecución:', err)
  } finally {
    // SIEMPRE cerrar las conexiones activas
    await influxClient.close()
    await prisma.$disconnect()
  }
}

main()
```

## ⚠️ Reglas y Buenas Prácticas

1. **Gestión de Conexiones**: Incluir siempre el bloque `finally` para desconectar `influxClient` y `prisma`.
2. **Logs Estándar**: Usar la clase `Logger` del proyecto para mantener el formato unificado.
3. **TypeScript Estricto**: Prohibido el uso de `any`. Tipar interfaces para consultas o payloads.
