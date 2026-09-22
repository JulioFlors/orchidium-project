# Apéndices

## Apéndice G: Manual Técnico del Sistema PristinoPlant

El presente manual técnico proporciona las especificaciones de ingeniería, procedimientos de despliegue, configuración de firmware y pautas de mantenimiento requeridas para la operación, soporte y reproducibilidad de la plataforma PristinoPlant. Está dirigido a administradores de infraestructura, desarrolladores de software e ingenieros de mantenimiento de hardware.

---

### 1. Requisitos del Entorno de Desarrollo e Infraestructura

Para configurar el entorno de trabajo y realizar tareas de mantenimiento o despliegue, la estación de ingeniería debe contar con las siguientes herramientas instaladas:

* **Node.js y Gestor de Paquetes:** Versión 22.x LTS o superior, administrada mediante Corepack para vincular rígidamente la versión de `pnpm` utilizada en el monorepositorio Turborepo.
* **Entorno Python y Herramientas Embebidas:** Python 3.10 o superior, acompañado de los paquetes globales `esptool` (para operaciones en memoria flash) y `mpremote` (para interacción serial con MicroPython).
* **Firmware Oficial de MicroPython:** Imagen binaria compilada para arquitectura ESP32 SoC (versión estable v1.26.0 o posterior).
* **Motor de Contenedores:** Docker Engine y Docker Compose para el aislamiento y despliegue de los servicios de backend y almacenamiento persistente.
* **Herramientas de Diagnóstico de Red:** Cliente MQTT Explorer para la auditoría y validación en tiempo real de los tópicos telemétricos bajo canales TLS seguros.

---

### 2. Despliegue de Servicios de Servidor (VPS / Docker)

La arquitectura de backend se despliega en un Servidor Privado Virtual (VPS) bajo sistema operativo Linux Ubuntu Server 22.04 LTS, orquestada mediante un archivo maestro `docker-compose.yml` que encapsula la base de datos relacional, el almacenamiento de series temporales, el bróker telemétrico y los microservicios auxiliares.

**Configuración del Bróker MQTTS (Eclipse Mosquitto).** El servicio de mensajería opera en el contenedor `mosquitto`, exponiendo el puerto seguro 8883 con cifrado TLS obligatorio. Requiere la vinculación de certificados SSL de dominio (CA, certificado de servidor y clave privada) y la configuración de listas de control de acceso (ACL) para autenticar unívocamente al nodo actuador, a las estaciones meteorológicas y a los microservicios de ingesta y planificación.

**Persistencia Políglota y Microservicios.** La base de datos relacional PostgreSQL opera en el contenedor `postgres`, persistiendo las migraciones estructuradas por Prisma ORM relativas a especies, variantes comerciales, ejemplares individuales (`SeedPlant`) y bitácoras de auditoría. Paralelamente, el motor InfluxDB almacena en un *bucket* con retención ilimitada las series temporales climáticas ($T, HR, Lux, VPD$) consumidas por el microservicio `services/ingest`. La orquestación temporal de riego y los motores de inferencia se ejecutan en el microservicio `Scheduler` desarrollado en Node.js.

La Tabla Ap-G1 consolida los parámetros de entorno esenciales requeridos para la inicialización y vinculación de los contenedores en el servidor de producción.

#### Tabla Ap-G1. *Matriz de variables de entorno y parámetros de infraestructura de producción*

| Variable de Entorno | Servicio Destino | Propósito y Restricción Técnica |
| :--- | :--- | :--- |
| `DATABASE_URL` | App Web / Scheduler | Cadena de conexión TCP relacional hacia PostgreSQL con pooling de conexiones. |
| `INFLUXDB_URL` | Ingest / Telemetría | Dirección del socket HTTP del motor InfluxDB (ej. `http://influxdb:8086`). |
| `INFLUXDB_TOKEN` | Ingest / Telemetría | Token criptográfico de acceso con privilegios de lectura y escritura en el bucket. |
| `INFLUXDB_ORG` | Ingest / Telemetría | Identificador de organización dentro de la instancia de InfluxDB. |
| `INFLUXDB_BUCKET` | Ingest / Telemetría | Contenedor lógico de persistencia para las series temporales del invernadero. |
| `MQTT_BROKER_URL` | Ingest / Scheduler | URI del bróker seguro en producción (`mqtts://vps.sisparrow.com:8883`). |
| `MQTT_USERNAME` | Todos los servicios | Usuario autenticado con permisos de publicación y suscripción en tópicos `/orchidium/*`. |
| `MQTT_PASSWORD` | Todos los servicios | Contraseña robusta de acceso telemétrico al bróker Mosquitto. |
| `BETTER_AUTH_SECRET` | App Web Next.js | Clave secreta para el firmado criptográfico de sesiones y tokens de usuario. |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Tienda / E-commerce | URL pública del bucket Cloudflare R2 para el renderizado optimizado de imágenes botánicas. |

*Nota.* Fuente: Elaboración propia a partir de los archivos de configuración `.env.template` y `docker-compose.yml`.

---

### 3. Especificación Técnica de Hardware y Conexiones Electromecánicas

La infraestructura física del sistema PristinoPlant articula el sensado microclimático hiperlocal, la conmutación eléctrica de fuerza y la impulsión hidráulica presurizada mediante componentes seleccionados por su robustez ante la intemperie tropical y alta humedad.

**Catálogo y Especificación de Componentes Físicos.** La Tabla Ap-G2 detalla los módulos de procesamiento, potencia, sensado y protección eléctrica integrados en el orquideario, documentando sus especificaciones nominales, tensiones de operación y funciones de ingeniería.

#### Tabla Ap-G2. *Especificación técnica y catálogo de componentes de hardware del sistema PristinoPlant*

| Ítem | Componente / Modelo | Cantidad | Tensión / Consumo | Función en el Sistema | Interfaz / Notas Técnicas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **ESP32-WROOM-32** (SoC dual-core 240 MHz) | 2 unidades | 3.3V / 5V DC (240 mA) | Procesamiento embebido, telemetría y control | Unidades en Tablero de Fuerza/EMA Ext. y EMA Int. Wi-Fi 802.11 b/g/n, MQTTS TLS (8883). |
| **2** | **Placa Shield de Expansión ESP32** | 2 unidades | 5V DC pasivo | Borneras de conexión y fijación mecánica rígida | Terminales de tornillo para suprimir falsos contactos en buses y cableado hacia relés. |
| **3** | **Bomba de Agua Periférica (1 HP, 0.75 kW)** | 1 unidad | 110VAC / 11A nominal | Impulsión presurizada de la red matriz de riego | Conexión de 1 pulgada; 2.5 a 3.2 bar (50 L/min). Conmutada vía contactor industrial de 30A. |
| **4** | **Contactor Industrial en Riel DIN** | 1 unidad | Bobina 110VAC / Contactos 30A | Conmutación de fuerza de la bomba de agua | Manejo de corriente inductiva de arranque; desacopla y protege a los relés de 10A de fatiga térmica. |
| **5** | **Controlador de Presión (*Press Control*)** | 1 unidad | 110VAC / 10A | Automatización de flujo y protección contra marcha en seco | Manómetro integrado y sensor de flujo; detiene la bomba ante ausencia de caudal en succión. |
| **6** | **Electroválvulas de Solenoide Maestras** | 2 unidades | 110VAC / 15W | Conmutación de entradas matrices de agua y agroquímicos | Rosca de 1 pulgada, normalmente cerradas (NC); conmutadas vía relés optoacoplados. |
| **7** | **Electroválvulas de Solenoide de Sector** | 4 unidades | 24VAC / 8W | Apertura y cierre de las 4 líneas de riego independientes | Rosca de 3/4 pulgada, NC; distribuyen a nebulizadores, microaspersores y manguera de piso. |
| **8** | **Módulos de Relés Optoacoplados (4 Canales)** | 2 módulos (8 relés) | 5VDC lógica / 250VAC 10A contactos | Aislamiento galvánico y disparo de bobinas de fuerza | Disparo por nivel bajo (Active-Low); 1 relé para contactor de bomba y 6 para electroválvulas. |
| **9** | **Fusileras Industriales de Protección (15A)** | 2 unidades | 110VAC / 15A cartucho | Protección contra sobrecorrientes en acometida | Instaladas individualmente en línea de fase positiva y en línea de neutro. |
| **10** | **Interruptor Switch Industrial de Maniobra** | 1 unidad | 110VAC / 20A | Seccionamiento y corte general manual del tablero | Montaje en panel frontal para desenergización inmediata de todo el ecosistema. |
| **11** | **Transformador Electromagnético Reductor** | 1 unidad | Entrada 110VAC / Salida 24VAC (50VA) | Alimentación de maniobra para electroválvulas de 24V | Suministra tensión alterna aislada para la operación de las 4 válvulas de distribución. |
| **12** | **Filtro de Disco de 1 Pulgada** | 1 unidad (+1 rec.) | Operación a 2.5 bar / 120 mesh | Retención de sólidos y prevención de obturación | Instalado en descarga de bomba; se recomienda unidad adicional en succión. |
| **13** | **Sensor Microclimático DHT22 (AM2302)** | 2 unidades | 3.3V - 5V DC (< 1.5 mA) | Muestreo de temperatura y humedad relativa | Rango -40 a 80 °C, 0 a 100% HR; bus digital unifilar 1-Wire con pull-up de 4.7 kΩ. |
| **14** | **Sensor de Iluminancia Digital BH1750** | 2 unidades | 3.3V - 5V DC (0.12 mA) | Medición de radiación lumínica y luminosidad foliar | Bus I2C; rango ampliado dinámico de 1 a 121.557 lux mediante ajuste de MTreg. |
| **15** | **Transistor MOSFET de Potencia** | 1 unidad | 3.3V Gate / 5V Drain (Canal N) | Corte de alimentación para autorrecuperación de sensores | Conmutado por GPIO 5 para ciclo de desenergización (*power cycle*) de 200 ms. |
| **16** | **Tomacorriente Interno y Adaptador 5V 2A** | 1 unidad | Entrada 110VAC / Salida 5VDC regulada | Fuente de alimentación lógica del nodo ESP32 | Provee energía limpia desacoplada de transitorios inductivos de conmutación. |
| **17** | **Borneras de Conexión de Paso en Riel DIN** | 1 juego (12 bornes) | 600V / 30A capacidad | Distribución ordenada de fases, neutros y señales | Sujeción mecánica rígida en riel DIN metálico dentro de gabinete estanco IP65. |

*Nota.* Fuente: Elaboración propia a partir del levantamiento electromecánico y de instrumentación del orquideario.

**Mapeo de Pines GPIO y Conexiones Electromecánicas.** La Tabla Ap-G3 documenta la asignación física de pines en los microcontroladores ESP32 del ecosistema físico, distinguiendo entre el nodo actuador y las estaciones sensoras.

#### Tabla Ap-G3. *Mapa de distribución de pines GPIO y asignación de periféricos en nodos ESP32*

| Dispositivo / Nodo | Pin GPIO | Modo / Tipo | Periférico Conectado | Función en el Sistema |
| :--- | :--- | :--- | :--- | :--- |
| **Nodo Actuador (Tablero)** | `GPIO 23` | Salida Digital | Módulo Relé 1 / Bobina Contactor 30A | Conmutación de potencia de la bomba de agua de 1 HP (110VAC). |
| **Nodo Actuador (Tablero)** | `GPIO 22` | Salida Digital | Módulo Relé 2 / Válvula Solenoide 1 | Conmutación de 24VAC para Línea 1 (Nebulización / Foggers). |
| **Nodo Actuador (Tablero)** | `GPIO 21` | Salida Digital | Módulo Relé 3 / Válvula Solenoide 2 | Conmutación de 24VAC para Línea 2 (Aspersión principal mesas). |
| **Nodo Actuador (Tablero)** | `GPIO 19` | Salida Digital | Módulo Relé 4 / Válvula Solenoide 3 | Conmutación de 24VAC para Línea 3 (Humectación de piso / Manguera perforada). |
| **Nodo Actuador (Tablero)** | `GPIO 18` | Salida Digital | Módulo Relé 5 / Válvula Solenoide 4 | Conmutación de 24VAC para Línea 4 (Dosificación agronómica). |
| **Nodo Actuador (Tablero)** | `GPIO 16` | Salida Digital | Módulo Relé 6 / Válvula Solenoide Matriz A | Conmutación de 110VAC para entrada de agua limpia. |
| **Nodo Actuador (Tablero)** | `GPIO 17` | Salida Digital | Módulo Relé 7 / Válvula Solenoide Matriz B | Conmutación de 110VAC para entrada de agroquímicos. |
| **Nodo Sensor (EMA Exterior)** | `GPIO 4` | Entrada/Salida Digital | Sensor DHT22 (AM2302) | Muestreo de temperatura y humedad a la intemperie (1-Wire). |
| **Nodo Sensor (EMA Exterior)** | `GPIO 21` | Bidireccional Open-Drain | Sensor BH1750 (Línea SDA) | Comunicación I2C para iluminancia solar exterior. |
| **Nodo Sensor (EMA Exterior)** | `GPIO 22` | Salida Clock | Sensor BH1750 (Línea SCL) | Reloj I2C para iluminancia solar exterior. |
| **Nodo Sensor (EMA Exterior)** | `GPIO 5` | Salida Digital | Compuerta Transistor MOSFET | Conmutación de corte de energía (200 ms *power cycle*) en sensores. |
| **Nodo Sensor (EMA Interior)** | `GPIO 15` | Entrada/Salida Digital | Sensor DHT22 (AM2302) | Muestreo de microclima bajo persiana Stevenson (1-Wire). |
| **Nodo Sensor (EMA Interior)** | `GPIO 21 / 22` | Bidireccional / Salida | Sensor BH1750 (I2C) | Medición de iluminancia solar difusa bajo malla sombra. |

*Nota.* Fuente: Elaboración propia a partir de los esquemas de hardware y archivos de inicialización de pines del firmware.

---

### 4. Aprovisionamiento y Mantenimiento del Firmware Embebido

El aprovisionamiento de los microcontroladores ESP32 en las estaciones meteorológicas (EMA) y en el nodo actuador de riego se rige por un procedimiento riguroso para asegurar la estabilidad térmica y la gestión de memoria RAM.

**Flasheo del Sistema Base MicroPython.** Antes de cargar el código del proyecto, la memoria Flash del SoC debe borrarse íntegramente para erradicar sectores defectuosos o fragmentación previa, ejecutando secuencialmente en la terminal de desarrollo:

```bash
esptool erase-flash
esptool write-flash 0x1000 firmware/ESP32_2025-08-09_v1.26.0.bin
```

**Tooling Automatizado y Despliegue con `mprun`.** La gestión de dependencias y la transferencia de código hacia los nodos embebidos se automatizó mediante el comando personalizado en PowerShell `mprun -b -l`. Este script analiza el manifiesto local del nodo (`manifest.json`), compila los módulos de código fuente `.py` a bytecode binario `.mpy` mediante la utilidad `mpy-cross` (liberando más de 12 KB de RAM dinámica durante la compilación en caliente en el ESP32), purga la carpeta remota `:lib` y sincroniza las bibliotecas estrictamente necesarias.

---

### 5. Protocolo de Resiliencia y Bibliotecas Especializadas de Firmware

Para garantizar una operación ininterrumpida frente a redes inalámbricas inestables y restricciones de memoria dinámica (*heap*), el firmware de PristinoPlant descartó los paquetes comunitarios convencionales e incorporó componentes altamente optimizados.

**Driver MQTT Endurecido (`simple2.py`).** Modificación profunda sobre `umqtt.simple` orientada a la tolerancia a fallos en enlaces TLS sobre ESP32:
* *Cierre Atómico de Descriptores:* Si la negociación SSL (`wrap_socket`) aborta por agotamiento temporal de RAM, el driver ejecuta un cierre forzoso del socket TCP subyacente, impidiendo la acumulación de descriptores huérfanos que derivan en el error fatal `OSError: [Errno 16] EBUSY`.
* *Timeouts Asíncronos Estrictos:* El socket se aprovisiona con un temporizador perentorio previo al enlace seguro, evitando bloqueos indefinidos si el bróker deja de responder.
* *Escritura y Lectura No Bloqueante:* Utiliza `uselect.poll` en `_send_with_timeout` para verificar la disponibilidad del búfer de salida antes de transmitir tramas telemétricas.
* *Escudo de Concurrencia:* Las operaciones de comunicación se sincronizan bajo un cerrojo global `asyncio.Lock`, anulando la corrupción de paquetes ante la llegada simultánea de órdenes mientras se emite telemetría.

La Tabla Ap-G4 sintetiza la codificación semántica de excepciones implementada en `simple2.py` para facilitar la auto-recuperación y el diagnóstico remoto.

#### Tabla Ap-G4. *Códigos de excepción semántica y diagnóstico en el driver MQTT endurecido (simple2.py)*

| Código Semántico | Tipo de Excepción | Causa Raíz Diagnosticada | Acción de Recuperación en Firmware |
| :--- | :--- | :--- | :--- |
| **1** | Fallo de conexión TCP | El host del bróker es inalcanzable o el puerto 8883 está cerrado. | Reintento con retroceso exponencial (*exponential backoff*). |
| **28** | Enlace físico ausente | Radio WiFi desconectada de la red local inalámbrica. | Reescaneo de SSID y reconexión forzada de la interfaz STA. |
| **30** | Timeout de red / Falla DNS | El servidor DNS no resuelve la IP del VPS o el socket expiró. | Purga de descriptores y reintento de resolución tras 5 segundos. |
| **-202** | Fallo de negociación SSL | Memoria RAM dinámica insuficiente (< 45 KB) para el contexto TLS. | Liberación forzada de memoria vía `gc.collect()` y reintento. |

*Nota.* Fuente: Elaboración propia a partir del código fuente de `firmware/lib/umqtt/simple2.py`.

**Driver Dinámico para Sensor de Iluminancia (BH1750).** El sensor BH1750 en su modo predeterminado se satura al alcanzar 65.535 lux, nivel frecuentemente superado por la radiación cenital de Ciudad Guayana. El firmware incorpora un algoritmo adaptativo que modifica dinámicamente el registro de tiempo de medición `MTreg` (entre 31 y 254), extendiendo el límite de captura hasta 121.557 lux sin desbordamiento numérico.

**Rutina de Autorrecuperación por Hardware (*Power Cycle*).** Ante congelamientos de la lógica interna de los transductores I2C o 1-Wire por transitorios eléctricos, el firmware evalúa el contador de errores consecutivos. Al alcanzar tres fallos continuos, activa el pin `GPIO 5`, abriendo el circuito del transistor MOSFET por 200 ms. Esto desenergiza completamente los sensores, drena sus condensadores de desacoplo y reconfigura el bus en dos segundos, restableciendo las lecturas normales sin necesidad de reiniciar el SoC ni interrumpir el socket seguro con el servidor.

**Temporizador de Seguridad Local (*Fail-Safe Timer*).** Ante una pérdida imprevista del enlace de red durante una maniobra de riego, el nodo actuador previene inundaciones catastróficas mediante un temporizador por interrupción de hardware (*Hardware Timer*). Cada comando recibido desde el servidor incorpora su parámetro de duración en segundos; el microcontrolador inicia la cuenta regresiva local y, si no recibe una orden de apagado explícita al término del periodo, desenergiza de inmediato la bomba de agua y las electroválvulas de forma autónoma.

---

### 6. Mantenimiento Preventivo y Solución de Incidencias Técnicas

Para asegurar la longevidad del sistema físico y la continuidad operativa del software, se define un conjunto de revisiones periódicas e instrucciones de diagnóstico rápido en campo.

**Mantenimiento Preventivo de Hardware e Instalación.**
* *Inspección Semestral del Tablero:* Verificar el torque de apriete en las borneras de riel DIN y terminales del contactor de 30A para prevenir puntos calientes por resistencia de contacto.
* *Limpieza de Garita Meteorológica:* Limpiar trimestralmente las ranuras de la persiana Stevenson 3D con un paño seco para asegurar la libre convección de aire sobre los sensores DHT22 y BH1750.
* *Inspección y Limpieza del Filtro de Disco de 1 Pulgada:* Desmontar semestralmente el cuerpo roscado del filtro de disco de 1 pulgada ubicado a la salida de la bomba de agua. Se debe extraer la columna de discos anulares ranurados, aflojar el tornillo de compresión y lavar a contracorriente con agua a presión (o sumergir en solución desincrustante ligera si existen sales precipitadas de agroquímicos), verificando el empaque de goma antes del reensamblaje manual.
* *Recomendación Técnica de Filtrado en Succión:* Se recomienda enfáticamente instalar una segunda unidad de filtro de disco de 1 pulgada en la línea de succión (entrada) de la bomba de agua. Esta disposición alivia la carga de partículas sobre el impulsor mecánico y el filtro principal de descarga, minimizando drásticamente el riesgo de obstrucción en los nebulizadores y microaspersores.

La Tabla Ap-G5 consolida la matriz formal de diagnóstico y resolución de problemas técnicos en firmware, red e infraestructura.

#### Tabla Ap-G5. *Matriz de diagnóstico y solución de incidencias técnicas en firmware e infraestructura (Troubleshooting)*

| Síntoma o Incidencia | Causa Raíz Probable | Procedimiento de Verificación Técnica | Acción Correctiva de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Reinicio continuo del ESP32 en tablero (`EBUSY`).** | Descriptores de socket huérfanos o memoria RAM dinámica menor a 45 KB. | Inspeccionar consola serial con `mpremote` y medir `gc.mem_free()`. | Confirmar presencia del driver `simple2.py` y purgar bibliotecas innecesarias con `mprun -b -l`. |
| **Lecturas climáticas congeladas en valores fijos.** | Bloqueo transitorio en el circuito integrado del sensor DHT22 o BH1750. | Auditar en log si la rutina de MOSFET conmuta el GPIO 5 por 200 ms. | Verificar continuidad del cableado Cat6 y confirmar funcionamiento del MOSFET de corte. |
| **La bomba de agua no arranca al conmutar desde la web.** | Disparo térmico en fusilera de 15A o falla en bobina del contactor industrial. | Medir voltaje en la salida de 110VAC del contactor con multímetro. | Comprobar fusibles cilíndricos, verificar alimentación de bobina y revisar estado de press control. |
| **El servidor no registra datos en InfluxDB.** | Token de autenticación revocado o interrupción del contenedor `influxdb`. | Ejecutar `docker ps` y revisar logs del servicio `services/ingest`. | Reiniciar pila con `docker compose restart ingest` y verificar variables en el archivo `.env`. |
| **Comandos de riego descartados con acuse `VETO`.** | Lluvia activa inferida o humedad ambiental interior superior a 85%. | Consultar pantalla `/operations/history` y estado en `/weather-oracle`. | Comportamiento normal del motor deliberativo; si se requiere forzar, utilizar `/operations/control`. |
| **Desconexión periódica del ESP32 al mediodía.** | Atenuación de señal WiFi por dilatación térmica de antena o colapso DNS. | Monitorear RSSI inalámbrico y auditar logs del bróker Mosquitto en puerto 8883. | Ajustar orientación de antena en tablero y fijar IP estática con DNS 1.1.1.1 en firmware. |

*Nota.* Fuente: Elaboración propia a partir de los registros de incidencias de campo y bitácora técnica de desarrollo.
