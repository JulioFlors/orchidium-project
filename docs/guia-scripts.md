# Guía de Creación de Scripts de Utilidad

Este documento detalla la estructura base y los estándares para crear scripts de TypeScript (TS) dentro del monorepo que necesiten realizar consultas a las bases de datos (PostgreSQL o InfluxDB) y ejecutarse localmente.

## 🚀 Estructura Base del Script

los scripts deben ubicarse preferiblemente en `services/scheduler/src/scripts/` para aprovechar la infraestructura de conexión existente.

### Plantilla Recomendada

```typescript
import { influxClient } from '../lib/influx'
import { prisma } from '@package/database' // Si usas Postgres
import { Logger } from '../lib/logger'

// Helper para manejar fechas de InfluxDB (Nanosegundos a Date)
function rowTimeToDate(rawTime: unknown): Date {
  if (rawTime instanceof Date) return rawTime
  const s = String(rawTime)
  return s.length > 13 ? new Date(Number(s.substring(0, 13))) : new Date(Number(s))
}

async function main() {
  Logger.info('Iniciando script de utilidad...')

  try {
    // --- EJEMPLO POSTGRES ---
    // const users = await prisma.user.findMany()
    
    // --- EJEMPLO INFLUXDB ---
    // const query = `SELECT * FROM "environment_metrics" LIMIT 10`
    // const stream = influxClient.query(query)
    // for await (const row of stream) { ... }

    Logger.success('Proceso completado con éxito.')
  } catch (err) {
    Logger.error('Error durante la ejecución:', err)
  } finally {
    // SIEMPRE cerrar las conexiones
    await influxClient.close()
    await prisma.$disconnect()
  }
}

main()
```

## 💻 Ejecución Local (Windows)

Para ejecutar estos scripts desde la raíz del proyecto cargando las variables de entorno correctamente, usa el siguiente comando:

```powershell
pnpm exec dotenv -e .env -- tsx services/scheduler/src/scripts/nombre-del-script.ts
```

### Por qué usamos este comando

1. `pnpm exec dotenv -e .env`: Carga el archivo `.env` de la raíz en el proceso.
2. `tsx`: Ejecuta el archivo TypeScript directamente sin necesidad de compilarlo manualmente.
3. `services/scheduler/...`: Referencia la ruta completa desde la raíz.

## ⚠️ Reglas y Buenas Prácticas

1. **Gestión de Conexiones**: Asegúrate de incluir el bloque `finally` para cerrar `influxClient` y `prisma`. Si no se cierran, el proceso de Node.js podría quedarse "colgado" en la terminal.
2. **Batching (InfluxDB)**: Si realizas consultas históricas largas, recuerda que InfluxDB 3.0 Community tiene un límite de archivos Parquet (1000). Realiza consultas por lotes de 7-10 días si es necesario.
3. **Logs**: Utiliza siempre la clase `Logger` del proyecto para mantener la consistencia estética y facilitar la depuración.
4. **Tipado**: No uses `any`. Define interfaces para los resultados de tus consultas si son complejos.

---
> [!IMPORTANT]
> Recuerda que los cambios en la base de datos (escrituras) realizados vía script son permanentes. Valida siempre con un `console.log` del objeto antes de ejecutar un `create` o `update` masivo.
