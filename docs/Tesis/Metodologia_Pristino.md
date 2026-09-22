# Capítulo III: Marco Metodológico

## Tipo de Investigación

El presente Trabajo Instrumental de Grado se enmarca como una investigación proyectiva, al enfocarse en el diseño e implementación de una solución tecnológica fundamentada en un proceso sistemático de indagación para solventar requerimientos operativos de un entorno real (Hurtado de Barrera, 2010, p. 133). 

Asimismo, responde a la modalidad de proyecto factible, ya que consiste en el desarrollo e implantación de un modelo funcional y económicamente viable orientado a solventar necesidades organizacionales específicas (UPEL, 2016, p. 21). Por su parte, adquiere un carácter tecnológico o aplicado, dado que persigue la integración práctica de la ingeniería sobre la mera teoría (Nicomedes, 2018, p. 3).

Estas metodologías se materializan en una plataforma de agricultura inteligente que automatiza el monitoreo microclimático, confiere autonomía deliberativa al riego mediante motores de inferencia, centraliza la planificación de dosificación de agroquímicos, el catálogo taxonómico y el inventario unívoco.

## Nivel de la Investigación

Según el grado de profundidad alcanzado, la investigación se sitúa en un nivel descriptivo-explicativo (Arias, 2012). Es descriptiva porque caracteriza el microclima, la infraestructura hidráulico-electrónica y las necesidades agronómicas del cultivo. Asimismo, adquiere carácter explicativo al determinar las relaciones causa-efecto entre las variaciones de los parámetros ambientales y la toma de decisiones autónoma del motor de inferencia para ejecutar, diferir o vetar el riego.

## Diseño de la Investigación

La estrategia metodológica adoptada corresponde a un diseño experimental de campo complementado con investigación documental (Arias, 2012, p. 27). Es experimental de campo debido a que los prototipos de hardware —tablero de potencia, nodos de control y estaciones meteorológicas— y los algoritmos para la toma de decisiones fueron sometidos a la manipulación de variables y validaciones iterativas bajo las condiciones reales del orquideario (Ramos-Galarza, 2021, p. 1). Paralelamente, el componente documental se sustentó en la revisión sistemática de sistemas IoT, el protocolo MQTT para la adquisición y transmisión de telemetría, el diseño de estaciones meteorológicas de bajo costo, técnicas de regulación microclimática y literatura agronómica especializada en el cultivo de orquídeas.

## Población y Muestra

La población representa el conjunto de elementos sobre los cuales se generalizan los resultados de la investigación (Arias, 2012). En este proyecto, enfocado en dotar de autonomía al circuito hidráulico de riego mediante motores de inferencia, la población comprende el universo continuo de variaciones microclimáticas y estados ambientales generados en el orquideario PristinoPlant.

La muestra consistió en la totalidad de los registros discretos de telemetría (temperatura, humedad relativa, iluminancia y eventos de precipitación) capturados sistemáticamente por las estaciones meteorológicas (EMA interior y exterior) desplegadas en el orquideario durante los ciclos estacionales de prueba. Este muestreo continuo exhaustivo aportó el corpus de datos empíricos indispensable para caracterizar el comportamiento del entorno y calibrar las reglas de decisión del sistema IoT.

## Técnicas e Instrumentos de Recolección de Datos

La recolección de datos comprende los procedimientos sistemáticos e instrumentos empleados para obtener y registrar la información empírica y conceptual de la investigación (Arias, 2012, pp. 67-68). En este proyecto se articularon tres técnicas principales:

**Revisión y análisis documental.** Constituyó la consulta sistemática de fuentes científicas —artículos científicos, tesis de grado y fichas técnicas de componentes electrónicos— para fundamentar las decisiones de diseño arquitectónico y de hardware (Arias, 2012; Hernández et al., 2010). Esta técnica fundamentó el proyecto en cuatro niveles clave: el marco metodológico (TDDM4IoTS), la optimización del firmware en MicroPython (ESP32), la arquitectura distribuida bajo Docker con mensajería MQTT/SSL, y el dimensionamiento del tablero de potencia junto a las estaciones meteorológicas.

***Instrumentos de revisión documental.*** Comprendieron el uso de:
1. *Bases académicas:* Google Scholar e IEEE Xplore para la recopilación de literatura sobre IoT y agricultura de precisión.
2. *Fichas técnicas (Datasheets):* Especificaciones de fabricantes para el dimensionamiento de microcontroladores, sensores, relés, bombas de agua y electroválvulas.
3. *Esquemas digitales:* Diagramas de conexión de hardware, topología de red y circuitos electrónicos del sistema.

**Entrevista no estructurada.** Diálogo abierto y continuo con los cultivadores y el tutor empresarial (Arias, 2012, p. 73) para traducir el conocimiento agronómico empírico en estructuras formales de software.

***Instrumentos de la entrevista no estructurada.*** Comprendieron:
1. *Guías abiertas de preguntas:* Aplicadas en dos fases: en el modelado de datos, para estructurar el catálogo de agroquímicos, diluciones exactas y planes de aplicación rotativos en la base de datos; y en los umbrales microclimáticos, para fijar horarios y límites climáticos que rigen el veto o espaciamiento preventivo del motor de inferencia de riego.
2. *Libreta de notas de campo:* Registro de observaciones microclimáticas, dosificaciones prácticas y requerimientos operativos in situ.

**Observación directa estructurada con enfoque de pruebas iterativas.** Según Arias (2012), la observación directa es la captación sistemática de un fenómeno en su contexto real. Dado que en un sistema IoT la lógica del software y la comunicación con el hardware son imperceptibles a simple vista, la única vía para validar el sistema fue desarrollar herramientas propias para su monitoreo, trazabilidad y observabilidad. Estos instrumentos permitieron verificar la estabilidad del firmware en campo, evaluar las decisiones autónomas del motor de inferencia de riego y obtener certeza trazable sobre cada rutina del circuito hidráulico.

***Instrumentos de la observación directa.*** Desarrollados específicamente para la plataforma:
1. *Depuración IoT (`/admin`):* Interfaz web para auditar la salud de los nodos, supervisar sensores y probar conmutaciones bajo demanda, permitiendo calibrar y depurar el hardware en campo sin conexiones físicas.
2. *Telemetría y gráficas (`/monitoring`):* Interfaz web para analizar el microclima interior y exterior, permitiendo definir los umbrales de riego y desarrollar el motor de inferencia para la detección y caracterización de lluvia.
3. *Trazabilidad operativa (`/history`):* Interfaz web que audita las operaciones del circuito hidráulico de riego, documentando cada conmutación física o cancelación preventiva orquestada por el servicio Scheduler.
4. *Logs de servicios (`Scheduler` e `Ingest`):* Registros cronológicos del flujo de comunicación con los nodos, consolidando estado operativo, telemetría y decisiones operativas para el mantenimiento y diagnóstico del sistema.

## Metodología de Desarrollo

En la Ingeniería de Software, la gobernanza del ciclo de vida se articula convencionalmente en dos vertientes: los enfoques predictivos, orientados a la exhaustividad de la planificación previa y al seguimiento secuencial de etapas, y los enfoques adaptativos o ágiles, centrados en la flexibilidad iterativa y la asimilación continua del cambio (Sommerville, 2011). 

No obstante, los sistemas basados en Internet de las Cosas (IoTS) trascienden las premisas de ambos paradigmas al exigir la convergencia simultánea de hardware de conmutación, capas de adquisición de datos telemétricos, firmware embebido y software de gestión (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024). En estos entornos, las restricciones físicas y electromagnéticas no pueden anticiparse enteramente en el diseño conceptual, sino que emergen durante el prototipado y la puesta en marcha *in situ*, demandando evolucionar el diseño previsto sobre la marcha.

Esta condición intrínseca de los IoTS impone una dependencia jerárquica estricta en la ingeniería de la solución: las capas superiores de supervisión y toma de decisiones autónomas no pueden operar con fiabilidad sobre una infraestructura física que no ha sido previamente automatizada y estabilizada. Un modelo secuencial cerrado postergaría la integración y validación del hardware hasta etapas tardías, elevando exponencialmente el costo de mitigar incompatibilidades de campo; a su vez, un marco ágil puro asume ciclos de iteración rápida sobre software homogéneo, subestimando las restricciones de acoplamiento eléctrico e instrumentación física. Se evidenció, por tanto, la necesidad de una estrategia metodológica capaz de aislar, validar y estabilizar progresivamente cada estrato del Sistema Basado en IoT (IoTS) antes de incorporar el siguiente nivel de complejidad lógica.

Bajo estos criterios, se adoptó como marco metodológico rector el **Modelo Incremental**. De acuerdo con Pressman (2010), este enfoque aplica secuencias lineales de forma escalonada a medida que avanza el calendario del proyecto, generando en cada ciclo un incremento funcional operativo y evaluable. Dicha aproximación permitió gestionar la heterogeneidad tecnológica de PristinoPlant mediante entregables modulares, facilitando la verificación temprana de cada componente y mitigando riesgos de integración en campo.

## Procedimiento Metodológico

A continuación se describen las cinco (5) fases del Modelo Incremental de Pressman (2010), detallando su aplicación en el proyecto, su articulación con los objetivos específicos y los resultados obtenidos:

**Comunicación.** Esta fase se orienta a identificar los requerimientos del sistema e interactuar con los interesados para definir las expectativas del proyecto (Pressman, 2010). En PristinoPlant, se aplicó mediante inspecciones técnicas en campo y entrevistas con el cultivador, articuladas con la revisión agronómica del cultivo. Su desarrollo dio cumplimiento al **primer objetivo específico**, obteniéndose la línea base conceptual y la Especificación de Requerimientos del Sistema (SRS) bajo estándares IEEE 830 e ISO/IEC 25010 (19 RF y 9 RNF).

**Planeación.** Comprende la organización del proyecto mediante la estimación de recursos, definición de tareas de ingeniería y secuenciación temporal de los incrementos (Pressman, 2010). En el proyecto, se estructuró el plan de trabajo desglosando el alcance en seis (6) incrementos funcionales y dimensionando los estratos de hardware, red hidráulica y servidores. Esta etapa dio inicio al **segundo objetivo específico**, generando como resultados el plan de desarrollo incremental, la matriz de asignación de recursos y el cronograma general.

**Modelado.** Abarca la creación de representaciones estructurales y funcionales del software y hardware que sirven de guía para su implementación (Pressman, 2010). En la plataforma IoTS, se tradujo en el diseño de los circuitos de potencia con aislamiento galvánico, la sectorización hidráulica, la topología telemétrica MQTT, los modelos de base de datos y la arquitectura de microservicios. Esta fase completó el **segundo objetivo específico**, arrojando planos eléctricos e hidráulicos, esquemas de bases de datos y especificaciones de contratos de interfaz.

**Construcción.** Consiste en la transformación de los modelos de diseño en artefactos operacionales mediante la codificación de programas y el ensamblaje físico (Pressman, 2010). En PristinoPlant, se materializó en el montaje del tablero de potencia, el tendido hidráulico, la fabricación de las estaciones meteorológicas, el firmware embebido y el desarrollo web con microservicios backend. Esta etapa alcanzó el **tercer objetivo específico**, logrando la solución de IoTS plenamente construida, integrada y operativa en el orquideario a través de entregas sucesivas.

**Despliegue.** Comprende la entrega del sistema en su entorno operacional para su evaluación por los usuarios, recolección de retroalimentación y cierre documental (Pressman, 2010). En el orquideario, implicó la puesta en marcha in situ, pruebas de conmutación bajo carga, validación de la inferencia de riego junto al cultivador y elaboración de manuales. Esta fase cumplió el **cuarto y quinto objetivo específico**, obteniéndose los informes de validación operativa (100% de la SRS), el Manual de Usuario, el Manual Técnico y el informe final de grado.

```
MODELO INCREMENTAL (Pressman, 2010) Y LOGRO POR OBJETIVOS ESPECÍFICOS
├── 1. Comunicación  ──> Objetivo Específico 1 (SRS, Marco Teórico y Diagnóstico Inicial)
├── 2. Planeación     ──> Objetivo Específico 2 (Estructuración de Incrementos y Recursos)
├── 3. Modelado      ──> Objetivo Específico 2 (Diseño Eléctrico, Hidráulico, Red y Software)
├── 4. Construcción  ──> Objetivo Específico 3 (Tablero, Estaciones EMA, Firmware, Docker y Web)
└── 5. Despliegue    ──> Objetivos Específicos 4 y 5 (Validación In-Situ, Autonomía y Manuales)
```

_Figura 1._ Representación esquemática del modelo incremental. Adaptado de _Ingeniería del software: Un enfoque práctico_ (p. 36), por R. Pressman, 2010, McGraw-Hill.

Dado que la solución implementada se enmarca en la categoría de Sistemas Basados en el Internet de las Cosas (IoTS), la ejecución de las fases de Construcción y Despliegue del Modelo Incremental de Pressman (2010) se complementan con las directrices de la metodología TDDM4IoTS (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024). En consonancia con el principio de adaptabilidad metodológica enunciado por sus autores, las actividades de TDDM4IoTS no se aplicaron de manera rígida, sino que se seleccionaron e integraron operativamente en función de los requerimientos específicos de cada capa tecnológica (hardware, firmware, servicios backend o interfaz web).

De manera complementaria, el diseño global del sistema (asociado al segundo objetivo específico) se estructuró formalmente a través de las tres etapas de la ingeniería: conceptual, básica y de detalle; sirviendo como marco arquitectónico unificado para guiar la construcción e integración progresiva de los seis (6) incrementos funcionales.

La articulación entre el Modelo Incremental, la metodología TDDM4IoTS, los niveles de diseño en ingeniería y los productos técnicos generados se sintetiza en la Tabla 1 (cuyos detalles extendidos de trazabilidad se presentan en el Apéndice B). En ella se detalla la correspondencia entre los seis (6) incrementos funcionales implementados en el orquideario PristinoPlant, sus fases metodológicas asociadas y los entregables de ingeniería consolidados.

#### Tabla 1. *Matriz de correspondencia entre el Modelo Incremental, TDDM4IoTS y los incrementos del proyecto*

| Incremento | Denominación | Fases del Modelo Incremental (Pressman, 2010) | Fases TDDM4IoTS Adoptadas | Entregables de Ingeniería Obtenidos |
| :---: | :--- | :--- | :---: | :--- |
| **Inc. 1** | **Plataforma Web Base, UI/UX y Catálogo Agroquímico** | Comunicación, Planeación, Modelado, Construcción | **F1, F2, F3, F4, F7, F9** | Arquitectura web base, sistema de diseño accesible, modelo de datos relacional para insumos y catálogo agronómico inicial. |
| **Inc. 2** | **Automatización de Borde, Red Hidráulica y Tablero de Potencia** | Modelado, Construcción, Despliegue | **F1, F2, F4, F5, F6, F7, F8** | Tablero de fuerza eléctrica con aislamiento de tres niveles, red hidráulica presurizada de 4 líneas y firmware base para conmutación de actuadores. |
| **Inc. 3** | **Infraestructura Backend Distribuida, Orquestación y Operaciones** | Planeación, Modelado, Construcción, Despliegue | **F1, F2, F3, F4, F7, F8, F9** | Arquitectura backend en microservicios contenerizados, bróker de mensajería segura, microservicio orquestador 24/7 y paneles de control operativo. |
| **Inc. 4** | **Telemetría Ambiental, Estaciones Meteorológicas y Monitoreo** | Modelado, Construcción, Despliegue | **F1, F3, F5, F6, F7, F8, F10** | Estaciones meteorológicas automatizadas (exterior e interior), firmware de adquisición telemétrica, mitigación de interferencias y paneles climáticos en tiempo real. |
| **Inc. 5** | **Inferencia Agronómica y Autonomía Hídrica** | Construcción, Despliegue | **F3, F5, F7, F8, F10, F11** | Motor de inferencia de riego basado en indicadores microclimáticos (VPD), motor heurístico de precipitación y validación empírica en campo. |
| **Inc. 6** | **Inventario Unívoco de Ejemplares y Sincronización Comercial** | Modelado, Construcción, Despliegue | **F1, F2, F4, F7, F11** | Modelo de gemelos digitales para seguimiento individualizado por maceta, control espacial en mesas de cultivo y canal de comercio electrónico integrado. |

*Nota.* Elaboración propia basada en las fases de Pressman (2010) y el marco TDDM4IoTS (Guerrero-Ulloa et al., 2020).
