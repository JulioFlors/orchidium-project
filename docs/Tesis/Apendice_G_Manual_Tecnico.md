# Apéndices

## Apéndice G: Manual Técnico de Ingeniería, Arquitectura y Firmware

El presente manual técnico proporciona las especificaciones completas de ingeniería, la arquitectura de microservicios backend contenerizados, el dimensionamiento electromecánico del hardware, el diseño del firmware embebido en MicroPython y las directrices de manufactura y mantenimiento de la plataforma PristinoPlant. Este documento está dirigido a ingenieros de soporte, desarrolladores y personal de mantenimiento.

---

### 1. Requisitos de Infraestructura y Entorno de Ingeniería

Para reproducir el entorno operativo, desplegar el monorepositorio o ejecutar labores de soporte, la estación de trabajo y el servidor deben disponer de las siguientes herramientas:

* **Node.js y Gestor de Paquetes:** Versión 22.x LTS o superior, administrada mediante Corepack para vincular rígidamente la versión de `pnpm` utilizada en el monorepositorio Turborepo.
* **Entorno Python y Herramientas Embebidas:** Python 3.10 o superior, acompañado de los paquetes globales `esptool` (para operaciones en memoria flash) y `mpremote` (para interacción serial con MicroPython).
* **Firmware Oficial de MicroPython:** Imagen binaria compilada para arquitectura ESP32 SoC (versión estable v1.26.0 o posterior).
* **Motor de Contenedores:** Docker Engine y Docker Compose para el aislamiento y despliegue de los servicios backend y las bases de datos políglotas.
* **Diagnóstico de Red:** Cliente MQTT Explorer para la auditoría y validación en tiempo real de los tópicos telemétricos bajo canales MQTTS (puerto 8883 con TLS 1.3).

---

### 2. Despliegue de Servicios Backend Contenerizados (Docker Compose)

La infraestructura de servidor opera en un Servidor Privado Virtual (VPS) bajo Ubuntu Server 22.04 LTS, gobernada mediante un archivo maestro `docker-compose.yml` que encapsula la base de datos relacional, el motor de series de tiempo, el bróker telemétrico y los microservicios auxiliares.

* **Bróker MQTTS (Eclipse Mosquitto):** Expone el puerto seguro 8883 con cifrado TLS obligatorio, autenticación de credenciales por usuario y listas de control de acceso (ACL) que delimitan los tópicos autorizados para cada nodo físico y microservicio.
* **Persistencia Políglota:**
  * **PostgreSQL:** Persiste las entidades del dominio botánico (`PlantType`, `PlantGenus`, `PlantSpecies`, `Plant`), las recetas y programas de laboratorio, los usuarios y la bitácora inmutable de operaciones (`TaskLog`).
  * **InfluxDB:** Almacena en un bucket de retención ilimitada las series temporales climáticas de alta resolución ($T, HR, Lux$) transmitidas minuto a minuto por las estaciones meteorológicas.

#### Tabla Ap-G1. *Matriz de variables de entorno esenciales de producción*

| Variable de Entorno | Servicio Destino | Propósito y Restricción Técnica |
| :--- | :--- | :--- |
| `DATABASE_URL` | App Web / Scheduler | Cadena de conexión TCP relacional hacia PostgreSQL con pooling de conexiones. |
| `INFLUXDB_URL` | Ingest / Telemetría | Dirección del socket HTTP del motor InfluxDB (ej. `http://influxdb:8086`). |
| `INFLUXDB_TOKEN` | Ingest / Telemetría | Token criptográfico de acceso con privilegios de lectura/escritura en el bucket. |
| `INFLUXDB_ORG` | Ingest / Telemetría | Identificador de organización dentro de la instancia de InfluxDB. |
| `INFLUXDB_BUCKET` | Ingest / Telemetría | Contenedor lógico de persistencia para las series temporales del invernadero. |
| `MQTT_BROKER_URL` | Ingest / Scheduler | URI del bróker seguro en producción (`mqtts://vps.sisparrow.com:8883`). |
| `MQTT_USERNAME` | Todos los servicios | Usuario autenticado con permisos en tópicos `pristinoplant/*`. |
| `MQTT_PASSWORD` | Todos los servicios | Contraseña robusta de acceso telemétrico al bróker Mosquitto. |
| `BETTER_AUTH_SECRET` | App Web Next.js | Clave secreta para el firmado criptográfico de sesiones y tokens de usuario. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Tienda / E-commerce | URL pública del bucket Cloudflare R2 para renderizado de imágenes botánicas. |

---

### 3. Arquitectura de Microservicios Backend

Para garantizar alta resiliencia y desacoplar la ingesta de telemetría de las interfaces de usuario web, la lógica de servidor se distribuye en dos microservicios autónomos en Node.js y TypeScript:

```
+-----------------------------------------------------------------------------------+
|                              ARQUITECTURA BACKEND DOCKER                          |
|                                                                                   |
|  [ESP32 Actuador] ---\                                                            |
|  [ESP32 EMA Ext]   ----+----> [Bróker MQTTS: Mosquitto]                            |
|  [ESP32 EMA Int]   ---/          |                 |                              |
|                                  v                 v                              |
|                         [Microservicio]     [Microservicio]                       |
|                             INGEST             SCHEDULER                          |
|                            (Node.js)           (Node.js)                          |
|                                |                   |                              |
|                   +------------+----+              +------------+                 |
|                   |                 |              |            |                 |
|                   v                 v              v            v                 |
|              [InfluxDB]       [PostgreSQL]    [PostgreSQL]  [Mosquitto]           |
|            (Series Tiempo)      (Sync)         (TaskLog)     (Comandos)           |
+-----------------------------------------------------------------------------------+
```

#### 3.1 Microservicio de Ingesta Telemétrica (`services/ingest`)
Actúa como la pasarela de procesamiento asíncrono entre el bróker MQTTS y las bases de datos:
1. **Desacoplamiento del Núcleo Web:** Mantiene una suscripción continua al árbol `pristinoplant/telemetria/#`. Evita que las ráfagas concurrentes de paquetes saturen las conexiones del servidor web Next.js.
2. **Normalización y Filtrado de Datos:** Valida la estructura JSON de cada paquete, descarta lecturas anómalas fuera de rango físico producidas por transitorios eléctricos y añade marcas temporales normalizadas.
3. **Escritura Dual Políglota:** Inserta los puntos climáticos escalares ($T, HR, Lux$) en InfluxDB y actualiza la marca de último reporte del nodo en PostgreSQL para alimentar los indicadores de estado en tiempo real.

#### 3.2 Microservicio Planificador y Orquestador (`services/scheduler`)
Opera de forma desatendida 24/7 coordinando las operaciones hidráulicas y la deliberación algorítmica:
1. **Bucle Croner (`croner`):** Evalúa expresiones temporales periódicas para disparar rutinas de riego configuradas.
2. **Motor de Inferencia Pluvial (`rain-manager.ts`):** Mantiene una cola deslizante de 4 lotes de 10 minutos ($B_0$ a $B_3$) para calcular derivadas de temperatura e incremento de humedad relativa clasificadas por ramas de radiación solar, deduciendo en tiempo real el inicio y cese de precipitación.
3. **Motor de Inferencia Hídrica (`water-intelligence.ts`):** Aplica la matriz de guardas y vetos: cancela riegos si hay lluvia activa, lluvia en las últimas 4 horas, humedad interior $\ge 85\%$ o si ya se regó en la jornada previa (alternancia interdiaria).
4. **Secuenciador de Comandos (`CommandSequencer`):** Despacha órdenes con QoS 1 hacia el nodo actuador, supervisa el tiempo de espera del acuse de recibo (`ACK`) y asienta el resultado inmutable en la tabla `TaskLog`.

---

### 4. Especificación Técnica de Hardware y Conexiones Electromecánicas

La infraestructura física del sistema articula el sensado microclimático, la conmutación eléctrica de fuerza y la impulsión presurizada mediante componentes seleccionados por su resistencia al entorno tropical.

#### Tabla Ap-G2. *Catálogo de componentes de hardware del sistema PristinoPlant*

| Ítem | Componente / Modelo | Cantidad | Tensión / Consumo | Función en el Sistema | Interfaz / Notas Técnicas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **ESP32-WROOM-32** (SoC dual-core 240 MHz) | 2 unidades | 3.3V / 5V DC (240 mA) | Procesamiento embebido, telemetría y control | Unidades en Tablero de Potencia/EMA Ext. y EMA Int. Wi-Fi 802.11 b/g/n, MQTTS TLS (8883). |
| **2** | **Placa Shield de Expansión ESP32** | 2 unidades | 5V DC pasivo | Borneras de conexión y fijación mecánica rígida | Terminales de tornillo para suprimir falsos contactos en buses de datos. |
| **3** | **Bomba de Agua Periférica (1 HP, 0.75 kW)** | 1 unidad | 110VAC / 11A nominal | Impulsión presurizada de la red matriz de riego | Conexión de 1 pulgada; 2.5 a 3.2 bar (50 L/min). Conmutada vía contactor industrial de 30A. |
| **4** | **Contactor Industrial en Riel DIN** | 1 unidad | Bobina 110VAC / Contactos 30A | Conmutación de fuerza de la bomba de agua | Manejo de corriente inductiva de arranque; desacopla y protege a los relés de 10A de fatiga térmica. |
| **5** | **Controlador de Presión (*Press Control*)** | 1 unidad | 110VAC / 10A | Automatización de flujo y protección contra marcha en seco | Manómetro integrado y sensor de flujo; detiene la bomba ante ausencia de caudal en succión. |
| **6** | **Electroválvulas de Solenoide Maestras** | 2 unidades | 110VAC / 15W | Conmutación de entradas matrices de agua y agroquímicos | Rosca de 1 pulgada, normalmente cerradas (NC); conmutadas vía relés optoacoplados. |
| **7** | **Electroválvulas de Solenoide de Sector** | 4 unidades | 24VAC / 8W | Apertura y cierre de las 4 líneas de riego independientes | Rosca de 3/4 pulgada, NC; distribuyen a nebulizadores, aspersores y manguera de piso. |
| **8** | **Módulos de Relés Optoacoplados (4 Canales)** | 2 módulos (8 relés) | 5VDC lógica / 250VAC 10A contactos | Aislamiento galvánico y disparo de bobinas de fuerza | Disparo por nivel bajo (Active-Low); 1 relé para contactor de bomba y 6 para electroválvulas. |
| **9** | **Fusileras Industriales de Protección (15A)** | 2 unidades | 110VAC / 15A cartucho | Protección contra sobrecorrientes en acometida | Instaladas individualmente en línea de fase positiva y en línea de neutro. |
| **10** | **Interruptor Switch Industrial de Maniobra** | 1 unidad | 110VAC / 20A | Seccionamiento y corte general manual del tablero | Montaje en panel frontal para desenergización inmediata de todo el ecosistema. |
| **11** | **Transformador Electromagnético Reductor** | 1 unidad | Entrada 110VAC / Salida 24VAC (50VA) | Alimentación de maniobra para electroválvulas de 24V | Suministra tensión alterna aislada para la operación de las 4 válvulas de distribución. |
| **12** | **Filtro de Disco de 1 Pulgada** | 1 unidad | Operación a 2.5 bar / 120 mesh | Retención de sólidos y prevención de obturación | Instalado en descarga de bomba para proteger nebulizadores y aspersores. |
| **13** | **Sensor Microclimático DHT22 (AM2302)** | 2 unidades | 3.3V - 5V DC (< 1.5 mA) | Muestreo de temperatura y humedad relativa | Rango -40 a 80 °C, 0 a 100% HR; bus digital unifilar 1-Wire con pull-up de 4.7 kΩ. |
| **14** | **Sensor de Iluminancia Digital BH1750** | 2 unidades | 3.3V - 5V DC (0.12 mA) | Medición de radiación lumínica solar | Bus I2C; rango ampliado dinámico de 1 a 121.557 lux mediante ajuste de tiempo de integración. |
| **15** | **Transistor MOSFET de Potencia** | 1 unidad | 3.3V Gate / 5V Drain (Canal N) | Corte de alimentación para autorrecuperación de sensores | Conmutado por GPIO 5 para ciclo de desenergización (*power-cycle*) de 200 ms. |
| **16** | **Tomacorriente Interno y Adaptador 5V 2A** | 1 unidad | Entrada 110VAC / Salida 5VDC regulada | Fuente de alimentación lógica del nodo ESP32 | Provee energía limpia desacoplada de transitorios inductivos de conmutación. |
| **17** | **Borneras de Conexión de Paso en Riel DIN** | 1 juego (12 bornes) | 600V / 30A capacidad | Distribución ordenada de fases, neutros y señales | Sujeción mecánica rígida en riel DIN dentro de gabinete estanco IP65. |

#### Tabla Ap-G3. *Mapa de distribución de pines GPIO en microcontroladores ESP32*

| Pin GPIO | Nodo / Dispositivo | Función / Periférico Conectado | Modo de Operación | Justificación Técnica |
| :--- | :--- | :--- | :--- | :--- |
| **GPIO 5** | Tablero / Nodo Actuador | Compuerta Gate de MOSFET (*Power-Cycle*) | Salida Digital (Output) | Conmuta corte de alimentación de 200 ms a sensores ante fallo de bus. |
| **GPIO 18** | Tablero / Nodo Actuador | Bus I2C - Señal SCL (Sensor BH1750) | Salida de Reloj I2C | Línea de sincronismo temporal con resistencia de pull-up a 3.3V. |
| **GPIO 19** | Tablero / Nodo Actuador | Bus I2C - Señal SDA (Sensor BH1750) | Bidireccional I2C | Canal de transferencia de datos de iluminancia. |
| **GPIO 4** | Tablero / Nodo Actuador | Bus 1-Wire - Sensor DHT22 (EMA Ext.) | Entrada/Salida Digital | Lectura higrotérmica digital de intemperie con pull-up de 4.7 kΩ. |
| **GPIO 13** | Tablero / Nodo Actuador | Relé 1: Contactor Bobina 110VAC (Bomba 1HP) | Salida Digital (Active-Low) | Conmuta el contactor industrial para energizar la impulsión hidráulica. |
| **GPIO 12** | Tablero / Nodo Actuador | Relé 2: Electroválvula Maestra Agua (110VAC) | Salida Digital (Active-Low) | Abre la admisión de la red de acueducto matriz. |
| **GPIO 14** | Tablero / Nodo Actuador | Relé 3: Electroválvula Maestra Químicos (110VAC)| Salida Digital (Active-Low) | Conmuta la succión desde el tanque presurizado de agroquímicos. |
| **GPIO 27** | Tablero / Nodo Actuador | Relé 4: Línea 1 - Nebulización (24VAC) | Salida Digital (Active-Low) | Apertura de línea de nebulizadores finos (*foggers*). |
| **GPIO 26** | Tablero / Nodo Actuador | Relé 5: Línea 2 - Aspersión Principal (24VAC) | Salida Digital (Active-Low) | Apertura de microaspersores rotativos para riego de mesas. |
| **GPIO 25** | Tablero / Nodo Actuador | Relé 6: Línea 3 - Humectación de Piso (24VAC) | Salida Digital (Active-Low) | Apertura de manguera perforada de suelo para enfriamiento pasivo. |
| **GPIO 33** | Tablero / Nodo Actuador | Relé 7: Línea 4 - Dosificación Sector (24VAC) | Salida Digital (Active-Low) | Apertura de línea fitosanitaria aislada bajo confirmación modal. |
| **GPIO 21** | EMA Interior (ZONA_A) | Bus I2C - Señal SDA (BH1750 Interior) | Bidireccional I2C | Canal de adquisición lumínica bajo malla sombra. |
| **GPIO 22** | EMA Interior (ZONA_A) | Bus I2C - Señal SCL (BH1750 Interior) | Salida de Reloj I2C | Reloj I2C en garita meteorológica interior. |
| **GPIO 23** | EMA Interior (ZONA_A) | Bus 1-Wire - Sensor DHT22 Interior | Entrada/Salida Digital | Adquisición de temperatura y humedad en mesas de cultivo. |
| **GPIO 34** | EMA Interior (ZONA_A) | Divisor de tensión para monitoreo de batería | Entrada Analógica (ADC1) | Lectura de voltaje de la celda Li-ion 18650 (3.0V a 4.2V). |

---

### 5. Arquitectura de Firmware Embebido en MicroPython

El software embebido fue desarrollado en MicroPython v1.26.0 bajo dos paradigmas adaptados a las restricciones de cada nodo:

#### 5.1 Firmware del Nodo Actuador y EMA Exterior
Opera de forma ininterrumpida con alimentación de red:
1. **Asincronía con `uasyncio`:** Ejecuta un bucle cooperativo no bloqueante que gestiona la escucha MQTT, el envío de telemetría y los temporizadores sin incurrir en pausas ciegas (`time.sleep`).
2. **Temporizador Fail-Safe de Hardware:** Al recibir un comando de riego, el firmware programa un temporizador local por interrupción de hardware. Al expirar la duración ordenada, el microcontrolador desenergiza los relés de forma autónoma sin depender del servidor ni de la red Wi-Fi, eliminando cualquier riesgo de sobre-riego por desconexión.
3. **Mecanismo de Autorrecuperación Física (*Power-Cycle*):** Si se detectan 3 fallas de lectura consecutivas en los sensores, el microcontrolador conmuta el pin GPIO 5 por 200 ms, desenergizando la línea de alimentación de los sensores mediante el MOSFET de potencia para forzar un reinicio eléctrico en frío del bus sin reiniciar el SoC.
4. **Resiliencia de Memoria RAM:** Se suprimió el módulo flash `NVSManager` del código embebido, estabilizando la memoria dinámica libre (`gc.mem_free()`) por encima de 52 KB estables tras meses de operación continua.

#### 5.2 Firmware de la Estación Meteorológica Interior (EMA Interior)
Diseñado para operación móvil e inalámbrica en mesas de cultivo a batería:
1. **Gestión de Consumo Ultra-Bajo (*Deep Sleep*):** Alimentada por una celda de iones de litio 18650 (2500 mAh), la estación permanece en reposo profundo consumiendo menos de $15\,\mu\text{A}$.
2. **Ciclo de Ráfaga Telemétrica:** Cada 10 minutos, el temporizador interno del ESP32 despierta el microcontrolador, enciende los sensores, adquiere $T, HR$ y $Lux$, establece enlace Wi-Fi con IP estática, despacha la trama MQTTS cifrada en menos de 2.5 segundos y reingresa inmediatamente a *Deep Sleep*, alcanzando una autonomía calculada superior a 60 días de operación continua.

---

### 6. Modelado y Fabricación 3D de la Garita Meteorológica (EMA Interior)

Para proteger la electrónica de la EMA Interior contra la radiación cenital y las salpicaduras de riego sin obstaculizar la ventilación natural, se diseñó una garita meteorológica modular tipo Stevenson:

* **Material de Fabricación:** Se seleccionó copoliéster PETG (tereftalato de polietileno glicol) en color blanco reflectante. Este termoplástico ofrece alta resistencia mecánica, estabilidad dimensional ante temperaturas superiores a $70^\circ\text{C}$ e inmunidad a la degradación por radiación ultravioleta (UV), evitando el alabeo y decoloración que sufre el PLA en el clima de Ciudad Guayana.
* **Geometría y Ventilación Louvered:** La estructura incorpora lamas deflectoras inclinadas a $45^\circ$ con separación de $8\text{ mm}$, garantizando la circulación libre de corrientes convectivas y aislando los transductores de lecturas térmicas falsas por radiación directa.
* **Estructura Desmontable:** Ensamblada mediante 4 varillas roscadas de acero inoxidable M4 que comprimen los módulos apilables (base de soporte, compartimiento estanco para ESP32 y batería 18650, y cámara ventilada para sensores DHT22 y BH1750).

---

### 7. Pautas de Mantenimiento Preventivo

1. **Inspección de Filtro de Disco:** Purgar y desenroscar el cartucho de disco de 120 mesh cada 30 días para remover sedimentos minerales acumulados en la red de agua.
2. **Revisión de Contactos Eléctricos:** Verificar el apriete de las borneras en riel DIN y la ausencia de sulfatación en las conexiones de 24VAC cada 60 días.
3. **Limpieza de Cúpulas Ópticas:** Limpiar suavemente con paño de microfibra humedecido con agua destilada la cúpula translúcida del sensor BH1750 para prevenir atenuación artificial de la iluminancia por polvo ambiental.
4. **Calibración de Sensores DHT22:** Contrastar semestralmente las lecturas higrotérmicas contra un psicrómetro patrón certificado.