# Bitácora Narrativa y Registro Técnico del Desarrollo del Proyecto Pristinoplant

**Documento**: Registro Histórico Ampliado de Ingeniería e Experiencia de Campo  
**Proyecto**: Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas  
**Autor**: Julio Flores  
**Institución**: Universidad Católica Andrés Bello (UCAB Extensión Guayana)  

---

## Introducción y Propósito

Este documento reúne de manera exhaustiva la narrativa técnica, las decisiones de arquitectura, las lecciones de ingeniería de campo y la cronología real del desarrollo del proyecto **Pristinoplant**. Su objetivo es conservar todo el detalle cualitativo, anécdotas de hardware y evoluciones del sistema que complementan la matriz metodológica de TDDM4IoTS y que serán utilizadas como insumo directo para la redacción de los **Capítulos III y IV del Trabajo Instrumental de Grado (TIG)**.

---

## 1. Fundamentos de la Plataforma Web, Sistema UI/UX y Base Agroquímica (Enero - Agosto 2025)

### 1.1. Inicio del Proyecto y Arquitectura Frontend Base
- **Origen**: El desarrollo inició formalmente en enero de 2025, con los primeros registros en el repositorio Git fechados entre marzo y abril de 2025.
- **Monorepo & Next.js**: Se inicializó un proyecto de cero con Next.js (App Router) en estructura de monorepositorio con despliegue continuo.
- **Sistema de Diseño UI/UX**: Construcción completa de la identidad visual del proyecto antes de la integración del hardware:
  - Definición de la paleta de colores y reglas de diseño responsivo.
  - Estructura de navegación global: Header, Sidebar, Footer, Navbar y Submenús animados.
  - Biblioteca de componentes atómicos: Modales, Cards, Botones, Tablas y Grilla de productos responsiva (`/category/plants`).
- **Autenticación y Comercio**: Implementación de autenticación segura (Better-Auth / Prisma) y flujo comercial inicial de productos ornamentales.

### 1.2. Base de Conocimientos de Agroquímicos y Nutrición Botánica
- **Planificación desde la Primera Iteración**: Como parte de la recopilación de requisitos iniciales, se previó respaldar al cultivador en las tareas de fertilización y fitosanidad.
- **Modelado en Base de Datos**: Creación de los modelos y semillas iniciales en `services/seed/src/seed-data.ts` y `services/seed/src/seed-database.ts`:
  - Tipos de Agroquímicos: `FERTILIZANTE` y `FITOSANITARIO`.
  - Propósitos Específicos: `DESARROLLO`, `FLORACION`, `MANTENIMIENTO`, `ACARICIDA`, `BACTERICIDA`, `FUNGICIDA` e `INSECTICIDA`.
  - Guías de Dilución y Seguridad: Información detallada de proporciones de dilución en agua y descripciones del propósito del producto para guiar al cultivador al momento de ejecutar los programas programados.

---

## 2. Estudio de Microcontroladores, Instalación Hidráulica y Tablero Electrónico (Agosto - Octubre 2025)

### 2.1. Investigación de Hardware y Tooling MicroPython
- **Selección de Microcontrolador**: A finales de agosto de 2025 se iniciaron las pruebas de laboratorio con microcontroladores **ESP32**, aprendiendo su programación en lenguaje **MicroPython**.
- **Herramientas de Acceso Rápido**: Creación de scripts y funciones de acceso rápido en PowerShell (`mprun`, `mpremote`) documentados cuidadosamente en `firmware/README.md`.
- **Optimización de Memoria RAM**: Compilación de archivos de código MicroPython `.py` a archivos bytecode compilados `.mpy` para reducir el consumo de memoria en el ESP32.

### 2.2. Construcción del Sistema Hidráulico e Instalación Física
- **Tendido Hídrico (Única Zona con 4 Líneas)**: Montaje físico del circuito de riego en el invernadero real de Pristinoplant en San Félix, Estado Bolívar:
  - El sistema atiende a **una única zona física**, equipada con **4 líneas de riego independientes**:
    1) Riego por aspersión.
    2) Humidificación del aire.
    3) Humectación del suelo.
    4) Aplicación de productos agroquímicos y fitosanitarios.
  - Instalación de 2 líneas principales de suministro: una para agua limpia y otra para solución de agroquímicos/fertilizantes.
- **Bomba de Agua y Contactor de Potencia (30A)**:
  - La bomba de agua instalada consume una corriente de **11 Amperios**.
  - En las pruebas iniciales, los módulos de relé comerciales (especificados para máx. 10A) sufrieron fallas térmicas por la corriente inductiva.
  - **Lección de Ingeniería**: Se integró un **Contactor Industrial de 30 Amperios** en el tablero eléctrico. Los relés de bajo voltaje del ESP32 conmutan la bobina del contactor, el cual maneja holgadamente los 11A de la bomba de agua.

### 2.3. Tablero Electrónico y Transformador de 24V
- **Ubicación del Tablero**: El tablero de control electrónico se instaló ubicado fuera del orquideario, protegido de la intemperie.
- **Transformador de 24V para Electroválvulas**: Debido a que las electroválvulas del circuito hidráulico operan a **24V**, el tablero incorpora un **transformador de 24V AC/DC** específico, además del ESP32, módulo de relés, fusibles de protección y el contactor industrial de 30A.
- **Firmware Actuador Inicial**: Primera versión del código `firmware/relay_modules/main.py`.
- **Validación con MQTTExplorer**: Dado que aún no existía la plataforma web de microservicios, el control del actuador y la mensajería MQTT se probaron y validaron mediante la herramienta **MQTTExplorer**.

---

## 3. Infraestructura Docker/VPS, Microservicios y Suite de Operaciones (Octubre 2025 - Febrero 2026)

### 3.1. Arquitectura Docker Local y Despliegue a VPS 24/7
- **Desarrollo Docker en Local**: Desde el inicio del desarrollo del backend, los servicios de ingesta telemétrica (`Ingest`) y programación (`Scheduler`) se construyeron y ejecutaron en contenedores **Docker en entorno local**.
- **Despliegue a VPS**: La migración consistió en **desplegar la pila Docker completa a un servidor VPS propio** para garantizar la disponibilidad 24/7 de los microservicios:
  - Broker de mensajería **Mosquitto MQTT**.
  - Base de datos para series temporales **InfluxDB** (retención telemétrica ilimitada).
  - Base de datos relacional **PostgreSQL** con Prisma ORM.
- **Persistencia Telemétrica**: Mantener el historial completo en InfluxDB fue el factor crítico que permitió recopilar la data telemétrica necesaria para entrenar y calibrar el motor de inferencia del riego y el motor de inferencia meteorológica.

### 3.2. Adaptación del Patrón "Disconnected Fault-Tolerance & Hot State Recovery" al Scheduler
- **Fase de Borde (ESP32 Local)**: Inicialmente, el nodo actuador ejecutaba una lógica autónoma guardando el estado de tareas en memoria Flash local (`NVSManager` / `recovery.json`). Esta estrategia introdujo el patrón de **Tolerancia a Fallos Desconectada y Recuperación en Caliente (Disconnected Fault-Tolerance & Hot State Recovery)** tras cortes de energía o caídas de red WiFi/MQTT.
- **Evolución y Persistencia en el Microservicio Scheduler**: Al migrarse y delegarse la inteligencia de orquestación al microservicio **`Scheduler`**, el patrón no se descartó sino que se **adaptó y evolucionó a nivel de microservicios**:
  - El `Scheduler` mantiene en persistencia relacional (PostgreSQL/Prisma) y en memoria los estados exactos de ejecución, colas y temporizadores activos (`/operations/queue` y `/schedules`).
  - Ante reinicios del VPS, cortes del broker Mosquitto o desconexiones eléctricas del ESP32 en campo, el `Scheduler` sincroniza y re-evalúa inmediatamente los estados de tareas interrumpidas, re-emitiendo comandos de alineación por MQTT y garantizando la **recuperación del estado en caliente** sin pérdida de tareas ni ejecuciones huérfanas.

### 3.3. Suite de Operaciones Web y Módulo Lab (Febrero 2026 - Commit `6e220f6`)
- **Suite de Operaciones Web**:
  1. `/operations/control`: Control manual inmediato de relés, bombas y electroválvulas.
  2. `/operations/queue`: Gestión de tareas diferidas con temporizadores.
  3. `/operations/schedules`: Programaciones recurrentes (Cron) para ciclos de riego, fertilización y fumigación.
  4. `/operations/history`: Bitácora de auditoría e inserción de conciencia operacional.
- **Módulo Agronómico `/lab`**:
  - Implementación de las Server Actions en `app/src/actions/lab/programs.ts` y `agrochemicals.ts`.
  - Conexión de los programas de fertilización y fumigación con la línea de conmutación de agroquímicos del tablero electrónico (electroválvulas de 24V).
  - Visualización para el cultivador de las recetas de dilución y descripciones del producto durante la ejecución del programa.

---

## 4. Estaciones Meteorológicas (EMA), Desafíos Electromagnéticos y Autoreparación (Noviembre 2025 - Mayo 2026)

### 4.1. Del Servicio de API Climática a las Estaciones EMA Propias
- **Sistema de API Climática Inicial**: Antes de instalar hardware meteorológico, se conectó un servicio de APIs climáticas externas al `Scheduler` para alimentar una primera versión del motor de decisiones.
- **Insuficiencia de Datos Regionales**: Se determinó que los datos climáticos regionales eran demasiado generales e inválidos para tomar decisiones agronómicas microclimáticas (ej. la API indicaba lluvia en la ciudad, pero no había caído una sola gota sobre el invernadero).
- **Construcción de Nodos EMA Propios**:
  - **EMA Exterior**: Nodo alimentado por red eléctrica para monitoreo continuo, co-existiendo físicamente con el nodo actuador del riego.
  - **EMA Interior**: Nodo portátil autónomo alimentado a baterías para el interior del orquideario (*Deep Sleep* y ráfagas telemétricas adaptativas).

### 4.2. Problema de Diafonía (Crosstalk) e Interferencia Electromagnética (EMI)
- **Fallo en Instalación Física**: Tras instalar el cableado de la estación meteorológica exterior, surgieron ruidos electromagnéticos severos y lecturas erróneas.
- **Diagnóstico del Causal**: Se había conectado un par trenzado del cable UTP Cat6 a positivo/negativo y otro par trenzado a las líneas de datos. Al viajar las señales de datos en un par sin apantallamiento balanceado, sufrieron diafonía cruzada.
- **Solución de Cableado**: Se recableó el tendido acoplando **cada hilo de señal de datos directamente con su respectivo hilo de Tierra (GND) o VCC** dentro de su propio par trenzado Cat6, cancelando el ruido electromagnético.

### 4.3. Mecanismo Autoreparable por Hardware: Power Cycle por GPIO/Relé
- **Ruido Residual por Longitud de Cable**: Debido a la longitud física del tendido eléctrico hacia los sensores, aún se experimentaba ruido residual e inicializaciones fallidas esporádicas en los sensores I2C/OneWire.
- **Solución Autoreparable Innovadora**:
  - Se alimentó la línea VCC de los sensores mediante un pin de salida GPIO/relé del ESP32.
  - Si el código detecta un fallo de comunicación o lectura ruidosa al inicializar un sensor, el ESP32 ejecuta un **Power Cycle**: apaga la alimentación VCC del sensor por un segundo y la vuelve a encender, realizando un reset eléctrico completo que limpia los registros internos del sensor y restaura la lectura limpia.
  - El microservicio `Scheduler` monitorea esta condición y fuerza la rutina de reinicio de ciclo de potencia si detecta ausencia de datos.

### 4.4. Estabilidad SSL/MQTT en MicroPython
- **Monkey-Patching en `umqtt`**: Para solventar desconexiones periódicas cada 10-20 minutos causadas por sockets zombies y timeouts SSL en MicroPython, se desarrolló el parche `simple2.py`.
- **Resultado**: Conexiones SSL/MQTT estables e ininterrumpidas por más de 24 horas continuas en producción.
- **Dashboards UI**: Desarrollo de las interfaces de monitoreo telemétrico `/monitoring`, auditoría del bus `/admin` y seguimiento de parámetros botánicos `/botanics`.

---

## 5. Motores de Inferencia (Riego y Meteorológico) y Mantenimiento Evolutivo (Mayo - Julio 2026)

### 5.1. Motor de Inferencia del Sistema de Riego
- **Diseño Conjunto**: Desarrollado en campo junto al cultivador botánico durante la temporada invernal/lluviosa (Mayo-Julio 2026).
- **Motor de Inferencia de Riego**: Algoritmo en backend (`inference-rules.md`) que evalúa en tiempo real 3 parámetros ambientales clave: **Humedad Relativa**, **Temperatura** e **Iluminación**.
- **Propósito**: Interceptar las rutinas ciegamente programadas (`/schedules`) para cancelar o diferir automáticamente el riego cuando las condiciones ambientales del orquideario indican que la planta no requiere hidratación.

### 5.2. Motor de Inferencia Meteorológica (Lluvia) y Backtesting TDD
- **Motor de Inferencia Meteorológica**: Algoritmo de inferencia de lluvia basado en deltas y variaciones abruptas de Humedad Relativa, Iluminación y Temperatura para inferir precipitación.
- **Validación TDD**:
  - Creación del archivo de registro histórico real de lluvias observadas en finca (`historical-observed-rain.json`).
  - Creación de la suite de pruebas de reconstrucción de historial (`rebuild-rain-history.ts`), lo que permitió ejecutar *backtesting* histórico para calibrar los deltas del algoritmo de lluvia antes de dejarlo operando de forma autónoma.

### 5.3. Mantenimiento Evolutivo y Descarte Documentado de Módulos
- **Descarte del Sensor de Gotas (Raindrop Sensor)**:
  - Fue instalado en la estación exterior, pero sufrió rápida corrosión galvánica por exposición continua a la intemperie y generaba falsos positivos constantes por condensación o suciedad. Se descartó físicamente y se sustituyó por el Motor de Inferencia Meteorológica (Lluvia).
- **Descarte del Transductor de Presión de Agua**:
  - Implementado inicialmente en código (`firmware/README.md`) para verificar que la bomba estuviese encendida y detectar la obstrucción del filtro hídrico.
  - Durante las pruebas físicas de integración hidráulica, la celda de presión sufrió un fallo catastrófico por choque hidráulico (golpe de ariete). Se tomó la decisión de remover el código del firmware del ESP32 para mantener el firmware liviano y optimizado.

---

## 6. Inventario Físico Unívoco, Catálogo Taxonómico y Trazabilidad por Planta (Julio 2026 - Presente)

### 6.1. Módulo de Inventario Unívoco (Iteración 6)
- **Trazabilidad Individual por Espécimen**: Evolución del sistema para gestionar no solo categorías abstractas de plantas, sino cada espécimen físico individual presente en las mesas del invernadero.
- **Modelado en Base de Datos**:
  - Catálogo Taxonómico: Estructuración de Género, Especie, Genotipo y Variedad.
  - Instancias de Planta (`SeedPlant`): Registro de fecha de enmacetado, tamaño de maceta (`PotSize`: Nro 5, Nro 7, Nro 10, Nro 14) y ubicación física exacta en el invernadero (`ZoneType`: Zona A-D; `TableType`: Mesa 1-6).
- **Sincronización E-Commerce**: Vinculación en tiempo real entre la disponibilidad física observada en las mesas del invernadero y el stock disponible para venta en la plataforma web.

---

## Resumen de Aportes para el Informe TIG

| Área de Ingeniería | Desafío o Requisito Real | Solución Técnica e Innovación Aplicada |
| :--- | :--- | :--- |
| **Potencia Eléctrica** | Bomba de agua de 11A quemaba relés comerciales de 10A. | Integración de **Contactor Industrial de 30A** conmutado por relé aislado. |
| **Alimentación Válvulas** | Electroválvulas operan a 24V. | Integración de **Transformador de 24V AC/DC** dedicado en el tablero. |
| **Ubicación Tablero** | Protección de la electrónica sin sellado hermético. | Instalación del tablero **fuera del orquideario, protegido de la intemperie**. |
| **Cableado Físico** | Diafonía (Crosstalk) y EMI en el tendido UTP Cat6 de la EMA. | Recableado acoplando **cada hilo de datos con GND/VCC** en par trenzado. |
| **Sensores Ruidosos** | Bloqueo/fallo de inicialización de sensores por cables largos. | **Power Cycle por GPIO**: Conmutación de VCC para autoresetear sensores. |
| **Resiliencia & Estado** | Pérdida de conectividad o caídas de energía en campo o servidor. | Adaptación del patrón **Disconnected Fault-Tolerance & Hot State Recovery** al `Scheduler`. |
| **Arquitectura Backend** | Ejecución continua 24/7 e ingesta de datos. | Servicios en **Docker local** desplegados a **VPS 24/7** (Mosquitto, InfluxDB, Postgres). |
| **Conectividad SSL** | Sockets zombies y caída de comunicación MQTT en MicroPython. | Parche **`simple2.py`** logrando sesiones estables continuas a +24h. |
| **Sensor de Lluvia** | Sensor de gotas corroído y con falsos positivos. | **Motor de Inferencia Meteorológica (Lluvia)** por deltas + `rebuild-rain-history.ts`. |
| **Filtro de Bomba** | Transductor de presión destruido por golpe de ariete. | Descarte documentado y limpieza de firmware para evitar código muerto. |
| **Nutrición Agronómica** | Necesidad de guiar la fertilización/fumigación del cultivador. | Módulo **`/lab`** conectando guías de dilución con la línea de 24V de agroquímicos. |
| **Inventario Físico** | Control de existencias botánicas en invernadero. | Registro unívoco **`SeedPlant`** por maceta, fecha y ubicación en mesa. |
