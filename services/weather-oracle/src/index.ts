import { syncOpenMeteo } from './oracle';
import { Cron } from 'croner';
import { Logger } from './logger';

Logger.info('Iniciando servicio Weather Oracle');

/**
 * Inicialización inmediata al arrancar el contenedor/servicio.
 */
async function bootstrap() {
    try {
        Logger.info('Iniciando sincronización (Bootstrap)');
        await syncOpenMeteo();
        Logger.success('Bootstrap completado satisfactoriamente.');
    } catch (error) {
        Logger.error('Error crítico durante el bootstrap:', error);
    }
}

// Iniciar procesos
bootstrap();

// Programar sincronización periódica cada 3 horas.
// Cron: 0 */3 * * *
const job = new Cron('0 */3 * * *', async () => {
    Logger.cron(`Iniciando sincronización meteorológica periódica`);
    await syncOpenMeteo();
});

Logger.info(`Servicio inactivo en espera. Próxima ejecución: ${job.nextRun()?.toLocaleString()}`);

// Mantener el proceso vivo (aunque croner lo hace, es buena práctica en Node)
process.on('SIGINT', () => {
    Logger.warn('Señal SIGINT recibida. Cerrando servicio oracle');
    process.exit(0);
});
