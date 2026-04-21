# ⛅ Weather Oracle (Oráculo Meteorológico)

El **Weather Oracle** es un microservicio autónomo dentro del ecosistema de PristinoPlant. Actúa como el "vigía satelital" del sistema de riego, encargado de recopilar, normalizar y persistir de forma asíncrona datos meteorológicos y edafológicos (del suelo) provenientes de múltiples APIs externas.

---

## 🎯 Objetivos y Problemas que Resuelv


### 
Eguera 
Meteoro
lógica"
 y Rieg
o Ciego
En sistemas de riego iot tradicionales basados en temporizadores, si está lloviendo torrencialmente o si el suelo ya está saturado de humedad de días anteriores, el sistema igual regará, desperdiciando agua y pudiendo dañar las raíces de plantas delicadas (como las orquídeas) por pudrición. Además, un sensor de lluvia físico en el ESP32 solo indica si está lloviendo **ahora**, pero carece de contexto histórico o predictiv
o.


#










## La So
lución: We
atherGuard
El Weather Oracle alimenta de inteligencia al cerebro del sistema (el `Scheduler`), resolviendo problema




 icos:
1.  **Riego Predictivo (OWM & Open-Meteo):** Cancela riegos futuros si hay una altísima probabilidad de precipita horas.
2.  **Riego Contextual (AgroMonitoring):** Analiza si el porcentaje histórico de humedad remanente en el suelo a 10cm de profundidad es suficiente, evitando sobrehidrata ya sol.
3.  **Filosofía Fail-Safe Multi-API:** El servicio consulta 3 oráculos simultáneamente. Si un proveedor cae o agota su límite de capa gratuita, el sistema puede recaer en los otros, evitando que las plantas queden vulnerables.

---

## ⚙️ Arquitectura de Sincronización

El servicio está diseñado para funcionar en un entorno **Dockerizado de baja latencia** y corre un cronjob interno:

- **Bootstrap:** Sincroniza todas las fuentes de inmediato al arrancar el contenedor.
- **Cronjob Activo:** Re-sincroniza silenciosamente cada **3 horas**.
- **Consumo Mínimo:** Esta arquitectura consume menos del **1%** de los límites de Rate Limit gratuitos diarios permitidos por OpenWeatherMap y AgroMonitoring (8 a 16 llamadas por día).

---

## 🔑 Configuración del Entorno (`.env`)

El oráculo requiere configuración a nivel de root (en el archivo `../../../.env` del proyecto):

```env
# Coordenadas exactas del área a monitorear
LATITUDE=8.354972
LONGITUDE=-62.663898

# OpenWeatherMap (Forecast Atmosférico)
# Obtener en: https://home.openweathermap.org/api_keys
OPENWEATHER_API_KEY=tu-api-key-aqui

# AgroMonitoring (Satelital y Suelo a 10cm)
# Obtener en: https://agromonitoring.com/dashboard/api_keys
AGROMONITORING_API_KEY=tu-api-key-aqui
AGROMONITORING_POLY_ID=tu-id-de-poligono  # (Ver sección de automatización)
```

---

## 🚀 Uso y Comandos

Debido a la estructura monorepo (pnpm workspacevicio se debe ejecutar desde la raíz de








l 










proyecto o utilizando filtros.

### En Desarrollo
Para ejecutar el oráculo en modo v








ig










ilancia (watch) leyendo directamente el `.env` raíz:
```bash
pnpm --filter @service/weather-oracle run 








de










v
```

### Scripts de Utilidad: Generador de Polígonos
Para que AgroMonitoring funcione, necesitas un `POLY_ID` que represente **como mínimo 1.0 Hectáreas (100mx100m)** alrededor de tu jardín. El oráculo incluye un script automatizado para crear este cuadrante sin interactuar con la consola de ellos.

1. Añade tu `AGROMONITORING_API_KEY` al `.env`.
2. Edita `scripts/register_poly.ts` si neces

i






ta










s ajustar tus coordenada
s geográficas.
3. Ejecuta el script:
   ```bash
   pnpm -
-filte







r 










@service/weather-oracle exec tsx scripts/register_poly.ts
   ```
4. El script imprimirá un ID alfabético (ej. `69d306bb646c654ca29fd328`). Cópialo en `AGROMONITORING_POLY_ID` dentro de tu `.env`.

---

## 🗃️ Modelo de Persistencia (Prisma)

El servicio interactúa exclusivamente con el paquete interno `@package/database` modelando hacia la tabla `WeatherForecast` en PostgreSQL.
Los datos de suelo provenientes de AgroMonitoring (`moisture` y `t10`) se inyectan en los campos dedicados `soilMoisture` y `soilTemp` para no corromper la temperatura del aire proveniente de los oráculos atmosféricos.
