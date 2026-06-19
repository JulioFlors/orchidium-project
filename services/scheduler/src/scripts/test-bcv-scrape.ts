import { Logger } from '../lib/logger';

// Desactivar validación de certificados para el BCV (SSL del BCV suele fallar en entornos Node)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function runTestScrape() {
  Logger.info('Iniciando prueba manual de scraping del BCV...', '🔍');
  const url = 'https://www.bcv.org.ve/';

  try {
    const start = Date.now();
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const duration = Date.now() - start;
    Logger.info(`Página cargada con éxito en ${duration}ms. Tamaño: ${html.length} bytes.`, '⚡');

    // 1. Intentar buscar contenedor del dólar
    const matchDolar = html.match(/id=["']dolar["'][\s\S]*?<strong[^>]*?>\s*([\d,.]+)\s*<\/strong>/i);
    let rate: number | null = null;
    if (matchDolar) {
      const rawValue = matchDolar[1].trim();
      rate = parseFloat(rawValue.replace(',', '.'));
      Logger.info(`Tasa de cambio USD encontrada: ${rate} Bs/USD`, '💵');
    } else {
      Logger.error('No se pudo encontrar el contenedor id="dolar" con la tasa en la estructura HTML.');
    }

    // 2. Intentar buscar fecha valor de la tasa
    const matchDate = html.match(/class=["']date-display-single["'][^>]*?content=["']([^"']+)["']/i);
    let dateStr: string | null = null;
    if (matchDate) {
      dateStr = matchDate[1];
      Logger.info(`Fecha valor reportada por el sitio: ${dateStr}`, '📅');
      const date = new Date(dateStr);
      Logger.info(`Fecha convertida (UTC): ${date.toISOString()}`, '🕒');
    } else {
      Logger.error('No se pudo encontrar la fecha valor en la estructura HTML.');
    }

    if (rate && dateStr) {
      Logger.success('Prueba de scraping exitosa. Datos listos para almacenamiento.');

      // Importar prisma dinámicamente para evitar dependencias circulares en scripts
      const { prisma } = require('@package/database');

      const bcvDate = new Date(dateStr);
      bcvDate.setHours(0, 0, 0, 0);

      // 1. Guardar tasa de mañana (según fecha valor reportada del BCV)
      await prisma.exchangeRate.upsert({
        where: { date: bcvDate },
        update: { rate },
        create: {
          rate,
          currency: 'USD',
          date: bcvDate,
        },
      });
      Logger.success(`Tasa de mañana (${bcvDate.toISOString().slice(0, 10)}) guardada: ${rate} Bs/USD`);

      // 2. Guardar tasa de hoy (llenado retroactivo)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.exchangeRate.upsert({
        where: { date: today },
        update: { rate },
        create: {
          rate,
          currency: 'USD',
          date: today,
        },
      });
      Logger.success(`Tasa de hoy (${today.toISOString().slice(0, 10)}) guardada/actualizada: ${rate} Bs/USD`);
    } else {
      Logger.warn('El scraping finalizó con datos incompletos.');
    }
  } catch (error: any) {
    Logger.error(`Fallo crítico durante la prueba de scraping: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

runTestScrape();
