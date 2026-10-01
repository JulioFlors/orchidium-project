# **Capítulo II: Marco Teórico**

## **Antecedentes de la investigación** {#antecedentes-de-la-investigación}

La fundamentación teórica de la presente investigación se sustentó en la revisión sistemática de estudios previos, tanto en el ámbito internacional como local, que abordaron la convergencia entre la agricultura de precisión, el Internet de las Cosas (IoT) y la automatización telemétrica:

En el ámbito internacional, Liao y Chen (2022), en Taiwán, desarrollaron la investigación titulada “Correlación precisa del crecimiento de las hojas de orquídeas Phalaenopsis con las variables ambientales del invernadero utilizando un sistema de monitoreo IoT”. El estudio consistió en diseñar e implementar un sistema de monitoreo en tiempo real con IoT y visión computacional para evaluar el impacto de la temperatura y humedad relativa sobre el crecimiento de orquídeas *Phalaenopsis*.

Su trabajo validó la efectividad de plataformas en la nube para supervisar variables ambientales y conmutar actuadores de microaspersión, aportando un modelo referencial sobre la necesidad de correlacionar la telemetría continua con las respuestas fisiológicas del cultivo.

En el entorno institucional, Rozas (2023), en su trabajo de grado titulado “Servidor para la Interconexión de Dispositivos IoT de los Laboratorios de Ingeniería Informática e Ingeniería Civil de la UCAB Guayana”, implementó un servidor centralizado en un ordenador monoplaca Raspberry Pi 4 con bróker Eclipse Mosquitto, enlazado a nodos ESP8266 y Arduino mediante el protocolo MQTT y buses I2C para la lectura ambiental y conmutación de relés.

Este trabajo demostró la viabilidad práctica de emplear el protocolo MQTT para el intercambio telemétrico y validó la idoneidad de los microcontroladores de bajo costo de la familia ESP frente a placas tradicionales como Arduino gracias a su conectividad inalámbrica nativa. Para PristinoPlant, representó un caso de estudio sobre las alternativas de despliegue del bróker (local frente a servidor remoto) y fundamentó la selección del ESP32 —por su mayor capacidad de cómputo y memoria frente al ESP8266— acoplado a un bróker privado contenerizado en un VPS en la nube (Docker Compose) bajo canales seguros TLS, garantizando alta disponibilidad 24/7 y acceso remoto frente a la gestión local en un ordenador monoplaca.

Igualmente en la UCAB Guayana, Moreno González (2025), en su trabajo de grado titulado “Plataforma para Facilitar la Construcción y Programación de Estaciones Meteorológicas Orientadas a Estudiantes de Educación Básica”, desarrolló una estación meteorológica basada en el kit SparkFun Weather:bit y microcontrolador BBC Micro:bit, adquiriendo variables atmosféricas enlazadas a un bróker MQTT (Mosquitto/EMQX) y persistencia temporal en InfluxDB.

Dicha investigación validó en el ámbito institucional la idoneidad de InfluxDB para el registro masivo de series temporales climáticas y sirvió como referente de una estación meteorológica tradicional. No obstante, frente a la dependencia de kits prefabricados propietarios y sus altos costos de adquisición e importación, PristinoPlant contrastó este esquema demostrando la viabilidad de una solución de bajo costo basada en sensores independientes accesibles, manufactura aditiva local (garita meteorológica impresa en 3D) y el microcontrolador ESP32, logrando una estación meteorológica automática funcional, económica y autónoma.

## **Bases teóricas**

### **De la agricultura de precisión al Internet de las Cosas (IoT).**

La gestión agrícola tradicional ha dependido históricamente de la inspección visual empírica y de cronogramas rígidos de irrigación, prácticas que resultan altamente vulnerables ante las fluctuaciones climáticas y propician el desperdicio de recursos hídricos o la proliferación de fitopatógenos (Kim y Lee, 2022). Frente a estas limitaciones, la agricultura de precisión surgió como un paradigma tecnológico orientado a optimizar la toma de decisiones agronómicas mediante el monitoreo continuo, localizado y en tiempo real de las condiciones del entorno (Prakash et al., 2024).

La articulación de este enfoque con el Internet de las Cosas (IoT) transformó la captura de datos en una infraestructura digital distribuida, en la cual redes de dispositivos embebidos interconectados adquieren, procesan y transmiten telemetría ambiental hacia plataformas de software centralizadas (Majumder et al., 2019). En cultivos protegidos de alto valor botánico, como las orquídeas, la incorporación de arquitecturas IoT proporciona una base empírica para coordinar la conmutación de actuadores de riego y ventilación, mitigando tanto el estrés térmico como el encharcamiento prolongado del sustrato.

### **Arquitectura funcional por capas en sistemas IoT.**

Para garantizar modularidad, escalabilidad e interoperabilidad ante la heterogeneidad del hardware y software, los Sistemas Basados en Internet de las Cosas (IoTS) se estructuran formalmente bajo el modelo arquitectónico de cuatro capas funcionales propuesto por Gubbi et al. (2013):

* **Capa de percepción:** Constituye el estrato físico en contacto directo con el entorno. Agrupa los transductores y sensores encargados de medir las magnitudes analógicas o digitales (temperatura, humedad relativa e iluminancia) y los circuitos acondicionadores de señal gobernados por microcontroladores de borde.
* **Capa de red:** Responsable del transporte seguro y confiable de las tramas telemétricas hacia los servidores de cómputo. Se apoya en estándares de comunicación inalámbrica de corto alcance (Wi-Fi 802.11 b/g/n) y protocolos de mensajería optimizados para redes restringidas.
* **Capa de procesamiento:** Representa el núcleo analítico y de persistencia del sistema, desplegado bajo esquemas de computación en la nube (*Cloud Computing*) o en el borde (*Edge Computing*). En este estrato residen los servicios de ingesta masiva de datos, los motores de persistencia temporal y relacional, y los servicios de orquestación lógica desatendida.
* **Capa de aplicación:** Comprende las interfaces hombre-máquina (HMI) y plataformas web accesibles mediante las cuales los operadores supervisan en tiempo real el microclima, configuran agendas operativas, formulan programas agronómicos y administran la trazabilidad comercial del cultivo.

### **Protocolos de comunicación telemétrica en ambientes restringidos (MQTT).**

En los sistemas IoT con nodos sensores alimentados por baterías o enlazados a redes inalámbricas susceptibles a interferencias, los protocolos convencionales basados en el modelo petición-respuesta (como HTTP) introducen una sobrecarga inadmisible en el tamaño de las cabeceras y en el consumo energético (OASIS, 2014). Por esta razón, el estándar *Message Queuing Telemetry Transport* (MQTT) se consolidó como el protocolo de referencia para la transmisión de telemetría y el gobierno de actuadores en arquitecturas M2M (*Machine-to-Machine*).

MQTT se fundamenta en un patrón de comunicación desacoplado de Publicación/Suscripción (*Pub/Sub*), orquestado por un bróker central (como *Eclipse Mosquitto*). Los nodos de percepción publican cargas útiles (*payloads*) en formato binario o JSON bajo tópicos jerárquicos (p. ej., `pristinoplant/weather/exterior`), mientras que los microservicios backend reciben la información sin que los emisores requieran conocer la dirección de red de los destinatarios. Asimismo, MQTT contempla tres niveles de Calidad de Servicio (*Quality of Service*, QoS) que regulan la certeza de entrega del mensaje: *at most once* (QoS 0), *at least once* (QoS 1) y *exactly once* (QoS 2). En entornos de producción, este tráfico se canaliza sobre sockets TCP/IP protegidos con cifrado de capa de transporte (TLS/SSL), salvaguardando la integridad de los comandos de conmutación de potencia.

### **Persistencia de series temporales frente a modelos relacionales.**

En arquitecturas IoT coexisten dos paradigmas de almacenamiento con propósitos diferenciados. Los sistemas de bases de datos relacionales estructuran la información mediante esquemas normalizados y propiedades ACID, resultando idóneos para la gestión transaccional de identidades, inventarios y configuraciones del sistema.

Por su parte, las bases de datos de series temporales (*Time Series Database*, como InfluxDB) están especializadas en la ingesta continua de mediciones cronológicas a alta frecuencia. Estos motores implementan compresión temporal y funciones de agregación nativas, evitando la degradación de índices que sufren los modelos relacionales ante flujos masivos de telemetría y permitiendo consultas históricas eficientes por ventanas de tiempo.

### **Sistemas basados en reglas y motores de inferencia determinísticos.**

En la ingeniería de sistemas automatizados, Pressman (2010) define un motor de reglas (*Rule Engine*) como un componente de software que evalúa de forma desacoplada un conjunto de proposiciones lógicas (*si [condición], entonces [acción]*) contra el estado actual de los hechos almacenados en el sistema. 

En el contexto de la agricultura inteligente, la integración de motores de inferencia determinísticos permite conferir autonomía deliberativa al sistema de riego. En lugar de depender de temporizadores ciegos, el motor analiza en tiempo real las condiciones meteorológicas inmediatas (presencia de lluvia, caídas térmicas abruptas o saturación higrométrica), contrastándolas con matrices de decisión agronómicas para determinar si una tarea programada debe ejecutarse, diferirse o ser vetada preventivamente. Este enfoque desacopla la política de decisión del código de control de bajo nivel, posibilitando calibrar y evolucionar los umbrales de decisión sin alterar la arquitectura del firmware.

### **Parámetros microclimáticos críticos para la inferencia agronómica.**

El comportamiento biológico de las orquídeas epífitas en ambientes controlados se encuentra gobernado por un conjunto de magnitudes físicas que actúan como variables de entrada prioritarias para los algoritmos de control:

* **Temperatura y gradiente nictemeral:** La respuesta vegetal está condicionada por la alternancia térmica. El diferencial de temperatura entre el día y la noche (**termoperiodo**, $\Delta T = T_{\text{día}} - T_{\text{noche}}$) actúa como el disparador endocrino de la inducción floral. Asimismo, temperaturas sostenidas por encima de $34^\circ\text{C}$ provocan el cierre estomático foliar y exigen rutinas de enfriamiento evaporativo en el suelo del orquideario.
* **Humedad relativa (HR) y Déficit de Presión de Vapor (VPD):** La humedad relativa determina la tasa de evaporación en la lámina foliar. No obstante, el indicador biofísico más riguroso es el **Déficit de Presión de Vapor** ($VPD$, expresado en kilopascales, $\text{kPa}$), el cual cuantifica la diferencia entre la presión de vapor de saturación a la temperatura de la hoja y la presión de vapor real del aire. Un $VPD$ equilibrado ($0.8$ a $1.2\text{ kPa}$) favorece la transpiración adecuada y la absorción de nutrientes, mientras que valores elevados ($> 1.8\text{ kPa}$) inducen deshidratación foliar severa.
* **Iluminancia y radiación fotosintéticamente activa (PAR):** Las orquídeas requieren luz solar difusa (medida telemétricamente en luxes o $\mu\text{mol}\cdot\text{m}^{-2}\cdot\text{s}^{-1}$), evitando la radiación cenital directa que ocasiona quemaduras necróticas foliares por fotooxidación.
* **Dinámica radicular y prevención de anoxia:** Las raíces epífitas están recubiertas por el *velamen radicular*, un tejido esponjoso especializado que capta humedad por capilaridad en segundos pero requiere una rápida aireación posterior. La saturación hídrica continua por riegos excesivos elimina el oxígeno en el medio poroso, desencadenando la asfixia del tejido radicular (**anoxia**) y la proliferación letal de oomicetos fúngicos del suelo (*Phytophthora cactorum*).

*(Para un estudio exhaustivo sobre la diversidad botánica, los condicionantes fisiológicos ex situ y las tablas de nutrición mineral de la familia Orchidaceae que respaldan las mezclas del sistema, véase el **Apéndice E**)*.

## **Terminología básica**

* **Bróker MQTT:** Servidor de software centralizado en una red MQTT que recibe las publicaciones de datos desde los nodos sensores y las distribuye de manera desacoplada hacia los clientes suscritos a tópicos específicos.
* **Calidad de Servicio (Quality of Service - QoS):** Atributo del protocolo MQTT que define el nivel de garantía y confirmación de entrega en la transmisión de un mensaje entre clientes y bróker (QoS 0: entrega sin confirmación; QoS 1: entrega con confirmación obligatoria; QoS 2: entrega unívoca garantizada).
* **Computación en el Borde (Edge Computing):** Paradigma arquitectónico donde el procesamiento preliminar, filtrado y validación de las señales físicas se ejecuta directamente en los nodos de campo o microcontroladores locales, reduciendo la latencia y la saturación del canal de red.
* **Déficit de Presión de Vapor (Vapor Pressure Deficit - VPD):** Magnitud física calculada a partir de la temperatura y la humedad relativa que representa la diferencia entre la cantidad de vapor de agua contenida en el aire y la cantidad máxima que este podría retener a saturación; constituye el indicador bioclimático rector para evaluar la transpiración y el estrés vegetal.
* **Gemelo Digital (Digital Twin):** Representación computacional abstracta y estructurada de un espécimen botánico o componente físico presente en el orquideario (`SeedPlant`), enlazando sus características taxonómicas, ubicación física y estado fenológico con la base de datos de gestión.
* **Microclima:** Conjunto localizado y delimitado de condiciones atmosféricas (temperatura, humedad relativa, radiación solar y flujo de aire) existente en el interior de una estructura de cultivo o zona específica del orquideario.
* **Telemetría:** Técnica automatizada de medición y recopilación remota de magnitudes físicas a través de sensores instrumentados en campo, transmitiendo los datos mediante canales de comunicación hacia sistemas centrales de cómputo para su registro y análisis.
* **Velamen Radicular:** Manto epidérmico multiseriado de células lignificadas muertas que recubre las raíces de las orquídeas epífitas; actúa como una esponja capilar para la absorción de humedad y aislamiento térmico, demandando secado intermitente para prevenir anoxia tisular.