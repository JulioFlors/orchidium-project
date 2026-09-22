## Metodología de Desarrollo

En la Ingeniería de Software, la gobernanza del ciclo de vida se articula convencionalmente en dos vertientes: los enfoques predictivos, orientados a la exhaustividad de la planificación previa y al seguimiento secuencial de etapas, y los enfoques adaptativos o ágiles, centrados en la flexibilidad iterativa y la asimilación continua del cambio (Sommerville, 2011).

No obstante, los sistemas basados en Internet de las Cosas (IoTS) trascienden las premisas de ambos paradigmas al exigir la convergencia simultánea de hardware de conmutación, capas de adquisición de datos telemétricos, firmware embebido y software de gestión (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024). En estos entornos, las restricciones físicas y electromagnéticas no pueden anticiparse enteramente en el diseño conceptual, sino que emergen durante el prototipado y la puesta en marcha *in situ*, demandando evolucionar el diseño previsto sobre la marcha.

Esta condición intrínseca de los IoTS impone una dependencia jerárquica estricta en la ingeniería de la solución: las capas superiores de supervisión y toma de decisiones autónomas no pueden operar con fiabilidad sobre una infraestructura física que no ha sido previamente automatizada y estabilizada. Un modelo secuencial cerrado postergaría la integración y validación del hardware hasta etapas tardías, elevando exponencialmente el costo de mitigar incompatibilidades de campo; a su vez, un marco ágil puro asume ciclos de iteración rápida sobre software homogéneo, subestimando las restricciones de acoplamiento eléctrico e instrumentación física. Se evidenció, por tanto, la necesidad de una estrategia metodológica capaz de aislar, validar y estabilizar progresivamente cada estrato del Sistema Basado en IoT (IoTS) antes de incorporar el siguiente nivel de complejidad lógica.

Bajo estos criterios, se adoptó como marco metodológico rector el **Modelo Incremental**. De acuerdo con Pressman (2010), este enfoque aplica secuencias lineales de forma escalonada a medida que avanza el desarrollo, generando en cada ciclo un incremento funcional operativo y evaluable. Dicha aproximación permitió gestionar la heterogeneidad tecnológica de los IoTS mediante entregables modulares, facilitando la verificación temprana de cada estrato tecnológico y mitigando riesgos de integración *in situ* sin desestabilizar las capacidades previamente consolidadas.

---

## Procedimiento Metodológico

A continuación, se describen las cinco (5) fases del Modelo Incremental de acuerdo con lo formulado por Pressman (2010), detallando su aplicación concreta en el proyecto, su correspondencia directa con los objetivos específicos planteados y los resultados técnicos obtenidos en cada una de ellas.

```
MODELO INCREMENTAL (Pressman, 2010) Y LOGRO POR OBJETIVOS ESPECÍFICOS
├── 1. Comunicación  ──> Objetivo Específico 1 (SRS, Marco Teórico y Línea Base)
├── 2. Planeación     ──> Objetivo Específico 2 (Estructuración de Incrementos y Recursos)
├── 3. Modelado      ──> Objetivo Específico 2 (Diseño Eléctrico, Hidráulico, Red y Software)
├── 4. Construcción  ──> Objetivo Específico 3 (Tablero, Estaciones EMA, Firmware, Docker y Web)
└── 5. Despliegue    ──> Objetivos Específicos 4 y 5 (Validación In-Situ, Pruebas 24/7 y Documentación)
```

---

### 2.1. Comunicación

Esta fase se orienta a la identificación de los requerimientos del proyecto y la definición de las expectativas del sistema, recopilando la información necesaria que sirve como base para los incrementos posteriores (Pressman, 2010).

* **Actividades Desarrolladas:**
  1. Se realizó una revisión documental exhaustiva de la literatura agronómica sobre la ecofisiología de las orquídeas (géneros *Cattleya*, *Dendrobium*, *Phalaenopsis*, *Oncidium* y *Vanda*), identificando los rangos admisibles de temperatura (18 °C - 32 °C), humedad relativa (60% - 85%), iluminancia solar (10.000 - 30.000 lux) y Déficit de Presión de Vapor (VPD entre 0,45 y 1,25 kPa).
  2. Se consultaron manuales de tecnologías IoT, protocolos ligeros de comunicación (MQTT bajo TLS), plataformas de virtualización en microservicios (Docker) y marcos metodológicos para sistemas embebidos (TDDM4IoTS).
  3. Se realizaron visitas técnicas e inspecciones in situ en la Zona A del orquideario PristinoPlant, interactuando directamente con el cultivador experto mediante entrevistas no estructuradas para relevar las condiciones de acometida eléctrica (110VAC), presión de agua disponible, disposición física de las mesas y cobertura de red Wi-Fi (2.4 GHz).
* **Vinculación con los Objetivos:**
  Esta fase permitió alcanzar el **primer objetivo específico**, orientado a:
  > *«Analizar los conceptos y herramientas referentes al cultivo de orquídeas basado en agricultura inteligente, a fin de identificar las características del sistema a desarrollar».*
* **Resultado Obtenido:**
  Se consolidó el marco conceptual de la investigación, el catálogo de tecnologías base seleccionadas y la **Especificación de Requerimientos del Sistema (SRS)** estructurada bajo estándares internacionales (IEEE 830 e ISO/IEC 25010), conformada por diecinueve (19) Requerimientos Funcionales (RF) y nueve (9) Requerimientos No Funcionales (RNF).

---

### 2.2. Planeación

Durante la fase de planeación se estructura la organización del proyecto mediante la definición de los incrementos de desarrollo, las actividades de ingeniería, la estimación de recursos de hardware y software, y el cronograma de ejecución temporal (Pressman, 2010).

* **Actividades Desarrolladas:**
  1. Se desglosó el alcance total del sistema en una secuencia lógica de seis (6) incrementos funcionales escalonados, delimitando qué características serían abordadas en cada entrega para garantizar que el sistema mantuviese operatividad en campo en cada iteración.
  2. Se planificaron las adquisiciones y el aprovisionamiento de componentes electrónicos (microcontroladores ESP32, sensores digitales de grado industrial SHT31 y BH1750), componentes de fuerza eléctrica (fuentes conmutadas de 24VDC, contactores industriales de 11A, módulos de relés, protecciones térmicas) y accesorios hidráulicos (electroválvulas de 24V, tuberías de polietileno y microaspersores).
  3. Se estimaron los requerimientos de infraestructura de servidores en la nube (VPS con Linux) y se establecieron los protocolos de prueba para la mitigación temprana de riesgos operacionales.
* **Vinculación con los Objetivos:**
  Esta fase contribuyó a la etapa inicial del **segundo objetivo específico**, orientado a:
  > *«Diseñar en función del análisis realizado, un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas».*
* **Resultado Obtenido:**
  El plan de desarrollo incremental del proyecto, la estimación de costos y recursos de hardware/software, y el cronograma de actividades técnicas ordenadas por capas de ingeniería.

---

### 2.3. Modelado

La fase de modelado comprende el análisis detallado y el diseño arquitectónico de los incrementos del sistema, mediante representaciones estructurales, esquemáticas y funcionales que guían con precisión su construcción física y lógica (Pressman, 2010).

* **Actividades Desarrolladas:**
  1. *Diseño de Hardware y Potencia:* Se elaboraron los esquemáticos del tablero eléctrico industrial bajo un diseño de aislamiento galvánico de tres niveles: 110VAC para la bomba de agua de 1 HP, 24VDC/VAC mediante transformador para electroválvulas y 5V/3.3V para la lógica digital. Se modeló la conmutación de la bomba mediante un contactor electromagnético industrial de 30A comandado por un relé piloto de 10A, suprimiendo la inductancia de retorno hacia el microcontrolador.
  2. *Diseño Hidráulico:* Se modeló la red de distribución hídrica en la Zona A, sectorizando el riego en cuatro (4) áreas independientes y dos (2) líneas matrices de insumos (agua limpia y solución de fertilizante).
  3. *Diseño Embebido:* Se diseñó la topología de conexión de los microcontroladores ESP32, definiendo el conexionado del bus I2C para los sensores SHT31 y BH1750, y modelando dos tipos de nodos: la Estación Meteorológica Automatizada fija (EMA Exterior) y la estación móvil para mesas de cultivo (EMA Interior) con soporte de bajo consumo (*Deep Sleep*).
  4. *Diseño de Software y Persistencia:* Se diseñó la arquitectura distribuida en microservicios contenerizados (Docker Compose), el árbol de tópicos MQTT con cifrado SSL/TLS, el modelo de datos relacional en PostgreSQL usando Prisma ORM (`Plant`, `Species`, `Agrochemical`, `Scheduler`), el modelo de retención para series de tiempo en InfluxDB y los wireframes de interfaz web en Next.js (Suite Ops, telemetría `/monitoring` y módulo `/lab`).
  5. *Lógica de Inferencia:* Se modelaron los algoritmos del motor de inferencia de riego basado en VPD y las reglas heurísticas de detección de lluvia por gradientes térmicos e higrométricos.
* **Vinculación con los Objetivos:**
  Esta fase completó plenamente el **segundo objetivo específico**, orientado a:
  > *«Diseñar en función del análisis realizado, un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas».*
* **Resultado Obtenido:**
  Planos eléctricos y esquemáticos del tablero de potencia, diagramas de tuberías y sectorización hidráulica, arquitectura de contenedores Docker, modelos entidad-relación y de series de tiempo, especificación de contratos MQTT y diseños de interfaz de usuario.

---

### 2.4. Construcción

Durante la fase de construcción, los diseños técnicos se transforman en artefactos funcionales operativos mediante la fabricación física del hardware, el montaje de instalaciones hídricas/eléctricas y la codificación de software (Pressman, 2010).

* **Actividades Desarrolladas:**
  1. *Construcción de Tablero y Red Física:* Se ensambló e instaló in situ el cofre eléctrico estanco IP65 en la Zona A con riel DIN, contactor industrial de 11A, fuente de 24V, fusibles y microcontrolador ESP32. Se tendió la tubería hidráulica acoplando electroválvulas y microaspersores.
  2. *Desarrollo de Firmware en MicroPython:* Se programó el firmware para los ESP32, modularizando la conexión Wi-Fi con reconexión resiliente, cliente MQTT sobre SSL con parche para evitar fugas de socket (`simple2.py`), lecturas I2C de sensores y conmutación de salidas de potencia. Todos los scripts fueron compilados en bytecode binario `.mpy` para optimizar la memoria heap en el microcontrolador.
  3. *Construcción de Estaciones EMA y Supresión de Ruido:* Se ensamblaron las estaciones EMA Exterior e Interior. Para solventar bloqueos I2C en tiradas de 10 metros de cable Cat6 por diafonía (*crosstalk*), se balancearon los hilos pareando datos con tierra/voltaje (SDA con GND, SCL con VCC) y se construyó un circuito de autorrecuperación de alimentación gobernado por GPIO (*power cycle* de 200 ms) para reiniciar los sensores ante congelamientos.
  4. *Despliegue de Backend Contenerizado:* En un VPS con Linux, se desplegaron mediante Docker Compose el broker Eclipse Mosquitto con autenticación y cifrado SSL, InfluxDB, PostgreSQL y el microservicio `Scheduler` en Node.js para la orquestación continua de riegos 24/7.
  5. *Desarrollo Frontend e Inferencia:* Se desarrolló la plataforma web en Next.js (App Router, Tailwind CSS, TypeScript y Server Actions), programando los paneles de telemetría en tiempo real, el control manual protegido contra comandos concurrentes, el módulo de fertilización agronómica y el catálogo botánico. Asimismo, se codificaron el motor de inferencia de riego y el motor heurístico de lluvia.
* **Vinculación con los Objetivos:**
  Esta fase permitió alcanzar el **tercer objetivo específico**, orientado a:
  > *«Implementar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, según el diseño realizado».*
* **Resultado Obtenido:**
  El Sistema Basado en IoT (IoTS) completamente ensamblado y operativo, que incluye el tablero de potencia instalado en el orquideario, los nodos EMA transmitiendo telemetría en tiempo real por MQTT, el backend distribuido en VPS y la aplicación web interactiva en producción.

---

### 2.5. Despliegue

En la fase de despliegue, el sistema se entrega e instala en su entorno de operación real, donde es sometido a pruebas exhaustivas de funcionamiento y aceptación, recibiendo retroalimentación para realizar ajustes y procediendo a la documentación técnica formal (Pressman, 2010).

* **Actividades Desarrolladas:**
  1. *Pruebas de Esfuerzo Eléctrico e Hidráulico:* Se ejecutaron más de 100 ciclos continuos de arranque y parada de la bomba de 110VAC y apertura de electroválvulas, verificando la ausencia de rebotes inductivos en la línea de 3.3V y comprobando la estabilidad del contactor industrial sin reinicios del ESP32.
  2. *Pruebas de Telemetría Continua:* Se evaluó la transmisión ininterrumpida de las estaciones EMA hacia el broker Mosquitto durante más de 90 días continuos en producción, simulando caídas de energía y cortes de red Wi-Fi, comprobando la reconexión autónoma del firmware en menos de 15 segundos.
  3. *Validación del Motor de Inferencia y Backtesting de Lluvia:* Se ejecutaron pruebas de simulación histórica (*backtesting*) contrastando una bitácora observada in situ (`historical-observed-rain.json`) contra las series de telemetría con el script `rebuild-rain-history.ts`, calibrando los deltas térmicos e higrométricos ($-\Delta T$, $+\Delta HR$) para alcanzar más del 95% de precisión en la detección de lluvia, cancelando riegos innecesarios.
  4. *Validación Agronómica y Descarte Técnico de Sensores:* Junto con el cultivador de PristinoPlant se validó la pertinencia de los riegos autónomos. Además, se documentó el descarte justificado de dos componentes físicos inviables: el sensor de lluvia resistivo (por corrosión galvánica severa) y el transductor de presión analógico (por rotura ante golpes de ariete).
  5. *Documentación Técnica y Académica:* Se redactó de manera progresiva el libro final de Trabajo Instrumental de Grado acorde a la normativa de la UCAB (2021). Se elaboró el Manual de Usuario para el cultivador y el Manual Técnico y de Mantenimiento para la administración del ecosistema.
* **Vinculación con los Objetivos:**
  Esta fase permitió dar cumplimiento conjunto al **cuarto y quinto objetivo específico**, orientados respectivamente a:
  > *«Validar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, respecto al análisis realizado».*
  > *«Realizar la documentación formal del sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas».*
* **Resultado Obtenido:**
  Informes técnicos de validación y pruebas de banco/campo, matriz de cumplimiento del 100% de los requerimientos RF y RNF, registros de calibración de inferencia climática, Manual de Usuario, Manual Técnico del Sistema y el libro formal de Trabajo Instrumental de Grado.

---

## 3. Articulación Técnica con TDDM4IoTS en los Incrementos Funcionales

Dado que PristinoPlant es un sistema basado en Internet de las Cosas (IoTS), la ejecución de las fases de Construcción y Despliegue del Modelo Incremental se fortaleció con los principios de la **Metodología de Desarrollo Guiado por Pruebas para Sistemas Basados en Internet de las Cosas (TDDM4IoTS)** (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024).

TDDM4IoTS formaliza once (11) fases agrupadas en cuatro (4) bloques conceptuales:
* **Bloque 1: Iniciación y Requisitos:** Fase 1 (Recopilación de Requisitos), Fase 2 (Formulación de Requisitos de Alto Nivel), Fase 3 (Lista Inicial de Casos de Prueba).
* **Bloque 2: Diseño y Pruebas IoTS:** Fase 4 (Arquitectura del Sistema IoTS), Fase 5 (Especificación de Casos de Prueba IoTS), Fase 6 (Criterios de Aceptación de las Pruebas IoTS).
* **Bloque 3: Construcción Guiada por Pruebas:** Fase 7 (Creación del Entregable), Fase 8 (Casos de Prueba - TDD Red), Fase 9 (Desarrollo - TDD Green), Fase 10 (Refactorización - TDD Refactor).
* **Bloque 4: Evaluación y Entrega Final:** Fase 11 (Prueba de Aceptación Final, Despliegue Operativo, Mantenimiento y Evolución).

En concordancia con el principio de flexibilidad discrecional formulado por Guerrero-Ulloa et al. (2020, p. 77) y respaldado por Hornos & Quinde (2024), las once fases no se aplican de manera uniforme en cada ciclo, sino que cada incremento funcional activa selectivamente aquellas fases pertinentes a la naturaleza de su entregable (hardware de potencia, firmware, servicios de backend o interfaces web).

La Tabla 1 consolida la correspondencia entre los seis (6) incrementos funcionales desarrollados en PristinoPlant, las fases del Modelo Incremental de Pressman, las fases de TDDM4IoTS adoptadas y los entregables de ingeniería obtenidos.

#### Tabla 1. Matriz de correspondencia: Modelo Incremental (Pressman), Fases TDDM4IoTS y Entregables en PristinoPlant

| Incremento | Denominación y Periodo | Fases del Modelo Incremental (Pressman, 2010) | Fases TDDM4IoTS Adoptadas | Entregables y Artefactos de Ingeniería Obtenidos |
| :---: | :--- | :--- | :---: | :--- |
| **Inc. 1** | **Plataforma Web Base, UI/UX y Catálogo Agroquímico**<br>*(Ene - Ago 2025)* | Comunicación, Planeación, Modelado, Construcción | **F1, F2, F3, F4, F7, F9** | Monorepositorio Next.js App Router, modelo de datos relacional Prisma ORM (`Plant`, `Agrochemical`), catálogo botánico en `seed-data.ts`, sistema visual UI/UX accesible. |
| **Inc. 2** | **Prototipado ESP32, Red Hidráulica y Tablero de Potencia**<br>*(Ago - Oct 2025)* | Modelado, Construcción, Despliegue | **F1, F2, F4, F5, F6, F7, F8** | Tablero de fuerza eléctrica 110V/24V/5V, sustitución de relés por Contactor Industrial 11A por corriente pico, red hidráulica de 4 sectores, firmware en MicroPython (`.mpy`). |
| **Inc. 3** | **Backend Docker VPS 24/7, Scheduler y Suite Ops/Lab**<br>*(Oct 2025 - Feb 2026)* | Planeación, Modelado, Construcción, Despliegue | **F1, F2, F3, F4, F7, F8, F9** | Arquitectura Docker Compose en VPS (Mosquitto SSL, InfluxDB, Postgres), microservicio `Scheduler` en Node.js, Suite Ops (`/control`, `/queue`, `/schedules`) y módulo `/lab`. |
| **Inc. 4** | **Estaciones EMA, Supresión EMI, Power Cycle y Monitoreo**<br>*(Feb - May 2026)* | Modelado, Construcción, Despliegue | **F1, F3, F5, F6, F7, F8, F10** | Estaciones EMA Exterior e Interior (sensores SHT31, BH1750), apantallamiento de diafonía en Cat6 con pares GND/VCC, circuito autorreparable de *Power Cycle* por GPIO en ESP32, dashboards `/monitoring`. |
| **Inc. 5** | **Motores de Inferencia Agronómica, Lluvia y Calibración**<br>*(May - Jul 2026)* | Construcción, Despliegue | **F3, F5, F7, F8, F10, F11** | `InferenceEngine` de riego por umbrales VPD, Motor Heurístico de Lluvia por deltas ambientales, backtesting con bitácora real (`historical-observed-rain.json`), descarte documentado de sensores corrosivos. |
| **Inc. 6** | **Inventario Unívoco, Catálogo Botánico y Trazabilidad**<br>*(Jul 2026 - Presente)* | Modelado, Construcción, Despliegue | **F1, F2, F4, F7, F11** | Modelo de trazabilidad individual `SeedPlant` con tamaño de maceta (`PotSize`) y ubicación (`ZoneType`, `TableType`), sincronización en tiempo real entre inventario físico en mesa y e-commerce web. |
