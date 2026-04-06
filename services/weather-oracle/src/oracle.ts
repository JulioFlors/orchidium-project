import axios from 'axios';
import { prisma, type WeatherCondition } from '@package/database';
import { Logger } from './logger';

/**
 * Mapea los códigos WMO (World Meteorological Organization) a nuestro enum WeatherCondition.
 */
function mapWeatherCode(code: number): WeatherCondition {
  if (code === 0) return 'CLEAR';
  if (code >= 1 && code <= 3) return 'CLOUDY';
  if (code >= 45 && code <= 48) return 'FOG';
  if (code >= 51 && code <= 67) return 'RAIN';
  if (code >= 71 && code <= 77) return 'SNOW';
  if (code >= 80 && code <= 82) return 'RAIN';
  if (code >= 95 && code <= 99) return 'STORM';
  return 'UNKNOWN';
}

/**
 * Mapea los códigos de OpenWeatherMap a nuestro enum WeatherCondition.
 */
function mapOWMWeatherCode(code: number): WeatherCondition {
  if (code >= 200 && code <= 232) return 'STORM';
  if (code >= 300 && code <= 321) return 'RAIN';
  if (code >= 500 && code <= 531) return 'RAIN';
  if (code >= 600 && code <= 622) return 'SNOW';
  if (code >= 701 && code <= 781) return 'FOG';
  if (code === 800) return 'CLEAR';
  if (code >= 801 && code <= 804) return 'CLOUDY';
  return 'UNKNOWN';
}

/**
 * Sincroniza el pronóstico horario desde Open-Meteo (Sin API Key).
 */
export async function syncOpenMeteo() {
  const lat = process.env.LATITUDE || '8.31';
  const lon = process.env.LONGITUDE || '-62.71';
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=3`;

  Logger.info(`Sincronizando Open-Meteo para las coordenadas Lat:${lat} Lon:${lon}...`);

  try {
    const response = await axios.get(url);
    const { hourly } = response.data;
    
    if (!hourly || !hourly.time) {
      throw new Error('Invalid response from Open-Meteo');
    }

    const source = 'Open-Meteo';
    let upsertCount = 0;

    for (let i = 0; i < hourly.time.length; i++) {
      const timestamp = new Date(hourly.time[i]);
      const temperature = hourly.temperature_2m[i];
      const humidity = hourly.relative_humidity_2m[i];
      const precipProb = (hourly.precipitation_probability[i] || 0) / 100;
      const weatherCode = hourly.weather_code[i];

      const condition = mapWeatherCode(weatherCode);

      await prisma.weatherForecast.upsert({
        where: {
          timestamp_source: {
            timestamp,
            source
          }
        },
        update: {
          temperature,
          humidity,
          precipProb,
          condition,
          updatedAt: new Date()
        },
        create: {
          timestamp,
          temperature,
          humidity,
          precipProb,
          condition,
          source
        }
      });
      upsertCount++;
    }

    Logger.success(`${source} resincronizado. ${upsertCount} registros horarios guardados.`);
    return true;
  } catch (error) {
    Logger.error(`Fallo al sincronizar con ${'Open-Meteo'}:`, error);
    return false;
  }
}

/**
 * Sincroniza el pronóstico desde OpenWeatherMap (Requiere API Key).
 * Utiliza el endpoint '5 Day / 3 Hour Forecast'.
 */
export async function syncOpenWeatherMap() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const lat = process.env.LATITUDE || '8.31';
    const lon = process.env.LONGITUDE || '-62.71';

    if (!apiKey) {
        Logger.warn('Omitiendo OpenWeatherMap: No se encontró OPENWEATHER_API_KEY en .env');
        return false;
    }

    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`;

    Logger.info(`Sincronizando OpenWeatherMap para las coordenadas Lat:${lat} Lon:${lon}...`);

    try {
        const response = await axios.get(url);
        const { list } = response.data;

        if (!list || !Array.isArray(list)) {
            throw new Error('Respuesta inválida de OpenWeatherMap');
        }

        const source = 'OpenWeatherMap';
        let upsertCount = 0;

        for (const item of list) {
            const timestamp = new Date(item.dt * 1000); // OWM usa segundos
            const temperature = item.main.temp;
            const humidity = item.main.humidity;
            
            // OWM 'pop' (Probability of precipitation) es 0-1
            const precipProb = item.pop || 0;
            
            const weatherCode = item.weather[0]?.id || 0;
            const condition = mapOWMWeatherCode(weatherCode);

            await prisma.weatherForecast.upsert({
                where: {
                    timestamp_source: {
                        timestamp,
                        source
                    }
                },
                update: {
                    temperature,
                    humidity,
                    precipProb,
                    condition,
                    updatedAt: new Date()
                },
                create: {
                    timestamp,
                    temperature,
                    humidity,
                    precipProb,
                    condition,
                    source
                }
            });
            upsertCount++;
        }

        Logger.success(`${source} resincronizado. ${upsertCount} registros guardados.`);
        return true;
    } catch (error: any) {
        const status = error.response?.status;
        if (status === 401) {
            Logger.error('Fallo en OpenWeatherMap: API Key inválida o no activada aún (esperar 2h-24h tras registro).');
        } else {
            Logger.error(`Fallo al sincronizar con OpenWeatherMap:`, error.message);
        }
        return false;
    }
}

/**
 * Sincroniza datos de suelo (Humedad y Temperatura a 10cm) desde AgroMonitoring.
 */
export async function syncAgroMonitoring() {
    const apiKey = process.env.AGROMONITORING_API_KEY;
    const polyId = process.env.AGROMONITORING_POLY_ID;

    if (!apiKey || !polyId) {
        Logger.warn('Omitiendo AgroMonitoring Soil: Falta API Key o PolyID en .env');
        return false;
    }

    const url = `http://api.agromonitoring.com/agro/1.0/soil?polyid=${polyId}&appid=${apiKey}`;

    Logger.info(`Consultando datos de suelo en AgroMonitoring (PolyID: ${polyId})...`);

    try {
        const response = await axios.get(url);
        const { dt, t10, moisture } = response.data;

        const timestamp = new Date(dt * 1000);
        const source = 'AgroMonitoring';

        await prisma.weatherForecast.upsert({
            where: {
                timestamp_source: {
                    timestamp,
                    source
                }
            },
            update: {
                temperature: t10 - 273.15, // Kelvin to Celsius
                humidity: 0, // No aplica directamente
                soilTemp: t10 - 273.15,
                soilMoisture: moisture,
                condition: 'UNKNOWN',
                updatedAt: new Date()
            },
            create: {
                timestamp,
                temperature: t10 - 273.15,
                humidity: 0,
                soilTemp: t10 - 273.15,
                soilMoisture: moisture,
                condition: 'UNKNOWN',
                source
            }
        });

        Logger.success(`${source}: Datos de suelo actualizados (Humedad: ${(moisture * 100).toFixed(1)}%)`);
        return true;
    } catch (error: any) {
        Logger.error('Fallo al sincronizar suelo con AgroMonitoring:', error.message);
        return false;
    }
}

/**
 * Sincroniza historial de precipitación acumulada (últimas 24h).
 */
export async function syncAgroHistory() {
    const apiKey = process.env.AGROMONITORING_API_KEY;
    const polyId = process.env.AGROMONITORING_POLY_ID;

    if (!apiKey || !polyId) return false;

    const end = Math.floor(Date.now() / 1000);
    const start = end - (24 * 3600); // 24 horas atrás

    const url = `http://api.agromonitoring.com/agro/1.0/weather/history/accumulated_precipitation?polyid=${polyId}&start=${start}&end=${end}&appid=${apiKey}`;

    try {
        const response = await axios.get(url);
        const data = response.data;
        
        // El API devuelve un valor único de acumulación en mm
        Logger.info(`AgroMonitoring History: Precipitación acumulada 24h: ${data.amount || 0}mm`);
        return true;
    } catch (error: any) {
        Logger.error('Fallo al sincronizar historial con AgroMonitoring:', error.message);
        return false;
    }
}
