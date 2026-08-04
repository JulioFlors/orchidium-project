# Marco Metodológico TDDM4IoTS — Sistema Pristinoplant

**Documento**: Anexo Metodológico para el Trabajo Instrumental de Grado (TIG)  
**Institución**: Universidad Católica Andrés Bello (UCAB Extensión Guayana)  
**Proyecto**: Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas  
**Autor**: Julio Flores  

---

## 1. Cita Bibliográfica Oficial de la Metodología (APA 7.ª Edición)

> Guerrero-Ulloa, G., Hornos, M. J., & Rodríguez-Domínguez, C. (2020). TDDM4IoTS: A test-driven development methodology for Internet of Things (IoT)-based systems. En M. Botto-Tobar, L. Barba-Guamán, J. Bermeo, & O. S. Gómez (Eds.), *Applied Technologies* (Vol. 1193, pp. 41–55). Springer, Cham. https://doi.org/10.1007/978-3-030-42517-3_4

---

## 2. Estructura Teórica Formal de TDDM4IoTS (11 Fases en 4 Bloques)

La siguiente tabla resume la definición teórica original de la metodología TDDM4IoTS dividida en sus 4 Bloques Principales de Actividades:

| Bloque Metodológico | Fase | Nombre de la Fase | Descripción Teórica Formal | Entregables y Criterios Conceptuales |
| :--- | :--- | :--- | :--- | :--- |
| **Bloque 1: Iniciación y Requisitos** *(Fase Global de Preparación)* | **F1** | Recopilación de Requisitos del Sistema IoTS | Entrevistas cliente-facilitador para explorar y documentar las necesidades de negocio y restricciones del entorno operativo. | Documento preliminar de alcance, visión del sistema y restricciones del entorno físico. |
| | **F2** | Formulación de Requisitos de Alto Nivel | Redacción de historias de usuario, definición de casos de uso y priorización del backlog inicial de requerimientos. | Backlog priorizado, diagramas de casos de uso UML e identificación de componentes HW/SW. |
| | **F3** | Lista Inicial de Casos de Prueba | Creación del conjunto inicial de pruebas de aceptación y criterios de éxito acordados con el cliente. | Suite inicial de criterios de aceptación y pruebas de nivel de sistema. |
| **Bloque 2: Diseño y Pruebas IoTS** *(Sistemas de Internet de las Cosas)* | **F4** | Arquitectura del Sistema IoTS | Modelado formal de componentes de hardware, firmware, microservicios, protocolos (MQTT/HTTP) y topología de red. | Diagrama de arquitectura multicapa, esquemas de mensajería y modelo de persistencia. |
| | **F5** | Especificación de Casos de Prueba IoTS | Definición detallada de escenarios de prueba para hardware, sensores, conectividad telemétrica y almacenamiento. | Casos de prueba de conectividad, tolerancia a fallos y límites telemétricos. |
| | **F6** | Criterios de Aceptación de las Pruebas IoTS | Acuerdos entre cliente y equipo sobre los umbrales de rendimiento, estabilidad y resiliencia en campo. | Matriz de umbrales de aceptación (latencia, porcentaje de uptime, margen de error). |
| **Bloque 3: Construcción Guiada por Pruebas** *(Ciclo Iterativo TDD por Entregable)* | **F7** | Creación del Entregable | Planificación y subdivisión de tareas en sprints cortas para módulos específicos de software o hardware. | Plan de sprint, asignación de componentes y tareas de implementación. |
| | **F8** | Casos de Prueba del Entregable (TDD Red) | Escritura de pruebas unitarias, de integración y de hardware ANTES de codificar la lógica funcional. | Pruebas ejecutables en estado fallido (Red) listas para guiar el código. |
| | **F9** | Desarrollo del Entregable (TDD Green) | Implementación del código mínimo necesario en firmware, backend o frontend para hacer pasar las pruebas. | Código fuente (MicroPython, TypeScript) funcional con pruebas en verde (Green). |
| | **F10** | Ejecución de Pruebas y Refactorización (TDD Refactor) | Optimización de código, limpieza de firmware y mejoras de arquitectura manteniendo los tests en verde. | Código refactorizado, librerías optimizadas y suite de pruebas superada sin regresiones. |
| **Bloque 4: Evaluación y Entrega Final** | **F11** | Prueba de Aceptación Final, Despliegue y Evolución | Validación in-situ con el cliente en producción real, monitoreo 24/7, mantenimiento evolutivo y refactorización. | Sistema desplegado en producción, acta de aceptación del cliente y bitácora de mantenimiento. |

---

## 3. Adaptación Real de TDDM4IoTS en Pristinoplant (6 Iteraciones, 2025–2026)

La siguiente tabla detalla la aplicación práctica de TDDM4IoTS a lo largo de las **6 Iteraciones Integrales del Monorepositorio**, correlacionando cada módulo e hito con su correspondiente Fase TDDM4IoTS:

| Iteración & Rango Temporal | Fase TDD | Módulos, Componentes e Hitos Desarrollados | Justificación e Impacto de Ingeniería |
| :--- | :--- | :--- | :--- |
| **Iteración 1: Plataforma Web, Monorepo, UI/UX y Base Agroquímica** *(Ene - Ago 2025)* | **F1** | Requisitos comerciales, catálogo de plantas ornamentales y necesidades de nutrición/sanidad botánica. | Identificación de la necesidad de una plataforma e-commerce integrada con gestión agronómica. |
| | **F2** | Formulación de historias de usuario, monorepo Next.js App Router desde cero y esquema Prisma ORM. | Cimiento arquitectónico desacoplado para soportar los módulos IoT posteriores. |
| | **F3** | Pruebas de navegación, autenticación Better-Auth, catálogo `/category/plants` y ejecución de semillas (`seed-database.ts`). | Garantía de flujos comerciales y de acceso seguros antes de conectar hardware. |
| | **F4** | Modelado de datos relacional Prisma ORM (`User`, `Plant`, `Species`, `Category`, `Agrochemical`, `FertilizationProgram`). | Estructuración del dominio de datos relacional para inventario y agroquímicos. |
| | **F7** | Sistema UI/UX (Header, Sidebar, Footer, Navbar, Submenús, Modales, Cards, Botones); Base Agroquímica en `seed-data.ts` (Abril 2025). | Creación del sistema visual y la base de conocimientos con agroquímicos, diluciones y guías. |
| | **F9** | Despliegue inicial de la tienda e-commerce como cimiento para los microservicios telemétricos. | Validación del núcleo comercial en producción base. |
| **Iteración 2: API Climática Inicial, Prototipado ESP32, Hidráulica y Tablero 24V/30A** *(Ago - Oct 2025)* | **F1** | Integración inicial de APIs climáticas externas regionales para alimentar un prototipo temprano del `Scheduler`. | Primera aproximación a datos ambientales (API regional reemplazada luego por EMA propia). |
| | **F2** | Instalación hídrica en **1 única zona con 4 líneas** (aspersión, humedad aire, humectación suelo, agroquímicos); Contactor 30A. | **Lección de Campo**: Relés de 10A fallaban con los 11A de la bomba. Se integró un **Contactor Industrial de 30A**. |
| | **F4** | MicroPython optimizado a bytecode `.mpy` y suite de herramientas PowerShell (`mprun`, `mpremote`). | Reducción del consumo de memoria RAM en el ESP32 y agilización del flujo de desarrollo. |
| | **F5** | Pruebas de conmutación en protoboard y activación de electroválvulas mediante MQTTExplorer (pre-backend). | Validación de la capa de transporte MQTT sin depender del servidor web. |
| | **F6** | Armado de tablero de control (fuera del orquideario, protegido de la intemperie) con ESP32, relés, **transformador 24V** y contactor 30A. | Alimentación a 24V para electroválvulas e integración de potencia de la bomba de agua. |
| | **F7** | Programación del firmware actuador `firmware/relay_modules/main.py` con patrón **Disconnected Fault-Tolerance & Hot State Recovery** (`recovery.json`). | Resiliencia tras cortes de energía, WiFi o MQTT sin perder tareas en ejecución. |
| | **F8** | Tendido físico hídrico in-situ y pruebas de presión/flujo con la bomba de agua de 11A en el invernadero real. | Verificación de caudal y resistencia mecánica de las tuberías de riego. |
| **Iteración 3: Ingesta Telemétrica, VPS Docker Compose, Suite Ops y Módulo Lab** *(Oct 2025 - Feb 2026)* | **F1** | Evaluación de arquitectura: Desarrollo inicial de `Ingest` y `Scheduler` en **Docker local** para posterior despliegue a VPS. | Definición de microservicios desacoplados en contenedores desde el entorno local. |
| | **F2** | Despliegue de la pila Docker completa a servidor VPS propio 24/7 (Broker Mosquitto MQTT, InfluxDB, PostgreSQL). | Arquitectura de alta disponibilidad 24/7 para ingesta telemétrica e historial temporal ilimitado. |
| | **F3** | Especificación de la suite de operaciones web (tareas manuales, diferidas, programadas) y programas de nutrición. | Diseño de la interfaz de control operativo para el cultivador. |
| | **F4** | Definición de tópicos MQTT (`pristinoplant/actuators/...`), esquemas JSON telemétricos y retención en InfluxDB. | Estandarización del protocolo de comunicación entre broker y backend. |
| | **F7** | Microservicio `Scheduler` centralizado; Suite Ops (`/control`, `/queue`, `/schedules`, `/history`); Módulo `/lab` (Feb 2026 - Commit `6e220f6`). | **Evolución**: Traslado de la orquestación al `Scheduler`, adaptando y persistiendo el patrón **Disconnected Fault-Tolerance & Hot State Recovery** a nivel de microservicio (PostgreSQL/Redis/MQTT sync). Conexión de `/lab` con electroválvulas de 24V. |
| | **F8** | Sincronización bidireccional entre la UI web, el backend central y los relés de conmutación en campo. | Verificación de respuesta en tiempo real (<200ms) desde la web hasta el relé físico. |
| | **F9** | Despliegue de contenedores Docker Compose en VPS de producción 24/7. | Estabilización del pipeline de ingesta y servicios centrales. |
| **Iteración 4: Estaciones Meteorológicas (EMA), Supresión EMI/Diafonía, Power Cycle y UI** *(Nov 2025 - May 2026)* | **F1** | Constatación de la invalidez de datos de APIs regionales para las condiciones microclimáticas reales del invernadero. | **Decisión Clave**: Necesidad imperativa de desplegar **Estaciones EMA Propias**. |
| | **F3** | Especificación telemétrica de precisión (Temperatura, Humedad Relativa e Iluminación) para exterior e interior. | Requerimientos de monitoreo hiperlocal en tiempo real. |
| | **F5** | Diagnóstico de lecturas corruptas por diafonía (Crosstalk) e interferencia electromagnética (EMI) en UTP Cat6. | Identificación de fallas de transmisión en cables trenzados largos. |
| | **F6** | **Nodos EMA**: EMA Exterior (red) y EMA Interior portable (baterías, *Deep Sleep*); Recableado UTP Cat6 (datos + GND/VCC); **Power Cycle GPIO**. | **Soluciones EMI**: 1) Hilos de datos acoplados con GND/VCC. 2) Circuito GPIO que conmuta VCC para autoresetear sensores. |
| | **F7** | *Monkey-patching* SSL/MQTT (`simple2.py`); Dashboards visuales `/monitoring`, `/admin` y `/botanics`. | Estabilización de sesiones SSL a +24h (previniendo sockets zombies) y UI/UX de telemetría en vivo. |
| | **F10** | Streaming telemétrico ininterrumpido en producción sin pérdida de ráfagas telemétricas. | Prueba de resiliencia del nodo sensor interior y exterior. |
| **Iteración 5: Motores de Inferencia (Riego y Meteorológico) y Mantenimiento** *(May - Jul 2026)* | **F3** | Reglas de inteligencia agronómica para cancelar o diferir riegos ciegos programados ante lluvias o alta humedad. | Optimización hídrica y prevención de hongos/pudrición en orquídeas. |
| | **F5** | Construcción de la bitácora observada real (`historical-observed-rain.json`) y suite de backtesting (`rebuild-rain-history.ts`). | Enfoque TDD aplicado a reglas heurísticas ambientales. |
| | **F7** | Desarrollo del **Motor de Inferencia del Riego** (T, HR, Luz) y **Motor de Inferencia Meteorológica** (Lluvia por deltas). | Algoritmos de decisión autónomos integrados en el pipeline de riego. |
| | **F8** | Calibración de umbrales y deltas en campo durante la temporada invernal/lluviosa (Mayo-Julio 2026). | Ajuste del modelo heurístico con datos del entorno real. |
| | **F10** | Validación in-situ por el cultivador confirmando que el sistema evita sobre-riego en el orquideario. | Verificación de aceptación agronómica en producción. |
| | **F11** | **Descarte de Módulos**: Sensor de Gotas (corrosión a intemperie) y Transductor de Presión (fallo físico por golpe de ariete). | Mantenimiento evolutivo manteniendo el firmware optimizado y libre de código muerto. |
| **Iteración 6: Inventario Físico Unívoco, Catálogo Taxonómico y Trazabilidad** *(Jul 2026 - Presente)* | **F1** | Requerimiento de trazabilidad individual por espécimen botánico presente en las mesas del invernadero. | Necesidad de vincular la producción física real con las ventas del e-commerce. |
| | **F2** | Modelado taxonómico avanzado (Género, Especie, Genotipo, Variedad, Tamaño de Maceta `PotSize` y Ubicación). | Dominio de datos botánico estructurado. |
| | **F4** | Modelado Prisma de instancias de planta individuales (`SeedPlant`) asociadas a fecha de enmacetado. | Identificación unívoca por espécimen. |
| | **F7** | Desarrollo del módulo de inventario sincronizando la disponibilidad física en mesas con la tienda web. | Control de stock exacto en tiempo real. |
| | **F11** | Operación agronómica integral, ventas, trazabilidad por código/instancia y mantenimiento continuo del sistema. | Consolidación final del sistema automatizado de grado de tesis. |
