# Service: Weather Oracle

El servicio `Weather Oracle` es el responsable de centralizar la información meteorológica externa y proporcionar datos predictivos al sistema para la toma de decisiones de riego.

## Fuentes de Datos

### 1. Open-Meteo (Principal)

- Fuente secundaria sin requerimiento de API Key.
- Proporciona pronóstico horario de temperatura, humedad y probabilidad de precipitación para las coordenadas configuradas.

### 2. OpenWeatherMap

- Fuente de validación cruzada.
- Requiere `OPENWEATHER_API_KEY`.
- Se utiliza el endpoint de pronóstico de 5 días / 3 horas.

### 3. AgroMonitoring (Suelo y Satélite)

- Proporciona datos de humedad del suelo (`moisture`) y temperatura a 10cm (`t10`).
- **Restricción de Capa Gratuita**: Solo se utiliza el polling de estado actual del suelo. El historial acumulativo (`syncAgroHistory`) está desactivado por requerir planes Premium (Error 401).

## Lógica de Sincronización

- **Bootstrap**: Al iniciar el servicio, se realiza una sincronización inmediata (Promise.allSettled) de todas las fuentes.
- **Intervalo**: Se ejecuta un proceso cron de fondo cada **3 horas** (`0 */3 * * *`) para refrescar los datos en la base de datos PostgreSQL.

## Modelo de Datos

Toda la información se unifica en la tabla `WeatherForecast` bajo un índice único compuesto por `timestamp` y `source`. Esto permite comparar pronósticos de diferentes proveedores para una misma hora futura.
