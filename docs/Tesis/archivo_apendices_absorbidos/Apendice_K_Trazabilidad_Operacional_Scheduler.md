# **Apéndice K. Arquitectura y Trazabilidad Operacional del Servicio Scheduler**

El presente apéndice expone la especificación arquitectónica, los subsistemas concurrentes y la bitácora de trazabilidad en tiempo real del microservicio `Scheduler` de la plataforma PristinoPlant. Desarrollado en Node.js y TypeScript bajo un contenedor Docker independiente con ejecución continua (24/7), este componente actúa como el orquestador soberano de la solución, mediando de forma desacoplada entre los microcontroladores en campo (ESP32), el bróker de mensajería MQTTS, la persistencia histórica en bases de datos (PostgreSQL e InfluxDB) y los flujos de mensajería interactiva hacia Telegram.

---

### 1. Responsabilidades Nucleares del Servicio Scheduler

La arquitectura interna del `Scheduler` organiza siete (7) módulos operativos que ejecutan tareas programadas mediante expresiones temporales (`croner`), consumidores de eventos reactivos y controladores de enlace:

1. **Gestión de Sesión y Comunicación MQTTS (`mqtt-handler`):** Administra la conexión segura bajo TLS con el bróker Eclipse Mosquitto, estructurando el secuenciador de comandos (`CommandSequencer`) con acuse de recibo obligatorio (`ACK`), reintento automático y tiempo de estabilización post-reconexión.
2. **Ciclo Circadiano y Clasificación Solar (`day-classifier`):** Computa la iluminancia promedio diurna para categorizar la jornada (`SOLEADO`, `EXTREMADAMENTE_SOLEADO`, `TEMPLADO`), gobernando dinámicamente el encendido matutino y apagado nocturno del luxómetro (`lux_sampling:on/off`).
3. **Orquestación de la Estación en Reposo (`ema-manager`):** Coordina el ciclo de bajo consumo de la Estación Meteorológica Interior (EMA Interior), sincronizando su reloj interno (RTC), extrayendo sus lotes de telemetría y ordenando su retorno a sueño profundo (*Deep Sleep*).
4. **Motor de Resiliencia y Watchdog de Sensores (`watchdog`):** Supervisa la disponibilidad de datos de los transductores físicos (DHT22 y BH1750), comandando ciclos de sincronización (`sync_climate`) y ciclos de potencia en el hardware para desbloquear buses digitales sin reiniciar el nodo.
5. **Autonomía Hídrica y Deliberación Algorítmica (`inference-engine`):** Evalúa los umbrales climáticos antes de autorizar cualquier conmutación sobre el circuito hidráulico, aplicando vetos por lluvia activa, ventanas retrospectivas, saturación y alternancia interdiaria.
6. **Agenda Agronómica y Mantenimiento de Filtro (`task-manager` / `dosing-schedule-manager`):** Pre-agenda las rutinas de fertilización y fitosanitarias, marca la expiración de tareas no atendidas y audita la cadencia de limpieza del filtro de disco cada 48 horas hacia Telegram.
7. **Procesamiento Telemétrico y Cierre Diario (`telemetry-processor`):** Calcula a la medianoche los índices bioclimáticos consolidados del orquideario: Integral de Luz Diaria (DLI), Déficit de Presión de Vapor (VPD) y gradiente térmico día/noche (DIF), aplicando filtros de calidad por densidad de muestras.

---

### 2. Evidencia Empírica de Trazabilidad en Consola

La Figura Ap-K1 documenta una ventana de ejecución real del microservicio `Scheduler`, capturando la interacción concurrente entre la detección algorítmica de precipitaciones, la gestión de eventos huérfanos ante pérdidas de red, el protocolo post-reinicio de microcontroladores y el cierre astronómico diario.

![Figura Ap-K1. Bitácora de eventos y trazabilidad operativa en tiempo real del servicio Scheduler.](figuras/figura_ap_k1_consola_scheduler.png)

##### *Figura Ap-K1. Bitácora de eventos y trazabilidad operativa en tiempo real del servicio Scheduler.*
Captura de pantalla de la consola de terminal del servicio orquestador, mostrando la apertura de evento de lluvia, cese por desconexión `EMA_OFFLINE`, reinicio con sincronización horaria RTC, reintento de sensores, ciclo circadiano y consolidación diaria. Elaboración propia.

---

### 3. Desglose Secuencial de Eventos Críticos

A partir de los registros auditados en la consola e ilustrados en la Figura Ap-K1 (comprendidos cronológicamente entre el 28 de septiembre a las 5:20 p.m. y el 29 de septiembre a las 12:01 a.m.), se desglosan los cinco (5) hitos operacionales que evidencian la autonomía deliberativa y resiliencia del sistema:

#### Hito 1: Apertura de Evento de Lluvia Inferida (05:20 p.m.)
En las líneas iniciales de la Figura Ap-K1 se observa el instante en que el motor de inferencia meteorológica evaluó las series temporales de la EMA Exterior en ventanas deslizantes diurnas. Al registrar un incremento higrométrico abrupto ($\Delta HR = +14.1\%$), aparejado a un enfriamiento térmico de magnitud ($\Delta Temp = -5.5^\circ\text{C}$) y una caída del 71% en la iluminancia solar (descendiendo desde un valor base de 10.031 lx hasta 2.874 lx), el algoritmo determinó una condición de lluvia diurna bajo nubosidad persistente, abriendo el evento pluvial en la base de datos para vetar de inmediato cualquier maniobra de riego activa o programada.

#### Hito 2: Detección y Cierre de Evento Huérfano por Desconexión (06:15 p.m. – 06:21 p.m.)
A las 6:15 p.m., tal como documenta la captura, el bróker MQTTS notificó la desconexión del microcontrolador exterior (`NODE OFFLINE [Actuador]`). En lugar de mantener el evento de lluvia abierto de forma indefinida (lo que habría bloqueado falsamente el riego del orquideario durante días), el planificador activó una ventana de guarda de doce minutos. Al no reanudarse la telemetría, el sistema ejecutó a las 6:21 p.m. la regla determinista de salvaguarda `EMA_OFFLINE`, reflejada en la consola con el cierre formal del evento huérfano y una duración calculada de 59 minutos.

#### Hito 3: Recuperación Post-Reinicio y Sincronización Horaria (06:23 p.m.)
Continuando con la cronología de la Figura Ap-K1, al restablecerse el suministro eléctrico del nodo actuador (`NODE REBOOT`), el planificador detectó su conexión en el tópico de estado. De forma inmediata, despachó el comando de sincronización horaria hacia el reloj interno (RTC) del microcontrolador para fijar la marca de 6:23 p.m. Este ajuste responde a dos propósitos operacionales fundamentales: sincronizar las marcas temporales de la telemetría con la hora local de Venezuela (UTC-4) para su correlación en base de datos, y garantizar que las publicaciones de los lotes telemétricos se alineen estrictamente con los múltiplos de diez minutos del reloj (:00, :10, :20, etc.) en lugar de contar deltas relativos desde el encendido. De este modo, si el nodo inicia actividades a las 12:05 p.m., su primer envío ocurrirá exactamente a las 12:10 p.m., sincronizándose de manera determinista con la estación interior. El nodo confirmó la recepción mediante una trama de acuse de recibo (`ACK`) antes de que el servidor procediera con la activación del muestreo lumínico y la verificación de actuadores.

#### Hito 4: Resiliencia de Transductores y Watchdog de Sensores (06:23 p.m. – 06:28 p.m.)
Durante la fase de inicialización post-reinicio, la terminal advierte que la lectura del transductor higrotérmico falló transitoriamente (`Clima: No se detecto el sensor DHT22`). En respuesta, el subsistema de vigilancia del planificador activó una rutina de reintento agresivo (intento 1 de 6) comandando la sincronización climática (`sync_climate`). Tras recibir el acuse de recibo y restablecer el bus de datos, el watchdog certificó en consola la estabilización exitosa de los sensores a las 6:28 p.m., reanudando la captura telemétrica continua sin requerir la intervención presencial del operador.

#### Hito 5: Ciclo Circadiano, Consulta Financiera y Cierre Diario (07:01 p.m. – 12:01 a.m.)
En el segmento final de la Figura Ap-K1, al alcanzar las 7:01 p.m., el planificador constató el anochecer y emitió la orden `lux_sampling:off` confirmada con `ACK`; este comando suspende el bus del luxómetro BH1750 durante la noche para evitar registros innecesarios de 0 lux y optimizar recursos. A las 8:30 p.m., un microflujo autónomo consultó la API oficial del Banco Central de Venezuela, obteniendo la tasa cambiaria de 857.88 Bs/USD para actualizar los precios en la tienda electrónica. 

Finalmente, a las 12:01 a.m. del día siguiente, la consola evidencia el cierre diario completado: el servicio consolidó 2.228 registros del microclima exterior, calculando los descriptores agronómicos acumulados: Integral de Luz Diaria ($DLI = 22.06\text{ mol}\cdot\text{m}^{-2}\text{d}^{-1}$), Déficit de Presión de Vapor promedio ($VPD = 4.27\text{ kPa}$) y balance térmico ($DIF = 13.67^\circ\text{C}$). Asimismo, constató que la EMA Interior no transmitió datos durante dicha jornada, descartando el día mediante una advertencia de control de calidad (`WARN`) para no sesgar las estadísticas históricas del cultivo.

---

### 4. Ciclo de Vida y Protocolo de Reposo con la Estación Interior (EMA)

La auditoría extendida de las operaciones del `Scheduler` revela el riguroso protocolo de bajo consumo implementado para gobernar la Estación Meteorológica Interior a batería:

```
PROTOCOLO HORARIO DE REPOSO (DEEP SLEEP) - NODO EMA
┌────────────────────────────────────────────────────────────────────────┐
│ 1. DESPERTAR HORARIO: El nodo enciende radio y publica telemetría      │
│    [ 10:00 pm ] 🟢 [ NODE ] ONLINE [EMA]                               │
│    [ 10:00 pm ] 🌡️ [ INFO ] Clima: 27.8°C / 75.7%                      │
├────────────────────────────────────────────────────────────────────────┤
│ 2. SINCRONIZACIÓN Y GUARDAS: El servidor ajusta reloj y sensores       │
│    [ 10:00 pm ] 📡 Comando: Sincronización horaria RTC ──> [ ACK ]     │
│    [ 10:00 pm ] 📡 Comando: lux_sampling:off           ──> [ ACK ]     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ORDEN DE SUEÑO PROFUNDO: Servidor autoriza apagado de periféricos   │
│    [ 10:00 pm ] 📡 Comando: sleep                      ──> [ ACK ]     │
│    [ 10:00 pm ] 💤 [ NODE ] SLEEP [EMA] (Retorno a Deep Sleep x 60 min)│
└────────────────────────────────────────────────────────────────────────┘
```

Si durante este ciclo se produce una pérdida de paquete en el acuse de recibo (`ACK`), el planificador incorpora una guarda por tiempo límite (*Timeout Fallback*):
`⚠️ EMA marcado en SLEEP tras timeout de acuse (Fallback)`
Esta regla previene que el servidor asuma falsamente que la estación permanece encendida consumiendo energía, preservando la coherencia del estado del gemelo digital en el backend.

---

### 5. Resumen de Gobernanza de Vetos y Recuperación en Caliente

La trazabilidad del servicio demuestra la aplicación determinista de las reglas de irrigación y resiliencia documentadas en el informe:
* **Recuperación en Caliente (*Hot State Recovery*):** Ante una caída de red a los 2 minutos de una rutina de aspersión de 15 minutos, el planificador pausó la tarea; tras reconectarse el nodo un minuto después, reevaluó el clima y despachó un nuevo comando con los **13 minutos restantes (780 s)**, completando la cuota hídrica sin sobre-irrigar.
* **Modo Ráfaga de Precipitación:** Cuando la iluminancia desciende bruscamente al mediodía ($\le 8.500\text{ lx}$), el `Scheduler` conmuta el nodo de modo vigía (muestreo cada 5 min) a modo ráfaga (`INTERVAL_BURST`, muestreo a 1 min), retornando a `INTERVAL_NORMAL` en cuanto se recupera la radiación solar.
* **Vetos Cruzados por Historial:** Cancelación automática de aspersión matutina (`IRRIGATION`) al registrarse lluvia inferida en la víspera (alternancia interdiaria), veto de humectación ante lluvias en las últimas 4 horas o ante saturación diurna sostenida ($\ge 85\%$).
