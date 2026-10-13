# Apéndices

## **Apéndice H \- Catálogo de Documentación Técnica, Orquestación y Automatización en Repositorio Digital** {#apéndice-h---catálogo-de-documentación-técnica-orquestación-y-automatización-en-repositorio-digital}

Para garantizar la reproducibilidad de la plataforma, facilitar la transferencia tecnológica y guiar las labores de administración y soporte por parte de futuros ingenieros, el código fuente, los esquemas de aprovisionamiento contenerizado y las guías de mantenimiento de PristinoPlant se encuentran centralizados en el repositorio público de GitHub:

* **Repositorio Maestro del Proyecto:** [JulioFlors/orchidium-project (GitHub)](https://github.com/JulioFlors/orchidium-project)

Bajo la arquitectura de monorepositorio (*Turborepo*), el proyecto complementa sus manuales de grado con artefactos modulares de ingeniería en formato Markdown (`README.md`), manifiestos de orquestación en contenedores (`docker-compose.yml`), scripts de automatización para el servidor (`.sh`) y plantillas exhaustivas de configuración (`.env.template`). En este apéndice se indexan dichos recursos, detallando su localización en la rama principal (`main`) y su función operativa dentro de la infraestructura.

---

### Tabla Ap-H1. *Índice de artefactos de documentación técnica (README.md) en GitHub* {#tabla-ap-h1.-índice-de-artefactos-de-documentación-técnica-readme.md-en-github.}

| Componente / Módulo | Subsistema Tecnológico | Archivo y Enlace en GitHub |
| :--- | :--- | :--- |
| **Monorepositorio Maestro** | Arquitectura general, modelo de datos y entorno local | [README.md (Raíz)](https://github.com/JulioFlors/orchidium-project/blob/main/README.md) |
| **Nodos Embebidos IoT** | Firmware en MicroPython para SoCs ESP32 y sensores | [firmware/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/firmware/README.md) |
| **Infraestructura MQTT** | Bróker Mosquitto contenerizado, TLS y seguridad | [infrastructure/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/README.md) |
| **Orquestación n8n** | Asistente PristinoBot en Telegram y alertas de red | [infrastructure/n8n/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/n8n/README.md) |
| **Microservicio Scheduler** | Motor de deliberación hídrica y scripts de backfill | [services/scheduler/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/README.md) |
| **Weather Oracle** | Oráculo meteorológico multi-API y riesgo predictivo | [services/weather-oracle/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/weather-oracle/README.md) |
| **Base Agronómica Web** | Formulación de recetas químicas y catálogo biológico | [app/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/README.md) |
| **Estándar de Componentes UI** | Arquitectura de capas z-index, GPU y accesibilidad | [app/src/components/ui/action-menu/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/src/components/ui/action-menu/README.md) |

---

### Descripción del Contenido por Artefacto de Documentación

#### 1. Arquitectura General y Monorepositorio Maestro
* **Enlace directo:** [JulioFlors/orchidium-project/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/README.md)
* **Contenido y alcance técnico:**
  * **Estructura del Monorepositorio:** Organización modular de paquetes bajo Turborepo y pnpm workspaces (`app`, `firmware`, `infrastructure`, `packages/database`, `services`).
  * **Modelo de Datos de Triple Fuente de Verdad:** Resolución de discrepancias entre catálogo digital e inventario físico mediante los modelos `Species` (información botánica), `ProductVariant` (SKU comercial y precio) y `Plant` (activo biológico físico individual).
  * **Filosofía de Co-ubicación y Buenas Prácticas:** Directrices de diseño modular para mantener la UI desacoplada de la lógica de negocio y estado.
  * **Guía de Despliegue Local:** Procedimiento de arranque en entornos de desarrollo mediante Docker Desktop, Node.js 22 LTS (vía Corepack), cliente PostgreSQL y variables de entorno iniciales.
  * **Políticas de Integración de Servicios Externos:** Configuración de la política CORS para la subida directa de activos fotográficos botánicos a Cloudflare R2 sin bloqueos en el navegador.

#### 2. Firmware Embebido para Nodos ESP32
* **Enlace directo:** [JulioFlors/orchidium-project/firmware/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/firmware/README.md)
* **Contenido y alcance técnico:**
  * **Entorno y Herramientas Embebidas:** Requisitos para flashear microcontroladores ESP32 con la imagen oficial de MicroPython (v1.26.0+) usando `esptool`.
  * **Automatización de Despliegue con `mprun`:** Manual del comando personalizado `mprun -b -l` que interpreta archivos `manifest.json` para aprovisionar automáticamente librerías en la memoria flash de cada nodo.
  * **Especificación de Transductores y Actuadores:** Circuitos de conexionado y protocolos para el sensor de temperatura/humedad DHT22, sensor de iluminancia BH1750 (bus I2C), módulo de relés de 4 canales y protecciones de conmutación de potencia.
  * **Librerías Parchadas y Resiliencia:** Documentación de las modificaciones a la librería `umqtt` para implementar reconexión automática ante micro-caídas y temporizadores locales de seguridad (*fail-safe*) que desenergizan las válvulas si se pierde la red.
  * **Auditoría Telemétrica:** Procedimientos de validación de tópicos y payloads JSON bajo canales seguros MQTTS utilizando MQTT Explorer.

#### 3. Infraestructura de Comunicaciones y Bróker MQTTS (Mosquitto)
* **Enlace directo:** [JulioFlors/orchidium-project/infrastructure/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/README.md)
* **Contenido y alcance técnico:**
  * **Despliegue Contenerizado:** Configuración del servicio Eclipse Mosquitto en Docker Compose para el intercambio de mensajes en tiempo real entre hardware, servicios y frontend.
  * **Seguridad y Control de Acceso:** Procedimiento de encriptación de contraseñas mediante la utilidad interna `mosquitto_passwd` y mapeo seguro de volúmenes persistentes (`config/passwd`).
  * **Gestión de Calidad de Servicio (QoS):** Directrices para conmutaciones críticas con confirmación obligatoria (QoS 1) frente a publicaciones telemétricas ambientales continuas (QoS 0).
  * **Diagnóstico y Mantenimiento de Servidor:** Comandos de monitoreo en tiempo real de paquetes `PUBLISH` y directivas de truncamiento seguro del log físico para evitar la saturación del almacenamiento en el VPS.

#### 4. Orquestación con n8n y Asistente Autónomo en Telegram
* **Enlace directo:** [JulioFlors/orchidium-project/infrastructure/n8n/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/n8n/README.md)
* **Contenido y alcance técnico:**
  * **Flujo de Comandos de PristinoBot:** Arquitectura del workflow interactivo de Telegram (`/status`, `/dosing`, `/help`), detallando la depuración de conexiones paralelas en nodos Switch y consultas SQL con `UNION ALL` para unificar eventos pasados (`DosingLog`) con tareas proyectadas en agenda (`DosingSchedule`).
  * **Normalización de Salida y API de Telegram:** Inyección de caracteres de ancho cero (`\u200B`) para preservar saltos de línea e incorporación de diccionarios de traducción de zonas agronómicas.
  * **Workflow de Alertas Correlacionadas de Nodos:** Lógica de supervisión continua sobre la tabla `DeviceLog` en PostgreSQL para monitorear el estado de las estaciones meteorológicas y el nodo actuador.
  * **Algoritmo de Tolerancia a Micro-Fallos:** Regla de ventana temporal de 10 minutos continuos en estado `OFFLINE` para inhibir falsas alarmas ante reconexiones transitorias de Wi-Fi, distinguiendo entre cortes eléctricos generales y descargas de batería de la EMA.

#### 5. Microservicio Scheduler y Procedimientos de Reconstrucción de Datos
* **Enlace directo:** [JulioFlors/orchidium-project/services/scheduler/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/README.md)
* **Contenido y alcance técnico:**
  * **Consolidación de Telemetría (Backfill):** Procedimiento para ejecutar el script `backfill-history.ts` utilizando contenedores temporales de Node.js en el VPS o en entornos locales, transfiriendo y compactando métricas higrotérmicas desde InfluxDB hacia PostgreSQL.
  * **Reconstrucción Histórica de Precipitaciones:** Guía de uso del script `rebuild-rain-history.ts` para recalcular retroactivamente eventos de lluvia a partir de gradientes microclimáticos brutos, alimentando la base de datos de auditoría del motor hídrico.
  * **Variables de Entorno Operativas:** Configuración de parámetros de conexión a InfluxDB (URL, Token criptográfico, Organización y Bucket) y rangos temporales de procesamiento (`BACKFILL_DAYS`).

#### 6. Microservicio Weather Oracle (Oráculo Meteorológico)
* **Enlace directo:** [JulioFlors/orchidium-project/services/weather-oracle/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/weather-oracle/README.md)
* **Contenido y alcance técnico:**
  * **Arquitectura de Riego Contextual:** Justificación del servicio satelital como mecanismo para eliminar el riego a ciegas mediante la consulta concurrente a tres proveedores externos (OpenWeatherMap, Open-Meteo y AgroMonitoring).
  * **Supervisión Edafológica:** Recopilación de humedad remanente en suelo a 10 cm de profundidad y probabilidad horaria de lluvia para suministrar guardas ambientales predictivas al `Scheduler`.
  * **Estrategia Fail-Safe y Optimización de Cuotas:** Ejecución asíncrona mediante cronjob interno cada 3 horas, consumiendo menos del 1% del límite diario de solicitudes de las capas gratuitas de las APIs.
  * **Parámetros Geográficos:** Configuración de coordenadas de geolocalización e identificadores de polígono agronómico en el archivo maestro de entorno.

#### 7. Base de Conocimiento Agronómico y Formulación de Recetas
* **Enlace directo:** [JulioFlors/orchidium-project/app/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/README.md)
* **Contenido y alcance técnico:**
  * **Compendio Técnico de Insumos:** Fichas técnicas completas de fertilizantes de liberación controlada (Osmocote Plus), formulaciones NPK hidrosolubles (Solucat, Nitrifort, Bio-Fert 72, Triples 20-20-20), enraizantes (Razormin), bioestimulantes (Dalgin, Melaza) y correctores nutricionales (Calcio+Boro).
  * **Fitosanitarios e Insecticidas:** Especificaciones de preparación por litro de agua (g/L y ml/L), principios activos, modo de acción y precauciones toxicológicas.
  * **Modelado del Módulo de Laboratorio:** Fundamentación botánica para la parametrización de tareas de dosificación manual y cálculo automatizado de volumen en el tanque de mezcla.

#### 8. Estándares de Implementación y Accesibilidad de Interfaces
* **Enlace directo:** [JulioFlors/orchidium-project/app/src/components/ui/action-menu/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/src/components/ui/action-menu/README.md)
* **Contenido y alcance técnico:**
  * **Jerarquía Estricta de Capas (Z-Index):** Escala normalizada desde `z-0` (contenido base) hasta `z-9999` (toasts prioritarios) para prevenir superposiciones visuales no deseadas.
  * **Reglas de Aislamiento Gráfico:** Prohibición del uso de `createPortal` en menús de tarjeta y directivas para forzar aceleración por GPU (`transform-gpu antialiased [backface-visibility:hidden]`) para eliminar el parpadeo de texto (*flicker*) durante animaciones con Framer Motion en Chromium.
  * **Conformidad de Accesibilidad (WAI-ARIA):** Soporte de navegación por teclado mediante teclas de flecha arriba/abajo, escape y pérdida de foco (`blur`/`Tab`).

---

### Tabla Ap-H2. *Artefactos de orquestación, scripts de automatización y configuración* {#tabla-ap-h2.-artefactos-de-orquestación-scripts-de-automatización-y-configuración.}

| Artefacto / Archivo | Rol en el Servidor (VPS) | Enlace en GitHub |
| :--- | :--- | :--- |
| **`docker-compose.yml`** | Orquestador maestro de la arquitectura contenerizada | [docker-compose.yml](https://github.com/JulioFlors/orchidium-project/blob/main/docker-compose.yml) |
| **`deploy.sh`** | Automatización de despliegue continuo en producción | [deploy.sh](https://github.com/JulioFlors/orchidium-project/blob/main/deploy.sh) |
| **`renew_certs.sh`** | Renovación SSL/TLS con Certbot Docker y permisos | [renew_certs.sh](https://github.com/JulioFlors/orchidium-project/blob/main/renew_certs.sh) |
| **`.env.template`** | Plantilla maestra de variables de entorno y guía de conexión | [.env.template](https://github.com/JulioFlors/orchidium-project/blob/main/.env.template) |
| **`entrypoint.sh` (Servicios)** | Scripts de arranque con espera activa de bases de datos | [services/scheduler/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/entrypoint.sh) |

---

### Descripción de Artefactos de Orquestación y Automatización

#### A. Manifiesto de Orquestación Contenerizada (`docker-compose.yml`)
* **Enlace directo:** [JulioFlors/orchidium-project/docker-compose.yml](https://github.com/JulioFlors/orchidium-project/blob/main/docker-compose.yml)
* **Contenido y decisiones de arquitectura:**
  * **Desacoplamiento por Perfiles (`profiles`):**
    * *Perfil `local`:* Despliega en la estación de desarrollo contenedores ligeros de PostgreSQL 17 (`postgres-local`), InfluxDB 3 (`influxdb-local`) y Mosquitto en puertos estándar (1883 y 9001), permitiendo la depuración local sin requerir conexión a internet.
    * *Perfil `cloud`:* Gobierna la infraestructura de producción en el VPS bajo Ubuntu Server. Despliega PostgreSQL con canal seguro SSL obligatorio (puerto 5432), Mosquitto con puertos duales seguros (8883 bajo MQTTS para hardware ESP32 y 8884 bajo WSS con soporte de WebSockets para la app web en Vercel), InfluxDB 3 Core con TLS (puerto 8181), y los microservicios autónomos `ingest`, `scheduler` y `weather-oracle`.
  * **Aislamiento y Redes Virtuales:** Redes Docker puente (*bridge*) que garantizan la comunicación inter-servicios mediante nombres de host internos (p. ej., `postgres`, `mosquitto-local`), evitando exponer sockets innecesarios a la red pública.
  * **Persistencia de Volúmenes:** Mapeo de almacenamiento para los datos relacionales (`/var/lib/postgresql/data`), las series temporales de InfluxDB y los certificados criptográficos compartidos.

#### B. Script de Despliegue en Servidor (`deploy.sh`)
* **Enlace directo:** [JulioFlors/orchidium-project/deploy.sh](https://github.com/JulioFlors/orchidium-project/blob/main/deploy.sh)
* **Contenido y flujo de ejecución en el VPS:**
  * **Sincronización Segura del Código:** Ejecuta `git fetch origin main` y `git reset --hard origin/main`, protegiendo de forma intacta los volúmenes de datos, certificados SSL y archivos de registro locales.
  * **Construcción y Lanzamiento:** Ejecuta `docker compose --profile cloud build` para compilar las imágenes optimizadas de los microservicios y levanta la pila con `docker compose --profile cloud up -d --remove-orphans`.
  * **Mantenimiento y Purga de Almacenamiento:** Ejecuta rutinas de limpieza automática mediante `docker image prune -a -f` y `docker builder prune -f`, liberando espacio en disco al eliminar capas de construcción y versiones obsoletas de imágenes.
  * **Directrices de Migración de Base de Datos:** Documenta los procedimientos de migración en producción delegados en el contenedor:
    ```bash
    docker compose exec scheduler npx prisma migrate deploy
    ```

#### C. Automatización de Certificados Criptográficos SSL/TLS (`renew_certs.sh`)
* **Enlace directo:** [JulioFlors/orchidium-project/renew_certs.sh](https://github.com/JulioFlors/orchidium-project/blob/main/renew_certs.sh)
* **Contenido y relevancia para el hardware:**
  * **Gestión de Dominios Múltiples:** Renueva y administra certificados Let's Encrypt mediante la imagen oficial `certbot/certbot` para los dominios `mqtt.sisparrow.com`, `vps.sisparrow.com` y `n8n.sisparrow.com`.
  * **Apertura y Cierre Automatizado de Firewall (UFW):** Detecta si el cortafuegos UFW está activo, abre temporalmente el puerto `80/tcp` para el desafío *standalone* de Certbot y lo clausura inmediatamente al finalizar el proceso.
  * **Optimización Criptográfica para Microcontroladores ESP32:** Resuelve la limitación de memoria RAM en el microcontrolador al momento del saludo TLS. Certbot genera cadenas completas (`fullchain.pem`) que desbordan el *heap* del ESP32; el script aísla y distribuye exclusivamente el certificado hoja (`cert.pem`) y la clave privada (`privkey.pem`) hacia el directorio de Mosquitto, fijando los permisos de usuario `chown 1883:1883` y reiniciando el servicio para aplicar el cifrado sin saturar los nodos de campo.

#### D. Plantilla Maestra de Variables de Entorno (`.env.template`)
* **Enlace directo:** [JulioFlors/orchidium-project/.env.template](https://github.com/JulioFlors/orchidium-project/blob/main/.env.template)
* **Contenido y guía operativa:**
  * **Acceso y Administración del VPS:** Comandos documentados para conexión remota segura vía SSH (`ssh root@ip`, `ssh root@vps.tu-dominio.com`).
  * **Almacenamiento de Medios en Cloudflare R2:** Claves de API (`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`), identificadores de cuenta y URLs públicas para la entrega de imágenes botánicas mediante CDN.
  * **Autenticación Federada con Google OAuth 2.0:** Guía paso a paso para dar de alta las URIs de redireccionamiento autorizadas en Google Cloud Console tanto para desarrollo local (`http://localhost:3000/api/auth/callback/google`) como para producción institucional (`https://pristinoplant.com/api/auth/callback/google`).
  * **Seguridad de Sesiones (Better Auth):** Generación de secretos criptográficos (`BETTER_AUTH_SECRET`) y configuración de la URL base canónica (`BETTER_AUTH_URL=https://pristinoplant.com`).
  * **Matriz de Credenciales MQTT por Roles:** Definición de usuarios y contraseñas diferenciadas con listas de control de acceso (ACL) para el microservicio de ingesta, el planificador (*Scheduler*), el nodo actuador y el frontend.
  * **Persistencia Políglota:** Cadenas de conexión TCP para PostgreSQL local y en la nube (con pooling y unpooled para migraciones), junto a los tokens de autenticación de organización y buckets para InfluxDB 3.
  * **Parámetros Geográficos y Tokens Externos:** Coordenadas latitud/longitud del orquideario e identificadores de polígonos para las consultas automáticas de Weather Oracle en OpenWeatherMap y AgroMonitoring.

#### E. Scripts de Inicialización Segura en Microservicios (`entrypoint.sh`)
* **Enlaces directos:** 
  * [services/scheduler/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/entrypoint.sh)
  * [services/ingest/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/ingest/entrypoint.sh)
  * [services/weather-oracle/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/weather-oracle/entrypoint.sh)
* **Contenido técnico:**
  * **Espera Activa de Dependencias (*Healthcheck Loops*):** Implementa bucles de verificación mediante `pg_isready` para suspender el inicio de las aplicaciones Node.js hasta que la base de datos relacional esté completamente receptiva.
  * **Sondeo a InfluxDB 3:** Valida la respuesta HTTP del endpoint `/api/v2/ping` incorporando el encabezado de autorización criptográfica, evitando errores de inicialización y fallas en cascada al momento de levantar el servidor.
