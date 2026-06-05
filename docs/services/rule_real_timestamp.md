# Regla: Reconstrucción de Timestamp Real (Formato Estilizado)

Esta especificación detalla el diseño para recuperar y mostrar el timestamp real de cada muestra física capturada por los sensores en la consola de logs del servicio de ingesta, estilizado con corchetes `[ ]` y sin puntos en `am`/`pm` para optimizar espacio en consola.

---

## Diseño Técnico de Estilización

### 1. Limpieza de AM/PM

Los formateadores de fecha en Node.js para español (`es-VE` o `es-ES`) devuelven por defecto la nomenclatura con puntos y espacios (ej. `p. m.`, `a. m.`). Para homogeneizar y ahorrar espacio en consola, utilizaremos una función de limpieza:

```typescript
function cleanAmPm(str: string): string {
  return str
    .replace(/a\.\s*m\./gi, 'am')
    .replace(/p\.\s*m\./gi, 'pm')
    .replace(/a\s*m/gi, 'am')
    .replace(/p\s*m/gi, 'pm');
}
```

### 2. Estilo de los Logs

Tanto el tiempo del servidor (generado por `Logger`) como el de la muestra (generado en `formatPointSummary`) se estilizarán bajo la misma convención:

* **Tiempo del servidor**: `[ 04/06/2026, 12:59 pm ]` (limpio, sin puntos).
* **Tiempo real de la muestra**: `[ 12:40:00 pm ]` (limpio, entre corchetes).

### 3. Integración en `formatPointSummary`

En `services/ingest/src/index.ts`, la función `formatPointSummary(point: Point)` formateará el timestamp real del protocolo de línea de la siguiente manera:

```typescript
let timeLabel = '';
if (parts.length >= 3) {
  const timestampVal = Number(parts[2]);
  if (!isNaN(timestampVal)) {
    const epochMs = timestampVal > 10000000000000 ? Math.floor(timestampVal / 1000000) : timestampVal;
    const date = new Date(epochMs);
    const rawTime = new Intl.DateTimeFormat('es-VE', {
      timeZone: 'America/Caracas',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date);
    timeLabel = ` [ ${cleanAmPm(rawTime)} ]`;
  }
}
```

Esto retornará el sufijo de tiempo para insertar en el log, resultando en:

* `return \`[ \${source} ]\${zonePart}\${timeLabel} -> \${metrics}\``

---

## Formato Final en Consola

```text
[ 04/06/2026, 12:59 pm ] 📈 [ METRIC ] [ Weather_Station ] [ ZONA_A ] [ 12:40:00 pm ] -> temperature:27.1
[ 04/06/2026, 12:59 pm ] 📈 [ METRIC ] [ Weather_Station ] [ ZONA_A ] [ 12:40:00 pm ] -> humidity:99.8
[ 04/06/2026, 01:03 pm ] 📈 [ METRIC ] [ Weather_Station ] [ EXTERIOR ] [ 01:02:15 pm ] -> rain_intensity:98
```

*(Nota: El formato ahorra valioso espacio en consola al eliminar caracteres redundantes y mantiene consistencia visual con corchetes planos).*
