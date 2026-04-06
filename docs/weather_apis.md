# Optimización de APIs Meteorológicas (WeatherGuard)

El sistema **WeatherGuard** de PristinoPlant implementa una arquitectura multi-oráculo para maximizar la cantidad y calidad de los datos climatológicos sin incurrir en costos de suscripción. Esto se logra separando inteligentemente las cargas de trabajo entre dos plataformas de la misma matriz: **OpenWeatherMap** (clima atmosférico) y **AgroMonitoring** (clima agronómico).

A continuación se detalla la documentación técnica, los límites de las capas gratuitas, y la estrategia de frecuencia de consultas de nuestro oráculo.

---

## 1. OpenWeatherMap (OWM) - Pronóstico Atmosférico

La API tradicional de [OpenWeatherMap](https://openweathermap.org/) está diseñada para aplicaciones meteorológicas generales. En PristinoPlant, la utilizamos exclusivamente para **predecir el futuro** (pronósticos probabilísticos a corto y medio plazo) sobre una amplia zona geográfica (San Félix).

### Límites de la Capa Gratuita (Free Tier)
- **Límite de Consultas Volumétricas:** 1,000 llamadas por día.
- **Tasa de Refresco:** 60 llamadas por minuto.
- **Historial:** No incluido en la versión gratuita.

### Endpoints Utilizados
*   **5 Day / 3 Hour Forecast (`/data/2.5/forecast`)**
    *   *Propósito:* Predecir fuertes temporales con anticipación.
    *   *Data Clave:* `pop` (Probabilidad de precipitación 0-100%).
    *   *Resolución:* Datos agrupados cada 3 horas por los próximos 5 días.

---

## 2. AgroMonitoring - Telemetría Agrícola de Precisión

[AgroMonitoring](https://agromonitoring.com/) utiliza imágenes satelitales (Sentinel-2, Landsat) para analizar cuadrantes geográficos definidos mediante polígonos. A diferencia de OWM, esta API no se orienta al volumen de peticiones al azar, sino al **monitoreo persistente de áreas agrícolas**. En PristinoPlant lo usamos como nuestro "sensor de suelo remoto".

### Límites de la Capa Gratuita (Free Tier)
- **Límite de Superficie (Área):** Permite monitorear un total acumulado de hasta **1,000 Hectáreas (ha)** sumando todos los polígonos registrados.
    - *Nota local:* Nuestro polígono `Orquideario Simón Bolívar` ocupa solo **~1.5 Hectáreas**, por lo que estamos al **0.15%** de nuestro límite máximo permitido. 
    - *Regla Crítica:* La API requiere que cada polígono mida **como mínimo 1.0 Hectárea**; de lo contrario, rechazará la creación (Error `422 UnprocessableEntityError`).
- **Límite de Consultas Volumétricas:** 60 llamadas por minuto (sin un límite diario estricto explícito para endpoints básicos del polígono, sujeto al uso razonable).

### Endpoints Utilizados y Disponibles
*   **Humedad de Suelo (`/agro/1.0/soil`)** 
    *   *Propósito:* Conocer la cantidad de agua disponible en las raíces de las orquídeas.
    *   *Data Clave:* `moisture` (Humedad del suelo a 10cm de profundidad) y `t10` (Temperatura del suelo).
*   **Precipitación Acumulada (`/agro/1.0/weather/history/accumulated_precipitation`)**
    *   *Propósito:* Validar eventos pasados, saber cuánta lluvia (en mm) cayó exactamente en la finca en un período específico.
    *   *Comportamiento:* Permite rangos dinámicos usando timestamps (ej: últimas 24h).
*   **Índices Satelitales (NDVI, EVI) *(Disponible, Uso Futuro)***
    *   Imágenes de vitalidad de vegetación, muy útiles en terrenos abiertos, aunque pueden aportar poco valor bajo las mallas de un orquideario residencial.

---

## 3. Estrategia de Sincronización del Weather Oracle

Para garantizar que PristinoPlant siempre cuente con la última información y jamás sufra suspensiones por exceder los límites de la cuota (rate limits), el oráculo ejecuta la sincronización bajo el siguiente formato:

### Configuración de Frecuencias (Cron)
```typescript
// Ejecución cada 3 horas (8 veces al día)
const job = new Cron('0 */3 * * *', async () => { ... });
```

### Cálculo de Consumo (Límites)
1. **Consumo Diario OWM:** 
   - 1 actualización cada 3 horas = **8 llamadas/día**.
   - Presupuesto diario ocioso: 992 llamadas.
   *Conclusión:* Tenemos un margen masivo del **99.2%**, lo que nos permite incrementar la frecuencia a futuro si necesitamos pronósticos de extrema urgencia.
   
2. **Consumo Diario AgroMonitoring:**
   - 2 llamadas (Soil + History) cada 3 horas = **16 llamadas/día** sobre una misma cuenta/polígono.
   - Peticiones por minuto: 2. (Límite: 60/min).
   *Conclusión:* Uso insignificante en términos de peticiones, asegurando la supervivencia eterna de la capa gratuita siempre que no sobrepasemos las 1,000 hectáreas registradas.

### Justificación de Arquitectura Dividida
Si se intentara centralizar toda la lógica en un solo servicio (ej. todo OWM), las limitaciones restrictivas de las capas gratuitas (falta de análisis de suelo, carencia de historial, y límites diarios) colapsarían el módulo.

Al dividir el orquestador:
- **OWM** toma el trabajo "amplio": ¿Lloverá la próxima semana? (Ideal para planificar tanques de agua).
- **AgroMonitoring** toma el trabajo "macro/local": ¿Tengo que encender las bombas de riego hoy? (El riego local se basa en lo que está mojado hoy, no en si va a llover mañana).

Esta separación proporciona un blindaje arquitectónico donde la falla de una cuenta o de una API no deja "ciego" al orquideario.
