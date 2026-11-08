# Guion Rector para la Defensa de Grado (30 Minutos)

> **Trabajo Instrumental de Grado:** *Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas*  
> **Autor:** Julio César Flores Silva | **Tutor Académico:** Prof. José Francisco Fonseca Droy  
> **Tutor Empresarial:** Ing. Richard José García Martínez | **Institución:** Universidad Católica Andrés Bello (UCAB Guayana)  
> **Fecha de Defensa:** Noviembre, 2026

---

## Parámetros de Calibración y Gobernanza Temporal

* **Tono Académico Impersonal y Autoría Individual:** En estricta concordancia con las Normas APA de la UCAB y el estilo del informe técnico [FloresJulioInformeTG.md](file:///c:/Dev/pristinoplant/docs/Tesis/FloresJulioInformeTG.md), la redacción adopta la **voz impersonal y pasiva refleja** (*«se diseñó / se implementó / se evaluó / se constató / se formalizó»*). Esto preserva la sobriedad científica de un proyecto de ingeniería de autoría individual sin incurrir en primera persona singular informal (*«diseñé / identifiqué»*) ni en primera persona plural (*«nosotros / diseñamos»*).
* **Total de Diapositivas:** 60 láminas correlativas (Numeradas del 1 al 60).
* **Alineación con el Informe Escrito:** Todo el vocabulario, conceptos técnicos, siglas y taxonomía se apegan rigurosamente a las definiciones formales del informe escrito.
* **Integración Oral Requerida:** Cada fragmento de discurso incorpora de forma explícita, elegante y fluida el **Título** y el **Subtítulo** de la lámina proyectada, asegurando sincronía total entre lo que el jurado ve en pantalla y lo que escucha.
* **Tiempo Total Reglamentario:** 30 minutos (1.800 segundos).
* **Tiempo Efectivo de Exposición Oral:** **~25 min 00 s a 26 min 00 s** (4180 palabras a un ritmo estándar de 135-140 ppm).
* **Colchón de Reserva:** **~4 a 5 minutos libres** para transiciones, respiración, énfasis en gráficos y pausas del jurado.
* **Puntos de Control de Reloj (Checkpoints):**
  * **05:50 min:** Culminación de Apertura, Fundamentación y Metodología (Lámina 10).
  * **11:40 min:** Culminación de Fases de Análisis y Diseño (Lámina 24).
  * **23:45 min:** Culminación de los 7 Incrementos de Construcción (Lámina 53).
  * **25:15 min:** Culminación de Validación y Documentación (Lámina 56).
  * **27:05 min:** Conclusiones, Recomendaciones Técnicas y Cierre (Láminas 57 a 60).

---

## GUION FLUIDO PARA LA DEFENSA (DISCURSO CONTINUO)

> [!TIP]
> **Instrucciones para el Expositor:**  
> Esta sección reúne la totalidad del discurso oral de las 60 láminas de manera continua y sin tablas ni interrupciones visuales intermedias. Puedes leerla o ensayarla de principio a fin manteniendo un ritmo sereno y constante (~135-140 ppm). Cada párrafo inicia con una etiqueta guía de lámina `[Lámina XX]` para que sepas exactamente en qué momento cambiar la diapositiva en el pasador o mando a distancia.

### Bloque I: Apertura, Fundamentación y Metodología (Láminas 1 a 10)

**[Lámina 1: Portada]**  
Muy buenos días. Damos inicio a la defensa del Trabajo Instrumental de Grado titulado: Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente para el Cultivo de Orquídeas.

**[Lámina 2: Índice de Contenido]**  
Se presenta la estructura de la defensa en seis capítulos: se inicia con el problema agronómico y los objetivos; se exponen las bases teóricas y metodológicas; se profundiza en la ingeniería y resultados de los siete incrementos funcionales, la validación en campo, concluyendo con las recomendaciones técnicas y una demostración del proyecto implementado. A continuación, se aborda el problema agronómico en el orquideario.

**[Lámina 3: Planteamiento del Problema]**  
Al abordar el Planteamiento del Problema, se transiciona de la gestión empírica al control autónomo y trazable en el cultivo de orquídeas. En la situación actual de PristinoPlant se identificaron cuatro limitaciones operativas críticas: primero, un riego empírico interdiario; segundo, un vacío telemétrico ante picos de mayor temperatura y baja humedad relativa combatidos inundando el suelo con manguera; tercero, alto riesgo de asfixia radicular y anoxia por sobre-riego al no controlar el espaciado entre riegos, donde la superficie del sustrato aparenta estar seca mientras el interior permanece húmedo; y cuarto, un desfase operativo en la dosificación de agroquímicos y en la planificación de los ciclos de fertilización y fumigación, dependientes del registro manual llevado por el cultivador. Frente a esto, la propuesta introduce riego deliberativo con vetos automáticos, telemetría continua en garitas 3D bajo MQTTS, eficiencia hídrica y un asistente interactivo en Telegram con patrón Human-in-the-Loop. Para dar respuesta a estas limitaciones, se definió el objetivo general del proyecto.

**[Lámina 4: Objetivo General]**  
Como Objetivo General: Desarrollar un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.

**[Lámina 5: Objetivos Específicos (Parte 1: Analizar y Diseñar)]**  
Objetivos Específicos: Primero, analizar los conceptos y herramientas referentes al cultivo de orquídeas basado en agricultura inteligente, a fin de identificar las características del sistema a desarrollar. Segundo, diseñar en función del análisis realizado, un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.

**[Lámina 6: Objetivos Específicos (Parte 2: Implementar, Validar y Documentar)]**  
Tercero, implementar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, según el diseño realizado. Cuarto, validar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, respecto al análisis realizado. Y quinto, realizar la documentación formal del sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.

**[Lámina 7: Aportes Tecnológicos]**  
Los Aportes Tecnológicos del proyecto se sustentan en una arquitectura reproducible, autonomía deliberativa y transferencia tecnológica: bajo el ODS 9 se demostró que con hardware libre ESP32, manufactura 3D y protocolos abiertos se alcanza confiabilidad industrial sin costosos kits propietarios; se dotó a la instalación de autonomía deliberativa con motores de lluvia virtual y anti-anoxia; y se transfirió este conocimiento técnico a PristinoPlant y la comunidad orquideológica. En el plano operativo y biológico, estos avances sustentan los aportes funcionales.

**[Lámina 8: Aportes Funcionales]**  
En los Aportes Funcionales se destacan la eficiencia hídrica, la resiliencia climática y el valor fenológico y comercial: bajo el ODS 6 se optimizó el agua vetando riegos sobre mojado; bajo el ODS 13 se fortaleció la resiliencia mitigando picos térmicos mediante humectación pasiva en piso; y se crearon gemelos digitales para cada maceta, registrando su floración individual y conectando la trazabilidad botánica directamente con la tienda en línea. Estos aportes se respaldan en las bases científicas y normativas del proyecto.

**[Lámina 9: Marco Teórico]**  
El Marco Teórico integra estándares de ingeniería, protocolos seguros y ecofisiología vegetal en cuatro pilares: se adoptó la arquitectura IoTS de cuatro capas de Gubbi et al.; en telecomunicaciones se implementó MQTT sobre TLS 1.2 en el puerto 8883 para conmutaciones seguras; en persistencia se estructuró un modelo políglota con InfluxDB para series temporales masivas y PostgreSQL para transacciones ACID; y en agronomía se correlacionaron métricas bioclimáticas clave como VPD y DLI. Para gobernar el desarrollo convergente de software, circuitos y tuberías, se adoptó una metodología híbrida.

**[Lámina 10: Marco Metodológico]**  
En el Marco Metodológico se formuló un ciclo de vida híbrido adaptado a la convergencia hardware-software. Como macroestructura de gestión se seleccionó el Modelo Incremental de Pressman en siete entregables operativos, respetando las dependencias jerárquicas entre fluidos, potencia y software. En paralelo, como microestructura técnica se adoptó TDDM4IoTS de Guerrero-Ulloa, ejecutando ciclos de pre-implementación en banco de pruebas, despliegue a la intemperie y refactorización guiada por observabilidad. Bajo esta rigurosidad metodológica, se entra al Capítulo IV para examinar la ingeniería del sistema.

***

### Bloque II: Fases de Análisis y Diseño (Láminas 11 a 24)

**[Lámina 11: Fase 1: Requisitos de Dominio y Entorno]**  
La Fase 1: Requisitos de Dominio y Entorno se inició mediante el diagnóstico agroclimático del cultivo de orquídeas en Guayana. Se constató que las raíces epífitas demandan aireación continua tras humedecerse; registrar 34 °C con 45% de humedad relativa evidenció la necesidad de refrescar el ambiente sin encharcar el sustrato, previniendo la letal asfixia radicular. A partir de esta ecofisiología se definieron los requerimientos funcionales del sistema.

**[Lámina 12: Fase 1: Requisitos Funcionales del Sistema]**  
Al evaluar la Fase 1: Requisitos Funcionales del Sistema, se priorizaron cuatro capacidades operativas clave: sectorización hidráulica independiente entre aspersión y nebulización; telemetría climática local en tiempo real; formulación asistida de mezclas para agroquímicos; y un bot interactivo en Telegram con patrón Human-in-the-Loop para autorizar aplicaciones en campo. En paralelo, se delimitaron los requisitos no funcionales que rigen el rendimiento.

**[Lámina 13: Fase 1: Requisitos No Funcionales y Criterios]**  
En la Fase 1: Requisitos No Funcionales y Criterios se establecieron metas estrictas de fiabilidad, latencia, seguridad y autonomía operativa: respuesta electromecánica sub-dos segundos desde la orden web; operación fail-safe ante pérdida de enlace; transporte cifrado punto a punto mediante MQTTS bajo TLS 1.2; y modos de reposo profundo en nodos móviles a batería. Con estos requerimientos formalizados, se seleccionaron las tecnologías del proyecto.

**[Lámina 14: Fase 1: Selección del Stack Tecnológico]**  
El análisis concluyó con la Fase 1: Selección del Stack Tecnológico, apostando a una convergencia de tecnologías robustas y de código abierto: microcontroladores ESP32 por su bajo coste y doble núcleo; MicroPython con corrutinas uasyncio; Docker con PostgreSQL e InfluxDB; y Next.js con Tailwind CSS para un panel de supervisión reactivo. Se avanzó a la Fase 2 para estructurar el diseño conceptual de la plataforma.

**[Lámina 15: Fase 2: Arquitectura Conceptual (C4)]**  
En la Fase 2: Arquitectura Conceptual C4 se implementó una descomposición modular en tres capas de responsabilidad aislada: la Capa de Campo ejecuta censado y conmutación con guardas locales; la Capa de Servidor centraliza el bróker Mosquitto, la ingesta telemétrica y el microservicio orquestador Scheduler; y la Capa de Usuario provee la aplicación web y el bot móvil. En la capa de servidor, la naturaleza heterogénea de los datos exigió un diseño híbrido.

**[Lámina 16: Fase 2: Modelo de Datos Híbrido]**  
Para la persistencia se diseñó la Fase 2: Modelo de Datos Híbrido, garantizando la coexistencia de base de datos relacional y series temporales: PostgreSQL mediante Prisma ORM administra usuarios, especies botánicas e inventario; mientras InfluxDB absorbe ráfagas telemétricas continuas sin colapsar índices, y Cloudflare R2 almacena las fotografías botánicas. Esta base de datos alimenta de forma continua la lógica deliberativa de riego.

**[Lámina 17: Fase 2: Flujo de Deliberación y Riego]**  
La inteligencia del sistema reside en la Fase 2: Flujo de Deliberación y Riego, que gobierna el ciclo de decisión del Scheduler y la supervisión determinista de vetos: cada sesenta segundos consulta tareas programadas, verifica en InfluxDB que no exista lluvia ni saturación previa, y solo en condiciones seguras despacha la orden hacia el hardware con confirmación. En la Fase 3 se concretó la topología física y la infraestructura contenerizada.

**[Lámina 18: Fase 3: Selección de Hardware y Topología]**  
En la Fase 3: Selección de Hardware y Topología se definió la distribución física de nodos y buses de instrumentación: se estructuró una topología distribuida en estrella con un nodo actuador central en el tablero eléctrico comandando la hidráulica, y dos estaciones satelitales capturando el microclima exterior e interior enlazadas mediante una red Wi-Fi dedicada. En el servidor, estos flujos convergen en un entorno contenerizado.

**[Lámina 19: Fase 3: Arquitectura de Servicios en Docker]**  
La Fase 3: Arquitectura de Servicios en Docker consolida la orquestación modular en VPS mediante Docker Compose: se desacoplaron siete contenedores independientes que albergan el bróker Mosquitto, el servicio de ingesta, el planificador Scheduler, las bases de datos relacional y temporal, n8n y la interfaz web, asegurando portabilidad, escalabilidad y aislamiento entre procesos. La mensajería distribuida entre contenedores y nodos de campo se rige por MQTT.

**[Lámina 20: Fase 3: Comunicación y Mensajería MQTT]**  
La Fase 3: Comunicación y Mensajería MQTT estructuró la topología Pub/Sub, la jerarquía de tópicos y la entrega confiable con QoS 1: se organizaron canales estrictos para comandos, estados y telemetría, empleando tramas JSON compactas de menos de 180 bytes protegidas con certificados TLS 1.2 sobre el puerto 8883 para blindar las órdenes de conmutación. Se entra a la Fase 4 para revisar los planos y algoritmos de detalle.

**[Lámina 21: Diseño Detallado: Tablero y Circuito Eléctrico]**  
En el Diseño Detallado: Tablero y Circuito Eléctrico se concibió la distribución de potencia trifrontal en 110VAC, 24VAC y 5VDC: se segregó físicamente la fuerza motriz de la bomba con guardamotor, la alimentación de 24 voltios alternos para electroválvulas y los 5 voltios regulados para el microcontrolador, eliminando reinicios espurios por inducción electromagnética. En el estrato físico de fluidos, se dimensionó la red presurizada.

**[Lámina 22: Diseño Detallado: Circuito Hidráulico Presurizado]**  
En el Diseño Detallado: Circuito Hidráulico Presurizado se dimensionó la impulsión, filtrado, cebado y distribución modular en cuatro líneas: se seleccionó una bomba periférica de 1 HP a 40 PSI continuos, un filtro de anillas de 120 mesh y un colector cuádruple de electroválvulas para comandar independientemente microaspersión, nebulización y dosificación agronómica. Para gobernar este circuito físico se formuló el firmware asíncrono.

**[Lámina 23: Diseño Detallado: Firmware y Resiliencia en Silicio]**  
El Diseño Detallado: Firmware y Resiliencia en Silicio materializó la concurrencia uasyncio, exclusión mutua y cortes fail-safe en el ESP32: se estructuraron corrutinas independientes para red y conmutación protegidas por cerrojos asyncio.Lock que impiden arranques concurrentes, junto con temporizadores locales por hardware que cierran el paso ante caídas de red. A nivel de servidor, se modeló la deliberación algorítmica.

**[Lámina 24: Diseño Detallado: Motores de Inferencia]**  
El Diseño Detallado: Motores de Inferencia formalizó la deliberación algorítmica determinista para la protección del cultivo: el motor meteorológico infiere eventos pluviales evaluando caídas térmicas acopladas a saltos higrométricos y colapsos solares; mientras el motor hídrico aplica vetos ante lluvia activa, balance interdiario o humedad relativa sostenida mayor a 85%. Con estos modelos completados, se avanzó hacia la fase de construcción e implementación incremental.

***

### Bloque III: Construcción e Implementación Incremental (Láminas 25 a 53)

**[Lámina 25: Incremento 1: Plataforma Base y Modelo de Dominio]**  
La construcción inició con el Incremento 1: Plataforma Base y Modelo de Dominio, enfocado en la configuración del repositorio, diseño UI/UX y modelado de datos: se implementó el esquema relacional en PostgreSQL mediante Prisma ORM para administrar géneros, especies e insumos agroquímicos, validando las operaciones CRUD iniciales que sirvieron de cimiento transaccional para la posterior automatización electromecánica del orquideario. El segundo incremento materializó la red hidráulica y el tablero de potencia.

**[Lámina 26: Incremento 2: Cabezal Hidráulico Presurizado]**  
En el Incremento 2: Cabezal Hidráulico Presurizado se construyó la impulsión, doble línea de entrada y distribución modular en cuatro sectores: se instaló la bomba de 1 HP a 40 PSI, un filtro de anillas de 120 mesh y un colector cuádruple de electroválvulas para conmutar de manera independiente agua limpia o fertilizantes. Estas cuatro líneas se canalizaron hacia las mesas de cultivo.

**[Lámina 27: Incremento 2: Líneas de Riego en Cultivo]**  
El Incremento 2: Líneas de Riego en Cultivo ejecutó el despliegue de microaspersores y cobertura uniforme sobre las orquídeas: se tendieron tuberías aéreas de polietileno de 16 mm sobre las mesas, combinando microaspersores de gota media para el sustrato con boquillas de nebulización para regular la humedad y disipar el calor. Antes de fijar el tablero definitivo, se validó la lógica en banco de pruebas.

**[Lámina 28: Incremento 2: Protoboard y Runtime Base]**  
Mediante el Incremento 2: Protoboard y Runtime Base se logró el primer prototipado del runtime y la verificación electromecánica local: se acopló el ESP32 en banco de pruebas a un módulo de relés optoacoplados, depurando en MicroPython las rutinas de apertura y apagado seguro para garantizar que ninguna señal parásita activara indebidamente las cargas. Estabilizado el prototipo, se ensambló el tablero de grado industrial.

**[Lámina 29: Incremento 2: Tablero Eléctrico Implementado]**  
La potencia se consolidó con el Incremento 2: Tablero Eléctrico Implementado mediante el ensamblaje final con contactor de potencia y aislamiento electromecánico: se montó un gabinete metálico sellado IP65 en el orquideario con contactor industrial para la bomba, transformador de 24 VAC y cableado segregado por canaletas ranuradas, garantizando seguridad frente a la humedad. Con el hardware de campo estabilizado, en el Incremento 3 se desplegó la suite backend.

**[Lámina 30: Incremento 3: Infraestructura Backend Distribuida]**  
El Incremento 3: Infraestructura Backend Distribuida guió la evolución desde Docker local y serverless hasta una nube privada autogestionada: se desplegó una red contenerizada interna que intercomunica el bróker MQTT, la ingesta telemétrica y las bases de datos, garantizando que el reinicio de un contenedor jamás interrumpa la disponibilidad de los demás servicios. La operación y despliegue de esta infraestructura se automatizó mediante DevOps.

**[Lámina 31: Incremento 3: Automatización de Operaciones (DevOps)]**  
En el Incremento 3: Automatización de Operaciones DevOps se consolidaron prácticas de automatización para despliegue continuo en VPS y microcontroladores: se crearon scripts bash para aprovisionamiento con un solo comando, políticas de variables de entorno y respaldos automáticos para PostgreSQL e InfluxDB, reduciendo a minutos la recuperación ante fallos. El tráfico telemétrico de esta suite se canalizó mediante Mosquitto.

**[Lámina 32: Incremento 3: Bróker Mosquitto Autoalojado]**  
En el Incremento 3: Bróker Mosquitto Autoalojado se aplicó segregación de puertos, discriminación de certificados y control de acceso: se implementó cifrado TLS 1.2 en el puerto 8883 y se definieron listas ACL estrictas, de modo que los microcontroladores solo publican telemetría autorizada y el actuador responde únicamente a órdenes firmadas por el planificador. Para comunicar el microcontrolador con este bróker TLS se superó una falla de bajo nivel.

**[Lámina 33: Incremento 3: Driver de Transporte simple2.py]**  
Con el Incremento 3: Driver de Transporte simple2.py se aplicaron parches a bajo nivel contra fugas de memoria, conexiones zombie y bloqueos: la librería oficial de MicroPython bloqueaba el silicio ante pérdidas de red; se desarrolló un driver parchado con sockets no bloqueantes y tiempos de guarda que restablece la sesión TLS limpiamente sin reinicios forzados. Este driver permitió construir un runtime asíncrono sumamente estable.

**[Lámina 34: Incremento 3: Runtime Asíncrono del ESP32]**  
En el Incremento 3: Runtime Asíncrono del ESP32 se desarrolló un núcleo reactivo multitarea para sesiones MQTTS continuas de más de 24 horas: se orquestaron corrutinas concurrentes para recepción de órdenes, latido de salud y un temporizador decreciente por hardware que apaga las válvulas si expira la comunicación, blindando la integridad física del cultivo. Esta organización de software consolidó el enfoque Thin Edge.

**[Lámina 35: Incremento 3: Arquitectura Borde Delgado (Thin Edge)]**  
Mediante el Incremento 3: Arquitectura Borde Delgado Thin Edge se estableció un desacoplamiento funcional entre microcontrolador y servidor en la nube: se trasladó la persistencia pesada y la inferencia al backend, reservando al ESP32 para conmutación y salvaguardas inmediatas, liberando más de 15 kilobytes de memoria RAM y garantizando estabilidad ininterrumpida. En el estrato de aplicación web se construyó el centro de operaciones.

**[Lámina 36: Incremento 3: Servicios Backend y Operaciones]**  
El Incremento 3: Servicios Backend y Operaciones consolidó el desacoplamiento de Ingest y Scheduler junto a interfaces de supervisión: se construyó en la web el módulo de operaciones hidráulicas, permitiendo accionar solenoides manualmente con tiempos seguros, automatizar rutinas periódicas y consultar la bitácora histórica de eventos ejecutados en tiempo real. Con la conmutación hidráulica afianzada, en el Incremento 4 se instrumentó el clima.

**[Lámina 37: Incremento 4: Estaciones Meteorológicas (EMA)]**  
En el Incremento 4: Estaciones Meteorológicas EMA se implementó la captura continua de temperatura, humedad, luz y lluvia en el orquideario: se desplegó la EMA Exterior para caracterizar la intemperie y la EMA Interior para monitorear el microclima entre las mesas, transmitiendo lotes telemétricos cada diez minutos hacia la base de datos InfluxDB. A continuación, se detalla la protección de la instrumentación exterior contra la intemperie.

**[Lámina 38: Incremento 4: Estación Meteorológica Exterior (EMA)]**  
El Incremento 4: Estación Meteorológica Exterior EMA resolvió el monitoreo perimetral a 5VDC y la mitigación de ruido electromagnético en cable Cat6: se elevaron los sensores en un mástil protegido contra la radiación directa con conos impresos en PETG blanco y se empleó cableado apantallado con malla a tierra, evitando lecturas espurias por inducción parásita. Para el monitoreo interno entre las plantas se diseñó una unidad móvil.

**[Lámina 39: Incremento 4: Estación Meteorológica Interior (EMA)]**  
El Incremento 4: Estación Meteorológica Interior EMA materializó una unidad móvil autónoma para registrar el microclima entre las mesas de cultivo: se diseñó una garita Stevenson portátil impresa en 3D con persianas de ventilación natural que opera a batería de litio bajo ciclos de Deep Sleep, permitiendo caracterizar diferentes microclimas sin tender cables. Para resolver fallos electrónicos en campo se implementó una recuperación física.

**[Lámina 40: Incremento 4: Resiliencia y Autorrecuperación Física]**  
En el Incremento 4: Resiliencia y Autorrecuperación Física se introdujo el ciclo de potencia en Relé 8, drenado capacitivo y autoescala lumínica: ante bloqueos transitorios en el bus digital por humedad extrema, el sistema corta la alimentación de los sensores durante 200 milisegundos, restableciendo la captura de datos en dos segundos sin reiniciar el microcontrolador. Estas lecturas continuas alimentan los dashboards agronómicos de la plataforma.

**[Lámina 41: Incremento 4: Caracterización del Microclima]**  
El Incremento 4: Caracterización del Microclima aportó herramientas para caracterizar el microclima interno y externo del orquideario: se desarrollaron las interfaces /monitoring para supervisar variables en tiempo real y /botanics para calcular analítica bioclimática de Déficit de Presión de Vapor y DLI, guiando al cultivador en la gestión científica del estrés térmico vegetal. Para supervisar la salud del hardware desde cualquier ubicación se creó un panel técnico.

**[Lámina 42: Incremento 4: Auditoría Técnica Remota Asíncrona]**  
El Incremento 4: Auditoría Técnica Remota Asíncrona facilitó la supervisión de salud en silicio sin cables y el protocolo asíncrono en reposo: se implementó el panel /admin/iot-debug para auditar intensidad de señal Wi-Fi, memoria libre en microcontroladores y sincronización horaria con el reloj RTC, posibilitando soporte y depuración remota sin desplazar instrumental a campo. Con telemetría continua consolidada, en el Incremento 5 se abordó la autonomía hídrica.

**[Lámina 43: Incremento 5: Inferencia Hídrica y Jerarquía]**  
El Incremento 5: Inferencia Hídrica y Jerarquía introdujo deliberación adaptativa, jerarquía sensorial y vetos agronómicos deterministas: el motor evalúa condiciones climáticas previas a cualquier conmutación, vetando el riego si detecta lluvia activa, cancelando humectación si llovió en las últimas cuatro horas y forzando alternancia interdiaria para impedir que el velamen permanezca saturado. Durante las pruebas de lluvia en campo se enfrentó una falla destructiva del sensor.

**[Lámina 44: Incremento 5: Corrosión del Sensor de Lluvia]**  
En el Incremento 5: Corrosión del Sensor de Lluvia se documentó la electrólisis galvánica acelerada, lluvias ficticias y descarte de transductor: el sensor resistivo convencional sufrió degradación de sus pistas en pocas semanas de intemperie, reportando falsos positivos continuos que paralizaban el riego del invernadero, demostrando la inviabilidad física de placas resistivas expuestas a la lluvia. Ante este obstáculo físico, se innovó sustituyendo el hardware por software e inferencia.

**[Lámina 45: Incremento 5: Inferencia Meteorológica de Lluvia]**  
El Incremento 5: Inferencia Meteorológica de Lluvia desarrolló la detección virtual en ventanas de 10 a 30 minutos por gradientes físicos ambientales: se concibió un motor algorítmico que infiere precipitaciones con base científica, correlacionando caídas bruscas de temperatura con ascensos de humedad y colapsos solares, erradicando para siempre los sensores oxidables. El motor determinó también las condiciones matemáticas exactas de cese pluvial.

**[Lámina 46: Incremento 5: Cese Pluvial y Calibración]**  
El Incremento 5: Cese Pluvial y Calibración implementó cuatro reglas de cese, persistencia de eventos y la herramienta rebuild-rain-history: el motor detecta el fin de la precipitación por estabilización higrométrica o reapertura solar; sometido a simulación histórica frente a la bitácora del cultivador, logró un 100% de sensibilidad ajustada en eventos hídricos relevantes. Con la gobernanza climática completada, en el Incremento 6 se vinculó el orquideario con el comercio.

**[Lámina 47: Incremento 6: Catálogo y Trazabilidad Individual]**  
En el Incremento 6: Catálogo y Trazabilidad Individual se logró la organización botánica, carga multimedia en nube y control unívoco por maceta: se crearon gemelos digitales para cada ejemplar físico, asociando género, especie, ubicación en mesa y fotografías en Cloudflare R2, sustituyendo las etiquetas físicas desgastadas por una trazabilidad botánica integral. Sobre este gemelo digital se implementó la bitácora de seguimiento biológico.

**[Lámina 48: Incremento 6: Seguimiento Fenológico y Floración]**  
El Incremento 6: Seguimiento Fenológico y Floración estructuró el historial de floración por ejemplar y su proyección biológica en la tienda online: el sistema registra la apertura y duración de las flores, computando automáticamente la periodicidad de floración anual, transformando la memoria del orquideólogo en un indicador objetivo que incrementa el valor de la colección. En paralelo, se organizó la agenda de aplicaciones químicas seguras.

**[Lámina 49: Incremento 6: Cronograma de Dosificación Agronómica]**  
El Incremento 6: Cronograma de Dosificación Agronómica consolidó la integración de aspersión manual y fertirriego hidráulico en un cronograma unificado: se diseñó una calculadora asistida para abonos y fungicidas según los litros preparados, proyectando un calendario de rotación quincenal que previene la resistencia en plagas y desacopla los químicos del riego automático. Los ejemplares y su trazabilidad fenológica se articularon con el comercio digital.

**[Lámina 50: Incremento 6: Comercio Botánico y Pasarela Asistida]**  
El Incremento 6: Comercio Botánico y Pasarela Asistida habilitó el cómputo reactivo de inventario, tasa oficial BCV y reserva atómica por WhatsApp: los usuarios consultan ejemplares en flor con fotografías reales y envían un pedido consolidado al cultivador, conectando la producción del invernadero con el mercado formal de forma fluida y transparente. El Incremento 7 coronó la solución con un asistente móvil inteligente y n8n.

**[Lámina 51: Incremento 7: Asistente Agronómico y n8n]**  
En el Incremento 7: Asistente Agronómico y n8n se desplegó un canal proactivo de mensajería con n8n, bot de Telegram y comandos rápidos: se automatizaron alertas en tiempo real ante detección de lluvia, cancelaciones por veto y estrés térmico diurno, acercando la gobernanza del orquideario al dispositivo móvil del operador sin obligarlo a navegar permanentemente en la web. Para dosificaciones químicas se incorporó supervisión humana obligatoria.

**[Lámina 52: Incremento 7: Confirmación Previa en Fertirriego]**  
El Incremento 7: Confirmación Previa en Fertirriego implementó el patrón humano en el bucle para la autorización segura del fertirriego: ante tareas con insumos químicos el sistema no conmuta de forma ciega; envía una notificación con la formulación calculada y espera la aprobación explícita del cultivador mediante un botón interactivo, erradicando intoxicaciones accidentales. El asistente asumió también el diagnóstico correlacionado y el mantenimiento.

**[Lámina 53: Incremento 7: Diagnóstico y Mantenimiento Preventivo]**  
El Incremento 7: Diagnóstico y Mantenimiento Preventivo integró la detección correlacionada de batería y el mantenimiento del filtro de disco: al desconectarse la EMA mientras el actuador sigue en línea deduce batería baja; asimismo, emite recordatorios cada dos días para limpiar el filtro de anillas, reseteando el temporizador tras asentar la labor con el comando /filter. Con los siete incrementos culminados, se procedió a la validación experimental en campo.

***

### Bloque IV: Validación, Documentación y Cierre (Láminas 54 a 60)

**[Lámina 54: Validación: Gobernanza y Resiliencia en Campo]**  
Al evaluar la Validación: Gobernanza y Resiliencia en Campo, se certificó la supervisión desatendida 24/7 y la respuesta determinista ante fallos de red: tal como ilustra la Figura 14, ante un corte de red a los dos minutos de un riego de diez, el nodo actuador detuvo la impulsión de inmediato para evitar sobre-riego; al reconectarse, el planificador despachó los ocho minutos remanentes sin alterar el balance hídrico. En el plano biológico, se validó la toma de decisiones agronómicas y el alivio térmico.

**[Lámina 55: Validación: Autonomía y Supervisión Agronómica]**  
En la Validación: Autonomía y Supervisión Agronómica se confirmó la prevención de asfixia radicular, la mitigación térmica y el control en el bucle: de 369 tareas hidráulicas procesadas, el motor ejecutó 137 vetos autónomos ante lluvia o saturación ambiental, protegiendo las raíces del encharcamiento; mientras pulsos de humectación en grava lograron enfriamiento evaporativo pasivo sin mojar las hojas susceptibles a hongos. Para asegurar la transferencia y permanencia de este desarrollo, se formalizó su documentación.

**[Lámina 56: Documentación del Prototipo y Transferencia]**  
La Documentación del Prototipo y Transferencia consolidó manuales técnicos, memoria constructiva y guías operativas del orquideario: se formalizó en el Apéndice F la arquitectura de contenedores Docker y firmware; en el Apéndice H el modelado 3D de garitas y el tablero de potencia; y en el Apéndice G los procedimientos de uso de la web y Telegram, asegurando una autogestión completa. Se entra al Capítulo V para presentar las conclusiones formales del trabajo de grado.

**[Lámina 57: Conclusiones: Análisis, Diseño e Implementación]**  
En Conclusiones: Análisis, Diseño e Implementación se ratifica el logro de los objetivos 1, 2 y 3: especificación, arquitectura y construcción. Con el primer objetivo se formalizaron 19 requerimientos funcionales y 9 no funcionales; con el segundo objetivo se concibió una arquitectura desacoplada en cuatro capas con MQTTS y persistencia políglota; y con el tercer objetivo se construyó la plataforma en siete incrementos con TDDM4IoTS, optimizando la memoria mediante Thin Edge y autorrecuperación física en silicio. Los objetivos finales consolidan la verificación experimental y el aporte integral.

**[Lámina 58: Conclusiones: Validación, Documentación y Aporte]**  
En Conclusiones: Validación, Documentación y Aporte se concluye con el logro de los objetivos 4 y 5: verificación en campo, transferencia y lazo cerrado. Se validaron los 28 requisitos en régimen 24/7, certificando la detección pluvial en 57 días y ejecutando 137 vetos que evitaron el sobre-riego; mientras los manuales garantizaron la transferencia tecnológica. En síntesis, se sustituyó la gestión empírica por un control autónomo en lazo cerrado orientado por datos. Con base en esta experiencia en producción, se formulan las recomendaciones de ingeniería.

**[Lámina 59: Capítulo V: Recomendaciones Técnicas]**  
En el Capítulo V: Recomendaciones Técnicas se establecen directrices para la consolidación, instrumentación y escalabilidad del sistema: primero, instalar un prefiltro de sedimentos previo a la bomba; segundo, incorporar sensores sinterizados SHT40 en macetas para modelar curvas reales de secado; tercero, integrar un pluviómetro mecánico de balancín con interrupciones en el ESP32; y cuarto, dotar a la estación interior de captación solar fotovoltaica para portabilidad continua. Con estas directrices concluye la presentación formal del proyecto.

**[Lámina 60: Agradecimientos y Cierre]**  
En Agradecimientos y Cierre, se expresa el más sincero reconocimiento institucional, a los tutores y la dedicación final: un profundo agradecimiento al jurado calificador, al profesor José Francisco Fonseca y al ingeniero Richard García por su valiosa orientación técnica y académica en este proyecto. Se reitera la gratitud a la Universidad Católica Andrés Bello. Quedo a su entera disposición para dar inicio a la sesión de preguntas y observaciones. Muchas gracias.

***
