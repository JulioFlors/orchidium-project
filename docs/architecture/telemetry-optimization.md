# Optimización de Telemetría: Downsampling Dinámico

Este documento detalla la estrategia de optimización implementada para la visualización de datos de series temporales (TimeSeries) en el Orchidarium.

## Contexto

El sistema captura aproximadamente **800 lecturas diarias por sensor**. Sin una estrategia de agregación, la visualización de rangos temporales amplios (7 días, 30 días) genera dos cuellos de botella críticos:

1.  **Backend (InfluxDB 3 Core)**: El motor de consulta debe escanear cientos de archivos Parquet no compactados para recuperar miles de puntos individuales, lo que dispara el límite de seguridad `exceeding the file limit` y agota la memoria del servidor.
2.  **Frontend (UI)**: El navegador del cliente debe renderizar miles de nodos SVG/Canvas. Debido a la resolución finita de las pantallas (aliasing), muchos puntos se solapan en el mismo píxel horizontal, resultando en un desperdicio de recursos de cómputo y ruido visual.

## Solución: Algoritmo de Downsampling Dinámico

Se ha implementado una arquitectura de **"Resolución Basada en el Objetivo" (Target Point Resolution)**.

### Funcionamiento del Algoritmo

En cada consulta a la API de historial, el sistema calcula matemáticamente la resolución óptima basándose en el rango solicitado mediante la función `getDynamicInterval`.

1.  **Objetivo (Target)**: Se ha definido un objetivo de **~500 puntos** por consulta. Este número es el balance ideal entre precisión visual y rendimiento fluido en dispositivos móviles y escritorio.
2.  **Cálculo**:
    `Intervalo = Tiempo Total Solicitado / 500`
3.  **Límites de Seguridad**:
    -   El intervalo mínimo es de **1 minuto** para evitar pérdida de resolución en rangos cortos.
    -   Se utilizan datos crudos (sin agregación) para rangos menores a **1 hora**.

### Tabla de Aplicación (Ejemplos)

| Rango | Tiempo Total | Intervalo de Agregación | Cantidad de Puntos |
| :--- | :--- | :--- | :--- |
| **1h** | 3.600s | Ninguno (Raw) | ~34 |
| **24h** | 86.400s | ~3 minutos | ~480 |
| **7 días** | 604.800s | ~20 minutos | ~500 |
| **30 días** | 2.592.000s | ~1.5 horas | ~500 |

## Beneficios Arquitectónicos

-   **Estabilidad del Servidor**: InfluxDB utiliza la función `DATE_BIN` de SQL para procesar la agregación en el motor, lo que permite descartar archivos irrelevantes mediante metadatos y reduce drásticamente el escaneo de disco.
-   **Fluidez de la UI**: La latencia de red se reduce (JSON de ~15KB constante) y el renderizado en el cliente es instantáneo, independientemente de si se visualiza un día o un año.
-   **Escalabilidad**: El sistema escala automáticamente aunque aumente la frecuencia de muestreo de los sensores (ej. a 1s), ya que la resolución del dashboard está desacoplada de la frecuencia de ingesta.

## Alternativas Forenses

Para casos donde se requiera el dato exacto (ej. depuración de un fallo de hardware), el sistema mantiene el acceso a los datos crudos a través de los **Snapshots de Auditoría** en PostgreSQL, permitiendo un análisis punto a punto sin afectar el rendimiento del monitoreo general.
