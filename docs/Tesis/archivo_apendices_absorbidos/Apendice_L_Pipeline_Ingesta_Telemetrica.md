# **Apéndice L. Arquitectura y Pipeline de Ingesta Telemétrica**

El presente apéndice expone la especificación técnica, el diseño arquitectónico y el funcionamiento interno del microservicio `Ingest` de la plataforma PristinoPlant. Desarrollado en TypeScript sobre el entorno de ejecución Node.js y contenerizado de forma independiente en Docker, este componente actúa como la pasarela de procesamiento asíncrono y desacoplamiento entre el bróker de mensajería segura Eclipse Mosquitto (MQTTS) y la infraestructura de almacenamiento políglota conformada por InfluxDB y PostgreSQL.

---

### 1. Desacoplamiento Arquitectónico y Rol del Microservicio

En las etapas preliminares del diseño, se evaluó centralizar la ingesta de telemetría dentro de las rutas de la API del servidor web principal (Next.js). Sin embargo, el tráfico telemétrico continuo procedente de los microcontroladores en campo, emitido en lotes concurrentes de alta frecuencia y sujeto a ráfagas de reconexión tras cortes de enlace, amenazaba con saturar el grupo de conexiones a la base de datos relacional y degradar los tiempos de respuesta de la interfaz de usuario.

Para erradicar este riesgo operativo, la responsabilidad de ingesta se delegó íntegramente en el microservicio `Ingest`. Este proceso opera de forma autónoma las veinticuatro horas del día, manteniendo una suscripción permanente y de bajo consumo al árbol de tópicos `PristinoPlant/#`. Al desacoplar la ingesta, el núcleo web queda liberado de la carga de red por telemetría, asegurando que las contingencias en la transmisión de los nodos no afecten la disponibilidad de la plataforma administrativa ni el monitoreo de los cultivadores.

---

### 2. Persistencia Políglota y Ruteo de Tópicos

El microservicio implementa una estrategia de persistencia políglota orientada a maximizar la eficiencia en la consulta y el resguardo de la información. Los datos transaccionales, las relaciones taxonómicas de las plantas y los estados actuales de los nodos se gestionan en PostgreSQL mediante el mapeador relacional de objetos Prisma; paralelamente, la telemetría climática continua y las series temporales de alta resolución se delegan a un motor columnar de series temporales en InfluxDB versión 3.

###### Tabla Ap-L1.  *Mapeo y enrutamiento de tópicos MQTT en el servicio Ingest.*
| Tópico MQTT Suscrito | Procesador de Paquete | Destino de Persistencia | Medición / Entidad |
| :--- | :--- | :--- | :--- |
| `PristinoPlant/+/readings` | `processEnvironmentPacket` | InfluxDB | `environment_metrics` |
| `PristinoPlant/+/rain/event` | `processRainEventPacket` | InfluxDB | `rain_events` |
| `PristinoPlant/+/status` | `processZoneStateEvent` | InfluxDB / PostgreSQL | `system_events` / `device_status` |
| `PristinoPlant/+/rain/state` | `processZoneStateEvent` | InfluxDB | `system_events` |
| `PristinoPlant/+/audit` | `processAuditPacket` | InfluxDB | `system_events` |

*Nota.* Fuente: Mapeo de rutas `TOPIC_ROUTES` implementado en `services/ingest/src/index.ts`. Elaboración propia.

Cada paquete recibido es validado contra su esquema estructural antes de despacharse al repositorio correspondiente:
1. **Telemetría Ambiental (`/readings`):** Desempaqueta las matrices de muestras que contienen temperatura, humedad relativa, iluminancia solar e intensidad de precipitación, escribiéndolas como puntos vectoriales etiquetados por zona y origen.
2. **Eventos Pluviales Concluidos (`/rain/event`):** Asienta la duración consolidada en segundos y la intensidad porcentual acumulada de precipitaciones que han cesado formalmente en campo.
3. **Señales de Latido y Estado (`/status`):** Registra los estados de conexión (`online`, `offline` o desconexión abrupta `lwt_disconnect`), actualizando concurrentemente el estado del gemelo digital en PostgreSQL.
4. **Transiciones Binarias de Lluvia (`/rain/state`):** Registra en tiempo real los cambios discretos (`DRY` o `RAINING`) con el propósito de alimentar los motores deliberativos.
5. **Auditoría de Microcontroladores (`/audit`):** Captura métricas diagnósticas de bajo nivel emitidas por el firmware, tales como la memoria dinámica libre en el heap, latencia de bus y saturación de buffers.

---

### 3. Normalización Temporal, Época de MicroPython y Algoritmo de Backtracking

La integración entre microcontroladores embebidos y servicios en la nube demanda resolver discrepancias de sincronismo temporal. El firmware de MicroPython en las placas ESP32 establece su época de reloj interno a partir del 1 de enero de 2000, a diferencia de los entornos de servidor basados en el estándar POSIX y las bases de datos de series temporales, cuya época de referencia inicia el 1 de enero de 1970.

Para corregir esta divergencia de forma transparente, el servicio `Ingest` evalúa cada marca de tiempo entrante. Si el valor detectado es inferior a mil millones ($1 \times 10^9$), el sistema reconoce la marca como época MicroPython y le suma automáticamente un offset compensatorio constante de **946.684.800 segundos**, restituyendo la coherencia astronómica con la época Unix internacional.

Asimismo, ante escenarios de corte de energía donde el nodo reinicia y transmite un lote telemétrico antes de recibir la sincronización horaria del planificador, el servicio activa el algoritmo de reconstrucción retrospectiva (*Backtracking*). Bajo esta lógica, el procesador toma la marca de tiempo de recepción en el servidor como la estampa de la muestra más reciente del lote, deduciendo de forma inversa las marcas temporales de las muestras precedentes en función de los intervalos relativos registrados por el microcontrolador. Este mecanismo impide la pérdida o traslape de datos durante transiciones de red.

---

### 4. Formato de Salida y Trazabilidad en Bitácora

Con el propósito de mantener una alta observabilidad del flujo de ingesta sin degradar el rendimiento con escrituras extensas en disco, el servicio incorpora un formateador semántico ultra-compacto (`formatPointSummary`). La función traduce la sintaxis en protocolo de línea de InfluxDB a registros legibles de una sola línea en terminal, categorizados mediante loggers semánticos con la hora local de Venezuela:

```
[ INGEST ] [ Actuator_Controller ] [ EXTERIOR ] [ 10:00:00 pm ] -> temp:27.8, hum:75.7, lux:0
[ INGEST ] [ Weather_Station ] [ ZONA_A ] [ 10:00:00 pm ] -> temp:28.1, hum:74.2
[ INGEST ] [ Actuator_Controller ] [ 06:15:00 pm ] -> Device_Status: offline
[ INGEST ] [ Weather_Station ] [ EXTERIOR ] [ 05:20:00 pm ] -> Rain_State: RAINING
[ INGEST ] [ Weather_Station ] [ EXTERIOR ] [ 06:21:00 pm ] -> 3540s | 85%
```

Esta estructura de bitácora certifica en tiempo real que cada medición es atribuida a su zona física de origen, facilitando la depuración remota de la red de sensores y garantizando que la base de datos de telemetría conserve registros depurados y trazables para la posterior formulación de los descriptores ecofisiológicos del orquideario.
