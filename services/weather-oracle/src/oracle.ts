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
 * TODO: Implementar syncOpenWeatherMap() cuando se proporcione una API Key.
 */
export async function syncOpenWeatherMap() {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
        Logger.warn('Omitiendo OpenWeatherMap: No se encontró OPENWEATHER_API_KEY.');
        return false;
    }
    // Lógica similar a syncOpenMeteo usando One Call API 3.0
    return false;
}
