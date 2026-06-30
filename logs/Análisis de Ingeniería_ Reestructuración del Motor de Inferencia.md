# **Análisis de Ingeniería: Reestructuración del Motor de Inferencia (Orchidium Scheduler)**

Este documento presenta el análisis técnico detallado y las especificaciones de diseño para la reestructuración del motor de inferencia de **Orchidium** (services/scheduler/src/lib/inference-engine.ts). El objetivo primordial es implementar un control de alternancia dinámico, un sistema de reprogramación resiliente frente a fallas o pérdidas de datos (*packet loss*), y garantizar el cumplimiento estricto del riego interdiario en el orquideario de **PristinoPlant**.

## **1\. Glosario de Aprendizaje de Inglés Técnico (Technical Vocabulary)**

Para consolidar el dominio del idioma inglés aplicado a la ingeniería de sistemas, utilizaremos la siguiente terminología técnica estándar a lo largo de este documento y en el código del sistema:

| Término en Inglés | Traducción | Contexto de Uso en Orchidium |
| :---- | :---- | :---- |
| **Scheduler** | Planificador / Programador | Servicio encargado de orquestar y disparar tareas automatizadas basadas en tiempo o eventos. |
| **Inference Engine** | Motor de Inferencia | Módulo lógico que evalúa las condiciones del entorno y las reglas de negocio para determinar acciones. |
| **State Machine** | Máquina de Estados | Modelo de diseño de software en el cual el sistema transiciona entre estados mutuamente excluyentes. |
| **State Transition** | Transición de Estado | El paso de un estado lógico a otro gatillado por el cumplimiento de una condición o evento. |
| **Fallback** | Mecanismo de Respaldo | Acción o ruta alternativa que se toma de forma segura cuando el proceso principal falla. |
| **Task Log** | Registro de Tareas | Historial inmutable de auditoría donde se reporta el resultado, duración y estatus de cada tarea. |
| **Interday / Alternate Days** | Interdiario / Días Alternos | Patrón de frecuencia del riego: se ejecuta un día sí y un día no (![][image1] día de riego, ![][image1] día de descanso). |
| **Overcast / Shadow** | Nublado / Sombra | Reducción de la irradiancia solar útil medida a través del promedio de luxes y las rachas consecutivas. |
| **Packet Loss** | Pérdida de Paquetes / Datos | Lagunas en las muestras de sensores de telemetría provocadas por fallas de red o retransmisión MQTT. |
| **Deferred Task** | Tarea Diferida | Tarea planificada dinámicamente para ejecutarse en el futuro inmediato, fuera del cron fijo habitual. |
| **Misting System** | Sistema de Nebulización | Microaspersión de agua fina orientada al control de humedad relativa y temperatura foliar. |

## **2\. Diagnóstico del Estado Actual vs. Requerimientos**

Al analizar la arquitectura del planificador en services/scheduler/src/lib/inference-engine.ts, identificamos la necesidad de evolucionar desde una clasificación de días rígida hacia un sistema adaptativo.

               \[ ESTADO ACTUAL \]                                   \[ ESTADO DESEADO \]  
┌──────────────────────────────────────────────┐   ┌──────────────────────────────────────────────┐  
│ 1\. Evaluación rígida por días                │   │ 1\. Evaluación de volumen hídrico acumulado   │  
│    (Clasificación: soleado, lluvioso, etc.)  │   │    multifuente (Manual, Rutina, Diferido).    │  
├──────────────────────────────────────────────┤   ├──────────────────────────────────────────────┤  
│ 2\. Ejecución basada únicamente en Cron.      │   │ 2\. Máquina de estados con control de         │  
│                                              │   │    alternancia entre Cron y Tarea Diferida.   │  
├──────────────────────────────────────────────┤   ├──────────────────────────────────────────────┤  
│ 3\. Sensibilidad a pérdidas de datos.         │   │ 3\. Resiliencia mediante interpolación lineal │  
│                                              │   │    en el cálculo de promedios de lux.         │  
├──────────────────────────────────────────────┤   ├──────────────────────────────────────────────┤  
│ 4\. Fallas en electroválvulas causan sequía   │   │ 4\. Mecanismo Fallback que genera tareas      │  
│    al no reprogramar de emergencia.          │   │    diferidas al detectar fallas en el día.   │  
└──────────────────────────────────────────────┘   └──────────────────────────────────────────────┘

## **3\. Especificación de Reglas de Negocio (Business Rules)**

El motor de inferencia ejecutará un balance diario a las **8:00 PM** de cada día (![][image2]) recopilando la telemetría microclimática y el historial de ejecuciones. Las decisiones se regirán bajo las siguientes directrices:

### **REGLA 1: Confirmación de Riego Efectivo (![][image3])**

Para evitar sobrierrego o deshidratación, el Scheduler no se limita a verificar si se disparó la tarea; debe interrogar el log histórico (TaskHistory) y acumular la duración total real de todas las tareas exitosas de tipo ASPERSION del día:

* ![][image4]**Riego Efectivo (![][image5])**: Si ![][image6] dentro del día en curso. No importa si provino de la rutina Cron, de una tarea diferida o de ![][image7] ejecuciones manuales consecutivas de ![][image8] iniciadas por el usuario desde el panel de control.  
* **Riego Insuficiente (![][image9])**: Si ![][image10]. Se considera que la planta no recibió el agua suficiente (por ejemplo, si hubo un corte de energía o interrupción a los ![][image11] de ejecución).

### **REGLA 2: Regla de Oro de Interdiariedad (Golden Rule of Interday Irrigation)**

Si se confirma que ![][image5] en el día ![][image2], el motor de inferencia debe **bloquear y cancelar** de forma absoluta cualquier rutina de riego por aspersión programada para el día siguiente (![][image12]).

### **REGLA 3: Evaluación Climatológica Post-Cancelación**

En el día en que un riego programado fue cancelado para cumplir con la interdiariedad, el motor de inferencia evaluará el microclima del día de la cancelación (![][image13]) a las **8:00 PM** para decidir si debe reprogramar un riego para el día siguiente:

$$\\text{Decisión para } D\_{\\text{mañana}} \=

\\begin{cases}

\\text{Reprogramar (6:00 AM, 15 min)} & \\text{si } LL\_{\\text{acum}} \< 20\\text{ min} \\land L\_{\\text{prom}} \> 13,000\\text{ Lux} \\land S\_{\\text{consec}} \\le 60\\text{ min} \\

\\text{Suspender Riego / Esperar} & \\text{si } LL\_{\\text{acum}} \\ge 20\\text{ min} \\lor L\_{\\text{prom}} \\le 13,000\\text{ Lux} \\lor S\_{\\text{consec}} \> 60\\text{ min}

\\end{cases}$$

Donde:

* ![][image14] **(Lluvia Acumulada)**: Minutos totales de lluvia activa en el día. Si es ![][image15], se cancela y no se reprograma.  
* ![][image16] **(Lux Promedio)**: Promedio de irradiancia útil entre las 8:00 AM y las 4:00 PM. Si es ![][image17], el día se clasifica como nublado/lluvioso y se suspende el riego del día siguiente.  
* ![][image18] **(Sombra Consecutiva)**: Mayor racha continua donde el promedio móvil de ![][image19] se mantuvo por debajo de ![][image20] (Sombra Extrema). Si esta racha supera la hora (![][image21]), se suspende el riego para evitar saturación radicular en condiciones de baja transpiración foliar.

### **REGLA 4: Lluvia Consecutiva Excepcional**

Si se registran dos días consecutivos con lluvia activa (![][image22] en ambos días):

1. El planificador cancela preventivamente todas las aspersiones automáticas programadas.  
2. Al tercer día se realiza un seguimiento en tiempo real:  
   * **Si el día resulta soleado** (![][image23] y sin lluvia): Se habilita el sistema de nebulización foliar para recuperar el microclima del orquideario y se agenda un riego diferido por aspersión a las 6:00 AM del día siguiente.  
   * **Si se mantiene nublado o lluvioso**: Se mantiene deshabilitada la nebulización y el riego para prevenir pudriciones por hongos fitopatógenos (*Phytophthora* / *Pythium*).

## **4\. Diseño de la Máquina de Estados del Scheduler**

Para alternar de forma segura entre el Cron estándar del usuario y las tareas de riego dinámicas calculadas por Orchidium, el sistema mantendrá una variable de estado inmutable en la base de datos (SchedulerState):

                      \+----------------------------------+  
                      |       STATE\_STANDARD\_CRON        | \<----------------+  
                      | (Ejecuta la rutina base del      |                  |  
                      |  usuario de forma interdiaria)   |                  |  
                      \+----------------------------------+                  |  
                                       |                                    |  
                           Cancelación por Clima / Lluvia                   |  
                                       v                                    |  
                      \+----------------------------------+                  |  
                      |     STATE\_DIFERIDO\_SCHEDULER     |                  |  
                      | (Scheduler deshabilita Cron Fijo |                  |  
                      |  y genera tareas diferidas)      |                  |  
                      \+----------------------------------+                  |  
                                       |                                    |  
                    Sincronización (Riego doble detectado                   |  
                     o reprogramación exitosa del usuario) \-----------------+

### **Matriz de Transiciones de Estado (State Transition Matrix)**

| Estado de Origen | Evento / Gatillo | Acción del Scheduler | Estado de Destino |
| :---- | :---- | :---- | :---- |
| **STANDARD\_CRON** | Se cancela un riego programado por lluvia o baja radiación. | Deshabilita los disparadores automáticos del cron fijo. Evalúa a las 8:00 PM para agendar la primera tarea diferida. | **DIFERIDO\_SCHEDULER** |
| **DIFERIDO\_SCHEDULER** | Se completa un riego diferido con éxito (![][image5]). | Aplica interdiariedad cancelando preventivamente el día de mañana. Evalúa clima mañana a las 8:00 PM para agendar el subsiguiente. | **DIFERIDO\_SCHEDULER** |
| **DIFERIDO\_SCHEDULER** | Se detecta riego doble consecutivo (dos días de riego exitoso ![][image24] debido a intervención manual del usuario). | Restablece las rutinas de cron fijo originales del cultivador y sincroniza el balance de días alternos. | **STANDARD\_CRON** |
| **DIFERIDO\_SCHEDULER** | Fallo crítico: El riego planificado falla y el reporte diario cierra con ![][image9]. | **Fallback de Emergencia**: Ignora la interdiariedad y agenda una tarea diferida de aspersión (6:00 AM, 15 min) para el día siguiente. | **DIFERIDO\_SCHEDULER** |
| **CUALQUIER\_ESTADO** | Lluvia activa ![][image15] durante dos días consecutivos. | Cancela de inmediato todo riego. En el tercer día activa el protocolo de nebulización si sale el sol. | **RAIN\_SUSPENSION** |

## **5\. Diseño del Algoritmo del Motor de Inferencia**

Esta propuesta de código en TypeScript está lista para incorporarse al archivo services/scheduler/src/lib/inference-engine.ts, interactuando con Prisma y tus clases de soporte:

import { PrismaClient } from '@prisma/client';  
import { DayClassifier } from './day-classifier';  
import { TaskManager } from './task-manager';  
import { Logger } from './logger';

export class InferenceEngine {  
  private prisma: PrismaClient;  
  private classifier: DayClassifier;  
  private taskManager: TaskManager;  
  private logger: Logger;

  constructor(prisma: PrismaClient, classifier: DayClassifier, taskManager: TaskManager) {  
    this.prisma \= prisma;  
    this.classifier \= classifier;  
    this.taskManager \= taskManager;  
    this.logger \= new Logger('InferenceEngine');  
  }

  /\*\*  
   \* Ejecuta la evaluación diaria de reglas (Disparado cada día a las 8:00 PM)  
   \* @param date Fecha de evaluación (por defecto la fecha actual del sistema)  
   \*/  
  public async evaluateDailyRules(date: Date \= new Date()): Promise\<void\> {  
    this.logger.info(\`Iniciando evaluación de reglas para la fecha: ${date.toISOString()}\`);  

    const startOfDay \= new Date(date);  
    startOfDay.setHours(0, 0, 0, 0);  
    const endOfDay \= new Date(date);  
    endOfDay.setHours(23, 59, 59, 999);

    // 1\. Calcular minutos totales acumulados de riego efectivo de tipo ASPERSION que terminaron en OK  
    const irrigationMinutes \= await this.calculateEffectiveIrrigation(startOfDay, endOfDay);  
    const hasEffectiveIrrigation \= irrigationMinutes \>= 15;  

    this.logger.info(\`Riego total acumulado hoy: ${irrigationMinutes} min. Riego Efectivo: ${hasEffectiveIrrigation}\`);

    // 2\. Cargar el estado persistido de la Máquina de Estados del Scheduler  
    let schedulerState \= await this.prisma.schedulerState.findFirst();  
    if (\!schedulerState) {  
      schedulerState \= await this.prisma.schedulerState.create({  
        data: { state: 'STANDARD\_CRON', lastEvaluation: date }  
      });  
    }

    // 3\. Obtener variables climáticas del día (usando interpolación lineal en caso de packet loss)  
    const climateMetrics \= await this.classifier.getDailyMetrics(startOfDay, endOfDay);  
    const { rainMinutes, avgLux, maxConsecutiveOvercastMinutes } \= climateMetrics;

    this.logger.info(\`Métricas de clima hoy: Lluvia=${rainMinutes}m, LuxProm=${avgLux}, SombraConsecutiva=${maxConsecutiveOvercastMinutes}m\`);

    // 4\. Procesamiento de la Máquina de Estados (State Machine Logic)  
    switch (schedulerState.state) {  
      case 'STANDARD\_CRON':  
        if (hasEffectiveIrrigation) {  
          // El riego se cumplió hoy. Por regla de oro de interdiariedad, cancelamos preventivamente mañana.  
          await this.taskManager.cancelTomorrowRoutineIrrigation();  
          await this.prisma.schedulerState.update({  
            where: { id: schedulerState.id },  
            data: { state: 'DIFERIDO\_SCHEDULER', lastEvaluation: date }  
          });  
          this.logger.info('Transición a \[DIFERIDO\_SCHEDULER\] realizada con éxito. Rutina de mañana cancelada.');  
        }  
        break;

      case 'DIFERIDO\_SCHEDULER':  
        // Verificar si el usuario intervino regando dos días consecutivos  
        const hadIrrigationYesterday \= await this.checkIrrigationOnPreviousDay(startOfDay);  
        if (hasEffectiveIrrigation && hadIrrigationYesterday) {  
          this.logger.warn('Riego doble consecutivo detectado. Retornando control al usuario en \[STANDARD\_CRON\].');  
          await this.taskManager.restoreUserCronSchedules();  
          await this.prisma.schedulerState.update({  
            where: { id: schedulerState.id },  
            data: { state: 'STANDARD\_CRON', lastEvaluation: date }  
          });  
          return;  
        }

        // Si hoy tocaba riego y NO se completó el volumen (Riego Fallido o Cancelación por Clima)  
        if (\!hasEffectiveIrrigation) {
          // Evaluar si las condiciones de hoy permiten reprogramar una tarea diferida para mañana  
          const shouldReprogram \=
            rainMinutes \< 20 &&
            avgLux \> 13000 &&
            maxConsecutiveOvercastMinutes \<= 60; // Sombra continua \<= 1 hora (60 min)

          if (shouldReprogram) {  
            this.logger.info('Condiciones climatológicas óptimas. Reprogramando riego diferido para mañana a las 6:00 AM (15 min).');  
            await this.taskManager.createDeferredIrrigationTask(date, 15);  
          } else {  
            this.logger.warn('Condiciones climatológicas desfavorables detectadas hoy. Se suspende la reprogramación.');  
            await this.taskManager.cancelTomorrowRoutineIrrigation();  
          }  
        } else {  
          // Si hoy sí se regó con éxito mediante tarea diferida, cancelamos preventivamente mañana para mantener la alternancia  
          this.logger.info('Riego diferido de Orchidium ejecutado exitosamente hoy. Cancelando rutina de mañana.');  
          await this.taskManager.cancelTomorrowRoutineIrrigation();  
        }  
        break;

      case 'RAIN\_SUSPENSION':  
        // Evaluación de salida para temporada de lluvias consecutivas  
        if (rainMinutes \< 20 && avgLux \> 20000\) {  
          this.logger.info('Clima seco y radiación óptima detectada. Habilitando Nebulización y agendando aspersión diferida.');  
          await this.taskManager.enableMistingSystem();  
          await this.taskManager.createDeferredIrrigationTask(date, 15);  
          await this.prisma.schedulerState.update({  
            where: { id: schedulerState.id },  
            data: { state: 'STANDARD\_CRON', lastEvaluation: date }  
          });  
        }  
        break;  
    }  
  }

  /\*\*  
   \* Sumariza todos los minutos de riego exitosos (status OK) de tipo ASPERSION  
   \*/  
  private async calculateEffectiveIrrigation(start: Date, end: Date): Promise\<number\> {  
    const logs \= await this.prisma.taskLog.findMany({  
      where: {  
        taskType: 'ASPERSION',  
        status: 'OK',  
        completedAt: {  
          gte: start,  
          lte: end  
        }  
      }  
    });

    return logs.reduce((total, log) \=\> total \+ log.durationMinutes, 0);  
  }

  /\*\*  
   \* Comprueba si el día anterior se registró un riego efectivo  
   \*/  
  private async checkIrrigationOnPreviousDay(todayStart: Date): Promise\<boolean\> {  
    const yesterdayStart \= new Date(todayStart);  
    yesterdayStart.setDate(yesterdayStart.getDate() \- 1);  
    const yesterdayEnd \= new Date(todayStart);  
    yesterdayEnd.setMilliseconds(-1);

    const prevIrrigationMinutes \= await this.calculateEffectiveIrrigation(yesterdayStart, yesterdayEnd);  
    return prevIrrigationMinutes \>= 15;  
  }  
}

## **6\. Plan de Validación y Pruebas (Testing and Validation Plan)**

Para asegurar la robustez del motor reestructurado bajo condiciones de producción, se implementarán los siguientes escenarios de prueba utilizando el script de evaluación services/scheduler/src/scripts/test-evaluate.ts:

1. **Test de Pérdida de Datos (*Packet Loss Resilience*)**:  
   * **Insumo**: Un set de datos de InfluxDB con solo ![][image25] muestras (aproximadamente un ![][image26] de pérdida aleatoria).  
   * **Resultado Esperado**: El módulo day-classifier.ts debe interpolar linealmente la curva de luxes antes de entregar las métricas a evaluateDailyRules, calculando un promedio de radiación estable y detectando correctamente si la racha de sombra superó los ![][image27] reales de forma continua.  
2. **Test de Fallo de Válvula (*Fallback Trigger*)**:  
   * **Insumo**: Simular una tarea programada a las 6:00 AM que se interrumpe a los ![][image28] debido a un fallo de hardware (status: "FAILED", duration: 3).  
   * **Resultado Esperado**: Al correr la evaluación a las 8:00 PM, el motor identificará que ![][image9]. Si el clima fue óptimo en el día, agendará autónomamente la tarea diferida de emergencia para el día siguiente a las 6:00 AM por ![][image19].  
3. **Test de Sincronización Forzada (*Resync Trigger*)**:  
   * **Insumo**: Estando en estado DIFERIDO\_SCHEDULER, registrar un riego manual exitoso de ![][image19] un día, seguido de la ejecución de una tarea diferida exitosa al día siguiente.  
   * **Resultado Esperado**: Al detectar dos días consecutivos de riego completo, la máquina de estados cambiará de inmediato a STANDARD\_CRON y restaurará las rutinas Cron fijas del cultivador.
