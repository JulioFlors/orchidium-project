# Especificación: Estación Meteorológica Inteligente y WeatherGuard

## 1. Visión General

Transformar la estación meteorológica física en un sistema reactivo y proactivo que utilice pronósticos digitales para predecir condiciones y sensores locales para confirmar la realidad del microclima del orquideario.

## 2. Fuentes de Datos

- **Interna (Realidad)**: Nodos ESP32 (Exterior y Zona A). Proporcionan `is_raining`, `illuminance`, `temp`, `humidity`.
- **Externa (Predicción)**: API Climática (OpenWeatherMap o Open-Meteo). Proporciona `probabilidad_lluvia`, `temp_max_esperada`, `nubosidad`.

## 3. El Guardián del Clima (WeatherGuard Logic)

Antes de iniciar cualquier riego automático, el `scheduler` ejecutará el siguiente flujo de decisión:

### A. Bloqueo por Lluvia Presente (Sensor Local)

- **Regla**: Si el sensor de gotas reporta `rain_state: true`, se cancela el riego.
- **Justificación**: Prioridad absoluta a la realidad física inmediata.

### B. Bloqueo por Lluvia Inminente (Pronóstico API)

- **Regla**: Si `pop` (Probability of Precipitation) > 80% en las próximas 3 horas.
- **Justificación**: Ahorro de agua y prevención de exceso de humedad en raíces si la tormenta es inminente.
- **consideracion**: que prosigue si en 3h no llovio ? y se perdieron las condiciones ambientales aceptadas para efectuar el riego.

### C. Ajuste por Humedad Acumulada (Histórico)

- **Regla**: Si en las últimas 12 horas el sensor local registró más de 5mm de lluvia (o duración > 30 min).
- **Justificación**: El sustrato aún está saturado; no es necesario regar aunque no esté lloviendo en el momento exacto.

## 4. Arquitectura de Implementación

1. **Modelo Prisma**: `WeatherForecast` para cachear la respuesta de la API (evitar rate-limiting).
2. **Servicio `WeatherOracle`**:
   - `syncForecast()`: Corre cada 6 horas.
   - `shouldIrrigate(zoneId: string)`: Retorna booleano basado en la matriz de decisión.
3. **Dashboard UI**:
   - Comparativa: "Pronosticado: 28°C | Real Orquideario: 26.5°C".
   - Etiqueta de confianza del pronóstico.

## 5. APIs Recomendadas

- **Open-Meteo**: Recomendada para desarrollo (Sin API Key, open-source).
- **OpenWeatherMap**: Recomendada para producción (One Call API 3.0 por su precisión en Ciudad Guayana).
