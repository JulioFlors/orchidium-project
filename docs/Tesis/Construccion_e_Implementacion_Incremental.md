## Construcción e Implementación Incremental

La fase de construcción e implementación materializa la ingeniería del sistema mediante la integración iterativa de hardware, firmware y software. En correspondencia con la articulación metodológica formalizada en el **Apéndice B**, el desarrollo se estructuró en seis (6) incrementos funcionales. Cada iteración adaptó la filosofía del ciclo de vida incremental de Pressman (2010) y las fases técnicas de la metodología TDDM4IoTS (Guerrero-Ulloa et al., 2020), abordando el desarrollo a través del ciclo de resolución de problemas en ingeniería: planteamiento del alcance, montaje técnico, detección de fallas o limitaciones en banco de pruebas, rediseño correctivo y consolidación del entregable funcional antes de iniciar la siguiente iteración.

---

### Incremento 1: Plataforma Web Base y Modelado de Dominios Botánico y Agronómico

El primer incremento tuvo como propósito establecer la arquitectura tecnológica base de software y resolver la ausencia total de registros digitalizados en el orquideario diagnosticada en el análisis inicial, estructurando el modelado relacional para los dominios botánico y agronómico.

**Construcción de software y arquitectura web base.** Se inicializó un proyecto bajo el framework Next.js con arquitectura App Router y tipado estricto en TypeScript dentro de una estructura de monorepositorio administrada con Turborepo. Se diseñó un sistema visual accesible y responsivo fundamentado en componentes modulares reutilizables (tablas de datos, ventanas modulares, selectores y formularios reactivos). La autenticación y el control de acceso basado en roles se implementaron mediante la librería Better-Auth acoplada a una base de datos relacional PostgreSQL a través de Prisma ORM.

**Modelado del dominio agronómico y base de insumos.** Para estructurar la gestión de fertilización y sanidad vegetal, se implementó la base de datos de agroquímicos clasificada en dos grandes familias: fertilizantes y fitosanitarios. Estos últimos se categorizaron según su propósito de acción en insecticidas, fungicidas, bactericidas y acaricidas. A cada producto químico se le asociaron recomendaciones de uso, advertencias de seguridad y proporciones volumétricas de dilución en agua, proporcionando al cultivador las directrices técnicas requeridas para formular las mezclas sin riesgos de fitotoxicidad.

**Modelado relacional desacoplado del dominio botánico.** Desde este incremento inicial se concibió y formalizó en el esquema de Prisma la separación arquitectónica entre:
1. `Species:` Entidad taxonómica abstracta (género, especie, requerimientos bioclimáticos y fotografías), sin fijación de precio ni inventario directo.
2. `ProductVariant:` Variante comercial vendible (SKU), que vincula una especie a un tamaño de contenedor (`PotSize`) para determinar su precio en el catálogo.
3. `Plant` (`SeedPlant`): Activo biológico físico individual en mesa, cuya existencia real gobierna el stock comercial disponible.

**Estructuración inicial de datos de prueba y validación.** Aunque el desacoplamiento relacional del dominio botánico quedó estructurado en la base de datos, la construcción de sus rutas visuales y sus flujos operativos completos se postergó hasta el sexto incremento. En esta fase inicial, se utilizó el servicio `services/seed` para inyectar datos semilla de prueba (*fixtures*). Esta estrategia permitió validar mediante Prisma Studio y pruebas de integración la reactividad de la interfaz, el rendimiento de las tablas de datos y el aislamiento de las Server Actions (fases F3 y F9 de TDDM4IoTS), entregando el núcleo web operativo y el esquema de seguridad poblado (véase Tabla Ap-B1 del Apéndice B y Figuras Ap-F10 y Ap-F19 del **Apéndice F**).

---

### Incremento 2: Circuito Hidráulico, Tablero de Potencia y Automatización

El segundo incremento se concentró en la construcción de la red hidráulica y el tablero de fuerza eléctrica en las instalaciones del orquideario en San Félix (Estado Bolívar), transformando el riego manual con manguera en un sistema presurizado automatizable mediante hardware embebido.

**Construcción del circuito hidráulico presurizado.** En el área de cultivo protegida de $45\text{ m}^2$ se instaló un circuito presurizado alimentado por una bomba de agua periférica de 1 HP (0.75 kW) con conexión hidráulica de 1 pulgada, capaz de suministrar una presión de 2.5 a 3.2 bar ($36\text{ a }46\text{ PSI}$) y un caudal de $50\text{ L/min}$. La red se estructuró en una única zona física subdividida en cuatro (4) líneas independientes: Línea 1 (humidificación ambiental mediante nebulizadores *fogger* suspendidos), Línea 2 (aspersión principal sobre mesas con microaspersores de $360^\circ$), Línea 3 (humectación de piso mediante manguera perforada a ras de suelo sobre la cama de piedra picada para enfriamiento pasivo) y Línea 4 (dosificación agroquímica aislada). El tendido matriz se ejecutó en tubería de PVC de 3/4" cédula 40 con derivaciones en PEAD de 1/2", integrando una válvula *check* y un filtro de disco de 1 pulgada a la descarga de la bomba para impedir la obturación de los emisores.

![Figura 2. Red hidráulica presurizada de 4 líneas y emisores en el orquideario.](figuras/figura_2_red_hidraulica_emisores.jpg)

**_Figura 2._** Red hidráulica presurizada de 4 líneas y emisores en el orquideario.
*Nota.* Fuente: Elaboración propia. Despliega la bomba de agua de impulsión de 1 HP (1 pulgada), la tubería matriz de 3/4", los ramales de derivación de 1/2" y los sectores de nebulización, microaspersión y humectación de piso.

**Fallo de sobrecorriente inductiva en relés y rediseño de potencia.** La bomba de agua de 1 HP presenta una corriente nominal en placa de 11 Amperios en 110VAC con picos de arranque inductivo superiores. Durante los primeros ensayos en banco de pruebas, los módulos relé comerciales (especificados para cargas máximas de 10A) sufrieron fatiga térmica severa y soldadura de contactos por chisporroteo eléctrico, inutilizando la maniobra. Como decisión de ingeniería, se integró en el tablero un contactor industrial de 30 Amperios en riel DIN; los relés de 10A del microcontrolador conmutan únicamente la bobina de control del contactor, delegando el manejo seguro de la corriente de fuerza al dispositivo industrial.

**Ensamblaje del tablero eléctrico y tensiones de maniobra.** Para resguardar la electrónica de la humedad tropical, el tablero se instaló fuera del invernadero. La acometida de 110VAC se protegió mediante un switch industrial y dos fusileras de 15A (fase y neutro). Asimismo, se incorporaron dos módulos de cuatro canales (totalizando 8 relés optoacoplados) para gobernar las seis electroválvulas de solenoide (dos de 110VAC para las entradas matrices de agua y agroquímicos, y cuatro de 24VAC alimentadas por un transformador reductor para las líneas de riego), junto a un controlador de presión (*press control*) para salvaguardar la bomba contra funcionamiento en seco, un tomacorriente interno con regulador de 5V y una placa base (*shield*) con borneras de tornillo para sujetar rígidamente al microcontrolador ESP32.

![Figura 3. Tablero de fuerza eléctrica industrial ensamblado sobre riel DIN.](figuras/figura_3_tablero_electrico_din.jpg)

**_Figura 3._** Tablero de fuerza eléctrica industrial ensamblado sobre riel DIN.
*Nota.* Fuente: Elaboración propia. Muestra el switch interruptor industrial, las dos fusileras de 15A (fase y neutro), el contactor de potencia de 30A, el transformador reductor de 24VAC, los dos módulos de relés (8 canales) y el nodo ESP32 acoplado a borneras de tornillo.

**Firmware embebido, tooling y validación de conmutación.** Se desarrolló el firmware base del actuador en MicroPython. Para optimizar el ciclo de desarrollo y superar las restricciones de memoria RAM del microcontrolador, se crearon scripts en PowerShell automatizados (`mprun -b -l`) que leen el manifiesto del nodo (`manifest.json`), instalan dependencias y compilan los módulos a bytecode binario `.mpy` mediante `mpy-cross`. La conmutación de los relés, la respuesta del contactor y la emisión del acuse de recibo (`ACK`) se validaron de forma remota utilizando la herramienta MQTT Explorer.

**Entregables consolidados.** Circuito hidráulico de cuatro líneas presurizadas, tablero eléctrico industrial de tres niveles de tensión (110VAC, 24VAC, 5V/3.3V) y firmware embebido de conmutación física (véase Tabla Ap-B1 del Apéndice B y diagrama de conmutación electromecánica en el Flujo 1 del **Apéndice F**).

---

### Incremento 3: Infraestructura Backend Distribuida, Orquestación y Operaciones

El tercer incremento abordó la construcción y despliegue de los servicios de servidor centralizados para garantizar la operación ininterrumpida y desatendida las 24 horas del día, independizando la supervisión telemétrica y la toma de decisiones del navegador web del usuario.

**Infraestructura de servicios contenerizados y despliegue VPS.** Para asegurar alta disponibilidad, la pila de backend se estructuró en contenedores Docker orquestados con Docker Compose y se desplegó en un Servidor Privado Virtual (VPS) bajo Linux Ubuntu Server. En este entorno se configuró el bróker Eclipse Mosquitto con cifrado MQTTS sobre TLS en el puerto seguro 8883, la base de datos relacional PostgreSQL y el motor de series temporales InfluxDB, configurado con retención de datos ilimitada para registrar la telemetría ambiental requerida para el entrenamiento de los algoritmos.

**El cuello de botella de memoria en borde y rediseño de resiliencia.** En las versiones iniciales del firmware (v0.14.x), el nodo actuador implementaba un sistema local denominado `NVSManager` que guardaba el estado de las tareas activas en memoria Flash (`recovery.json`) para tolerar caídas de red. Sin embargo, este módulo retenía entre 10 y 15 KB de memoria RAM dinámica. Cuando la memoria libre descendía por debajo de 45 KB, el microcontrolador era incapaz de completar la negociación SSL (`wrap_socket`), generando el error fatal `OSError: [Errno 16] EBUSY` y provocando reinicios continuos del dispositivo.

Como decisión arquitectónica, se eliminó por completo el `NVSManager` del ESP32 y se delegó la responsabilidad de persistencia al backend, adaptando el patrón de *Tolerancia a Fallos Desconectada y Recuperación en Caliente* (*Disconnected Fault-Tolerance & Hot State Recovery*). El microservicio `Scheduler` en Node.js pasó a gestionar en PostgreSQL el estado de colas, temporizadores y ventanas de oportunidad; ante cortes de energía o caídas del enlace MQTT, el servidor reconcilia de inmediato el estado del sistema, reemite las órdenes de conmutación pertinentes y cancela las tareas cuya vigencia temporal haya expirado.

**Desarrollo de servicios auxiliares y suite de operaciones.** Se construyó el microservicio de ingesta (`services/ingest`) para consumir, validar y almacenar las ráfagas telemétricas en InfluxDB. Paralelamente, en la aplicación web Next.js se desarrolló la suite de operaciones:
* `/operations/control:` Interfaz para comando manual directo con confirmación visual de estado y temporizador fail-safe (Figura Ap-F1 y modal de advertencia de insumos en Figura Ap-F2 del **Apéndice F**).
* `/operations/queue:` Panel de supervisión de tareas diferidas y activas con temporizadores de progreso y cancelación inmediata (Figura Ap-F3 del **Apéndice F**).
* `/operations/schedules:` Programador cronológico de rutinas recurrentes de irrigación con selectores de guardas ambientales (Figura Ap-F4 del **Apéndice F**).
* `/operations/history:` Bitácora de auditoría histórica que certifica la ejecución, procedencia o veto deliberativo de tareas (Figura Ap-F5 del **Apéndice F**).

Adicionalmente, se conectó el módulo agronómico `/lab` con las Server Actions de la plataforma, enlazando las recetas de dilución con la apertura de la electroválvula de 24V de la Línea 4 (Figuras Ap-F6 a Ap-F9 y Flujo 2 del **Apéndice F**).

![Figura 4. Suite web de operaciones y control manual del circuito hidráulico.](figuras/figura_4_suite_web_operaciones.png)

**_Figura 4._** Suite web de operaciones y control manual del circuito hidráulico.
*Nota.* Fuente: Elaboración propia a partir de la interfaz `/operations/control`. Ilustra los controles de conmutación directa por línea, los selectores de temporización fail-safe y la confirmación de estado real.

**Entregables consolidados.** Pila contenerizada en VPS 24/7, bróker seguro MQTTS, servicios de ingesta y planificación con recuperación de estado en caliente, y suite web de operaciones hidráulicas y laboratorio agronómico (Figuras Ap-F1 a Ap-F9 del **Apéndice F**; véase Tabla Ap-B1 del Apéndice B).

---

### Incremento 4: Estaciones Meteorológicas y Telemetría Ambiental

El cuarto incremento materializó la percepción ambiental del orquideario mediante hardware propio, sustituyendo el uso preliminar de APIs climáticas externas por estaciones meteorológicas in situ capaces de capturar el microclima hiperlocal con alta fidelidad.

**Insuficiencia de servicios climáticos externos y construcción de las EMA.** En las fases iniciales se evaluó alimentar el orquestador mediante APIs meteorológicas regionales. No obstante, las pruebas revelaron discrepancias críticas: los servicios reportaban precipitación generalizada en la ciudad mientras el orquideario permanecía bajo radiación solar intensa, o viceversa. Para erradicar esta ceguera climática, se diseñaron y construyeron dos Estaciones Meteorológicas Automatizadas (EMA) basadas en el SoC ESP32:
* *EMA Exterior:* Co-ubicada con el tablero eléctrico y alimentada por red, equipada con un sensor de temperatura y humedad DHT22 (AM2302) y un sensor digital de iluminancia BH1750 a cielo abierto.
* *EMA Interior:* Estación portátil protegida dentro de una garita meteorológica persiana tipo Stevenson modelada e impresa en 3D, alimentada por batería con gestión de bajo consumo (*Deep Sleep*) para medir las condiciones protegidas bajo malla sombra.

![Figura 5. Estaciones meteorológicas automatizadas (EMA Exterior e Interior).](figuras/figura_5_estaciones_meteorologicas_ema.jpg)

**_Figura 5._** Estaciones meteorológicas automatizadas (EMA Exterior e Interior).
*Nota.* Fuente: Elaboración propia. Ilustra el nodo sensor a la intemperie (EMA Exterior) y la garita meteorológica persiana tipo Stevenson impresa en 3D para el microclima protegido (EMA Interior).

**Fallo físico por diafonía (EMI) en Cat6 y solución por par trenzado.** La distancia de 10 metros de cableado UTP Cat6 entre el tablero y los sensores en intemperie introdujo ruido electromagnético y lecturas erráticas. La inspección de campo determinó que las señales de datos viajaban sin apantallamiento en pares independientes. La falla se solventó recableando el tendido de modo que cada línea digital (1-Wire del DHT22 y el bus I2C del BH1750) se emparejó físicamente con su respectivo retorno de referencia (GND o VCC) dentro de su propio par trenzado, cancelando la interferencia electromagnética por balanceo diferencial pasivo.

**Congelamiento de transductores y circuito de autorrecuperación (*Power Cycle*).** Tras periodos prolongados de operación continua, los sensores digitales en campo experimentaban bloqueos esporádicos en su circuito integrado debido a transitorios eléctricos residuales. Ante este cuelgue, el bus digital no respondía y el firmware solo lograba restablecer la lectura forzando un reinicio total (*hard reset*) del ESP32, lo que interrumpía la sesión TLS y degradaba la disponibilidad de red.

Para solventar esta limitación, se modificó la etapa de alimentación en el hardware: se retiró la alimentación fija permanente y se conectó la línea VCC de los sensores a través de un transistor MOSFET conmutado por un pin GPIO del ESP32. En el firmware se implementó una rutina de guarda que, al detectar tres ciclos consecutivos de lecturas fallidas en el bus, conmuta el GPIO cortando la energía de los sensores durante 200 ms. Esta maniobra provoca una desenergización completa (*cold start*) que drena los capacitores del sensor y restablece la comunicación en dos segundos, sin reiniciar el microcontrolador y manteniendo intacta la sesión con el bróker.

**Hardening del firmware: Driver MQTT `simple2.py` y autoescala lumínica.** La librería estándar `umqtt.simple` provocaba desconexiones periódicas por sockets zombis. Se adoptó el driver endurecido `simple2.py`, el cual incorpora cierre atómico de sockets TCP ante fallas de negociación TLS, timeouts previos a `wrap_socket`, escritura no bloqueante mediante `uselect.poll` y sincronización de concurrencia mediante `asyncio.Lock`. Paralelamente, se modificó el driver del sensor BH1750 para incorporar auto-escala dinámica en el registro `MTreg`, permitiendo medir intensidades de radiación solar de hasta 121.000 Lux a pleno mediodía tropical sin saturación.

![Figura 6. Panel de monitoreo telemétrico y cálculo psicrométrico en tiempo real.](figuras/figura_6_dashboard_telemetria_vpd.png)

**_Figura 6._** Panel de monitoreo telemétrico y cálculo psicrométrico en tiempo real.
*Nota.* Fuente: Elaboración propia a partir de la interfaz de `/monitoring`. Visualiza las series temporales de temperatura, humedad relativa, iluminancia solar y la curva psicrométrica de Déficit de Presión de Vapor (VPD).

**Entregables consolidados.** Estaciones meteorológicas EMA Exterior e Interior operativas, circuito de autorrecuperación por hardware, firmware optimizado y visualización de series de telemetría y VPD en `/monitoring` y `/botanics` (Figuras Ap-F16 y Ap-F18 del **Apéndice F**; véase Tabla Ap-B1 del Apéndice B).

---

### Incremento 5: Inferencia de Lluvia y Autonomía Hídrica

El quinto incremento dotó a la plataforma de autonomía deliberativa para la toma de decisiones de irrigación, integrando motores algorítmicos capaces de evaluar las condiciones ambientales en tiempo real para autorizar, diferir o vetar el riego programado.

**Fallo por corrosión en sensores de gotas y motor de inferencia meteorológica.** Durante los ensayos de campo de la temporada invernal, los sensores físicos resistivos de gotas instalados en la EMA Exterior sufrieron corrosión galvánica irreversible en sus pistas metálicas por efecto de la electrólisis continua y la humedad tropical, quedando inutilizados en menos de 30 días y generando falsos positivos constantes. Ante esta inviabilidad física, se descartó el transductor mecánico y se desarrolló el Motor de Inferencia Meteorológica en el microservicio `Scheduler`.

El motor infiere la presencia, duración y cese de precipitación mediante el análisis en tiempo real de derivadas térmicas instantáneas ($-\Delta T$) e higrométricas ($+\Delta HR$) en ventanas deslizantes de 10, 20 y 30 minutos, discriminando dinámicamente según la radiación solar en tres ramas de decisión (Nublado, Soleado y Nocturno), cuya visualización operativa se expone en la interfaz `/weather-oracle` (Figura Ap-F17 del **Apéndice F**).

**Validación experimental por simulación histórica (*Backtesting*).** Siguiendo la fase F8 de TDDM4IoTS, el motor pluvial se validó científicamente mediante simulación histórica con el script `rebuild-rain-history.ts`. La evaluación contrastó los eventos detectados algorítmicamente contra la bitácora presencial de campo del cultivador a lo largo de 57 días continuos de observación directa in situ (24 de junio al 19 de agosto de 2026). Esta prueba permitió calibrar con rigor los umbrales de caída térmica y gradiente higrométrico, certificando la exactitud del algoritmo para operar de forma autónoma sin sensores físicos (véase formulación matemática y matriz paramétrica en las Tablas Ap-C1 y Ap-C2 del **Apéndice C**).

**Fallo de transductor de presión y motor de inferencia hídrica.** Para verificar el paso de flujo de agua y la operación de la bomba, se instaló inicialmente un transductor de presión electrónico. Sin embargo, durante las maniobras de apertura y cierre de electroválvulas, el sensor sufrió una sobrepresión destructiva ocasionada por choque hidráulico (golpe de ariete). Se tomó la decisión de descartar el componente físico y depurar el firmware para evitar código muerto, sustituyendo la verificación por supervisión telemétrica cruzada y temporizadores locales de seguridad (*fail-safe*) que fuerzan el apagado autónomo de las salidas al expirar la duración asignada.

Sobre esta base se formuló el Motor de Inferencia Hídrica, el cual aplica una matriz deliberativa de veto preventivo: bloqueo categórico ante lluvia activa, alternancia interdiaria tras precipitaciones o riegos previos, ventanas retrospectivas de seguridad tras lluvia reciente (4 a 8 horas), veto por saturación higrométrica diurna ($HR > 85\%$) y enfriamiento evaporativo prioritario en la Línea 3 (humectación de piso) ante temperaturas superiores a $34^\circ\text{C}$ con $VPD > 1.8\text{ kPa}$. La efectividad de estas reglas se auditó sobre 369 tareas procesadas en producción (véase validación empírica en el **Apéndice D** y registro auditable en la Figura Ap-F5 del **Apéndice F**).

**Entregables consolidados.** Motor de inferencia de lluvia validado por *backtesting*, motor de inferencia hídrica con matriz de vetos autónomos y bitácora de auditoría histórica en producción (Figuras Ap-F5 y Ap-F17, y Flujo 4 del **Apéndice F**; véase Tabla Ap-B1 del Apéndice B).

---

### Incremento 6: Inventario Físico de Mesas y Comercio Electrónico

El sexto incremento culminó el ciclo de desarrollo integrando la gestión individualizada de especímenes botánicos en las mesas del invernadero con el canal comercial digital, materializando operativamente el modelado relacional concebido en el primer incremento.

**Implementación operativa de las rutas de inventario (`(inventory)`).** Se desarrollaron y desplegaron las rutas especializadas dentro del directorio `app/src/app/(orchidarium)/(inventory)`, materializando las interfaces que conectan la botánica con las operaciones:
* `/inventory/catalog:` Administración del catálogo de especies botánicas abstractas (`Species`), requerimientos de confort y fotografías en alta resolución.
* `/inventory/stock:` Trazabilidad individual de cada ejemplar en mesa (`SeedPlant`) con su maceta (`PotSize`: Nro 5, Nro 7, Nro 10 y Nro 14), estado biológico (`AVAILABLE` o `MOTHER`) y localización física tridimensional en zonas (A–D) y mesas (1–6).
* `/inventory/shop-manager:` Gestor de variantes comerciales (`ProductVariant`) que vincula el precio en dólares con el cómputo reactivo de plantas vivas en mesa.
* `/inventory/requests:` Gestión reactiva de listas de espera para ejemplares agotados o en etapa de crecimiento vegetativo.

A través de sucesivas iteraciones sobre este flujo, se vinculó la realidad física del orquideario con la plataforma de ventas, garantizando que el stock comercial en tienda se compute de forma estrictamente reactiva contando únicamente los ejemplares vivos en mesa, erradicando por diseño discrepancias de inventario.

**Trazabilidad fenológica y ciclo de floración.** La plataforma web incorporó interfaces de seguimiento biológico para registrar las variables fenológicas de cada espécimen: fecha de emisión de la vara floral, apertura de la primera flor, conteo de botones florales, duración en días de la inflorescencia y fecha de senescencia. Esta base de datos permite al cultivador identificar genotipos sobresalientes para su preservación como plantas madre y seleccionar especímenes en el punto óptimo de apertura para su venta comercial (véase ficha individual y bitácora fenológica en la Figura Ap-F13 del **Apéndice F**).

**Sincronización con el comercio electrónico y validación de compra.** Se integró la tienda digital en Next.js (`/category/plants`), validando de extremo a extremo la navegación taxonómica, el carrito de compras interactivo y el checkout asistido mediante la API de WhatsApp, la cual genera tramas de pedido formateadas hacia el cultivador para la conciliación de pago y despacho (véanse Figuras Ap-F19 a Ap-F24 y Flujo 5 del **Apéndice F**).

![Figura 7. Módulo de inventario unívoco de gemelos digitales (SeedPlant) y catálogo comercial.](figuras/figura_7_inventario_gemelos_catalogo.png)

**_Figura 7._** Módulo de inventario unívoco de gemelos digitales (`SeedPlant`) y catálogo comercial.
*Nota.* Fuente: Elaboración propia a partir de las interfaces `/admin/plants`, `(inventory)` y `/category/plants`. Muestra la matriz de trazabilidad de plantas individuales en mesa y su sincronización reactiva con el stock comercial.

**Entregables consolidados.** Rutas operativas de inventario `(inventory)` en producción, módulo de gemelos digitales (`SeedPlant`), bitácora de trazabilidad fenológica de floración y plataforma de comercio electrónico sincronizada (Figuras Ap-F10 a Ap-F15 y Ap-F19 a Ap-F24 del **Apéndice F**; véase Tabla Ap-B1 del Apéndice B).

**Síntesis de fallas experimentales y rediseños en banco.** La construcción física y computacional de la plataforma demandó sucesivas iteraciones de depuración sobre el hardware, firmware y servicios distribuidos. La Tabla 5 sintetiza de forma cronológica las principales fallas encontradas en los ensayos de banco y campo, las causas de raíz diagnosticadas y los rediseños definitivos que permitieron alcanzar la estabilidad operativa del sistema.

#### Tabla 5. *Matriz de resolución de fallas de banco, contingencias de campo y rediseños de ingeniería*

| Incremento / Módulo | Falla de Banco o Limitación Técnica | Causa Física o Computacional | Rediseño de Ingeniería Aplicado | Impacto en Producción |
| :--- | :--- | :--- | :--- | :--- |
| **Incr. 1: Plataforma Web Base** | Ausencia de datos estructurados para maquetar interfaces y probar rendimiento. | Inexistencia de registros previos digitalizados en el orquideario. | Poblado inicial con datos semilla de prueba mediante `services/seed`. | Verificación temprana de navegación, tablas de datos y consultas relacionales. |
| **Incr. 2: Potencia y Actuación** | Fatiga térmica y soldadura destructiva de contactos en módulos relé convencionales. | Corriente nominal de 11A en bomba de 1 HP rebasaba el límite de 10A de los relés con picos de arranque. | Instalación de contactor industrial de 30A en riel DIN activado por relé. | Conmutación electromecánica segura y erradicación total del arco eléctrico. |
| **Incr. 3: Orquestación VPS** | Bloqueo fatal del ESP32 (`EBUSY`) y reinicios en bucle al negociar TLS. | Módulo local `NVSManager` retenía 15 KB de RAM; memoria libre descendía de 45 KB. | Extracción total de persistencia a Node.js (`Scheduler`) y recuperación en caliente. | Disponibilidad permanente de sockets TLS seguros y despacho robusto 24/7. |
| **Incr. 4: Percepción (EMA)** | Ruido electromagnético y telemetría corrupta a lo largo de 10 metros de cable Cat6. | Señales digitales sin apantallamiento acopladas a transitorios de potencia (diafonía). | Pareo físico de cada línea de datos con su respectivo retorno GND/VCC trenzado. | Cancelación de ruido por modo diferencial y transmisión serial 100% limpia. |
| **Incr. 4: Percepción (Sensores)** | Congelamiento del bus I2C/1-Wire que requería reinicio total (*hard reset*) del SoC. | Transitorios residuales en el transductor que bloqueaban su lógica interna. | Circuito de corte físico por transistor MOSFET (200 ms *power cycle*). | Restablecimiento de sensores en 2 segundos sin cortar la conexión TLS. |
| **Incr. 5: Inferencia Pluvial** | Corrosión galvánica irreversible en sensores físicos de gotas en menos de 30 días. | Electrólisis continua en pistas metálicas expuestas a humedad tropical extrema. | Sustitución total por Motor de Inferencia Meteorológica ($-\Delta T, +\Delta HR, Lux$). | Detección matemática precisa de precipitación sin desgaste físico de componentes. |
| **Incr. 5: Autonomía Hídrica** | Destrucción física de transductor de presión piezoeléctrico en el colector. | Sobrepresión destructiva por choque hidráulico (golpe de ariete) al conmutar. | Supresión del sensor y adopción de temporizador fail-safe en firmware con validación cruzada. | Prevención absoluta de fugas o inundaciones y simplificación del hardware. |
| **Incr. 6: Gestión Comercial** | Discrepancias de inventario y venta accidental de plantas no disponibles en mesas. | Desacoplamiento entre el stock publicado en web y los ejemplares físicos reales. | Conteo dinámico y reactivo de gemelos vivos (`SeedPlant`) para cada variante vendible. | Sincronización exacta en tiempo real entre existencias físicas y tienda digital. |

*Nota.* Fuente: Elaboración propia a partir de la bitácora técnica de desarrollo y ensayos experimentales en campo.

---

### Validación del Sistema y Resultados Operacionales

Bajo los principios de la metodología TDDM4IoTS, cada uno de los seis incrementos funcionales fue sometido a ciclos iterativos de prueba, depuración y validación unitaria e integrativa en banco antes de autorizar el avance hacia la fase subsiguiente (evidenciados en las pruebas de regresión, herramientas de diagnóstico de cada incremento y los análisis experimentales formalizados en los **Apéndices C y D**). En consecuencia, esta sección evalúa el comportamiento global del sistema operando como un todo integrado y desatendido en el orquideario.

**Integración y macro-validación en lazo cerrado.** La estabilidad de la plataforma se comprobó sometiendo el sistema a ciclos continuos de operación desatendida 24/7. La interacción en lazo cerrado inicia cuando las estaciones meteorológicas EMA transmiten las ráfagas ambientales hacia el bróker MQTTS. El microservicio de ingesta persiste las series temporales en InfluxDB y las suministra en memoria al orquestador. Al cumplirse la ventana temporal de una tarea, el motor de inferencia hídrica delibera evaluando la presencia de lluvia o saturación higrométrica. Si la maniobra es autorizada, el comando desciende hacia el nodo actuador de borde, el cual energiza el contactor y las electroválvulas pertinentes, emitiendo de inmediato una trama de confirmación efectiva (`ACK`) que actualiza la interfaz web del cultivador y registra el evento en PostgreSQL. La Figura 8 sintetiza este flujo operativo.

![Figura 8. Flujo integral de validación operativa en lazo cerrado entre telemetría, inferencia y actuación.](figuras/figura_8_flujo_lazo_cerrado_validacion.png)

**_Figura 8._** Flujo integral de validación operativa en lazo cerrado entre telemetría, inferencia y actuación.
*Nota.* Fuente: Elaboración propia. Modela la secuencia cíclica entre la adquisición física en campo, la persistencia en el servidor VPS, la deliberación autónoma de veto/autorización y la conmutación de fuerza con acuse de recibo (`ACK`).

**Desempeño agronómico y mitigación de estrés microclimático.** El sistema de irrigación demostró una alta eficacia bioclimática en el orquideario de $45\text{ m}^2$. Durante las horas de radiación solar cenital extrema ($11:30\text{ a }14:30\text{ hrs}$), la activación de pulsos cortos de 180 segundos en la Línea 3 (humectación de piso) propició un abatimiento térmico de hasta $3.5^\circ\text{C}$ por enfriamiento evaporativo pasivo, amortiguando la temperatura en las mesas sin depositar agua sobre las hojas ni alterar el fotoperiodo. Asimismo, la modulación de microgotas en la Línea 1 (nebulización / *foggers*) permitió sostener el Déficit de Presión de Vapor (VPD) dentro de la franja óptima para orquídeas tropicales ($0.8\text{ a }1.2\text{ kPa}$) durante el 91.4% de las jornadas secas evaluadas, erradicando el cierre estomático prematuro por deshidratación.

**Balance global de evaluación de requerimientos del sistema.** Para certificar la adecuación técnica y operativa de PristinoPlant, se contrastó el sistema integrado contra los requerimientos formulados en la fase de análisis. La Tabla 6 sintetiza el balance general de cumplimiento agrupado por módulo funcional, totalizando diecinueve (19) requerimientos funcionales y nueve (9) requerimientos no funcionales plenamente satisfechos. La matriz exhaustiva que documenta el procedimiento de prueba, los criterios de aceptación y los resultados operacionales para cada uno de los veintiocho requerimientos se expone en la **Tabla Ap-I1 del Apéndice I**.

#### Tabla 6. *Balance global de evaluación y cumplimiento de requerimientos por módulo funcional*

| Módulo Funcional del Sistema | Requerimientos Evaluados | Métodos de Verificación Empleados | Nivel de Cumplimiento |
| :--- | :--- | :--- | :--- |
| **Gestión de Gemelos Botánicos** | RF01, RF02 | Inspección relacional de esquemas, pruebas CRUD y seguimiento fenológico en interfaz. | **100% Cumplido** (2/2) |
| **Laboratorio y Dosificación Agronómica** | RF03, RF04, RF05, RF06 | Verificación de migraciones, validación de fórmulas de dilución y confirmación modal de 24V. | **100% Cumplido** (4/4) |
| **Percepción y Telemetría Ambiental (EMA)** | RF07, RF08, RF09 | Ensayos telemétricos en banco, persistencia en InfluxDB y supervisión en tiempo real de VPD. | **100% Cumplido** (3/3) |
| **Inferencia y Autonomía Deliberativa** | RF10, RF14 | Simulación histórica (*backtesting* 57 días) y auditoría en producción de 369 tareas. | **100% Cumplido** (2/2) |
| **Orquestación y Actuación Hidráulica** | RF11, RF12, RF13, RF15, RF18 | Ensayos de conmutación directa, temporizador *fail-safe*, expresiones cron y acuse `ACK`. | **100% Cumplido** (5/5) |
| **Comercio Electrónico y Mensajería** | RF16, RF17, RF19 | Cómputo dinámico de stock en mesas, pasarela asistida WhatsApp y despacho de alertas. | **100% Cumplido** (3/3) |
| **Atributos de Calidad y Concurrencia (ISO 25010)** | RNF01 a RNF09 | Ensayos de corte de red, monitoreo de RAM libre (>52 KB), TLS 8883, latencia y MOSFET. | **100% Cumplido** (9/9) |

*Nota.* Fuente: Elaboración propia fundamentada en las pruebas de validación del sistema. Para la especificación detallada ítem por ítem, véase la Tabla Ap-I1 del Apéndice I.

---

### Documentación del Prototipo

En concordancia con los estándares de ingeniería de software y las directrices metodológicas para Trabajos Instrumentales de Grado de la Universidad Católica Andrés Bello, la culminación del desarrollo técnico exige la formalización de la documentación de transferencia tecnológica para garantizar la reproducibilidad, el mantenimiento y la operación continua del sistema.

**Manual Técnico del Sistema.** Para guiar a los ingenieros de soporte y administradores de infraestructura en el aprovisionamiento, despliegue y mantenimiento de hardware, firmware y servicios en la nube, se elaboró el **Apéndice G: Manual Técnico del Sistema PristinoPlant**. Este documento compila las especificaciones completas de infraestructura contenerizada en Docker, el procedimiento de flasheo de microcontroladores ESP32 mediante la herramienta personalizada `mprun`, la arquitectura del driver endurecido `simple2.py`, las rutinas de autorrecuperación física por corte de energía y la matriz técnica de resolución de incidencias en campo (*troubleshooting*).

**Manual de Usuario y Operaciones.** Con el propósito de instruir al cultivador y a los usuarios finales en la operación cotidiana de la plataforma, se redactó el **Apéndice H: Manual de Usuario y Operaciones de la Plataforma PristinoPlant** (respaldado por el catálogo visual exhaustivo de veinticuatro interfaces y diagramas de flujo formalizados en el **Apéndice F**). Dicho manual detalla paso a paso los procedimientos de conmutación manual del circuito hidráulico, la programación de calendarios de irrigación con guardas de veto ambiental, la formulación química en el laboratorio agronómico, la supervisión de series psicrométricas y el seguimiento del ciclo de vida de los especímenes botánicos.

Asimismo, la totalidad de los protocolos de prueba unitaria, la auditoría cuantitativa de decisiones del motor hídrico y la matriz de correspondencia normativa de requerimientos se encuentran formalmente encapsulados en los **Apéndices A, B, C, D e I**, consolidando un paquete documental exhaustivo para la defensa académica e industrial del proyecto.
