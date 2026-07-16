# Especificación: Corrección de Inferencia de Lluvia y Modularización del Sensor Físico

## 1. Contexto y Problema

El motor de inferencia termodinámica de lluvia (`rain-manager.ts`) analiza variaciones rápidas de temperatura, humedad e iluminancia para detectar lluvia de manera virtual. Actualmente, convive en el mismo archivo con la lógica del sensor de gotas físico de lluvia ("lluvia física"). Esta mezcla de responsabilidades en el mismo archivo ha generado confusión y dificultado el mantenimiento de ambos sistemas.

El análisis de la telemetría y del comportamiento en caliente revela la causa raíz de la inactividad del motor de inferencia en producción:

1. **Bug del Deslizamiento Infinito (Congelamiento de Lotes)**:
   - Los datos climáticos (temperatura, humedad y lux) se envían desde la estación meteorológica en caliente en lotes de 10 muestras cada 10 minutos, llegando aproximadamente 3 transmisiones (lotes) dentro de cada intervalo de 10 minutos.
   - En `pushBatchMetrics` de `rain-manager.ts`, si el tiempo transcurrido desde la creación del lote actual es menor que el límite (`now - queue[0].timestamp < LIMIT`), las nuevas muestras recibidas se anexan a dicho lote.
   - Sin embargo, el código hace `queue[0].timestamp = now` con cada muestra anexada.
   - Como llegan múltiples transmisiones dentro de la ventana de 10 minutos, la diferencia `now - queue[0].timestamp` siempre mide el corto tiempo transcurrido desde el último mensaje recibido, por lo que **nunca** supera el límite.
   - Esto congela la cola de lotes temporales en su estado de hidratación inicial. Las muestras se acumulan indefinidamente en el lote `[0]` (haciéndolo crecer sin control), mientras que los lotes `[1]`, `[2]`, `[3]` se quedan congelados en el tiempo con los datos climáticos del arranque del scheduler.
   - Al no crearse nuevos lotes, las derivadas climáticas diurnas y nocturnas se calculan comparando contra valores obsoletos de hace días o semanas, anulando la detección.

2. **Acoplamiento Innecesario con el Sensor Físico**:
   - El sensor de gotas físico está prácticamente en desuso debido a su falta de fiabilidad (motivo original del desarrollo del motor de inferencia).
   - Mantener variables de baselines físicos, watchdogs de hardware, y lógica de vetos inteligentes físicos en el mismo archivo del motor de inferencia termodinámica sobrecarga la complejidad cognitiva y oscurece el mantenimiento de la lógica climática pura.

## 2. Requerimientos de Solución

1. **Modularización y Extracción**:
   - Extraer toda la lógica asociada al sensor físico de gotas de lluvia a un nuevo archivo independiente.
   - Este nuevo archivo manejará los estados del sensor físico, sus baselines, watchdog y la evaluación del veto inteligente para la lluvia física.
   - El motor de inferencia en `rain-manager.ts` quedará 100% aislado y se concentrará únicamente en la inferencia termodinámica, importando el estado consolidado de la lluvia física de este nuevo módulo para mantener la API unificada de `isCurrentlyRaining()`.

2. **Conservar Timestamp de Creación del Lote (Inferencia)**:
   - Modificar `pushBatchMetrics` en `rain-manager.ts` para que al anexar muestras al lote `queue[0]`, **no** se actualice su `timestamp` a `now`. De este modo, `timestamp` representará el momento de inicio de ese lote, permitiendo que envejezca y expire tras 10 minutos para crear un lote nuevo.

3. **Homogeneizar Duración de Lotes a 10 Minutos (Inferencia)**:
   - Cambiar el límite de acumulación en caliente en `pushBatchMetrics` de 5 minutos a 10 minutos (`10 * 60 * 1000`) para garantizar consistencia absoluta con la hidratación del boot y el script de reconstrucción.

## 3. Plan de Verificación

- **Simulación en Local**:
  - Utilizar el simulador de MQTT en local para validar que la cola de batches climáticos en caliente rote correctamente cada 10 minutos y ejecute la inferencia climática de forma homogénea.
- **Pruebas de Inferencia y Eventos Físicos**:
  - Validar que tanto la lluvia inferida como la lluvia física (procesadas por módulos separados) registren sus respectivos eventos de manera independiente y correcta en Postgres.
- **Despliegue y Monitorización**:
  - Desplegar en el VPS y verificar en los logs del scheduler que se generan los logs de rotación de lotes climáticos y que el motor reaccione.
