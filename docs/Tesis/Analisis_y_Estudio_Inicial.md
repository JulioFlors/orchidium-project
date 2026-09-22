# Capítulo IV: Desarrollo y Resultados

En este capítulo se detalla el proceso de desarrollo del Sistema de Gestión de Invernaderos para PristinoPlant bajo el marco de la metodología incremental, comenzando con el análisis de requerimientos de la plataforma agronómica, seguido por el diseño arquitectónico modular del sistema, la capa de comunicación e interconectividad IoT y el circuito hidráulico de riego autónomo. Posteriormente, se documenta la construcción del hardware, firmware, infraestructura IoT y la plataforma de software, organizados en seis iteraciones funcionales. En cada una de estas etapas se adaptó la filosofía de la metodología TDDM4IoTS, orientando el proceso hacia un ciclo continuo de integración, despliegue en producción y refactorización. Esto permitió corregir las desviaciones operativas detectadas en producción antes de consolidar el cierre de cada iteración. Finalmente, se presentan los resultados del comportamiento y puesta en marcha del sistema integrado en el orquideario, certificando la autonomía de las decisiones de irrigación y la entrega de la documentación técnica mediante los manuales correspondientes.

---

## Análisis y Estudio Inicial

La fase de análisis y estudio inicial se sitúa estrictamente en el espacio del problema, respondiendo a la interrogante rectora de la investigación: ¿cuál es la problemática agronómica y operativa en el orquideario y qué necesita el cultivador para asegurar la preservación biológica y la eficiencia en la gestión de sus plantas? Desde la perspectiva del operador de PristinoPlant, esta etapa diagnostica las carencias del entorno preexistente y formaliza las necesidades funcionales indispensables para superar la administración manual y empírica.

**Diagnóstico del entorno operativo y levantamiento de información.** Con el propósito de caracterizar la situación de partida y reconociendo la ausencia total de instrumentación de agricultura de precisión o registros digitalizados en las instalaciones del orquideario (un área de cultivo protegida de aproximadamente $45\text{ m}^2$), se ejecutó el diagnóstico de campo mediante las técnicas descritas en el marco metodológico. A través de inspecciones técnicas directas y entrevistas no estructuradas con el cultivador, se examinaron las rutinas de trabajo, los tiempos dedicados a la manipulación hídrica y fitosanitaria, y las dificultades de control en las mesas de cultivo.

**Caracterización de problemáticas agronómicas y operativas.** El levantamiento evidenció que el manejo del orquideario se sustentaba en prácticas tradicionales altamente vulnerables a la variabilidad ambiental de Ciudad Guayana, identificándose tres problemáticas centrales:

***Riego empírico y vulnerabilidad microclimática.*** La rutina de riego por aspersión se ejecutaba de forma manual mediante manguera convencional bajo una frecuencia interdiaria rígida, desprovista de soporte instrumental y sujeta exclusivamente a la apreciación visual y la palpación empírica del cultivador para evaluar el estado del sustrato. En el contexto de un clima tropical cálido caracterizado por contrastes abruptos entre radiación solar intensa, días de lluvia continua y eventos de lluvias intermitentes, este esquema empírico introducía una severa fragilidad operacional ante las dos estaciones del año:
1. *Incertidumbre y asfixia radicular en temporada lluviosa:* Durante el régimen pluvial, el comportamiento atmosférico suele mantener condiciones de cielo encapotado y alta humedad ambiental durante días continuos sin que necesariamente se produzca precipitación directa sobre el orquideario. En ausencia de registros históricos y de instrumentación telemétrica in situ, el cultivador enfrentaba la imposibilidad de evaluar la tasa de evaporación real del sustrato poroso (corteza de pino y carbón vegetal), careciendo de criterios objetivos para determinar cuándo era seguro reanudar el riego. Esta ceguera operativa provocaba dos desviaciones críticas: o bien se regaba sobre un sustrato todavía saturado, asfixiando el velamen radicular y desatando la proliferación letal de hongos fitopatógenos del suelo (*Phytophthora cactorum* y *Pythium ultimum*, causantes de la pudrición negra), o bien se postergaba la hidratación de forma excesiva por temor al encharcamiento, deshidratando las raíces superficiales.
2. *Desfase temporal y degradación microclimática estival:* Durante la temporada seca, si bien la frecuencia interdiaria de riego se cumplía con mayor regularidad, el esquema manual no resolvía la pérdida de confort microclimático que ocurría horas después. El riego por aspersión de las mesas se ejecutaba estrictamente al amanecer (alrededor de las 6:00 a.m.) para evitar que el sol directo quemara el follaje húmedo. Sin embargo, las condiciones atmosféricas agresivas tenían lugar entre las 11:00 a.m. y las 3:00 p.m., intervalo en el cual la humedad relativa ambiental descendía hasta valores críticos cercanos al 45% y las temperaturas superaban los $34^\circ\text{C}$. En esta franja horaria, el problema no radicaba en la necesidad de un nuevo riego sobre el sustrato de las plantas —lo que resultaría contraproducente bajo radiación cenital—, sino en que el microclima circundante dejaba de ser óptimo, provocando el cierre estomático foliar y un agudo estrés térmico ante la ausencia de métodos para regular o mitigar oportunamente tales condiciones ambientales.
3. *Limitaciones para la humidificación y enfriamiento manual:* Humidificar el ambiente resultaba inviable sin instrumentación técnica especializada que evitara mojar directamente las plantas en las horas de mayor calor. La única alternativa del cultivador consistía en colocar una manguera abierta en el suelo por tiempo indefinido para inducir enfriamiento por evaporación. Este método empírico resultaba sumamente ineficiente: desperdiciaba agua, generaba encharcamientos en puntos aislados sin cobertura uniforme, dependía de la presencia constante del operador y carecía de datos ambientales para evaluar su efectividad real.

***Falta de registros y seguimiento en la dosificación de insumos.*** En el cultivo de orquídeas, la nutrición mineral y la sanidad vegetal demandan la planificación de programas rotativos y repetitivos estructurados en ciclos secuenciales: esquemas de fertilización que alternan periódicamente insumos para el desarrollo vegetativo, mantenimiento radicular y floración, así como rotaciones continuas de moléculas fungicidas e insecticidas indispensables para mitigar la resistencia biológica de plagas y patógenos (cuyas bases biológicas, requerimientos de macronutrientes y pautas de nutrición para la familia *Orchidaceae* se consolidan en el **Apéndice E**). Aunque el cultivador disponía del criterio técnico sobre los productos químicos y biológicos aptos para la familia *Orchidaceae*, la gestión práctica de estas labores era sumamente precaria. El problema central no residía en la selección o preparación de las mezclas, sino en la ausencia absoluta de un registro de las aplicaciones efectivamente ejecutadas y la inexistencia de una agenda proyectada en el tiempo. Al no documentarse qué insumo se dosificó en cada mesa ni planificarse anticipadamente las fechas de los siguientes pasos del ciclo, el seguimiento dependía de la memoria del operador. Esta desorganización causaba que los programas rotativos se interrumpieran con frecuencia, se dosificaran productos de forma reactiva o desfasada, y se perdiera la continuidad cronológica indispensable para el desarrollo biológico del cultivo.

***Descontrol de inventario y pérdida de trazabilidad botánica.*** En las mesas de cultivo prevalecía un marcado descontrol de inventario, gestionado mediante apreciaciones globales de volumen sin individualización de contenedores. Dado que las orquídeas constituyen especímenes de alto valor botánico y comercial con dinámicas de crecimiento heterogéneas, la falta de un registro unívoco por maceta impedía conocer con precisión el stock disponible por género y especie, su etapa biológica (plántula, crecimiento, madurez floral) y su ubicación física. Asimismo, se perdía por completo el registro fenológico de cada ejemplar: fecha de apertura de la vara floral, duración en días de la flor y frecuencia de floración anual, privando al cultivador de indicadores biológicos clave para seleccionar especímenes élite y limitando la comercialización hacia clientes finales al no disponer de un catálogo digital fidedigno.

**Definición de necesidades del usuario y áreas de demanda funcional.** Para resolver las limitaciones diagnosticadas y transformar la operación del orquideario hacia un modelo tecnificado, el análisis determinó cuatro áreas de demanda funcional que delimitan lo que el usuario y el cultivo requieren del sistema:
1. *Demanda de control microclimático y tecnificación hídrica:* Necesidad de supervisar de forma continua las variables atmosféricas hiperlocales ($T, HR, Lux, VPD$) y conferir autonomía deliberativa al riego mediante reglas algorítmicas capaces de autorizar, posponer o cancelar la irrigación según las condiciones climáticas del momento, erradicando el riego empírico y protegiendo al cultivo de la asfixia radicular y el estrés térmico.
2. *Demanda de dosificación y laboratorio agronómico:* Necesidad de centralizar el catálogo de insumos y formulaciones compuestas, estructurar programas agronómicos rotativos y repetitivos que definan la secuencia de aplicación de cada producto, y coordinar cronogramas con una agenda proyectada y registro histórico de ejecuciones que garantice el cumplimiento estricto de los planes nutricionales y fitosanitarios.
3. *Demanda de inventario botánico unívoco (Gemelos digitales):* Necesidad de modelar digitalmente cada espécimen en maceta de forma individualizada (`SeedPlant`), registrando su especie taxonómica, tamaño de contenedor y localización física en mesas, suprimiendo el descontrol de inventario.
4. *Demanda de trazabilidad fenológica y canal comercial:* Necesidad de registrar y procesar las variables de inflorescencia por ejemplar para identificar las plantas con mejor desempeño biológico, enlazando dicho inventario con un catálogo público de comercio electrónico para la venta directa al consumidor.

---

## Requerimientos del Sistema

Como resultado formal de la fase de análisis y estudio inicial, y en correspondencia con las pautas normativas de los estándares **IEEE 830** (y su evolución **ISO/IEC/IEEE 29148**) e **ISO/IEC 25010** —cuyos marcos y taxonomías de calidad se detallan en el **Apéndice A**—, se consolidó la **Especificación de Requerimientos del Sistema (SRS)**. Esta matriz sintetiza el comportamiento funcional y los atributos de calidad indispensables para satisfacer las necesidades operativas del orquideario mediante un Sistema Basado en Internet de las Cosas (IoTS).

**Requerimientos funcionales (RF).** Los requerimientos funcionales definen las capacidades y operaciones que el sistema debe ejecutar. Se encuentran agrupados en siete (7) módulos operativos en la Tabla 1.

#### Tabla 1. *Requerimientos Funcionales del Sistema PristinoPlant*

| Cód. | Descripción |
| :---: | :--- |
| **Módulo I** | **Seguridad y Acceso** |
| **RF01** | Gestionar el registro y autenticación de usuarios mediante credenciales, administrando el control de acceso basado en roles. |
| **Módulo II** | **Comercio Electrónico y Gestión de Ventas** |
| **RF02** | Explorar el catálogo botánico de la tienda con búsqueda de texto y filtros dinámicos por género y categoría. |
| **RF03** | Consultar la información botánica de la especie, galería de imágenes, precios por tamaño de maceta y disponibilidad para añadir al carrito. |
| **RF04** | Gestionar los productos seleccionados, actualizar cantidades por tamaño de maceta y calcular los subtotales de compra en tiempo real. |
| **RF05** | Gestionar datos de facturación y entrega, registrar el método de pago seleccionado y canalizar la verificación manual del pago de la orden multimoneda. |
| **RF06** | Conciliar pagos de pedidos online, autorizar despachos y registrar ventas comerciales directas realizadas en el orquideario. |
| **Módulo III** | **Inventario Físico y Gemelos Digitales** |
| **RF07** | Administrar el catálogo botánico de especies, registrando datos taxonómicos, referencias de floración y documentación fotográfica. |
| **RF08** | Registrar y gestionar plantas físicas individuales en invernadero, controlando su tamaño de maceta, estado y ubicación en mesas de cultivo. |
| **RF09** | Vincular variantes comerciales con el stock físico en mesa, fijar precios en USD y procesar avisos de reposición a clientes interesados. |
| **Módulo IV** | **Dosificación y Laboratorio Agronómico** |
| **RF10** | Administrar el inventario de agroquímicos puros y formular recetas de mezclas compuestas con proporciones de dilución balanceadas. |
| **RF11** | Configurar programas nutricionales y fitosanitarios por ciclos rotativos secuenciales para mitigar la resistencia biológica. |
| **RF12** | Programar la ejecución manual o automatizada de planes agronómicos, determinando día de la semana, hora de inicio y zonas de aplicación. |
| **Módulo V** | **Telemetría y Monitoreo Ambiental** |
| **RF13** | Capturar de forma continua la telemetría ambiental transmitida por los nodos meteorológicos. |
| **RF14** | Procesar consolidados diarios e indicadores agronómicos por zona de cultivo, visualizando datos climáticos en tiempo real y procesados. |
| **RF15** | Monitorear y caracterizar eventos de lluvia en el orquideario, registrando la presencia, duración temporal y finalización de la precipitación. |
| **Módulo VI** | **Operaciones Hidráulicas y Riego Autónomo** |
| **RF16** | Conmutar manualmente actuadores hidráulicos con auto-apagado y gestionar colas de tareas diferidas con posibilidad de cancelación. |
| **RF17** | Automatizar rutinas de riego mediante programación recurrente, regulándolas con vetos y espaciamiento reactivo ante el microclima. |
| **RF18** | Auditar el historial de operaciones hídricas, registrando duración real, operador, origen de la tarea y causas de veto ambiental. |
| **Módulo VII** | **Notificaciones del Sistema** |
| **RF19** | Emitir notificaciones y alertas al usuario ante eventos operativos, estados del sistema o requerimientos de confirmación interactiva. |

*Nota.* Fuente: Elaboración propia a partir del análisis de requerimientos del sistema.

**Requerimientos no funcionales (RNF).** En la Tabla 2 se establecen las restricciones de ingeniería, niveles de servicio y atributos de calidad de la infraestructura implementada, catalogados bajo el estándar **ISO/IEC 25010**.

#### Tabla 2. *Requerimientos No Funcionales del Sistema PristinoPlant*

| Cód. | Categoría ISO 25010 | Descripción |
| :---: | :--- | :--- |
| **RNF01** | Restricción de Infraestructura | Disponer de una adecuada cobertura de red inalámbrica Wi-Fi en el orquideario para asegurar una conexión continua de los nodos embebidos. |
| **RNF02** | Confiabilidad y Resiliencia | Retomar operaciones tras cortes eléctricos o inestabilidad Wi-Fi, garantizando su ejecución segura únicamente dentro de una ventana de oportunidad válida. |
| **RNF03** | Mantenibilidad y Modularidad | Desacoplar funcionalmente las capas de adquisición de borde, persistencia, orquestación y presentación para facilitar el mantenimiento del sistema. |
| **RNF04** | Tolerancia a Fallos | Detectar fallas en sensores de estaciones meteorológicas, intentar restablecer la operatividad telemétrica de forma autónoma y reflejar el incidente en logs del sistema. |
| **RNF05** | Eficiencia en Dispositivos | Garantizar disponibilidad continua superior a 24 horas mediante ejecución en bytecode, mitigación de fragmentación de memoria y resiliencia autónoma de red. |
| **RNF06** | Seguridad de la Información | Cifrar todas las comunicaciones entre nodos de campo, servidor y aplicación web mediante estándares criptográficos seguros. |
| **RNF07** | Capacidad y Persistencia | Almacenar el histórico de datos telemétricos sin restricciones de tiempo ni caducidad forzada, asegurando disponibilidad para análisis a largo plazo. |
| **RNF08** | Trazabilidad y Auditoría | Garantizar la trazabilidad integral de todo evento del sistema: decisiones de riego autónomo, accionamientos hidráulicos, telemetría ambiental y diagnóstico de los nodos. |
| **RNF09** | Mantenibilidad y Diagnóstico | Monitorear y depurar el estado operativo de los nodos embebidos de forma remota desde la interfaz web, sin requerir conexión física en campo. |

*Nota.* Fuente: Elaboración propia fundamentada en la taxonomía de calidad ISO/IEC 25010.

**Matriz de trazabilidad entre módulos y requisitos.** La Tabla 3 detalla la correspondencia entre los módulos del sistema, los requerimientos especificados y los componentes o servicios donde se materializa su ejecución.

#### Tabla 3. *Matriz de Correspondencia Modular, Nivel de Ejecución y Evidencia de Interfaz*

| Módulo Funcional | Requisitos Asociados | Componente / Servicio | Nivel de Ejecución | Evidencia de Interfaz (Apéndice F) |
| :--- | :---: | :--- | :--- | :--- |
| **Módulo I: Seguridad y Acceso** | RF01 | Next.js / Better-Auth / PostgreSQL | Servidor Web / Cloud | Autenticación y roles base |
| **Módulo II: Comercio Electrónico y Ventas** | RF02 – RF06 | Next.js (Shop) / Zustand / WhatsApp API | Servidor Web / Cliente | Figuras Ap-F19 a Ap-F24 (Flujo 5) |
| **Módulo III: Inventario y Gemelos Digitales** | RF07 – RF09 | Next.js (Inventory) / Prisma ORM | Servidor Web / Base de Datos | Figuras Ap-F10 a Ap-F15 (Flujo 3) |
| **Módulo IV: Dosificación y Laboratorio** | RF10 – RF12 | Next.js (Lab) / Tablero 24V / Scheduler | Web / Microservicio | Figuras Ap-F6 a Ap-F9 (Flujo 2) |
| **Módulo V: Telemetría y Monitoreo** | RF13 – RF15 | Nodos EMA (ESP32) / Mosquitto / InfluxDB | Borde (Edge) / Docker VPS | Figuras Ap-F16 a Ap-F18 (Flujo 4) |
| **Módulo VI: Operaciones y Riego Autónomo** | RF16 – RF18 | Nodo Actuador (ESP32) / Scheduler Engine | Borde (Edge) / Docker VPS | Figuras Ap-F1 a Ap-F5 (Flujo 1) |
| **Módulo VII: Notificaciones del Sistema** | RF19 | Servicio Ingest / WebSocket / UI Banner | Microservicio / Frontend | Figuras Ap-F1, Ap-F3 y Ap-F5 |

*Nota.* Fuente: Elaboración propia a partir de la descomposición modular del sistema. La materialización visual de cada pantalla y la interacción en los flujos operativos de extremo a extremo se detallan en el **Apéndice F**.

Con la formalización de esta especificación de requerimientos concluye la fase de **Análisis y Estudio Inicial**, proporcionando la línea base funcional y no funcional que guía la siguiente etapa del capítulo: el **Diseño Conceptual del Sistema**.

