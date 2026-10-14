  
**Universidad Católica Andrés Bello**   
**Facultad de Ingeniería**  
**Escuela de Ingeniería Informática Guayana**

**Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente**   
**para el Cultivo de Orquídeas** 

**Trabajo Instrumental de Grado**  
presentado ante la  
**Universidad Católica Andrés Bello**   
como parte de los requisitos para optar al título de  
**Ingeniero en Informática**

|  | Realizado por: | Flores Silva, Julio Cesar |
| ----: | :---- | :---- |
|  | Tutor Académico: | Fonseca Droy, José Francisco |
|  | Tutor Empresarial: | García Martínez, Richard José |
|  | Fecha: | Septiembre, 2026 |

**Dedicatoria**

*Todo este esfuerzo se lo dedico a mi familia.*

**Agradecimientos**

*A todos los que creyeron en este proyecto,*

*Cuando solo era una idea entre espinas y flores.*

**Índice de Contenido**

**[Dedicatoria](#dedicatoria)	ⅱ**

[**Agradecimientos**](#agradecimientos)	**ⅱ**

[**Índice de Contenido**](#índice-de-contenido)	**ⅲ**

[**Índice de Figuras**](#índice-de-figuras)	**ⅴ**

[**Índice de Tablas**](#índice-de-tablas)	**ⅶ**

[**Resumen**](#resumen)	**ⅷ**

[**Introducción	1**](#introducción)

[**Capítulo I. El Problema	2**](#capítulo-i.-el-problema)

[Planteamiento del Problema	2](#planteamiento-del-problema)

[Objetivo General	6](#objetivo-general)

[Objetivos Específicos	6](#objetivos-específicos)

[Aportes Tecnológicos	6](#aportes-tecnológicos)

[Aportes Funcionales	6](#aportes-funcionales)

[Alcance	8](#alcance)

[Limitaciones	9](#limitaciones)

[**Capítulo II. Marco Teórico	10**](#capítulo-ii.-marco-teórico)

[Antecedentes de la Investigación	10](#antecedentes-de-la-investigación)

[Bases Teóricas	11](#bases-teóricas)

[Terminología Básica	15](#terminología-básica)

[**Capítulo III. Marco Metodológico	17**](#capítulo-iii.-marco-metodológico)

[Tipo de Investigación	17](#tipo-de-investigación)

[Nivel de la Investigación	17](#nivel-de-la-investigación)

[Diseño de la Investigación	17](#diseño-de-la-investigación)

[Población y Muestra	18](#población-y-muestra)

[Técnicas e Instrumentos de Recolección de Datos	18](#técnicas-e-instrumentos-de-recolección-de-datos)

[Metodología de Desarrollo	20](#metodología-de-desarrollo)

[Procedimiento Metodológico	22](#procedimiento-metodológico)

[**Capítulo IV. Desarrollo y Resultados	25**](#capítulo-iv.-desarrollo-y-resultados)

[Análisis y Estudio Inicial	25](#análisis-y-estudio-inicial)

[Diseño Conceptual	31](#diseño-conceptual)

[Diseño Básico	37](#diseño-básico)

[Diseño Detallado	41](#diseño-detallado)

[Construcción e Implementación Incremental	44](#construcción-e-implementación-incremental)

[Validación del Funcionamiento	65](#validación-del-funcionamiento)

[Documentación del Prototipo	67](#documentación-del-prototipo)

[**Capítulo V. Conclusiones y Recomendaciones	68**](#capítulo-v.-conclusiones-y-recomendaciones)

[Conclusiones	68](#conclusiones)

[Recomendaciones	69](#recomendaciones)

[**Referencias Bibliográficas	71**](#referencias-bibliográficas)

[**Apéndices	74**](#apéndices)

[Apéndice A \- Marco Normativo de Calidad	74](#apéndice-a---marco-normativo-de-calidad)

[Apéndice B \- Correspondencia Metodológica por Incremento	76](#apéndice-b---correspondencia-metodológica-por-incremento)

[Apéndice C \- Validación Experimental del Motor de Inferencia Meteorológica	78](#apéndice-c---validación-experimental-del-motor-de-inferencia-meteorológica)

[Apéndice D \- Validación Experimental del Motor de Inferencia Hídrica	89](#apéndice-d---validación-experimental-del-motor-de-inferencia-hídrica)

[Apéndice E \- Arquitectura y Trazabilidad del Scheduler	93](#apéndice-e---arquitectura-y-trazabilidad-del-scheduler)

[Apéndice F \- Manual Técnico	98](#apéndice-f---manual-técnico)

[Apéndice G \- Manual de Operación y Catálogo de Interfaces de Usuario	107](#apéndice-g---manual-de-operación-y-catálogo-de-interfaces-de-usuario)

[Apéndice H \- Construcción de la Infraestructura en Campo	133](#apéndice-h---construcción-de-la-infraestructura-en-campo)

**Índice de Figuras**

[Figura 1\. Representación Esquemática del Modelo Incremental.	24](#figura-1.-representación-esquemática-del-modelo-incremental.)

[Figura 2\. Ensayo Empírico Sobre el Espaciado del Riego.	25](#figura-2.-ensayo-empírico-sobre-el-espaciado-del-riego.)

[Figura 3\. Arquitectura en Capas del IoTS de Pristinoplant.	33](#figura-3.-arquitectura-en-capas-del-iots-de-pristinoplant.)

[Figura 4\. Tablero Eléctrico de Conmutación y Nodo Embebido Implementado.	42](#figura-4.-tablero-eléctrico-de-conmutación-y-nodo-embebido-implementado.)

[Figura 5\. Disposición Física del Circuito Presurizado Implementado.	43](#figura-5.-disposición-física-del-circuito-presurizado-implementado.)

[Figura 6\. Prototipado en Banco de Pruebas.	47](#figura-6.-prototipado-en-banco-de-pruebas.)

[Figura 7\. Líneas de Microaspersión y Nebulización Sobre las Mesas de Cultivo.	48](#figura-7.-líneas-de-microaspersión-y-nebulización-sobre-las-mesas-de-cultivo.)

[Figura 8\. EMA Exterior Sensores Protegidos de la Intemperie.	53](#figura-8.-ema-exterior-sensores-protegidos-de-la-intemperie.)

[Figura 9\. EMA Interior en Garita Stevenson 3D.	54](#figura-9.-ema-interior-en-garita-stevenson-3d.)

[Figura 10\. Rutina Cancelada por el Motor Hídrico.	57](#figura-10.-rutina-cancelada-por-el-motor-hídrico.)

[Figura 11\. Degradación del Sensor Resistivo de Lluvia.	58](#figura-11.-degradación-del-sensor-resistivo-de-lluvia.)

[Figura 12\. Evento de Lluvia Inferida por el Motor Meteorológico.	59](#figura-12.-evento-de-lluvia-inferida-por-el-motor-meteorológico.)

[Figura 13\. Notificaciones Desde Telegram.	64](#figura-13.-notificaciones-desde-telegram.)

[Figura 14\. Resiliencia y Tolerancia a Fallos de Red en Rutinas Hídricas.	66](#figura-14.-resiliencia-y-tolerancia-a-fallos-de-red-en-rutinas-hídricas.)

[Figura Ap-E1. Trazabilidad Operativa del Servicio Scheduler.	94](#figura-ap-e1.-trazabilidad-operativa-del-servicio-scheduler.)

[Figura Ap-G1. Centro de Control Manual Directo de Actuadores Hidráulicos.	108](#figura-ap-g1.-centro-de-control-manual-directo-de-actuadores-hidráulicos.)

[Figura Ap-G2. Modal de Confirmación Linea de Agroquimicos	109](#figura-ap-g2.-modal-de-confirmación-linea-de-agroquimicos)

[Figura Ap-G3. Cola de Ejecución de Rutinas.	109](#figura-ap-g3.-cola-de-ejecución-de-rutinas.)

[Figura Ap-G4. Automatización de rutinas.	110](#figura-ap-g4.-automatización-de-rutinas.)

[Figura Ap-G5. Bitácora de Operaciones y Registro de Vetos.	111](#figura-ap-g5.-bitácora-de-operaciones-y-registro-de-vetos.)

[Figura Ap-G6. Inventario de Insumos Agroquímicos.	112](#figura-ap-g6.-inventario-de-insumos-agroquímicos.)

[Figura Ap-G7. Asistente de Formulación de Planes Agroquímicos.	112](#figura-ap-g7.-asistente-de-formulación-de-planes-agroquímicos.)

[Figura Ap-G8. Rutinas de Dosificación Manual de Agronómicos.	113](#figura-ap-g8.-rutinas-de-dosificación-manual-de-agronómicos.)

[Figura Ap-G9. Agenda Proyectada y Programación de Dosificación.	114](#figura-ap-g9.-agenda-proyectada-y-programación-de-dosificación.)

[Figura Ap-G10. Estados de las Rutinas de Dosificación Manual.	114](#figura-ap-g10.-estados-de-las-rutinas-de-dosificación-manual.)

[Figura Ap-G11. Catálogo Taxonómico de Especies Botánicas.	115](#figura-ap-g11.-catálogo-taxonómico-de-especies-botánicas.)

[Figura Ap-G12. Modales de Creación Taxonómica.	116](#figura-ap-g12.-modales-de-creación-taxonómica.)

[Figura Ap-G13. Gestión Taxonómica e Imágenes.	116](#figura-ap-g13.-gestión-taxonómica-e-imágenes.)

[Figura Ap-G14. Product Grid del Inventario Unívoco.	117](#figura-ap-g14.-product-grid-del-inventario-unívoco.)

[Figura Ap-G15. Ficha Técnica de Espécimen y Bitácora Fenológica.	118](#figura-ap-g15.-ficha-técnica-de-espécimen-y-bitácora-fenológica.)

[Figura Ap-G16. Configurar Heros Sliders del Landing Page.	119](#figura-ap-g16.-configurar-heros-sliders-del-landing-page.)

[Figura Ap-G17. Configurar Categorías del Landing Page.	119](#figura-ap-g17.-configurar-categorías-del-landing-page.)

[Figura Ap-G18. Interfaz de Solicitudes de Stock.	120](#figura-ap-g18.-interfaz-de-solicitudes-de-stock.)

[Figura Ap-G19. Mensaje de Notificación para Clientes.	120](#figura-ap-g19.-mensaje-de-notificación-para-clientes.)

[Figura Ap-G20. Dashboard Telemétrico de Supervisión Microclimática en Tiempo Real.	121](#figura-ap-g20.-dashboard-telemétrico-de-supervisión-microclimática-en-tiempo-real.)

[Figura Ap-G21. Telemetría Procesada de iluminancia EMA-Exterior.	122](#figura-ap-g21.-telemetría-procesada-de-iluminancia-ema-exterior.)

[Figura Ap-G22. Telemetría Cruda de Temperatura EMA-Exterior.	123](#figura-ap-g22.-telemetría-cruda-de-temperatura-ema-exterior.)

[Figura Ap-G23. Dashboard de Analítica Agronómica EMA-Exterior.	124](#figura-ap-g23.-dashboard-de-analítica-agronómica-ema-exterior.)

[Figura Ap-G24. Interfaz DIF Térmico EMA-Interior	125](#figura-ap-g24.-interfaz-dif-térmico-ema-interior)

[Figura Ap-G25. Oráculo Meteorológico.	126](#figura-ap-g25.-oráculo-meteorológico.)

[Figura Ap-G26. Sección de Floración.	127](#figura-ap-g26.-sección-de-floración.)

[Figura Ap-G27. Detalle de Producto.	128](#figura-ap-g27.-detalle-de-producto.)

[Figura Ap-G28. Carrito de Compras.	129](#figura-ap-g28.-carrito-de-compras.)

[Figura Ap-G29. Formulario de Formalización de Pedido.	130](#figura-ap-g29.-formulario-de-formalización-de-pedido.)

[Figura Ap-G30. Revisión del Carrito y Facturación.	131](#figura-ap-g30.-revisión-del-carrito-y-facturación.)

[Figura Ap-G31. Pedido Consolidado.	131](#figura-ap-g31.-pedido-consolidado.)

[Figura Ap-G32. Conciliación Administrativa de Órdenes.	132](#figura-ap-g32.-conciliación-administrativa-de-órdenes.)

[Figura Ap-G33. Historial de Ventas.	132](#figura-ap-g33.-historial-de-ventas.)

[Figura Ap-H1. Primera Prueba en Exterior.	133](#figura-ap-h1.-primera-prueba-en-exterior.)

[Figura Ap-H2. Controlador de Carga de Baterías de Litio.	134](#figura-ap-h2.-controlador-de-carga-de-baterías-de-litio.)

[Figura Ap-H3. Adecuaciones del Primer Prototipo.	134](#figura-ap-h3.-adecuaciones-del-primer-prototipo.)

[Figura Ap-H4. Montaje del Primer Prototipo	134](#figura-ap-h4.-montaje-del-primer-prototipo)

[Figura Ap-H5. Case del Primer Prototipo.	135](#figura-ap-h5.-case-del-primer-prototipo.)

[Figura Ap-H6. Visualización del BH1750.	135](#figura-ap-h6.-visualización-del-bh1750.)

[Figura Ap-H7. EMA-Interior Primer Prototipo.	135](#figura-ap-h7.-ema-interior-primer-prototipo.)

[Figura Ap-H8. EMA-Interior Segunda Modelación 3D.	136](#figura-ap-h8.-ema-interior-segunda-modelación-3d.)

[Figura Ap-H9. Piezas Case Protector Vista 1\.	136](#figura-ap-h9.-piezas-case-protector-vista-1.)

[Figura Ap-H10. Piezas Case Protector Vista 2\.	136](#figura-ap-h10.-piezas-case-protector-vista-2.)

[Figura Ap-H11. Cuerpo de la Garita.	137](#figura-ap-h11.-cuerpo-de-la-garita.)

[Figura Ap-H12. Base de la Garita.	137](#figura-ap-h12.-base-de-la-garita.)

[Figura Ap-H13. Adecuación para el BH1750.	138](#figura-ap-h13.-adecuación-para-el-bh1750.)

[Figura Ap-H14. Adecuación de Borneras EMA-Exterior.	138](#figura-ap-h14.-adecuación-de-borneras-ema-exterior.)

[Figura Ap-H15. Instalación de Infraestructura EMA-Exterior.	139](#figura-ap-h15.-instalación-de-infraestructura-ema-exterior.)

[Figura Ap-H16. Adecuación Base Bombillo BH1750.	139](#figura-ap-h16.-adecuación-base-bombillo-bh1750.)

[Figura Ap-H17. Instalación DTH22 en Garita de Lluvia.	140](#figura-ap-h17.-instalación-dth22-en-garita-de-lluvia.)

[Figura Ap-H18. Cableado del EMA-Exterior.	140](#figura-ap-h18.-cableado-del-ema-exterior.)

**Índice de Tablas**  
[Tabla 1\. Requerimientos funcionales.	28](#tabla-1.-requerimientos-funcionales.)  
[Tabla 2\. Requerimientos no funcionales.	30](#tabla-2.-requerimientos-no-funcionales.)  
[Tabla Ap-B1. Módulos y entregables de ingeniería por incremento.	75](#tabla-ap-b1.-módulos-y-entregables-de-ingeniería-por-incremento.)  
[Tabla Ap-B2. Matriz de correspondencia metodológica por incremento.	76](#tabla-ap-b2.-matriz-de-correspondencia-metodológica-por-incremento.)  
[Tabla Ap-C1. Bitácora de eventos de lluvia observados in situ.	78](#tabla-ap-c1.-bitácora-de-eventos-de-lluvia-observados-in-situ.)  
[Tabla Ap-D1. Volumen global y balance de ejecución de tareas hidráulicas.	89](#tabla-ap-d1.-volumen-global-y-balance-de-ejecución-de-tareas-hidráulicas.)  
[Tabla Ap-D2. Operaciones hidráulicas según el propósito de la rutina.	90](#tabla-ap-d2.-operaciones-hidráulicas-según-el-propósito-de-la-rutina.)  
[Tabla Ap-D3. Distribución de intervenciones de control manual y contingencias operativas.	90](#tabla-ap-d3.-distribución-de-intervenciones-de-control-manual-y-contingencias-operativas.)  
[Tabla Ap-D4. Clasificación de vetos del motor de inferencia hídrica.	91](#tabla-ap-d4.-clasificación-de-vetos-del-motor-de-inferencia-hídrica.)

**Universidad Católica Andrés Bello**   
**Facultad de Ingeniería**  
**Escuela de Ingeniería Informática Guayana**

**Sistema de Gestión de Invernaderos Basado en Agricultura Inteligente**   
**para el Cultivo de Orquídeas**

|  | Realizado por: | Flores Silva, Julio Cesar |
| ----: | :---- | :---- |
|  | Tutor Académico: | Fonseca Droy, José Francisco |
|  | Tutor Empresarial: | García Martínez, Richard José |
|  | Fecha: | Septiembre, 2026 |

**Resumen**

Las operaciones de cultivo previas en el orquideario de PristinoPlant se caracterizaban por un riego empírico, la ausencia de datos microclimáticos y la falta de trazabilidad en el cumplimiento de los programas de fertilización y control fitosanitario planificados. El objetivo de la investigación fue desarrollar una plataforma de agricultura inteligente basada en Internet de las Cosas para establecer el monitoreo microclimático continuo, dotar de autonomía deliberativa al circuito hidráulico de riego y digitalizar la gestión agronómica del orquideario. La solución integró una arquitectura en capas fundamentada en el protocolo MQTT, persistencia temporal y relacional, un tablero eléctrico y estaciones meteorológicas automáticas de diseño propio. Asimismo, se implementaron motores de inferencia determinísticos para detectar y caracterizar eventos de lluvia a partir de variaciones microclimáticas y vetar deliberativamente el accionamiento del circuito hidráulico de riego autónomo, complementados con módulos web para la dosificación agronómica y la trazabilidad botánica por ejemplar. Metodológicamente, se aplicó el modelo incremental articulado con la metodología TDDM4IoTS a lo largo de siete iteraciones. Los resultados validaron la efectividad del motor de inferencia meteorológica en la detección desatendida de lluvia, la precisión de los vetos preventivos de riego y una alta confiabilidad operativa en los accionamientos del circuito hidráulico. Se concluyó que la integración de hardware embebido, telemetría continua y servicios en la nube constituyó una solución tecnológicamente viable y robusta para sustituir las prácticas empíricas por un control preciso y trazable en el cultivo de orquídeas.

**Palabras clave:** Agricultura inteligente, Internet de las Cosas (IoT), Riego autónomo, Telemetría ambiental, TDDM4IoTS.

**Introducción**  
La gestión de las operaciones de cultivo de orquídeas bajo estructuras de malla sombra abarca desafíos agronómicos comunes a productores comerciales y coleccionistas. Las labores cotidianas demandan caracterizar oportunamente el microclima, coordinar la irrigación, planificar la nutrición mineral y mantener un inventario unívoco. En la práctica convencional, la carencia de herramientas tecnológicas accesibles somete estas tareas a un manejo empírico y desarticulado, propiciando riesgos de asfixia radicular por exceso de agua, estrés térmico en horas de alta radiación e interrupción en los planes fitosanitarios. Frente a esto, la agricultura inteligente permite concebir sistemas IoT para tecnificar el cultivo.

Esta investigación desarrolla una plataforma distribuida de agricultura inteligente validada en el orquideario PristinoPlant. La solución física acopla estaciones meteorológicas automáticas de diseño propio para la adquisición climática continúa, junto a un nodo embebido integrado en un tablero eléctrico que ejecuta la conmutación segura del circuito hidráulico. El sistema es coordinado por motores de inferencia determinísticos que evalúan las condiciones en tiempo real para autorizar, diferir o vetar deliberadamente las operaciones de riego ante eventos de lluvia o saturación hídrica.

En el software, el sistema integra una aplicación web para el monitoreo microclimático, la operatividad hidráulica, la gestión de dosificación de agroquímicos, complementada con el inventario unívoco de su catálogo taxonómico botánico. Metodológicamente, el desarrollo se sustenta en la arquitectura por capas de Gubbi et al. (2013), el estándar MQTT (OASIS, 2014\) y el modelo incremental de Pressman (2010), aplicando la metodología TDDM4IoTS de Guerrero-Ulloa et al. (2020) a lo largo de siete incrementos con despliegue continuo *in situ*.

El presente informe se organiza en cinco capítulos: el Capítulo I contextualiza la problemática y los objetivos del proyecto; el Capítulo II expone los antecedentes y las bases teóricas sobre agricultura de precisión, redes IoT y ecofisiología; el Capítulo III detalla el marco metodológico con la adaptación de TDDM4IoTS; el Capítulo IV documenta el diseño, la construcción incremental y las pruebas de campo; y el Capítulo V formula las conclusiones del sistema, complementándose con ocho (8) apéndices técnicos y operacionales.

**Capítulo I. El Problema**

**Planteamiento del Problema**

Cultivar orquídeas exitosamente implica proporcionar las condiciones microclimáticas específicas para cada especie. Para lograrlo, es fundamental comprender y controlar variables como la iluminancia, la temperatura, la humedad relativa, la ventilación, la frecuencia de riego, la planificación de dosificación de agroquímicos y las propiedades del sustrato, entendiendo esta última como la porosidad, capacidad de retención hídrica y aireación radicular. Cada uno de estos factores condiciona de manera directa el desarrollo vegetativo de las orquídeas y determina su capacidad para florecer.

Bajo esta perspectiva, el rigor operativo que exige el control de sus condiciones microclimáticas responde a la singularidad biológica de la familia Orchidaceae, la cual presenta "una amplia variedad de adaptaciones morfológicas y anatómicas únicas, una diversidad que pocas otras familias de plantas igualan" (Hágsater et al., 1996, p. 1). 

Su distribución biogeográfica abarca casi la totalidad de los ecosistemas terrestres, con excepción de las zonas polares y los desiertos hiperáridos, concentrando su mayor biodiversidad en las regiones tropicales. Pueden desarrollarse sobre diversos tipos de suelos, sobre rocas, y muchas especies tienen un hábito de crecimiento epífito, es decir, crecen sobre otras plantas o estructuras utilizándolas como soporte físico (Hágsater et al., 1996, p. 3).

En el ámbito regional, entidades especializadas como la Sociedad Orquideológica del Caroní (SOC), ubicada en Ciudad Guayana, Estado Bolívar, desempeñan un rol estratégico en la divulgación científica para la protección de las orquídeas. Mediante programas de capacitación, proyectos de conservación *in situ* o *ex situ*, e intercambio técnico entre especialistas, investigadores y aficionados, SOC promueve la adopción de prácticas informadas que facilitan la réplica *ex profeso* de los parámetros ambientales requeridos por los distintos géneros de orquídeas presentes en Venezuela.

Conforme los cultivadores profundizan sus conocimientos y su dedicación a las orquídeas, suelen especializarse en géneros que puedan cohabitar entre sí, invirtiendo un considerable esfuerzo en la construcción de orquidearios para mantener unas condiciones ambientales favorables. Sin embargo, en muchos casos no se dispone del espacio necesario para una estructura de invernadero compleja o de la infraestructura necesaria para controlar significativamente las condiciones ambientales del orquideario.

A esta restricción de infraestructura se suma el hecho de que, aun cuando un grupo de cultivadores coexista en una misma demarcación geográfica, las condiciones microclimáticas al interior de sus orquidearios presentan variaciones significativas. Estas fluctuaciones en parámetros como humedad, temperatura, iluminancia y ventilación suelen ser lo suficientemente marcadas como para limitar o comprometer la viabilidad agronómica de ciertos géneros de orquídeas, los cuales podrían desarrollarse óptimamente si se contara con mecanismos precisos de regulación ambiental.

Esta necesidad de regulación ambiental cobra especial relevancia en la producción comercial de orquídeas, la cual demanda infraestructuras con capacidad operativa para el monitoreo y control riguroso del microclima. Si bien muchos cultivadores inician sus operaciones en estructuras de invernaderos de malla sombra, la expansión progresiva de la producción y la búsqueda de eficiencia hacen imperativa la transición hacia sistemas de control ambiental más sofisticados e integrados.

Esta realidad se refleja directamente en iniciativas locales como *PristinoPlant*, un emprendimiento ubicado en San Félix, Estado Bolívar, enfocado en el cultivo, conservación, propagación y comercialización de orquídeas, así como de otras familias de plantas entre las que destacan rosas del desierto, cactus y suculentas. En la actualidad, PristinoPlant dispone de dos áreas de invernadero de malla sombra dedicadas a la producción de géneros como *Cattleya* y *Dendrobium*. Asimismo, como miembro activo de SOC, colabora constantemente en actividades de investigación y divulgación orquideológica en las Muestras Surorientales de Orquídeas del Caroní.

La producción comercial de orquídeas en invernaderos de malla sombra enfrenta desafíos significativos en cuanto al control preciso de las condiciones ambientales. Si bien estos invernaderos mitigan la intensidad lumínica, las altas temperaturas y la evaporación de la humedad relativa; su falta de precisión y la dependencia de la experiencia del cultivador limitan la eficiencia y escalabilidad de la producción. Por consiguiente, la ausencia de datos precisos impide optimizar las condiciones de cultivo y maximizar el rendimiento. Para superar estas limitaciones, es necesario adoptar enfoques de agricultura de precisión y agricultura inteligente. 

Marinello et al. (2023) definen la agricultura de precisión como un enfoque agrícola que hace uso de las innovaciones tecnológicas y el análisis de datos, para maximizar el rendimiento de los cultivos, reducir el desperdicio, aumentar la productividad y tomar decisiones más informadas (p. 1).

Bajo este enfoque, se sostiene que la integración de las tecnologías disruptivas de la Industria 4.0 —tales como el Internet de las Cosas (IoT), la analítica de datos, los algoritmos de inferencia y la automatización agrícola— ha impulsado la evolución desde una agricultura de precisión convencional hacia el paradigma de la agricultura inteligente. Esta transformación tecnológica ha generado nuevas oportunidades operativas, revolucionando la manera en que los productores gestionan sus cultivos, optimizan el uso de recursos hídricos y energéticos, y supervisan las variables ambientales en tiempo real (Marinello et al., 2023).

Esta transición hacia el modelo de agricultura inteligente en entornos protegidos resulta fundamental para garantizar la sostenibilidad operativa y la competitividad de la producción comercial de orquídeas. La optimización automatizada de recursos insustituibles como el agua, los nutrientes minerales y los agentes fitosanitarios reduce drásticamente el impacto ambiental. Así mismo, la captura continua y precisa de datos microclimáticos permite fundamentar las decisiones agronómicas sobre riego, fertilización y fitosanidad, impactando positivamente en el rendimiento, la calidad de la floración y la sanidad del cultivo. Esta mayor eficiencia técnica no sólo mitiga los riesgos de pérdida por estrés ambiental, sino que fortalece la posición de los productores en un mercado agrícola crecientemente exigente.

A partir de las consideraciones expuestas, se evidencia la limitación estructural de los invernaderos tradicionales basados en la supervisión manual y discontinua para responder a las exigencias fisiológicas de la familia *Orchidaceae* y sostener una escala comercial eficiente.

En consecuencia, surge la necesidad apremiante de hacer la transición hacia el paradigma de la agricultura inteligente, integrando soluciones tecnológicas avanzadas para el diagnóstico, la toma de decisiones y la ejecución autónoma de las labores culturales en el cultivo de orquídeas; consolidando así un sistema de producción agrícola eficiente: un invernadero inteligente. En consecuencia, surge la necesidad apremiante de integrar soluciones tecnológicas avanzadas para el diagnóstico, la toma de decisiones y la automatización de las labores culturales, orientadas hacia la consolidación de un sistema de producción autónomo: un invernadero inteligente.

Atendiendo a esta realidad, se le propuso a PristinoPlant el desarrollo e implementación de un *sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas*. Esta propuesta tiene como propósito automatizar el control de las variables microclimáticas al interior de sus orquidearios, sistematizar la planificación de la dosificación de agroquímicos según los requerimientos del cultivo, y centralizar el registro agronómico para realizar un seguimiento riguroso y trazable del desarrollo de las orquídeas.

**Objetivo General**

Desarrollar un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.

**Objetivos Específicos**

1. Analizar los conceptos y herramientas referentes al cultivo de orquídeas basado en agricultura inteligente, a fin de identificar las características del sistema a desarrollar.  
2. Diseñar en función del análisis realizado, un sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.  
3. Implementar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, según el diseño realizado.  
4. Validar el sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas, respecto al análisis realizado.  
5. Realizar la documentación formal del sistema de gestión de invernaderos basado en agricultura inteligente para el cultivo de orquídeas.

**Aportes Tecnológicos**

* Promover la adopción de tecnologías de agricultura inteligente para el diagnóstico, toma de decisiones y ejecución de las actividades relacionadas al cultivo de orquídeas.

* Brindar conocimientos referentes al diseño, construcción y gestión de un invernadero inteligente, que podrán ser aplicados tanto por PristinoPlant como por la Sociedad Orquideológica del Caroní en sus orquidearios.

**Aportes Funcionales**

* Apoyar la toma de decisiones de los cultivadores a través de información sobre el estado de las condiciones ambientales de manera expedita y oportuna.

* Optimizar la planificación y dosificación de agroquímicos garantizando una aplicación precisa, eficiente y segura que maximice la productividad.  
* Apoyar la gestión comercial y el estudio fenológico mediante el registro individualizado de floración, aportando métricas sobre frecuencia anual y estacionalidad biológica que incrementan el valor comercial del catálogo botánico.

* Optimizar el consumo de agua mediante la implementación de un sistema de riego en función de las necesidades de las plantas y las condiciones climáticas externas.

* Contribución al ODS 6 (Gestión sostenible del agua \- Meta 6.4): Optimización del uso del recurso hídrico mediante la integración de un circuito hidráulico de riego con veto deliberativo automático, el cual suspende el accionamiento de electroválvulas al detectar eventos de lluvia o saturación ambiental, evitando riegos redundantes y el desperdicio de agua dulce.

* Contribución al ODS 9 (Infraestructura resiliente e innovación \- Meta 9.4): Modernización tecnológica de la infraestructura de cultivo mediante una arquitectura de Internet de las Cosas (IoT) desacoplada, reproducible y de bajo costo, que combina manufactura aditiva (impresión 3D), microcontroladores de código abierto (ESP32) y protocolos estándares de comunicación segura (MQTT/TLS).

* Contribución al ODS 12 (Producción y consumo sostenibles \- Meta 12.2): Racionalización en el uso de insumos agrícolas a través de un módulo de formulación y seguimiento agronómico que calcula la dosificación precisa de fertilizantes y fitosanitarios, mitigando la sobre-aplicación química y la contaminación de sustratos.

* Contribución al ODS 13 (Acción por el clima \- Meta 13.1): Fortalecimiento de la capacidad de adaptación y resiliencia microclimática del orquideario frente a fluctuaciones térmicas e hidroclimáticas extremas, sustentado en la adquisición telemétrica continua y la detección desatendida de variaciones ambientales críticas.

**Alcance**  
El presente Trabajo de Grado consiste en un proyecto de Ingeniería Informática, específicamente en las áreas del Internet de las Cosas (IoT) y desarrollo de software, orientado al diseño, desarrollo e implementación de un sistema de gestión de invernaderos basado en agricultura inteligente para optimizar el cultivo de orquídeas en el emprendimiento PristinoPlant.  
El despliegue y validación del proyecto se sitúa en el orquideario de PristinoPlant, ubicado en San Félix, Estado Bolívar, Venezuela. Metodológicamente, se constituye por el estudio y análisis de las áreas de la agricultura inteligente, los sistemas basados en IoT y las actividades agronómicas de PristinoPlant; el diseño de la arquitectura distribuida del sistema, la capa de comunicación e interconectividad IoT, el modelado conceptual del circuito hidráulico de riego autónomo y la estructuración lógica de datos; el desarrollo e integración continua de los componentes de hardware, firmware, infraestructura IoT y la plataforma de software; la validación en campo de los algoritmos de inferencia de riego y de inferencia meteorológica; y la documentación formal de los manuales técnicos, operativos y de usuario necesarios para la transferencia tecnológica y sostenibilidad del sistema.  
La solución implementada abarca el monitoreo telemétrico continuo de las condiciones microclimáticas internas y externas del orquideario, la orquestación autónoma del riego hidráulico mediante motores de inferencia, y una plataforma web para la gestión del inventario botánico, la gestión de dosificación de insumos agroquímicos y el seguimiento agronómico del cultivo. A su vez, el proyecto valida el prototipado y la puesta en marcha de la arquitectura de software distribuida para la toma de decisiones agronómicas que integra hardware de adquisición de datos microclimáticos y hardware de conmutación hidráulica, constituyendo un referente práctico para la gestión autónoma de entornos de cultivo inteligente.

**Limitaciones**  
El desarrollo y despliegue del proyecto estuvo condicionado por limitaciones biológicas, físicas y de conectividad:

* **Evaluación biológica:** El lento ciclo vegetativo de las orquídeas requiere años de observación, lo que excede los plazos académicos del proyecto. Esto imposibilita realizar un estudio biométrico comparativo con grupos de control, por lo que la validación se limitó estrictamente a la precisión operativa, estabilidad y confiabilidad de la infraestructura IoT en el control microclimático.  
* **Degradación de hardware:** La selección inicial de componentes omitió considerar la degradación por intemperie y la necesidad de protección IP agrícola. Al evidenciarse fallas progresivas tras su implementación, se aplicaron las medidas pertinentes: un *press control* (en sustitución del transductor de agua), un motor de inferencia de lluvias (para reemplazar al sensor físico) y la recomendación de migrar a sensores de la familia SHT40 impermeables (en reemplazo del DHT22).  
* **Servicio de internet:** La inestabilidad y baja velocidad del servicio de internet local en el área de despliegue representan una restricción permanente para la arquitectura del sistema. Aunque se migraron los servicios críticos a un VPS en la nube, la sincronización de telemetría in situ y la entrega de datos en tiempo real quedan limitadas por la disponibilidad de la red local, forzando al hardware a operar en modo *offline* durante las fluctuaciones del servicio y retrasando la actualización de la telemetría.

**Capítulo II. Marco Teórico**

**Antecedentes de la Investigación**  
La fundamentación teórica de la presente investigación se sustentó en la revisión sistemática de estudios previos, tanto en el ámbito internacional como local, que abordaron la convergencia entre la agricultura de precisión, el Internet de las Cosas (IoT) y automatización telemétrica:  
En el ámbito internacional, Liao y Chen (2022), en Taiwán, desarrollaron la investigación titulada “*Correlación precisa del crecimiento de las hojas de orquídeas Phalaenopsis con las variables ambientales del invernadero utilizando un sistema de monitoreo IoT*”. El estudio consistió en diseñar e implementar un sistema de monitoreo en tiempo real con IoT y visión computacional para evaluar el impacto de la temperatura y humedad relativa sobre el crecimiento de orquídeas Phalaenopsis.   
Su trabajo validó la efectividad de plataformas en la nube para supervisar variables ambientales y conmutar actuadores de microaspersión, aportando un modelo referencial sobre la necesidad de correlacionar la telemetría continua con las respuestas fisiológicas del cultivo.  
En el entorno institucional, Rozas (2023), en su trabajo de grado titulado *“Servidor para la Interconexión de Dispositivos IoT de los Laboratorios de Ingeniería Informática e Ingeniería Civil de la UCAB Guayana”*, implementó un servidor centralizado en un ordenador monoplaca Raspberry Pi 4 con bróker Eclipse Mosquitto, enlazado a nodos ESP8266 y Arduino mediante el protocolo MQTT y buses I2C para la lectura ambiental y conmutación de relés.  
Este trabajo demostró la viabilidad práctica de emplear el protocolo MQTT para el intercambio telemétrico y validó la idoneidad de los microcontroladores de bajo costo de la familia ESP frente a placas tradicionales como Arduino gracias a su conectividad inalámbrica nativa. Para PristinoPlant, representó un caso de estudio sobre las alternativas de despliegue del bróker (local frente a servidor remoto) y fundamentó la selección del ESP32 —por su mayor capacidad de cómputo y memoria frente al ESP8266— acoplado a un bróker privado contenerizado en un VPS en la nube (Docker Compose) bajo canales seguros TLS, garantizando alta disponibilidad 24/7 y acceso remoto frente a la gestión local en un ordenador monoplaca.  
Igualmente en la UCAB Guayana, Moreno González (2025), en su trabajo de grado titulado “*Plataforma para Facilitar la Construcción y Programación de Estaciones Meteorológicas Orientadas a Estudiantes de Educación Básica*”, desarrolló una estación meteorológica basada en el kit SparkFun Weather:bit y microcontrolador BBC Micro:bit, adquiriendo variables atmosféricas enlazadas a un bróker MQTT (Mosquitto/EMQX) y persistencia temporal en InfluxDB.  
Dicha investigación validó en el ámbito institucional la idoneidad de InfluxDB para el registro masivo de series temporales climáticas y sirvió como referente de una estación meteorológica tradicional. No obstante, frente a la dependencia de kits prefabricados propietarios y sus altos costos de adquisición e importación, PristinoPlant contrastó este esquema demostrando la viabilidad de una solución de bajo costo basada en sensores independientes accesibles, manufactura aditiva local (garita meteorológica impresa en 3D) y el microcontrolador ESP32, logrando una estación meteorológica automática funcional, económica y autónoma.

**Bases Teóricas**

**De la agricultura de precisión al Internet de las Cosas (IoT).**  
La gestión agrícola tradicional ha dependido históricamente de la inspección visual empírica y de cronogramas rígidos de irrigación, prácticas que resultan altamente vulnerables ante las fluctuaciones climáticas y propician el desperdicio de recursos hídricos o la proliferación de fitopatógenos (Kim & Lee, 2022). Frente a estas limitaciones, la agricultura de precisión surgió como un paradigma tecnológico orientado a optimizar la toma de decisiones agronómicas mediante el monitoreo continuo, localizado y en tiempo real de las condiciones del entorno (Prakash et al., 2024).  
La articulación de este enfoque con el Internet de las Cosas (IoT) transformó la captura de datos en una infraestructura digital distribuida, en la cual redes de dispositivos embebidos interconectados adquieren, procesan y transmiten telemetría ambiental hacia plataformas de software centralizadas (Majumder et al., 2019). En cultivos protegidos de alto valor botánico, como las orquídeas, la incorporación de arquitecturas IoT proporciona una base empírica para coordinar la conmutación de actuadores de riego y ventilación, mitigando tanto el estrés térmico como el encharcamiento prolongado del sustrato.

**Arquitectura funcional por capas en sistemas IoT.**  
Para garantizar modularidad, escalabilidad e interoperabilidad ante la heterogeneidad del hardware y software, los Sistemas Basados en Internet de las Cosas (IoTS) se estructuran formalmente bajo el modelo arquitectónico de cuatro capas funcionales propuesto por Gubbi et al. (2013):

* *Capa de percepción:* Constituye el estrato físico en contacto directo con el entorno. Agrupa los transductores y sensores encargados de medir las magnitudes analógicas o digitales (temperatura, humedad relativa e iluminancia) y los circuitos acondicionadores de señal controlados por microcontroladores de borde.

* *Capa de red:* Responsable del transporte seguro y confiable de las tramas telemétricas hacia los servidores de cómputo. Se apoya en estándares de comunicación inalámbrica de corto alcance (Wi-Fi 802.11 b/g/n) y protocolos de mensajería optimizados para redes restringidas.

* *Capa de procesamiento:* Representa el núcleo analítico y de persistencia del sistema, desplegado bajo esquemas de computación en la nube (*Cloud Computing*) o en el borde (*Edge Computing*). En este estrato residen los servicios de ingesta masiva de datos, los motores de persistencia temporal y relacional, y los servicios de orquestación lógica desatendida.

* *Capa de aplicación:* Comprende las interfaces hombre-máquina (HMI) y plataformas web accesibles mediante las cuales los operadores supervisan en tiempo real el microclima, configuran agendas operativas, formulan programas agronómicos y administran la trazabilidad comercial del cultivo.

**Protocolos de comunicación telemétrica en ambientes restringidos.**  
En los sistemas IoT con nodos sensores alimentados por baterías o enlazados a redes inalámbricas susceptibles a interferencias, los protocolos convencionales basados en el modelo petición-respuesta (como HTTP) introducen una sobrecarga inadmisible en el tamaño de las cabeceras y en el consumo energético (OASIS, 2014). Por esta razón, el estándar *Message Queuing Telemetry Transport* (MQTT) se consolidó como el protocolo de referencia para la transmisión de telemetría y el gobierno de actuadores en arquitecturas M2M (*Machine-to-Machine*).  
MQTT se fundamenta en un patrón de comunicación desacoplado de Publicación/Suscripción (*Pub/Sub*), orquestado por un bróker central (como *Eclipse Mosquitto*). Los nodos de percepción publican cargas útiles (*payloads*) en formato binario o JSON bajo tópicos jerárquicos (p. ej., pristinoplant/weather/exterior), mientras que los microservicios backend reciben la información sin que los emisores requieran conocer la dirección de red de los destinatarios.   
Asimismo, MQTT contempla tres niveles de Calidad de Servicio (*Quality of Service, QoS*) que regulan la certeza de entrega del mensaje: *at most once* (QoS 0), *at least once* (QoS 1\) y *exactly once* (QoS 2). En entornos de producción, este tráfico se canaliza sobre sockets TCP/IP protegidos con cifrado de capa de transporte (TLS/SSL), salvaguardando la integridad de los comandos de conmutación de potencia.

**Persistencia de series temporales frente a modelos relacionales.**  
En arquitecturas IoT coexisten dos paradigmas de almacenamiento con propósitos diferenciados. Los sistemas de bases de datos relacionales estructuran la información mediante esquemas normalizados y propiedades ACID, resultando idóneos para la gestión transaccional de identidades, inventarios y configuraciones del sistema.  
Por su parte, las bases de datos de series temporales (*Time Series Database*, como InfluxDB) están especializadas en la ingesta continua de mediciones cronológicas a alta frecuencia. Estos motores implementan compresión temporal y funciones de agregación nativas, evitando la degradación de índices que sufren los modelos relacionales ante flujos masivos de telemetría y permitiendo consultas históricas eficientes por ventanas de tiempo.

**Sistemas basados en reglas y motores de inferencia determinísticos.**  
En sistemas automatizados, un motor de reglas (Rule Engine) es un componente de software que evalúa de forma desacoplada un conjunto de proposiciones lógicas (si \[condición\], entonces \[acción\]) contra el estado actual de los hechos almacenados en el sistema.  
En agricultura inteligente, la integración de motores de inferencia confiere autonomía deliberativa al circuito hidráulico. En lugar de temporizadores ciegos, el motor analiza variables climáticas en tiempo real (lluvia, gradientes térmicos o saturación hídrica) y las contrasta con matrices agronómicas para ejecutar, posponer o vetar el riego programado. Este enfoque desacopla la política de decisión del código de control de bajo nivel, permitiendo calibrar y evolucionar los umbrales de decisión sin alterar la arquitectura del firmware.

**Parámetros microclimáticos críticos para la inferencia agronómica.**  
El comportamiento biológico de las orquídeas epífitas en ambientes controlados se encuentra regido por un conjunto de magnitudes físicas que actúan como variables de entrada prioritarias para los algoritmos de control:

* *Temperatura y gradiente nictemeral:* La respuesta vegetal está condicionada por la alternancia térmica. El diferencial de temperatura entre el día y la noche (termoperiodo, ΔT \= Tdía − Tnoche) actúa como el disparador endocrino de la inducción floral. Asimismo, temperaturas sostenidas por encima de 34ºC provocan el cierre estomático foliar y exigen rutinas de enfriamiento evaporativo en el suelo del orquideario.

* *Humedad relativa (HR) y Déficit de Presión de Vapor (VPD):* La humedad relativa determina la tasa de evaporación en la lámina foliar. No obstante, el indicador biofísico más riguroso es el Déficit de Presión de Vapor (VPD , expresado en kilopascales, kPa), el cual cuantifica la diferencia entre la presión de vapor de saturación a la temperatura de la hoja y la presión de vapor real del aire. Un VPD equilibrado (0.8 a 1.2 kPa) favorece la transpiración adecuada y la absorción de nutrientes, mientras que valores elevados (\> 1.8 kPa) inducen deshidratación foliar severa.

* *Iluminancia y radiación lumínica acumulada (DLI):* La radiación solar gobierna la actividad fotosintética y la inducción floral. Mientras que la iluminancia instantánea (medida en lux) previene el daño por radiación cenital directa, el indicador agronómico determinante es la Integral de Luz Diaria (*Daily Light Integral* \- DLI, expresada en mol/m²/d). El DLI cuantifica la cantidad acumulada de luz útil recibida por metro cuadrado durante el ciclo completo de 24 horas, requiriendo en orquídeas del género *Cattleya* un rango óptimo de 4.0 a 12.0 mol/m²/d para inducir la floración sin provocar estrés fotoquímico ni clorosis.

* *Dinámica radicular y prevención de anoxia:* Las raíces epífitas están recubiertas por el *velamen radicular*, un tejido esponjoso especializado que capta humedad por capilaridad en segundos pero requiere una rápida aireación posterior. La saturación hídrica continúa por riegos excesivos elimina el oxígeno en el medio poroso, desencadenando la asfixia del tejido radicular (*anoxia*) y la proliferación letal de oomicetos fúngicos del suelo.

**Terminología Básica**

* *Bróker MQTT:* Servidor de software centralizado en una red MQTT que recibe las publicaciones de datos desde los nodos embebidos y las distribuye de manera desacoplada hacia los clientes suscritos a tópicos específicos.

* *Calidad de Servicio (Quality of Service \- QoS):* Atributo del protocolo MQTT que define el nivel de garantía y confirmación de entrega en la transmisión de un mensaje entre clientes y bróker (QoS 0: entrega sin confirmación; QoS 1: entrega con confirmación obligatoria; QoS 2: entrega unívoca garantizada).

* *Computación en el Borde (Edge Computing):* Paradigma arquitectónico donde el procesamiento preliminar, filtrado y validación de las señales físicas se ejecuta directamente en los nodos de campo o microcontroladores locales, reduciendo la latencia y la saturación del canal de red.

* *Déficit de Presión de Vapor (Vapor Pressure Deficit \- VPD):* Magnitud física calculada a partir de la temperatura y la humedad relativa que representa la diferencia entre la cantidad de vapor de agua contenida en el aire y la cantidad máxima que este podría retener a saturación; constituye el indicador bioclimático rector para evaluar la transpiración y el estrés vegetal.

* *Gemelo Digital (Digital Twin):* Representación computacional abstracta y estructurada de un espécimen botánico o componente físico presente en el orquideario, enlazando sus características taxonómicas, ubicación física y estado fenológico con la base de datos de gestión.

* *Microclima:* Conjunto localizado y delimitado de condiciones atmosféricas (temperatura, humedad relativa, radiación solar y flujo de aire) existente en el interior de una estructura de cultivo o zona específica del orquideario.

* *Telemetría:* Técnica automatizada de medición y recopilación remota de magnitudes físicas a través de sensores instrumentados en campo, transmitiendo los datos mediante canales de comunicación hacia sistemas centrales de cómputo para su registro y análisis.

* *Velamen Radicular:* Manto epidérmico multiseriado de células lignificadas muertas que recubre las raíces de las orquídeas epífitas; actúa como una esponja capilar para la absorción de humedad y aislamiento térmico, demandando secado intermitente para prevenir asfixia radicular.

**Capítulo III. Marco Metodológico**

**Tipo de Investigación**  
El presente Trabajo Instrumental de Grado se enmarca como una investigación proyectiva, al enfocarse en el diseño e implementación de una solución tecnológica fundamentada en un proceso sistemático de indagación para solventar requerimientos operativos de un entorno real (Hurtado de Barrera, 2010, p. 133).   
Así mismo, responde a la modalidad de proyecto factible, ya que consiste en el desarrollo e implantación de un modelo funcional y económicamente viable orientado a solventar necesidades organizacionales específicas (Universidad Pedagógica Experimental Libertador \[UPEL\], 2016, p. 21). Por su parte, adquiere un carácter tecnológico o aplicado, dado que persigue la integración práctica de la ingeniería sobre la mera teoría (Esteban Nieto, 2018, p. 3).  
Estas metodologías se materializan en una plataforma de agricultura inteligente que automatiza el monitoreo microclimático, confiere autonomía deliberativa al riego mediante motores de inferencia, centraliza la planificación de dosificación de agroquímicos, el catálogo taxonómico y el inventario unívoco.

**Nivel de la Investigación**  
Según el grado de profundidad alcanzado, la investigación se sitúa en un nivel descriptivo-explicativo (Arias, 2012; Sabino, 1992, p. 43). Es descriptiva porque caracteriza el microclima, la infraestructura hidráulico-electrónica y las necesidades agronómicas del cultivo. Asimismo, adquiere carácter explicativo al determinar las relaciones causa-efecto entre las variaciones de los parámetros ambientales y la toma de decisiones autónoma del motor de inferencia para ejecutar, diferir o vetar el riego.

**Diseño de la Investigación**  
La estrategia metodológica adoptada corresponde a un diseño experimental de campo complementado con investigación documental (Arias, 2012, p. 27; Sabino, 1992, pp. 91-92). Es experimental de campo debido a que los prototipos de hardware —tablero eléctrico, nodos de control y estaciones meteorológicas— y los algoritmos para la toma de decisiones fueron sometidos a la manipulación de variables y validaciones iterativas bajo las condiciones reales del orquideario (Ramos-Galarza, 2021, p. 1). Paralelamente, el componente documental se sustentó en la revisión sistemática de sistemas IoT, el protocolo MQTT para la adquisición y transmisión de telemetría, el diseño de estaciones meteorológicas de bajo costo, técnicas de regulación microclimática y literatura agronómica especializada en el cultivo de orquídeas.

**Población y Muestra**  
La población representa el conjunto de elementos sobre los cuales se generalizan los resultados de la investigación (Arias, 2012). En este proyecto, enfocado en dotar de autonomía al circuito hidráulico de riego mediante motores de inferencia, la población comprende el universo continuo de variaciones microclimáticas y estados ambientales generados en el orquideario PristinoPlant.  
La muestra consistió en la totalidad de los registros discretos de telemetría (temperatura, humedad relativa, iluminancia y eventos de precipitación) capturados sistemáticamente por las estaciones meteorológicas (EMA interior y exterior) desplegadas en el orquideario durante los ciclos estacionales de prueba. Este muestreo continuo exhaustivo aportó el corpus de datos empíricos indispensable para caracterizar el comportamiento del entorno y calibrar las reglas de decisión del sistema IoT.

**Técnicas e Instrumentos de Recolección de Datos**  
La recolección de datos comprende los procedimientos sistemáticos e instrumentos empleados para obtener y registrar la información empírica y conceptual de la investigación (Arias, 2012, pp. 67-68). En este proyecto se articularon tres técnicas principales:

**Revisión y análisis documental.**   
Consistió en la revisión sistemática de fuentes académicas y fichas técnicas para fundamentar las decisiones de arquitectura y hardware del proyecto (Arias, 2012; Hernández, Fernández y Baptista, 2010). Dicha labor orientó la aplicación del marco TDDM4IoTS, el firmware en MicroPython sobre ESP32, los servicios contenerizados con MQTT/SSL, la ingeniería del tablero eléctrico y el prototipado de las estaciones meteorológicas automáticas.

***Instrumentos de revisión documental.***

* *Bases Académicas:* Google Scholar e IEEE Xplore para la recopilación de literatura sobre IoT y agricultura de precisión.

* *Fichas Técnicas (Datasheets):* Especificaciones de fabricantes para el dimensionamiento de microcontroladores, sensores, relés, bombas de agua y electroválvulas.

* *Esquemas Digitales:* Diagramas de conexión de hardware, topología de red y circuitos electrónicos del sistema.

**Entrevista no estructurada.**  
Diálogo abierto y continuo con los cultivadores y el tutor empresarial (Arias, 2012, p. 73\) para traducir el conocimiento agronómico empírico en estructuras formales de software.

***Instrumentos de la entrevista no estructurada.***

* *Guías abiertas de preguntas*: Aplicadas en dos fases: 

  * *Modelado de datos*, para estructurar el catálogo de agroquímicos, diluciones exactas y planes de aplicación rotativos en la base de datos.

  * *Umbrales microclimáticos*, para fijar horarios y límites climáticos que rigen el veto o espaciamiento preventivo del motor de inferencia de riego.

* *Libreta de notas de campo:* Registro de observaciones microclimáticas, dosificaciones prácticas y requerimientos operativos in situ.

**Observación directa estructurada con enfoque de pruebas iterativas.**  
Según Arias (2012), la observación directa es la captación sistemática de un fenómeno en su contexto real. Dado que en un sistema IoT la lógica del software y la comunicación con el hardware son imperceptibles a simple vista, la única vía para validar el sistema fue desarrollar herramientas propias para su monitoreo, trazabilidad y observabilidad. Estos instrumentos permitieron verificar la estabilidad del firmware en campo, evaluar las decisiones autónomas del motor de inferencia de riego y obtener certeza trazable sobre cada rutina del circuito hidráulico.

***Instrumentos de la Observación Directa.***

* *Depuración IoT (\`/admin\`):* Interfaz web para auditar la salud de los nodos, supervisar sensores y probar conmutaciones bajo demanda, permitiendo calibrar y depurar el hardware en campo sin conexiones físicas.

* *Telemetría y Gráficas (\`/monitoring\`):* Interfaz web para analizar el microclima interior y exterior, permitiendo definir los umbrales de riego y desarrollar el motor de inferencia para la detección y caracterización de lluvia.

* *Trazabilidad Operativa (\`/history\`):* Interfaz web que audita las operaciones del circuito hidráulico de riego, documentando cada conmutación física o cancelación preventiva orquestada por el servicio Scheduler.

* *Logs de Servicios (\`Scheduler\` e \`Ingest\`):* Registros cronológicos del flujo de comunicación con los nodos, consolidando estado operativo, telemetría y decisiones operativas para el mantenimiento y diagnóstico del sistema.

**Metodología de Desarrollo**  
En la Ingeniería de Software, la gobernanza del ciclo de vida se articula convencionalmente en dos vertientes: los enfoques predictivos, orientados a la exhaustividad de la planificación previa y al seguimiento secuencial de etapas, y los enfoques adaptativos o ágiles, centrados en la flexibilidad iterativa y la asimilación continua del cambio (Sommerville, 2011).  
No obstante, los sistemas basados en Internet de las Cosas (IoTS) trascienden las premisas de ambos paradigmas al exigir la convergencia simultánea de hardware de conmutación, capas de adquisición de datos telemétricos, firmware embebido y software de gestión (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024). En estos entornos, las restricciones físicas y electromagnéticas no pueden anticiparse enteramente en el diseño conceptual, sino que emergen durante el prototipado y la puesta en marcha in situ, demandando evolucionar el diseño previsto sobre la marcha.  
Esta naturaleza multidisciplinaria impone una dependencia jerárquica estricta: las capas superiores de analítica microclimática, deliberación agronómica y comercio electrónico no pueden operar con fiabilidad si la infraestructura física subyacente (bomba de agua, electroválvulas y sensores) no ha sido previamente automatizada, protegida y estabilizada. Con base en este escenario, para el desarrollo de la plataforma PristinoPlant se seleccionó el Modelo Incremental formulado por Pressman (2010) como marco rector de ciclo de vida, implementado de forma complementaria y sinérgica con la Metodología de Desarrollo Guiado por Pruebas para Sistemas Basados en Internet de las Cosas (TDDM4IoTS) de Guerrero-Ulloa et al. (2020) y Hornos y Quinde (2024).

**Justificación de la selección del modelo de desarrollo.**  
La adopción del Modelo Incremental (Pressman, 2010\) como paradigma rector responde a tres criterios técnicos y operacionales determinantes frente a los modelos alternativos:  
1\. *Inviabilidad de los modelos secuenciales cerrados (Cascada):* Un enfoque lineal tradicional postergaría la integración física y las pruebas de hardware hasta etapas tardías del calendario. En un sistema de agricultura protegida que conmuta cargas inductivas de 110VAC (bomba de 1 HP), tolera presiones hidráulicas en red cerrada y expone transductores a intemperie tropical, diferir la validación de campo hubiera elevado exponencialmente el costo técnico y financiero ante incompatibilidades electromagnéticas o fallas de estanqueidad, conllevando rediseños catastróficos.  
2\. *Insuficiencia de los marcos ágiles puros (Scrum / XP):* Las metodologías ágiles convencionales asumen ciclos rápidos de iteración sobre software homogéneo, bajo la premisa de que todo artefacto es inmediata y económicamente refactorizable en código. Dicho supuesto resulta inviable ante componentes físicos sujetos a tiempos de importación, ensamblaje en panel, dimensionamiento de tuberías de PVC y calibración en banco de pruebas, los cuales exigen una planificación secuencial rigurosa previa a su construcción física.  
3\. *Mitigación de riesgos mediante entregables funcionales operativos:* De acuerdo con Pressman (2010), el Modelo Incremental combina elementos lineales y de prototipado, entregando al final de cada ciclo una versión operativa y evaluable del sistema. Esto permitió aislar los estratos tecnológicos de PristinoPlant en siete (7) incrementos funcionales progresivos: se estabilizó primero el nodo actuador y el circuito de potencia, posteriormente el conexionado hidráulico en mesas, luego las estaciones meteorológicas telemétricas y, finalmente, los motores de inferencia algorítmica y la aplicación web, garantizando que cada nivel de complejidad se edificara sobre una base de hardware y firmware previamente validada.  
Asimismo, la selección complementaria de la metodología TDDM4IoTS (Guerrero-Ulloa et al., 2020\) se justifica en la necesidad de contar con directrices de ingeniería especializadas para sistemas IoT durante las etapas de construcción y despliegue. Mientras el Modelo Incremental de Pressman proporciona la macroestructura de gestión del proyecto (gobernanza temporal e hitos de entrega), TDDM4IoTS aporta la microestructura técnica de desarrollo, estableciendo un esquema guiado por pruebas que desacopla el ciclo en cuatro bloques conceptuales y once fases operativas. Esta articulación posibilitó someter cada incremento a pruebas unitarias y de banco en hardware antes de su instalación definitiva en el orquideario, armonizando la rigurosidad de la ingeniería electrónica con la flexibilidad del desarrollo web moderno.

**Procedimiento Metodológico**  
A continuación se describen las cinco (5) fases del Modelo Incremental de Pressman (2010), cuya secuencia temporal y ciclos de iteración se representan en la Figura 1, detallando su aplicación en el proyecto, su articulación con los objetivos específicos y los resultados obtenidos:

**Comunicación.**  
Esta fase se orienta a identificar los requerimientos del sistema e interactuar con los interesados para definir las expectativas del proyecto (Pressman, 2010). En este proyecto, se aplicó mediante inspecciones técnicas en campo y entrevistas con el cultivador, articuladas con la revisión agronómica del cultivo. Su desarrollo dio cumplimiento al primer objetivo específico, obteniéndose la línea base conceptual y la Especificación de Requerimientos del Sistema.

**Planeación.**  
Comprende la organización del proyecto mediante la estimación de recursos, definición de tareas de ingeniería y secuenciación temporal de los incrementos (Pressman, 2010). En el proyecto, se estructuró el plan de trabajo desglosando el alcance en siete (7) incrementos funcionales y dimensionando los estratos de hardware, red hidráulica y servidores. Esta etapa dio inicio al segundo objetivo específico, generando como resultados el plan de desarrollo incremental, la matriz de asignación de recursos y el cronograma general.

**Modelado.**  
Abarca la creación de representaciones estructurales y funcionales del software y hardware que sirven de guía para su implementación (Pressman, 2010). En la plataforma IoTS, se tradujo en el diseño de los circuitos de potencia, el circuito hidráulico, la topología telemétrica MQTT, los modelos de base de datos y la arquitectura de servicios contenerizados. Esta fase completó el segundo objetivo específico, arrojando planos eléctricos e hidráulicos, esquemas de bases de datos y especificaciones de interfaces del sistema.

**Construcción.**  
Consiste en la transformación de los modelos de diseño en artefactos operacionales mediante la codificación de programas y el ensamblaje físico (Pressman, 2010). En PristinoPlant, se materializó en el montaje del tablero eléctrico, el tendido hidráulico, la fabricación de las estaciones meteorológicas, el firmware embebido y el desarrollo web con servicios contenerizados backend. Esta etapa alcanzó el tercer objetivo específico, logrando la solución de IoTS plenamente construida, integrada y operativa en el orquideario a través de entregas sucesivas.

**Despliegue.**  
Comprende la entrega del sistema en su entorno operacional para su evaluación por los usuarios, recolección de retroalimentación y cierre documental (Pressman, 2010). En el orquideario, implicó la puesta en marcha in situ, pruebas de conmutación bajo carga, validación de la inferencia de riego junto al cultivador y elaboración de manuales. Esta fase cumplió el cuarto y quinto objetivo específico, obteniéndose los informes de validación operativa, el Manual de Usuario, el Manual Técnico y el informe final de grado.

***Figura 1\.*** Representación Esquemática del Modelo Incremental.  
Tomado de *Ingeniería del software: Un enfoque práctico* (p. 36), por R. Pressman, 2010, México, D. F.: McGraw-Hill Interamericana.

Dado que la solución implementada se enmarca en la categoría de Sistemas Basados en el Internet de las Cosas (IoTS), la ejecución de las fases de Construcción y Despliegue del Modelo Incremental de Pressman (2010) se complementan con las directrices de la metodología TDDM4IoTS (Guerrero-Ulloa et al., 2020; Hornos & Quinde, 2024). En consonancia con el principio de adaptabilidad metodológica enunciado por sus autores, las actividades de TDDM4IoTS no se aplicaron de manera rígida, sino que se seleccionaron e integran operativamente en función de los requerimientos específicos de cada capa tecnológica (hardware, firmware, servicios backend o interfaz web). La articulación de las once (11) fases técnicas de TDDM4IoTS con los siete (7) incrementos funcionales del proyecto y su matriz de correspondencia metodológica se detallan formalmente en el Apéndice B.

Para dar cumplimiento al segundo objetivo específico, el diseño global del sistema integró la ingeniería conceptual, básica y de detalle en una arquitectura unificada, asegurando una base técnica sólida para guiar el desarrollo de los siete (7) incrementos funcionales.

**Capítulo IV. Desarrollo y Resultados** 

**Análisis y Estudio Inicial**  
Desde la perspectiva de los cultivadores de PristinoPlant, esta etapa diagnóstica las carencias del entorno preexistente y formaliza las necesidades funcionales indispensables para superar la administración manual y empírica.

**Diagnóstico del entorno operativo y levantamiento de información.** 

Con el propósito de caracterizar la situación de partida y reconociendo la ausencia total de instrumentación de agricultura de precisión o registros digitalizados en las instalaciones del orquideario, se ejecutó el diagnóstico de campo mediante las técnicas descritas en el marco metodológico. A través de inspecciones técnicas directas y entrevistas no estructuradas con el cultivador, se examinaron las rutinas de trabajo, los tiempos dedicados a la manipulación hídrica y fitosanitaria, y las dificultades de control en las mesas de cultivo. El levantamiento evidenció que el manejo del orquideario se sustentaba en prácticas tradicionales altamente vulnerables a la variabilidad ambiental de Ciudad Guayana, identificándose tres problemáticas centrales:

***Riego empírico y vulnerabilidad microclimática.***  
El riego se ejecutaba manualmente con una frecuencia interdiaria rígida, derivada de un ensayo empírico donde el cultivador pesó una maceta con sustrato seco, la saturó de agua y registró su masa en los días siguientes para indagar en cuántos días secaba el sustrato, tal como se evidencia en la Figura 2\.

***Figura 2\.*** Ensayo Empírico Sobre el Espaciado del Riego.  
Sin embargo, en la rutina diaria operaba sin soporte instrumental y basado únicamente en la inspección física y visual directa del cultivador para evaluar el estado de humedad del sustrato. En el contexto de un clima tropical cálido caracterizado por contrastes abruptos entre radiación solar intensa, días de lluvia continua y eventos de lluvias intermitentes, este esquema interdiario rígido introducía una severa fragilidad operacional ante las dos estaciones del año:

1. *Incertidumbre y asfixia radicular en temporada lluviosa:* Durante la temporada de lluvia, el comportamiento atmosférico suele mantener condiciones de cielo encapotado y alta humedad ambiental durante días continuos sin que necesariamente se produzca precipitación directa sobre el orquideario. En ausencia de registros históricos y de instrumentación telemétrica in situ, el cultivador enfrentaba la imposibilidad de evaluar la tasa de evaporación real del sustrato poroso, careciendo de criterios objetivos para determinar cuándo era seguro reanudar el riego. Esta ceguera operativa provocaba dos desviaciones críticas: o bien se regaba sobre un sustrato todavía saturado, favoreciendo la pudrición radicular y propiciando la proliferación de hongos fitopatógenos, o bien se postergaba el riego de forma excesiva por temor al encharcamiento, deshidratando las raíces superficiales.

2. *Desfase temporal, estrés térmico y precariedad en la humectación estival:* Durante la temporada seca, si bien la frecuencia interdiaria parecía cumplirse con mayor regularidad, el esquema colapsaba frente a la dinámica térmica intradiaria. El riego manual se ejecutaba estrictamente a primera hora de la mañana para evitar que el sol directo quemara el follaje húmedo. Sin embargo, las condiciones de máxima agresividad ambiental tienen lugar entre las 11:00 a.m. y las 3:00 p.m., intervalo en el cual la humedad relativa ambiental desciende hasta valores críticos cercanos los 45% y las temperaturas superan los 34ºC. En esta franja horaria, el problema no radica en la necesidad de un nuevo riego, sino en que el microclima del orquideario deja de ser óptimo, provocando el cierre estomático foliar y un agudo estrés térmico ante la ausencia de métodos para regular o mitigar oportunamente tales condiciones ambientales.

3. *Ineficiencia en la regulación térmica:* Mitigar las condiciones térmicas durante los picos de calor es imposible mediante el riego, ya que no se puede pulverizar agua sobre el cultivo sin riesgo de quemaduras foliares. En su lugar, el cultivador recurría a dejar una manguera abierta en el orquideario por tiempo indefinido para humectar el suelo. Dicho método empírico conllevaba un alto desperdicio hídrico, necesidad de intervención humana permanente y total ceguera respecto a su impacto real en el microclima.

***Falta de registros y seguimiento en la dosificación de agroquímicos.***  
En el cultivo de orquídeas, la nutrición mineral y la sanidad vegetal demandan la planificación de programas rotativos y repetitivos estructurados en ciclos secuenciales: esquemas de fertilización que alternan periódicamente insumos para el desarrollo vegetativo, mantenimiento radicular y floración, así como rotaciones continuas de agroquímicos fitosanitarios indispensables para mitigar la resistencia biológica de plagas y patógenos. Aunque el cultivador disponía de la planificación de dichos programas, la gestión práctica de estas labores era ineficiente.   
El problema central no residía en la selección o preparación de las mezclas, sino en la ausencia absoluta de un registro de las aplicaciones efectivamente ejecutadas y la inexistencia de una agenda proyectada en el tiempo. Al no documentarse qué insumo se aplicó en cada zona ni planificar anticipadamente las fechas de los siguientes pasos del ciclo, el seguimiento dependía de la memoria del operador. Esta desorganización causaba que los programas rotativos se interrumpieran con frecuencia, se aplicaran productos de forma reactiva o desfasada, y se perdiera la continuidad cronológica indispensable para el desarrollo biológico del cultivo.

***Descontrol de inventario y pérdida de trazabilidad botánica.***

En las mesas de cultivo prevalecía un marcado descontrol de inventario, gestionado mediante apreciaciones globales de volumen sin individualización de contenedores. Dado que las orquídeas constituyen especímenes de alto valor botánico y comercial con dinámicas de crecimiento heterogéneas, la falta de un registro unívoco por ejemplar impedía conocer con precisión el stock disponible por género, especie y variantes comerciales (maceta/tamaño). Asimismo, se perdía por completo el registro fenológico de cada ejemplar: fecha de apertura de la vara floral, duración en días de la flor y frecuencia de floración anual asociado a los meses de actividad floral, privando al cultivador de indicadores biológicos clave para seleccionar especímenes élite y limitando la comercialización hacia clientes finales al no disponer de un catálogo digital fidedigno.

**Definición de necesidades del usuario y áreas de demanda funcional.**

Para resolver las limitaciones diagnosticadas y transformar las operaciones del orquideario hacia una agricultura inteligente, el análisis determinó cuatro áreas de requerimientos funcionales que delimitan lo que el usuario y el cultivo requieren del sistema:

1. *Requerimiento de control microclimático y tecnificación hídrica:* Necesidad de supervisar de forma continua las variables microclimáticas y conferir autonomía deliberativa al riego mediante reglas algorítmicas capaces de autorizar, posponer o cancelar las operaciones de control microclimático según las condiciones climáticas del momento, erradicando el riego empírico y protegiendo al cultivo del déficit / saturación hídrica y el estrés térmico.

2. *Requerimiento de dosificación y laboratorio agronómico:* Necesidad de centralizar el catálogo de insumos y formulaciones compuestas, estructurar programas agronómicos rotativos y repetitivos que definan la secuencia de aplicación de cada producto, y coordinar cronogramas con una agenda proyectada y registro histórico de ejecuciones que garantice el cumplimiento estricto de los planes nutricionales y fitosanitarios.

3. *Requerimiento de inventario botánico unívoco:* Necesidad de modelar digitalmente cada espécimen de forma individualizada, registrando su especie taxonómica, tamaño de maceta y localización física en mesas, suprimiendo el descontrol de inventario.

4. *Requerimiento de trazabilidad fenológica y canal comercial:* Necesidad de registrar y procesar los eventos de floración por ejemplar para identificar las plantas con mejor desempeño biológico, enlazando dicha información con un catálogo público de comercio electrónico para la venta directa al consumidor.

**Requerimientos funcionales.**

En la Tabla 1 se presentan los requerimientos funcionales del sistema organizados en siete módulos operativos, formulados según los estándares descritos en el Apéndice A.

Tabla 1\.   
*Requerimientos funcionales.*

| Cód. | Descripción |
| ----- | ----- |
| **Módulo I** | **Seguridad y Acceso** |
| RF01 | Gestionar el registro y autenticación de usuarios mediante credenciales, administrando el control de acceso basado en roles. |
| **Módulo II** | **Comercio Electrónico y Gestión de Ventas** |
| RF02 | Explorar el catálogo botánico de la tienda con búsqueda de texto y filtros dinámicos por género y categoría. |
| RF03 | Consultar la información botánica de la especie, galería de imágenes, precios por tamaño de maceta y disponibilidad para añadir al carrito. |
| RF04 | Gestionar los productos seleccionados, actualizar cantidades por tamaño de maceta y calcular los subtotales de compra en tiempo real. |
| RF05 | Gestionar datos de facturación y entrega, registrar el método de pago seleccionado y canalizar la verificación manual del pago de la orden multimoneda. |
| RF06 | Conciliar pagos de pedidos online, autorizar despachos y registrar ventas comerciales directas realizadas en el orquideario. |
| **Módulo III** | **Inventario Físico y Gemelos Digitales** |
| RF07 | Administrar el catálogo botánico de especies, registrando datos taxonómicos, referencias de floración y documentación fotográfica. |
| RF08 | Registrar y gestionar plantas físicas individuales en invernadero, controlando su tamaño de maceta, estado y ubicación en mesas de cultivo. |
| RF09 | Vincular variantes comerciales con el stock físico en mesa, fijar precios en USD y procesar avisos de reposición a clientes interesados. |

Tabla 1\.  
*Requerimientos funcionales (Cont.).*

| Cód. | Descripción |
| ----- | ----- |
| **Módulo IV** | **Dosificación de Agroquímicos** |
| RF10 | Administrar el inventario de agroquímicos puros y formular recetas de mezclas compuestas con proporciones de dilución balanceadas. |
| RF11 | Configurar programas nutricionales y fitosanitarios por ciclos rotativos. |
| RF12 | Programar la ejecución manual o automatizada de planes agronómicos, determinando día de la semana, hora de inicio y zonas de aplicación. |
| **Módulo V** | **Telemetría e Inteligencia Ambiental** |
| RF13 | Capturar de forma continua la telemetría ambiental transmitida por los nodos meteorológicos. |
| RF14 | Procesar consolidados diarios e indicadores agronómicos por zona de cultivo, visualizando datos climáticos en tiempo real y procesados. |
| RF15 | Monitorear y caracterizar eventos de lluvia en el orquideario, registrando la presencia, duración temporal y finalización de la precipitación. |
| **Módulo VI** | **Operaciones Hidráulicas y Riego Autónomo** |
| RF16 | Conmutar manualmente actuadores hidráulicos con auto-apagado y gestionar colas de tareas diferidas con posibilidad de cancelación. |
| RF17 | Configurar ciclos de riego recurrentes y adaptar su ejecución mediante mecanismos autónomos de veto y espaciamiento dinámico según las condiciones del entorno. |
| RF18 | Auditar el historial de operaciones hídricas, registrando duración real, operador, origen de la tarea y causas de veto ambiental. |
| **Módulo VII** | **Notificaciones del Sistema** |
| RF19 | Emitir notificaciones y alertas a los cultivadores ante eventos operativos, estados del sistema o requerimientos de confirmación interactiva. |

**Requerimientos no funcionales.**

De igual forma, se definieron los atributos de calidad y restricciones técnicas indispensables para la plataforma (Apéndice A). En la Tabla 2 se presentan las especificaciones que garantizan la usabilidad, resiliencia y seguridad de la infraestructura implementada.

Tabla 2\.   
*Requerimientos no funcionales.*

| Cód. | Descripción |
| :---: | ----- |
| RNF01 | Disponer de una fuerte señal de la red wifi en el orquideario para asegurar una conexión continua de los nodos embebidos. |
| RNF02 | Retomar operaciones tras cortes eléctricos o inestabilidad Wi-Fi, garantizando su ejecución segura únicamente dentro de una ventana de oportunidad válida. |
| RNF03 | Garantizar la trazabilidad integral del sistema: decisiones de riego autónomo, accionamientos hidráulicos, telemetría ambiental y diagnóstico de los nodos. |
| RNF04 | Monitorear y depurar el estado operativo de los nodos embebidos de forma remota desde la interfaz web, sin requerir conexión física en campo. |
| RNF05 | Desacoplar funcionalmente las capas de adquisición de borde, persistencia, orquestación y presentación para facilitar el mantenimiento del sistema. |
| RNF06 | Detectar fallas en los sensores de las estaciones meteorológicas, intentar restablecer la operatividad telemétrica de forma autónoma y reflejar el incidente en los logs del sistema. |
| RNF07 | Garantizar alta disponibilidad operativa de los nodos embebidos mediante mitigación de fragmentación de memoria y resiliencia autónoma de red. |
| RNF08 | Cifrar todas las comunicaciones entre nodos embebidos, servidor y aplicación web mediante estándares criptográficos seguros. |
| RNF09 | Almacenar el histórico de datos telemétricos sin restricciones de tiempo ni caducidad forzada, asegurando disponibilidad para análisis a largo plazo. |

**Diseño Conceptual**  
En correspondencia con los requerimientos funcionales y no funcionales derivados del análisis inicial, el proyecto se concibe conceptualmente como un sistema integral y unificado, donde la aplicación web sirve como núcleo operativo central para la supervisión telemétrica, el comando de actuadores, la trazabilidad agronómica y el comercio digital. Para garantizar alta cohesión y modularidad, el sistema se organiza en dos grupos de módulos funcionales:

1. *Módulos IoT para el* *Control Microclimático y Riego Autónomo*: Componentes responsables de la adquisición telemétrica en campo, el monitoreo de estaciones meteorológicas y nodos embebidos, la conmutación del tablero eléctrico sobre el circuito hidráulico y la toma de decisiones autónomas mediante motores de inferencia.

2. *Módulos de Gestión Agronómica, Trazabilidad botánica y Comercio:* Capacidades operativas que administran el catálogo taxonómico botánico, el seguimiento y proyección del calendario de aplicación de los programas de dosificación de agroquímicos, el inventario unívoco y la tienda en línea.

**Visión general y abstracción de la arquitectura IoTS en capas funcionales.**

El control microclimático y las operaciones del circuito hidráulico se articulan bajo una arquitectura distribuida y dirigida por eventos, cuyo propósito es cerrar la brecha entre la percepción telemétrica del entorno, la toma de decisiones algorítmicas y la conmutación física sobre las instalaciones del orquideario. Para gestionar la integración coordinada de hardware, firmware y software inherente a los IoTS, el sistema se estructura en cuatro (4) capas funcionales interconectadas, cuya jerarquía arquitectónica se ilustra en la [Figura 3](#figura-3.-arquitectura-en-capas-del-iots-de-pristinoplant.).

* *Capa de percepción ambiental:* Constituye el punto de contacto sensorial con el microclima. Su función es registrar las magnitudes físicas críticas para la ecofisiología de las orquídeas, discriminando entre el entorno externo a la intemperie (EMA Exterior) y el microclima protegido por el orquideario (EMA Interior). Esta capa genera los flujos de telemetría de alta resolución requeridos para alimentar los algoritmos de decisión.

* *Capa de actuación y control de borde:* Representa el brazo ejecutor sobre la infraestructura física del invernadero. Está conformada por el nodo embebido de control y el tablero eléctrico. Su responsabilidad es interpretar las órdenes de riego en conmutaciones eléctricas confiables, orquestando la activación de la bomba de agua y las electroválvulas asociadas a las cuatro líneas del circuito hidráulico.

* *Capa de comunicación y red:* Constituye el canal de integración e intercambio de datos entre los nodos embebidos en campo (Edge) y los servicios en la nube (Cloud). Mediante un protocolo de publicación y suscripción bajo canales cifrados, el envío de telemetría y el despacho de comandos operan de forma ágil y desacoplada, evitando esperas bloqueantes en la transmisión, reduciendo la sobrecarga de datos y tolerando interrupciones transitorias de conectividad.

* *Capa de gestión, orquestación y decisión:* Constituye el estrato de inteligencia y supervisión del sistema IoT. En la gestión, integra las interfaces web operativas y de monitoreo telemétrico en tiempo real, administrando la persistencia histórica y la parametrización de las cuatro líneas de riego. En la orquestación, coordina mediante servicios contenerizados en Docker la ingesta telemétrica de datos y el despacho desatendido de comandos 24/7. Por último, en la decisión, delibera en tiempo real a través de los motores de inferencia meteorológica e hídrica para autorizar, diferir o vetar el riego ante lluvia o saturación ambiental, garantizando la protección autónoma del cultivo.

***Figura 3\.*** Arquitectura en Capas del IoTS de Pristinoplant.  
Elaboración propia fundamentada en el modelo de capas para IoTS (Gubbi et al., 2013).

**Modelo de información conceptual.**

Siguiendo el modelado formal para Sistemas Basados en IoT y trazabilidad botánica, el universo de información de PristinoPlant se estructura a partir de seis entidades y conceptos:

* *Espécimen botánico:* Entidad unívoca que modela la existencia física de cada planta. Mantiene su identidad taxonómica, tamaño de maceta, ubicación física en el orquideario y registros de floración.

* *Programas de dosificación y calendario agronómico:* Estructura secuencial que planifica y audita la aplicación rotativa de tratamientos nutricionales y fitosanitarios, garantizando la alternancia de insumos y el historial de aplicaciones.

* *Estación meteorológica automatizada (EMA):* Fuente telemétrica ambiental que delimita una zona de influencia microclimática específica (zona exterior intemperie o zona interior protegida por el orquideario).

* Muestra telemétrica: Registro inmutable constituido por una tupla de magnitudes físicas, estampilla de tiempo (*timestamp*) y etiqueta de la estación de origen, representativa de las condiciones del microclima.

* *Programa de riego:* Directriz temporal recurrente que asigna ventanas horarias, periodicidad y duraciones de apertura a una línea hidráulica específica.

  **Actores del sistema y dinámicas de interacción.**

En correspondencia con la fase de diseño conceptual y el marco metodológico TDDM4IoTS, la caracterización de los actores y la modelación de sus interacciones constituyen el instrumento formal para estructurar el comportamiento dinámico de la plataforma, articulando los requerimientos funcionales con las secuencias operacionales entre los componentes del ecosistema IoTS. El universo operativo se estructura a partir de cuatro (4) actores fundamentales:

* *Cultivador / Administrador:* Actor humano primario responsable de la supervisión microclimática, la configuración de las rutinas de riego, la configuración de los programas agroquímicos, la gestión del inventario botánico unívoco y la conciliación de ventas.  
* *Cliente:* Actor humano externo que explora el catálogo botánico, filtra especies por género, gestiona el carrito de compras en función del stock disponible y formaliza órdenes de compra multimoneda asistidas por mensajería.  
* *Sistema Autónomo:* Agente computacional continuo compuesto por los microservicios en segundo plano, encargado de la captura telemétrica ininterrumpida, la detección y caracterización de lluvia y la deliberación de vetos o autorizaciones de riego 24/7.  
* *Servicio de Notificaciones:* Agente computacional auxiliar responsable de canalizar alertas operativas y confirmaciones interactivas bidireccionales hacia el cultivador a través de interfaces reactivas desde Telegram.

La interacción operativa de estos actores con las capacidades de la plataforma se materializa a través de las pantallas presentadas en el Catálogo de Interfaces de Usuario (Apéndice E), mientras que la dinámica de intercambio de información y control entre los agentes físicos y de software se rige por el flujo conceptual de datos en dos vías que se describe a continuación.

**Flujo conceptual de datos en dos vías.**   
A diferencia de las plataformas informacionales convencionales, PristinoPlant opera mediante un lazo cerrado articulado en dos sentidos:

1. *Flujo telemétrico ascendente (borde hacia servidor):* Las estaciones meteorológicas automáticas (EMA) leen periódicamente los sensores ambientales y envían las lecturas a la nube mediante el protocolo MQTT. En el servidor, el servicio de ingesta valida los datos y los almacena en la base de datos de series temporales, poniéndolos a disposición de los motores de decisión y de la interfaz de monitoreo.  
2. *Flujo de control descendente (servidor hacia borde):* Comprende el envío de comandos hacia el nodo de control para conmutar las electroválvulas y la bomba de agua. Si la orden proviene directamente de la interfaz de control manual, se despacha de inmediato a voluntad del cultivador. En cambio, cuando se trata de tareas programadas por el planificador o tareas diferidas en cola, el motor de inferencia hídrica analiza previamente las condiciones ambientales recientes: si registra lluvia o saturación de humedad cancela la operación para evitar el sobre-riego, y si las condiciones son favorables envía la orden hacia el nodo para conmutar los actuadores físicos y confirmar su ejecución.

**Concepción funcional del circuito hidráulico de riego.**  
Para satisfacer los requerimientos agronómicos y de control microclimático, el circuito hidráulico se concibió como un sistema presurizado multifuente y multilínea, conmutado a nivel de hardware por canales de relés y orquestado desde el firmware del nodo actuador:

* *Fuentes de suministro y líneas de entrada:*  
  * *Entrada de agua:* Electroválvula solenoide principal conectada a la red de agua del orquideario, para las rutinas de riego, humidificación y humectación del suelo.  
  * *Entrada de agroquímicos:* Electroválvula solenoide conectada a un tanque dedicado para la dosificación de soluciones nutricionales y tratamientos fitosanitarios, garantizando el aislamiento físico respecto a la red de agua limpia.  
* *Elemento de impulsión y presurización:*  
  * *Bomba de agua:* Actuador de fuerza motriz, para asegurar una operación segura, el lazo de control aplica una secuencia de cebado previo en la que las electroválvulas seleccionadas se abren con anticipación al encendido de la bomba, previniendo sobrepresiones y golpes mecánicos en las tuberías.  
* *Líneas sectorizadas de distribución y salida:*  
  * *Línea 1 \- Humidificación de aire (foggers):* Emisores que atomizan microgotas para elevar la humedad relativa y reducir el Déficit de Presión de Vapor.  
  * *Línea 2 \- Dosificación agronómica:* dedicada a la aspersión foliar de tratamientos fertilizantes y fitosanitarios.  
  * *Línea 3 \- Aspersión principal:* Microaspersores rotativos sobre las mesas de cultivo para la irrigación homogénea del sustrato.  
  * *Línea 4 \- Humectación del suelo:* Manguera perforada tendida a lo largo del orquideario para propiciar enfriamiento evaporativo pasivo sin mojar las plantas.

Esta segmentación física e hidráulica constituye la base sobre la cual opera el motor de inferencia hídrica, permitiendo orquestar cada línea mediante reglas de decisión diferenciadas según el microclima en tiempo real.

**Diseño Básico**  
Concluida la visión conceptual, el diseño básico define las tecnologías y componentes utilizados para construir el sistema: los dispositivos físicos en campo, la red de comunicación, el almacenamiento de datos y la organización del software.

**Selección de componentes de hardware y periféricos.**  
La selección de piezas estuvo condicionada por la disponibilidad en el mercado local, priorizando componentes accesibles frente a instrumental con certificación industrial por su elevado costo. Como procesadores centrales se seleccionaron microcontroladores ESP32-WROOM-32 tanto para el tablero de control de riego como para las estaciones meteorológicas.  
Para el monitoreo del microclima se seleccionaron sensores digitales DHT22 (temperatura y humedad relativa) dentro de garitas meteorológicas de protección, y transductores BH1750 (iluminancia), descartando sensores de lluvia resistivos por su vulnerabilidad a la corrosión. En el circuito hidráulico, la bomba de 1 HP (11A en 110VAC) se conmuta mediante un contactor de 30A acoplado a un controlador de presión para protección contra funcionamiento en seco. El sistema se complementa con módulos de relés, un transformador reductor de 24VAC para las cuatro electroválvulas sectoriales y fusibles de protección en la acometida eléctrica (el prototipado evolutivo y montaje físico se documentan en el Apéndice H).

**Topología de red y arquitectura física distribuida.**  
La arquitectura física responde a un modelo distribuido compuesto por dos entornos operacionales: el entorno local en el orquideario (*Edge*) y el entorno centralizado de cómputo en la nube (*Cloud*).  
En el orquideario se despliegan dos nodos embebidos el *Nodo Actuador/EMA-Exterior* integrado físicamente en el tablero eléctrico, y el *Nodo EMA-Interior*, configurado como unidad móvil para caracterizar el microclima protegido bajo malla sombra. Ambos dispositivos se enlazan de forma inalámbrica a la red Wi-Fi local mediante el estándar 802.11 b/g/n en la banda de 2.4 GHz, obteniendo direccionamiento dinámico estándar a través de DHCP.  
En la nube, un servidor privado virtual (VPS) bajo Linux ejecuta los servicios contenerizados mediante Docker Compose, incluyendo el bróker Mosquitto, las bases de datos y los microservicios auxiliares. El enlace entre el orquideario y el servidor opera exclusivamente mediante el protocolo MQTT encapsulado en TLS v1.2 a través del puerto seguro 8883 con autenticación por credenciales individuales, garantizando la confidencialidad, autenticidad e integridad del canal telemétrico.

**Esquema de comunicación y mensajería MQTT.**  
El intercambio de información entre los nodos de campo y el servidor se realiza mediante un esquema jerárquico de tópicos bajo la raíz pristinoplant/. Este esquema divide el tráfico en canales ascendentes (donde las estaciones publican las magnitudes microclimáticas y los actuadores confirman su estado con acuse de recibo ACK) y canales descendentes (utilizados para enviar órdenes de conmutación temporizadas hacia las electroválvulas y la bomba).   
La telemetría periódica se transmite con calidad de servicio QoS 0, mientras que los comandos críticos y confirmaciones exigen QoS 1 y mensajes de última voluntad (LWT) para reportar desconexiones imprevistas.

**Estrategia de persistencia políglota y gestión de datos.**  
Para optimizar el rendimiento y desacoplar los flujos de lectura y escritura según la naturaleza y ciclo de vida de la información, se adoptó un modelo de persistencia políglota compuesto por dos motores complementarios:

1. *Base de datos de series temporales (InfluxDB):* Cumple el rol de motor de ingesta y almacenamiento de alta resolución para flujos cronológicos continuos. Su operación se articula en tres frentes:

   1. *Ingesta continua:* El servicio *Ingest* en segundo plano suscribe los tópicos telemétricos del bróker MQTT y persiste las muestras microclimáticas que los nodos EMA envian en lotes periódicos, absorbiendo la inserción masiva de múltiples lecturas concurrentes sin generar contención de bloqueos en el sistema.

   2. *Deliberación algorítmica:* El servicio Scheduler consulta periódicamente este motor mediante agregaciones en ventanas deslizantes de tiempo de 10, 20 y 30 minutos para evaluar las variaciones de temperatura y humedad que alimentan el motor de inferencia meteorológica.

   3. *Visualización operativa:* La interfaz web consulta InfluxDB de forma directa para graficar las series en tiempo real de una sola fecha. Para horizontes temporales mayores a 24 horas se evita deliberadamente consultar este motor, para no penalizar la latencia ni sobrecargar el navegador con miles de puntos crudos.

2. *Base de datos relacional (PostgreSQL con Prisma ORM):* Cumple una doble función en el sistema: por un lado, actúa como repositorio transaccional central para la plataforma web (Next.js) y el servicio *Scheduler*, asegurando la consistencia ACID en operaciones críticas del negocio donde no se admiten estados inconsistentes. Por otro lado, funge como almacén analítico consolidado al alojar las estadísticas diarias estructuradas generadas al cierre de cada jornada por el pipeline de procesamiento del Scheduler. Este esquema permite que las consultas de monitoreo histórico y balances agronómicos para rangos extensos (semanas o meses) se ejecuten en milisegundos sin sobrecargar al motor de series de tiempo.

**Arquitectura lógica de software y modularidad.**  
Para garantizar la separación de responsabilidades, la tolerancia a fallos y la continuidad operativa desatendida 24/7, la solución de software se articula en cuatro componentes desacoplados que interactúan mediante protocolos estándar sobre una topología distribuida:

* *Aplicación Web (Capa de Dominio y Presentación):* Centraliza la lógica de negocio transaccional, el control de acceso basado en roles, el catálogo fenológico, el modelado del inventario botánico y la proyección del calendario de fertirriego. Asimismo, provee las interfaces de usuario para la supervisión analítica del microclima y el despacho de comandos de control manual bajo demanda hacia el circuito hidráulico.

* *Servicio de Ingesta Telemétrica (Capa de Procesamiento de Flujo Sensorial):* Demonio de ejecución continua que gestiona el tráfico telemétrico ascendente proveniente del bróker MQTT. Su responsabilidad es validar los esquemas de datos en tiempo de ejecución, calcular magnitudes psicrométricas complementarias (como el Déficit de Presión de Vapor) y persistir las muestras en la base de datos de series temporales, aislando la carga de adquisición física del rendimiento de la interfaz web.

* *Servicio Planificador y Decisor (Orquestador y Motores de inferencia):* Motor deliberativo encargado de la orquestación temporal de las rutinas de riego y fertirrigación. Ejecuta en segundo plano los algoritmos de inferencia hídrica y meteorológica sobre las ventanas de telemetría en tiempo real para resolver de forma autónoma la autorización, el espaciamiento preventivo o el veto de operaciones hídricas, emitiendo órdenes de conmutación auditadas hacia los nodos actuadores de borde y consolidando al cierre del día las estadísticas ambientales en la base de datos relacional.

* *Motor de Flujos y Asistente Móvil (Capa de Observabilidad y Supervisión Human-in-the-Loop):* Subsistema asíncrono compuesto por el motor de automatización contenerizado y la interfaz conversacional de mensajería. Su cometido es garantizar la ubicuidad operativa mediante la emisión reactiva de notificaciones push, la supervisión de resiliencia del hardware y la canalización de confirmaciones interactivas bidireccionales antes de habilitar la dosificación de insumos agroquímicos a través del circuito hidráulico.

**Diseño Detallado**  
El diseño detallado define las especificaciones técnicas completas requeridas para la fabricación física, el ensamblaje, el cableado, el cálculo hidráulico, la programación del firmware embebido y la formulación matemática de los algoritmos de decisión del sistema.

**Diseño esquemático y circuito de potencia eléctrica.**  
El tablero eléctrico acopla el suministro de energía, la conmutación de la bomba y electroválvulas, y el nodo de procesamiento embebido, el cual asume el doble rol de controlador hidráulico y estación meteorológica exterior. Atendiendo a la naturaleza iterativa del prototipo, el montaje se ejecutó sobre un panel de madera con borneras de riel para facilitar la reorganización de componentes y la conexión de la instrumentación climática externa, cuya disposición física e integración final de las etapas de potencia y control se evidencia en la Figura 4\. El circuito opera bajo tres niveles de tensión:

1. *Circuito de alimentación principal (110VAC):* El suministro ingresa por un interruptor general hacia dos fusibles de protección de 15A. Desde los bornes de entrada del contactor de 30A se distribuye la línea protegida hacia el transformador reductor, la bomba de agua accionada por dicho contactor, las dos (2) electroválvulas maestras de entrada (conmutadas por sus propios módulos de relé) y hacia borneras de servicio que alimentan el interruptor del regulador de 5V DC.

2. *Circuito de electroválvulas de distribución (24VAC):* Se deriva del transformador reductor para alimentar y conmutar, a través de sus respectivos módulos de relé, las cuatro (4) electroválvulas que sectorizan las líneas de riego en el orquideario.

3. *Circuito de control e instrumentación (5V DC):* El nodo ESP32 se alimenta mediante un regulador, suministrando energía desde su placa de expansión a los módulos de relés. A su vez, la alimentación de los sensores se conmuta a través de uno de los canales de relé para permitir su reinicio físico independiente del nodo.

***Figura 4\.*** Tablero Eléctrico de Conmutación y Nodo Embebido Implementado.

**Dimensionamiento del circuito hidráulico presurizado.**  
La presurización del circuito (Figura 5\) recae en una bomba periférica de 1 HP (11A, 110VAC y conexión de 1"). Para facilitar el mantenimiento modular, la instalación incorpora tres uniones universales de 1" en las dos entradas de succión y previo al distribuidor de salida. En la descarga, la tubería de PVC de 1" integra un filtro de disco para retener sedimentos antes de ingresar a dicho distribuidor, el cual sectoriza el caudal hacia cuatro líneas con llaves de paso manuales y electroválvulas de 24VAC.  
El tendido se adapta a la demanda de los emisores: la Línea 2 (aspersión) se despliega en manguera de 3/4", mientras que la Línea 1 (nebulizadores) y la Línea 3 (humectación de piso) operan en 1/2". Por su parte, la Línea 4 opera aislada desde su electroválvula de sector para la dosificación de insumos agronómicos.

***Figura 5\.*** Disposición Física del Circuito Presurizado Implementado.

**Diseño del firmware embebido.**  
El firmware de los microcontroladores ESP32 se codificó en lenguaje MicroPython, optimizado y compilado a bytecode binario para reducir el consumo de memoria RAM. Su diseño descarta la programación secuencial tradicional y se estructura sobre un bucle asíncrono no bloqueante coordinado por eventos. Esta arquitectura ejecuta tareas concurrentes e independientes para la lectura de sensores, la gestión de la pila de red, el despacho de telemetría y la conmutación física. Los comandos recibidos por MQTT se encolan bajo un esquema de productor-consumidor y activan temporizadores locales de seguridad para coordinar la secuencia de apertura de electroválvulas y el encendido retardado de la bomba, mientras un temporizador guardián (Watchdog) supervisa la estabilidad del sistema ante eventuales bloqueos de ejecución.  
Para interrumpir el funcionamiento del circuito hidráulico ante fallas de red, el firmware del nodo actuador implementa un temporizador: toda orden recibida incluye una duración explícita; al expirar la cuenta regresiva local, el microcontrolador desenergiza la bomba y las electroválvulas de forma autónoma sin depender del servidor. Asimismo, el firmware incorpora una rutina de autorrecuperación física para los sensores: si la lectura falla durante tres ciclos consecutivos, conmuta el Relé 8 (Pin 27\) interrumpiendo la alimentación por 200 ms (*power cycle*), forzando un reinicio eléctrico de los sensores que restablece la comunicación del bus, sin reiniciar el microcontrolador ni interrumpir la sesión segura con el bróker.

**Diseño algorítmico de los motores de inferencia.**  
La deliberación autónoma del sistema reside en dos motores formulados para evaluar la telemetría microclimática en tiempo real y regular el riego desatendido:

* *Motor de inferencia meteorológica:* Analiza derivadas térmicas e higrométricas en ventanas deslizantes de 10, 20 y 30 minutos. El algoritmo evalúa caídas de temperatura y alzas de humedad relativa bajo condiciones nubladas, soleadas o nocturnas, infiriendo el inicio y cese pluvial con criterios de recuperación térmica (formulación en el Apéndice C e interfaz en la Figura 12).

* *Motor de inferencia hídrica:* Gobierna el riego articulando umbrales de ambas estaciones (EMA Exterior e Interior). Inhibe la irrigación ante lluvia activa o reciente (ventanas de cuatro horas en suelo y ocho en nebulización), respetando la alternancia interdiaria del riego por aspersión. A su vez, clasifica el fotoperiodo según el DLI acumulado y cruza temperatura con humedad relativa para autorizar la nebulización o accionar humectación en piso para enfriamiento pasivo (la matriz de vetos y auditoría de 369 tareas se detallan en el Apéndice D, ilustrándose en la Figura Ap-E1. del Apéndice E).

**Construcción e Implementación Incremental**  
La fase de construcción e implementación materializa la ingeniería del sistema conforme al diseño propuesto, articulando siete (7) incrementos adaptados de Pressman (2010) y TDDM4IoTS (Guerrero-Ulloa et al., 2020), véase en el Apéndice B. Cada iteración abordó el ciclo de ingeniería: definición de alcance, montaje técnico, detección de fallas en banco de pruebas, rediseño correctivo y consolidación del entregable funcional antes de la siguiente fase.

**Incremento 1: plataforma web base y modelado de dominio.**  
El primer incremento tuvo como propósito establecer la arquitectura de software base y estructurar el modelo de dominio antes de iniciar la construcción física en campo. Se implementó la arquitectura de información, los flujos de navegación y el sistema de diseño (UI/UX) bajo un enfoque modular, consolidando el núcleo funcional sobre el cual se acoplarían progresivamente las interfaces operativas de los ciclos posteriores.

***Construcción de software y arquitectura web base.***  
Se inicializó un proyecto bajo el framework Next.js con arquitectura App Router y tipado estricto en TypeScript dentro de un monorepositorio administrado con Turborepo. La presentación visual se estructuró mediante un layout maestro con navegación responsiva unificada. Como decisión técnica, se prescindió de frameworks de componentes de interfaz de terceros para evitar sobrecargas y dependencias externas, adoptando un desarrollo a medida donde cada elemento visual se construyó de forma incremental según los requerimientos de cada módulo. La autenticación y el control de acceso basado en roles se implementaron mediante la librería Better-Auth, acoplada a PostgreSQL a través de Prisma ORM.

***Modelado del dominio y esquema relacional de datos.***  
Para estructurar la gestión de fertilización y sanidad vegetal, se implementó la base de datos de agroquímicos clasificada en dos grandes familias: fertilizantes y fitosanitarios. Estos últimos se categorizaron según su propósito de acción en insecticidas, fungicidas, bactericidas y acaricidas. A cada producto químico se le asociaron recomendaciones de uso, advertencias de seguridad y proporciones volumétricas de dilución en agua, proporcionando al cultivador las directrices técnicas requeridas para formular las mezclas sin riesgos de fitotoxicidad.

***Modelado relacional desacoplado del dominio botánico.***  
Para respaldar la gestión integral del cultivo y sentar las bases transaccionales de la plataforma, se modelo en Prisma ORM un esquema relacional estructurado en tres pilares conceptuales:

1. *Subdominio botánico y comercial:* Se formalizó una clara separación entre la clasificación taxonómica de la especie, las presentaciones comerciales según el tamaño de maceta y el registro del ejemplar físico individualizado, sentando las pautas para la trazabilidad biológica y el control riguroso de existencias.

2. *Subdominio agronómico y nutricional:* Se estructuró el catálogo de insumos clasificando fertilizantes y fitosanitarios según su propósito de aplicación, parametrizando unidades de dosificación y disponiendo de un campo descriptivo abierto para registrar notas técnicas o recomendaciones de uso.

3. *Subdominio de seguridad y gestión de acceso:* Se definió la administración de identidades, sesiones de usuario y privilegios mediante control de acceso basado en roles, incorporando además las estructuras de datos iniciales para la gestión de órdenes comerciales.

***Estructuración de datos de prueba y validación preliminar.***  
Para construir y evaluar los cimientos de la plataforma web sin incurrir en el costo de desarrollar prematuramente interfaces CRUD para cada entidad, se estructuró un conjunto integral de datos semilla (seed dataset). Esta estrategia permitió poblar la base de datos con registros representativos del orquideario para validar la arquitectura de información, la navegación y las vistas de catálogo sobre datos realistas; de este modo, se agilizaron y priorizaron los esfuerzos de desarrollo, concentrando los recursos en la arquitectura base del software y postergando la construcción de paneles administrativos individuales para iteraciones posteriores.

***Entregables consolidados.***  
Como resultado de este incremento, se entregó la plataforma web base operativa, el layout maestro de navegación con sistema de diseño propio, el esquema relacional desplegado en PostgreSQL con datos semilla de prueba y el sistema de autenticación con control de acceso por roles.

**Incremento 2: circuito hidráulico, tablero eléctrico y conmutación física.**  
El segundo incremento tuvo como propósito materializar la infraestructura física del sistema para sustituir el riego manual por un circuito presurizado, sectorizado y controlado eléctricamente. Siguiendo el marco metodológico TDDM4IoTS, las actividades abarcaron el prototipado electrónico, el montaje del circuito hidráulico en campo, el ensamblaje del tablero de control y la validación local de la conmutación física mediante MQTT Explorer a través de un bróker MQTT contenedorizado en la red local, delimitando el alcance antes de abordar la orquestación en la nube.

***Prototipado electrónico preliminar y desacoplamiento metodológico.***  
Las pruebas de hardware se iniciaron en protoboard (Figura 6\) evaluando el microcontrolador ESP32 bajo MicroPython. Se estructuró un firmware preliminar para verificar los relés, muestrear los sensores DHT22 y BH1750, y calibrar el sensor resistivo de lluvia. Ante el despliegue en campo, se adoptó el desacoplamiento metodológico: priorizar el aseguramiento del circuito de riego antes del tendido sensorial a la intemperie.

***Figura 6\.*** Prototipado en Banco de Pruebas.

***Acondicionamiento físico e instalación del circuito hidráulico en campo.***  
En paralelo al prototipado electrónico, se ejecutaron las obras hidráulicas en el orquideario para dejar establecida la red antes de la integración eléctrica. El circuito consta de dos (2) electroválvulas de 110VAC para conmutar independientemente la entrada de agua y la toma del tanque de agroquímicos. La impulsión recayó en una bomba de agua de 1 HP con un controlador de presión hidroneumático para presurización automática, tubería matriz de PVC de 1 pulgada con filtro de disco, uniones universales y llaves de paso manuales.   
Desde el cabezal colector se distribuyeron cuatro líneas sectoriales con electroválvulas de 24VAC (nebulización, aspersión, humectación del suelo y dosificación agronómica) ramificadas con mangueras de 3/4" y 1/2". En particular, la línea de aspersión principal se desplegó suspendida sobre los mesones mediante microaspersores rotativos, como se ilustra en la Figura 7, concluyendo la fase con la red presurizada y libre de fugas

***Figura 7\.*** Líneas de Microaspersión y Nebulización Sobre las Mesas de Cultivo.

***Ensamblaje del tablero eléctrico y rediseño de la etapa de potencia.***

Superadas las pruebas en protoboard, el tablero de control se estructuró sobre un panel de madera fijado en la pared exterior del invernadero, protegido de la intemperie. El circuito aisló tres niveles de tensión: suministro de 110VAC protegido por fusibles de 15A e interruptor general, circuito de 24VAC alimentado por un transformador reductor para las electroválvulas, y alimentación lógica de 5V DC para el microcontrolador sobre su placa de expansión. Se integraron dos módulos de relés de 4 canales para conmutar las salidas.  
Al conectar el tablero a la red hidráulica y encender la bomba de agua de 1 HP, la demanda nominal de 11A y los picos inductivos de arranque superaron la capacidad de 10A de los relés, provocando su sobrecalentamiento y disparo térmico sin daño permanente. Para corregir esta falla, se desmontó el tablero y se instaló un contactor electromagnético de 30A; de este modo, el relé del microcontrolador pasó a conmutar únicamente la bobina del contactor, delegando a este la corriente de fuerza de la bomba y protegiendo la electrónica.

***Desarrollo del firmware de conmutación y verificación en red local.***  
Con la infraestructura física instalada, el firmware del nodo actuador gobernó la conmutación controlada mediante comandos MQTT en red local. El programa recibía instrucciones manuales con el tiempo de apertura deseado, energizando la bomba y las electroválvulas correspondientes y cerrándolas automáticamente al expirar el lapso. La conmutación se validó en campo bajo presión real de agua mediante MQTT Explorer, certificando la apertura y corte físico según los tiempos establecidos. Esta versión temprana del firmware cumplió el propósito estricto de comprobar la respuesta electromecánica, careciendo aún de persistencia de estado, tolerancia a fallos o rutinas autónomas.

***Entregables consolidados.***  
Este incremento entregó la infraestructura física instalada, validada en red local mediante MQTT Explorer. El sistema no quedó automatizado ni operativo para uso cotidiano, al carecer de interfaz web y requerir el despliegue local del bróker en Docker y la activación manual relé por relé. Esta base de hardware habilitó el punto de partida indispensable para que el siguiente incremento desarrollara la infraestructura backend y la suite de operaciones en la app web.

**Incremento 3: infraestructura backend distribuida, orquestación y operaciones.**  
El tercer incremento tuvo como propósito construir y desplegar los servicios del servidor para garantizar una operación ininterrumpida y desatendida las 24 horas del día. Esta arquitectura independizó la supervisión de los microcontroladores y la ejecución de rutinas del navegador web del usuario, trasladando la orquestación a un entorno de servidor para operar el orquideario de forma confiable ante contingencias de conectividad local.

***Infraestructura contenerizada y despliegue en servidor virtual.***  
Para garantizar alta disponibilidad y control operativo, los servicios centrales de backend se desplegaron en un Servidor Privado Virtual (VPS) bajo Linux Ubuntu Server mediante Docker Compose. En este entorno se integraron la base de datos relacional PostgreSQL gestionada con Prisma ORM, el motor InfluxDB con retención continua para series temporales y los microservicios de orquestación e ingesta. Con la pila de datos y lógica consolidada en el VPS, la evolución natural consistió en migrar desde el bróker serverless externo (HiveMQTT Cloud) hacia una instancia autogestionada de Eclipse Mosquitto en la misma infraestructura.

***Estabilización de MQTTS en bróker autoalojado.***  
La puesta en marcha del bróker autoalojado bajo TLS introdujo de inmediato severas fallas de conectividad debido a una configuración inicial inadecuada en el servidor. Los microcontroladores experimentaban desconexiones cíclicas cada pocos minutos, amenazando la operatividad del sistema al fragmentar la captura de telemetría continua e impedir la conmutación remota confiable de las líneas de riego.  
El diagnóstico determinó que el servidor entregaba la cadena completa de certificados (\`fullchain.pem\`) e intentaba negociar TLS 1.3, desbordando la pila criptográfica mbedTLS del ESP32 por el tamaño del paquete durante el handshake. Como solución de ingeniería, se bifurcó la configuración en Mosquitto: para el hardware en el puerto 8883 se forzó TLS 1.2 y se sirvió únicamente el certificado de hoja (\`cert.pem\`), permitiendo un enlace liviano sin validación de cadena intermedia; en contraste, para los clientes web en el puerto 8884 (WSS) se preservó la cadena completa requerida por los navegadores. Esta resolución garantizó un canal de transporte MQTTS estable las 24 horas del día, asegurando la ingesta ininterrumpida de datos hacia InfluxDB y la ejecución confiable de los comandos de campo.

***Transición hacia borde delgado y trazabilidad en el orquestador.***  
En las versiones tempranas del firmware, el nodo actuador implementaba un gestor local (\`NVSManager\`) que persistía tareas en memoria Flash (\`recovery.json\`). Concebido bajo una premisa de borde grueso (fat edge) con resiliencia autónoma descentralizada, este esquema convertía al microcontrolador en una entidad opaca: el backend carecía de visibilidad sobre los estados diferidos y las decisiones internas del dispositivo, imposibilitando una auditoría rigurosa en campo. Para erradicar este aislamiento y garantizar observabilidad centralizada, la arquitectura se rediseñó transformando los nodos en clientes de borde delgados (thin edge clients), trasladando la persistencia de estado y la orquestación deliberativa al servicio Scheduler.  
Bajo este modelo de borde delgado, el microcontrolador fue liberado de la toma de decisiones estratégicas para operar como un ejecutor disciplinado, pero conservó un robusto runtime reactivo de borde compartido modularmente con la estación meteorológica (EMA). Este núcleo común resuelve de forma autónoma la estabilidad física en campo: coordina la concurrencia no bloqueante mediante eventos (\`uasyncio\`), gestiona la cola de mensajería bajo el patrón productor-consumidor, aplica exclusión mutua (\`asyncio.Lock\`) para proteger el socket criptográfico, supervisa temporizadores guardianes (Watchdogs) jerárquicos de hardware y red, y ejecuta la salvaguarda electromecánica local (secuenciación de electroválvulas y cortes fail-safe). De este modo, el firmware opera como un cliente delgado altamente resiliente en el silicio, mientras el Scheduler asume la trazabilidad histórica, la reconciliación de colas y la recuperación de estado en caliente (Hot State Recovery).  
En paralelo, para optimizar el despliegue de este runtime y optimizar la memoria en el ESP32, se construyó la herramienta en PowerShell \`mprun\`, la cual interpreta el manifiesto del nodo (\`manifest.json\`), compila el código MicroPython \`.py\` a bytecode binario \`.mpy\` y carga todos los archivos actualizados al microcontrolador.

***Microservicio desacoplado de ingesta telemétrica.***  
El paradigma de Next.js, basado en renderizado del lado del servidor y Server Actions, opera bajo un modelo sin estado orientado a peticiones HTTP transitorias. Este esquema resulta inadecuado para sostener procesos residentes con conexiones persistentes por sockets; integrar un suscriptor MQTT en el servidor web habría condicionado la captura de telemetría a la existencia de tráfico activo o generado conexiones duplicadas y fugas de memoria.  
Para resolver esta limitación, se implementó el microservicio Ingest como un demonio independiente en Node.js y TypeScript dentro de un contenedor Docker con ejecución 24/7. El servicio mantiene un enlace permanente con el bróker MQTT, valida las cargas JSON recibidas, descarta anomalías y persiste los registros directamente en InfluxDB de forma ininterrumpida.

***Módulos web de operaciones y laboratorio agronómico.***  
Liberada del procesamiento de fondo, la aplicación web Next.js se concentró en la supervisión interactiva y el control operativo mediante cuatro interfaces principales:

* **/control:** Accionamiento manual directo de cada línea de riego, con confirmación visual de estado y un temporizador predefinido de seguridad.

* **/queue:** Supervisión en tiempo real de tareas activas y encoladas, con indicadores visuales de su estado y posibilidad de cancelación previa e inmediata.

* **/schedules:** Planificación de rutinas recurrentes según días de la semana, horario, duración y zonas automatizadas y líneas hidráulicas asociadas.

* **/history:** Bitácora de auditoría histórica que certifica la ejecución, procedencia o veto deliberativo de cada tarea.

De forma complementaria, se integró parcialmente el módulo agronómico para vincular los programas de fertilización y fitosanitarios con las rutinas programadas de la línea hidráulica de agroquímicos. Esta línea fue dotada progresivamente de mecanismos de confirmaciones para evitar su activación de manera descuidada.

***Entregables consolidados.***  
Como resultado de este incremento, se entregó la infraestructura contenerizada en el servidor VPS operando de forma continua (24/7), el bróker de mensajería autogestionado con cifrado MQTTS, el comando de desarrollo (mprun), los microservicios de ingesta y planificación, y los módulos web de operaciones hidráulicas y laboratorio agronómico.

**Incremento 4: estaciones meteorológicas y telemetría ambiental.**  
Consolidada la infraestructura de servidor y la conmutación remota, el cuarto incremento tuvo como propósito instrumentar la percepción ambiental del orquideario mediante hardware propio, sustituyendo los servicios meteorológicos regionales por estaciones in situ. Esta red telemétrica capturó el microclima hiperlocal en tiempo real, registrando variables higrotérmicas y lumínicas indispensables para desarrollar algoritmos determinísticos de los motores de inferencia.

***Instrumentación in situ y estaciones meteorológicas (EMA).***  
En las fases preliminares se implementó el módulo \`/weather-oracle\` para evaluar si las APIs meteorológicas remotas servían para guiar el cultivo. Sin embargo, las discrepancias locales fueron insalvables: los servicios reportaban lluvia generalizada en la ciudad mientras el orquideario permanecía bajo radiación solar intensa, o viceversa. Al comprobarse que los datos remotos distaban del microclima local, dicho módulo quedó relegado exclusivamente a fines informativos, procediéndose al diseño de dos Estaciones Meteorológicas Automatizadas (EMA) basadas en el microcontrolador ESP32:

* *EMA Exterior:* Energizada a 5VDC desde el tablero eléctrico, está provista de sensores protegidos en la intemperie, su implementación se ilustra en la Figura 7\. El nodo procesa y despacha ráfagas telemétricas por magnitud física de 10 muestras cada 10 minutos.  
* *EMA Interior:* Alimentada por batería y alojada en una garita meteorológica tipo Stevenson impresa en 3D, ubicada entre los ejemplares en las mesas de cultivo como se aprecia en la Figura 8\. Para maximizar la autonomía, permanece en reposo profundo (Deep Sleep); despierta cada 10 minutos para muestrear los sensores sin encender la radio WiFi, almacenando las lecturas en la memoria volátil protegida del microcontrolador (RTC RAM). Cumplido el ciclo de una hora, enciende la radio y transmite un lote consolidado de 6 muestras por magnitud, minimizando el consumo de energía al máximo.

***Figura 8\.*** EMA Exterior Sensores Protegidos de la Intemperie.

***Figura 9\.*** EMA Interior en Garita Stevenson 3D.

***Fallo de ruido en cableado de intemperie y mitigación por pares trenzados.***  
El tendido de diez metros de cable UTP Cat6 entre el tablero de control y los sensores exteriores introdujo perturbaciones electromagnéticas y lecturas erráticas. La inspección técnica determinó que las líneas de datos viajaban agrupadas en un par sin balancear frente a las de alimentación. La falla se solventó recableando la conexión, de modo que cada línea digital se trenzó físicamente con su respectivo retorno de referencia (GND ó VCC) dentro de su propio par en el cable Cat6, suprimiendo las interferencias inducidas.

***Bloqueo de sensores y autorrecuperación física por ciclo de potencia.***  
Tras periodos prolongados de operación continua, los sensores ambientales experimentaban bloqueos esporádicos en su circuitería integrada por transitorios residuales. Ante este congelamiento, el bus digital no respondía y el firmware se veía obligado a forzar un reinicio total del ESP32, perdiendo momentáneamente la sesión segura con el bróker y datos acumulados.  
Para resolver este fallo sin reiniciar el microcontrolador, se conectó la alimentación de los sensores al Módulo Relé en el tablero. En el firmware se codificó una guarda que, al registrar tres ciclos consecutivos de lecturas fallidas por tiempo de espera en el bus, desenergiza los sensores durante 200 ms. Este ciclo forzado de potencia drena los capacitores del sensor y restablece la comunicación en menos de dos segundos, manteniendo intacta la sesión de red del nodo.

***Autoescala lumínica y sincronización de arranque por el orquestador.***  
El sensor de iluminancia BH1750 saturaba bajo radiación solar directa (\~54.000 Lux). Para corregirlo, se adaptó su librería con autoescala dinámica sobre el tiempo de integración, expandiendo el rango útil hasta 121.000 Lux. Asimismo, al carecer de reloj con respaldo por batería, los microcontroladores son configurados por el Scheduler en cada inicio: el servicio sincroniza su RTC interno y habilita o suspende el muestreo de iluminancia según el fotoperiodo vigente. Paralelamente, si el backend detecta la pérdida prolongada de lecturas de algún sensor en los tópicos MQTT, comanda automáticamente un ciclo de potencia en el Relé 8 para reiniciar todos los sensores sin reiniciar el nodo.

***Interfaces web de supervisión y consolidación telemétrica en el servidor.***  
La visualización de datos ambientales en la plataforma web se estructuró delimitando la telemetría en tiempo real frente al procesamiento histórico:

* **/monitoring:** Procesa y renderiza bajo demanda la telemetría continua de una jornada específica (\~24 horas) mediante un selector de fecha. Esta delimitación previene la saturación visual que provocaría proyectar miles de puntos crudos, facilitando la interpretación humana. Para consultas históricas multidiarias, el sistema no vuelca series continuas, sino datos consolidados en bloques diurnos y nocturnos (mínimos, máximos, promedios y marcas horarias de extremos térmicos e higrométricos). Asimismo, las catorce horas diarias de iluminancia se segmentan en amanecer, fotoperiodo y atardecer para evaluar la curva de radiación del cultivo.  
* **/botanics:** Evaluación agronómica de las condiciones microclimáticas en ciclos de 24 horas. Procesa cinco métricas acumulativas: Integral de Luz Diaria, Déficit de Presión de Vapor, diferencial térmico día/noche, y horas acumuladas bajo saturación/déficit hídrico.  
* **/admin?view=iot\_debug:** Panel de diagnóstico técnico bajo demanda para auditar el estado interno de los microcontroladores (memoria RAM libre, intensidad de señal WiFi RSSI e historial de conectividad) directamente desde la web, sin sobrecargar los nodos con transmisiones continuas y prescindiendo de conectar una computadora directamente al nodo operativo en el orquideario.

Para el nodo en reposo (EMA Interior), la auditoría no puede ser síncrona en tiempo real. Se diseñó un esquema asíncrono mediado por el Scheduler: cuando el usuario solicita una auditoría desde la web, el servidor encola la petición internamente. Al despertar el nodo en su ventana horaria de transmisión, consume el comando pendiente, ejecuta el diagnóstico y devuelve los parámetros de salud (memoria, RSSI, buses) sin comprometer su ciclo de ahorro de batería.

***Entregables consolidados.***  
Como resultado de este incremento, se entregaron las dos arquitecturas finales de firmware embebido (servicio continuo para el Nodo Actuador/EMA-Exterior y bajo consumo para el Nodo EMA portable), la adecuación física del tablero de control para la autorrecuperación de sensores por conmutación eléctrica (Relé 8), la orquestación centralizada en el Scheduler para la sincronización operativa y persistencia de ambos nodos, y la plataforma web de supervisión telemétrica y diagnóstico remoto (\`/monitoring\`, \`/botanics\` y \`/admin?view=iot\_debug\`).

**Incremento 5: inferencia de lluvia y autonomía hídrica.**  
Consolidada la percepción climática in situ, el quinto incremento tuvo como objetivo automatizar la toma de decisiones de irrigación en el servicio Scheduler. Esta lógica sustituyó la programación cronológica rígida por un control adaptativo basado en reglas deterministas, capaz de espaciar las rutinas de riego, aplicar vetos preventivos y proteger el cultivo de la asfixia radicular optimizando el recurso hídrico.

***Percepción microclimática y umbrales de deliberación .***  
El sistema de toma de decisiones se fundamentó en la caracterización independiente de los dos entornos registrados por la red telemétrica: el microclima protegido del orquideario (EMA Interior) y las condiciones ambientales de intemperie (EMA Exterior). Esta diferenciación permitió calibrar de forma desacoplada los umbrales de deliberación del motor de inferencia hídrica según la procedencia de los datos, estableciendo una jerarquía sensorial que prioriza las lecturas internas sobre las externas.  
El motor consulta en InfluxDB la existencia de lecturas de la EMA Interior en los últimos treinta minutos. Si hay datos disponibles, aplica los umbrales del cultivo interior; ante la falta de registros por desconexión o agotamiento de batería, conmuta automáticamente a la EMA Exterior (fallback), adaptando los umbrales a la intemperie para mantener la operación continua.

***Motor de inferencia hídrica y matriz de vetos agronómicos.***  
El motor de inferencia hídrica intercepta las tareas programadas en el Scheduler antes de despachar órdenes hacia el actuador. La decisión de ejecutar, diferir o cancelar una tarea se fundamenta en un cúmulo de reglas interdependientes que analizan el estado ambiental desde distintas perspectivas. En la rutina de irrigación por aspersión, única destinada al riego de las plantas, el motor evalúa el historial hídrico en ventanas de seguimiento de hasta tres días, cruzando la duración acumulada de los eventos pluviales con la clasificación del día según su iluminancia promedio diurna. Si se registran jornadas lluviosas o nubladas con radiación inferior a 26.000 lux, la evaporación disminuye y el sistema continúa espaciando la rutina hacia las mañanas siguientes.  
De manera simultánea, el motor examina las variables higrotérmicas como un conjunto acoplado al momento de deliberar, suspendiendo la irrigación si coinciden valores de humedad relativa elevados con temperaturas frescas que evidencian condiciones inadecuadas para suministrar agua. Para los actuadores dedicados exclusivamente al control microclimático y a la dosificación de agroquímicos, el sistema aplica ventanas pluviales más estrechas de cuatro a ocho horas y condiciona su operación a la radiación solar disponible, restringiendo la nebulización vespertina ante nubosidad persistente y activando la humectación de piso solo cuando las condiciones diurnas de calor realmente ameriten inducir enfriamiento evaporativo.

***Figura 10\.*** Rutina Cancelada por el Motor Hídrico.

***Fallo por corrosión del sensor de lluvia en campo.***  
Durante el despliegue inicial de la estación exterior, la detección pluvial se confió a un sensor resistivo de gotas (MH-RD). Sin embargo, la exposición continua a la intemperie provocó una degradación física acelerada: la electrólisis sobre las pistas conductoras derivó en corrosión galvánica severa en menos de treinta días de operación. Este deterioro ocasiona cortocircuitos permanentes que registran eventos ficticios de lluvia continua de más de ocho horas, provocando la suspensión sistemática e indebida de las rutinas de riego. Constatada la inviabilidad física de los transductores resistivos expuestos al ambiente, se descartó definitivamente el componente de la arquitectura física.

***Figura 11\.*** Degradación del Sensor Resistivo de Lluvia.

***Rediseño de ingeniería: motor de inferencia meteorológica.***

Para sustituir el sensor físico, se desarrolló un motor de inferencia meteorológica que detecta y caracteriza los eventos de lluvia a partir del análisis higrotérmico del EMA-Exterior y de la iluminancia en su ventana de trabajo óptima. Durante el horario diurno, el algoritmo procesa telemetría en lotes de diez minutos y compara el lote más reciente contra los lotes anteriores en ventanas deslizantes a diez, veinte y treinta minutos.   
La evaluación clasifica las condiciones según la iluminancia base en tres ramas: Rama A (Cielo Nublado, ≤ 15 klx) Rama B (Cielo Soleado, \> 26 klx) y Rama C (Cielo Intermedio, ≥ 15 klx ≤ 26 klx). Cada rama exige descensos térmicos asociados a incrementos de humedad relativa o condiciones base ya saturadas (≥ 98%), incorporando la regla de Protección por Gradiente. Durante la Inferencia Nocturna, el motor prescinde de la iluminancia y evalúa caídas térmicas acopladas a incrementos de humedad respecto a la variabilidad previa de las series.  
Para registrar el cese de las precipitaciones y su duración en la base de datos relacional, se implementan cuatro criterios deterministas: Recuperación Solar ante lecturas continuas ≥26 klx durante diez minutos, Recuperación Progresiva con ascenso térmico y caída de humedad simultáneos, Variación Térmica respecto al punto más frío del evento y Cese por Estancamiento sin variación higrotérmica.

***Figura 12\.*** Evento de Lluvia Inferida por el Motor Meteorológico.

***Entregables consolidados.***  
Como resultado de este incremento, se entregó en el servicio Scheduler el motor de inferencia hídrica con sus umbrales calibrados y reglas agronómicas establecidas. Asimismo, se integró el motor de inferencia meteorológica para la detección y cese algorítmico de lluvia sin sensores mecánicos, respaldado por la herramienta de calibración paramétrica rebuild-rain-history.ts y la persistencia de eventos pluviales en PostgreSQL para su supervisión histórica en la interfaz /monitoring. Se remite la evaluación experimental en campo a la fase de validación del presente capítulo y a los Apéndices C y D.

**Incremento 6: catálogo, inventario, tienda y cronograma de dosificación.**  
El sexto incremento estableció la trazabilidad individual por ejemplar, automatizó el cronograma agronómico de dosificación y articuló un canal de comercialización en línea. La gestión previa se sustentaba en estimaciones globales sin individualización por maceta, perdiendo el historial biológico de las plantas y careciendo de una distinción operativa entre las aspersiones manuales y el fertirriego automatizado a través del circuito hidráulico. Esta iteración concentró sus esfuerzos en las interfaces de administración agronómica, el almacenamiento multimedia distribuido y la sincronización reactiva de existencias.

***Catálogo taxonómico y trazabilidad individual en zonas.***  
El catálogo botánico organiza jerárquicamente tipos de plantas, géneros y especies con sus descriptores de cultivo. La interfaz administra galerías fotográficas por especie, permitiendo el reordenamiento interactivo y la selección de la imagen de portada. Con el propósito de optimizar la entrega multimedia sin sobrecargar el servidor web, las imágenes se cargan directamente desde el navegador mediante enlaces prefirmados hacia un servicio distribuido de almacenamiento de objetos en la nube.  
Sobre esta base taxonómica, se implementó la trazabilidad física de cada espécimen de forma unívoca con su fecha de siembra, tamaño de maceta, precio y condición biológica. Esta diferenciación permite clasificar operativamente los ejemplares comercializables de las plantas madres destinadas a reproducción.

***Seguimiento fenológico y ciclo de floración.***  
La administración individualizada se complementa con un módulo fenológico. A través de la ficha unívoca del ejemplar, el sistema permite registrar eventos de floración, interpretándose la duración en días de la flor, su frecuencia anual y los meses con actividad floral. Estos registros sirven para proyectar las estadísticas del ejemplar destacado directamente en la tienda online, enriqueciendo la ficha comercial de la especie con datos biológicos reales.

***Desacoplamiento operativo y cronograma de dosificación.***  
La gestión agronómica exigió separar lógicamente la operatividad de la dosificación agroquímica manual aplicada al resto de las zonas de cultivo desprovistas del circuito hidráulico. Para el seguimiento operacional de ambas labores se construyeron dos interfaces web: la primera permite programar la ejecución manual (dia, hora, zona) de los planes agroquímicos formulados en las interfaces del laboratorio implementadas en el tercer incremento, mientras que la segunda interfaz proyecta el cronograma de dosificación discriminando su operatividad manual o por circuito hidráulico.  
Este cronograma proporciona trazabilidad combinando el historial de aplicaciones ejecutadas con proyecciones futuras calculadas mediante expresiones temporales para cada zona. La interfaz permite auditar el ciclo de vida de las tareas diferenciando aplicaciones pendientes, completadas o expiradas tras veinticuatro horas de inactividad. Esta sistematización integró formalmente las rutinas manuales con las rutinas automatizadas por el circuito hidráulico, consolidando una bitácora agronómica centralizada para la totalidad del vivero.

***Comercialización en línea, cómputo reactivo y pasarela asistida.***  
La tienda web estructura la navegación comercial permitiendo explorar las especies según el tipo de planta o por géneros taxonómicos. La plataforma gestiona los precios base en dólares con opción de visualización en bolívares, calculados según la tasa oficial del Banco Central de Venezuela del día bancario vigente. Para sincronizar el inventario unívoco con la tienda, el sistema evalúa la disponibilidad en tiempo real sumando únicamente los ejemplares aptos para la venta. Al procesar el pedido, una transacción atómica bloquea las plantas bajo reserva durante sesenta minutos y genera un mensaje estructurado hacia la API de WhatsApp para remitir el comprobante de pago al cultivador, erradicando la sobreventa de las plantas.

***Entregables consolidados.***  
Como resultado de este incremento, se entregó el catálogo botánico con almacenamiento multimedia en la nube, el sistema de trazabilidad unívoca de ejemplares por zonas y el módulo de seguimiento fenológico vinculado a la tienda en línea. Asimismo, se desplegaron las dos interfaces del cronograma de dosificación para articular operativamente las aplicaciones manuales con las rutinas del circuito hidráulico, y la plataforma de comercialización digital con cómputo reactivo de existencias y pasarela asistida por WhatsApp. 

**Incremento 7: asistente agronómico, orquestación n8n y resiliencia.**  
El séptimo incremento tuvo como propósito establecer un canal centralizado de alertas y notificaciones de alto impacto para el equipo de cultivadores de PristinoPlant. Aunque la plataforma web ofrece un apartado de notificaciones, este resultaba ser pasivo, donde las notificaciones solían pasar desapercibidas. Esta desarticulación provocaba que contingencias operativas críticas, como el agotamiento de batería en la estación interior o el mantenimiento del filtro de disco del circuito hidráulico, pasarán inadvertidas para los cultivadores durante días.  
Para asegurar una supervisión proactiva y colectiva, las actividades se orientaron a integrar la plataforma de orquestación de flujos n8n con un bot interactivo de Telegram, dotando al grupo de trabajo de alertas inmediatas y mecanismos compartidos de confirmación operativa.

***Asistente agronómico en Telegram y microflujos en n8n.***  
Para independizar la lógica de mensajería del núcleo web, se desplegó la plataforma de orquestación de flujos n8n contenerizada en Docker sobre el servidor VPS, conectada directamente a PostgreSQL y a la API de Telegram. A través del Bot de Telegram, el sistema consolidó un canal centralizado para los cultivadores, estructurando un enrutador de comandos rápidos con visualización vertical optimizada para terminales móviles: consulta del estado en tiempo real de los nodos embebidos (/status), cronograma de dosificación (/dosing) e inspección del estado del filtro (/filter).  
La interacción cotidiana se agilizó mediante la incorporación de teclados interactivos en línea. A través del comando /complete, el bot lista las tareas de dosificación manual pendientes para la jornada, permitiendo a cualquier miembro del equipo marcarlas como completadas. Esta acción actualiza de forma atómica la bitácora agronómica en la base de datos sin requerir que el operador interactue con la plataforma web, manteniendo informado al resto del equipo sobre el cumplimiento de las labores fitosanitarias.

***Flujo de confirmación previa en la línea de agroquímicos.***  
La automatización de las rutinas de agroquímicos a través del circuito hidráulico exigió establecer un mecanismo riguroso de confirmación previa. A diferencia del riego por aspersión, la dosificación agronómica demanda que el cultivador prepare físicamente la mezcla en el tanque auxiliar antes de conmutar el circuito hidráulico.   
La gestión inicial de estas autorizaciones en las interfaces administrativas web resultaba pasiva, provocando que las tareas programadas expirarán por falta de confirmación oportuna. Para asegurar una interacción directa y de alto impacto, el protocolo de autorización se trasladó al bot de Telegram mediante flujos de trabajo automatizados.  
Bajo este esquema, el Scheduler programa la rutina de agroquímicos en estado preliminar y delega en n8n el envío de una notificación push al canal de los cultivadores doce horas antes de su ejecución. El mensaje despliega botones interactivos para confirmar la preparación del tanque, posponer la rutina veinticuatro horas o cancelar la rutina. Únicamente tras recibir la confirmación explícita de un cultivador, el flujo muta el estado de la tarea por autorizado en la base de datos, habilitando al Scheduler a ejecutar la rutina llegado el momento programado.

***Alertas centralizadas, diagnóstico correlacionado y mantenimiento preventivo.***  
La desconexión del Nodo EMA por agotamiento de su batería pasaba inadvertida para los cultivadores durante días. Aunque el Scheduler detectaba su desconexión y registraba la contingencia, la plataforma web carece de notificaciones push, relegando el aviso a una inspección manual diferida en la interfaz. Para erradicar este desfase, se programó en el bot de Telegram una regla de diagnóstico correlacionado con una ventana de guarda de diez minutos para descartar micro-cortes transitorios de Wi-Fi: si la estación a batería permanece fuera de línea mientras el nodo actuador continúa enlazado a la red eléctrica, el sistema despacha una alerta inmediata al grupo notificando el agotamiento de la batería.  
Bajo esta misma limitación, el mantenimiento del filtro dependía de la comunicación entre el equipo de cultivo para notificar o delegarse la tarea de mantenimiento, conllevando a la acumulación de sedimentos durante lapsos prolongados, lo cual degrada el caudal de salida del circuito hidráulico. Para solucionar esta deficiencia, el sistema vinculó una cadencia de mantenimiento de dos días: si transcurre dicho lapso sin registrarse la labor, el bot de Telegram emite una notificación a las 8:00 a.m. y reitera el aviso una hora antes de cada activación del circuito hasta que se complete la limpieza.   
Para asentar la labor, el operador ejecuta el comando /filter y acciona el botón interactivo de confirmación, respondiendo el asistente con la identidad del cultivador, la fecha de ejecución y la reprogramación automática del próximo ciclo. La interacción resultante de estos flujos se ilustra en la Figura 13, donde se aprecia la notificación matutina de dosificación manual de agroquímicos junto al recordatorio preventivo del filtro de disco, seguido por el mensaje confirmatorio emitido por el asistente una vez que el operador registra la limpieza y reinicia el temporizador de mantenimiento.

***Figura 13\.*** Notificaciones Desde Telegram.

***Entregables consolidados.***  
Como resultado de este incremento, se entregó la plataforma de automatización de flujos n8n desplegada en producción, articulada bidireccionalmente con la base de datos relacional y la API de mensajería. Sobre esta arquitectura se consolidó el asistente agronómico interactivo en Telegram \`PristinoBot\`, implementando el protocolo de confirmación previa para las rutinas de la línea de agroquímicos con patrón humano en el bucle, la supervisión del estado operativo del Nodo EMA y el flujo de mantenimiento preventivo del filtro.

**Validación del Funcionamiento**  
La validación del prototipo se realizó con el objetivo de comprobar que la plataforma desarrollada cumple con los requerimientos funcionales y no funcionales definidos en las etapas iniciales del proyecto. Con este propósito, se evaluó el comportamiento del sistema operando de manera continua y desatendida dentro de las instalaciones del orquideario, contrastando la interacción entre los nodos de campo, los servicios del servidor y las interfaces de usuario bajo escenarios reales de operación.

**Caso 1: Orquestación y gobernanza autónoma desatendida.**  
Se evaluó la capacidad del sistema para sostener la supervisión bioclimática y gobernar el circuito hidráulico de forma continua las veinticuatro horas del día, prescindiendo de la intervención de operadores. Durante las pruebas en producción, el servicio Scheduler centralizó la comunicación bidireccional con los microcontroladores mediante mensajería segura MQTTS, procesando la telemetría entrante y coordinando el accionamiento del contactor y las electroválvulas mediante tramas confirmadas por acuse de recibo (ACK). Esta gobernanza autónoma integró con éxito la sincronización horaria de los nodos, el encendido y suspensión del luxómetro según el ciclo circadiano, la vigilancia de transductores y la consolidación de descriptores ecofisiológicos a medianoche, registrando cada decisión de forma atómica en las bitácoras históricas, cuya arquitectura y trazabilidad operacional en tiempo real se detallan en el Apéndice E.

**Caso 2: Resiliencia del hardware y tolerancia a fallos.**  
La tolerancia a fallos del sistema se validó empíricamente mediante la interfaz /history, cuya línea de tiempo audita las conmutaciones y la respuesta ante contingencias de red. Tal como se evidencia en la Figura 14, ante una pérdida de enlace durante el riego, el nodo actuador interrumpe la impulsión para prevenir sobre-riego; al restablecerse la conexión, el planificador despacha automáticamente el remanente de la rutina (evidenciado en una rutina de 10 min pausada a los 2 min y reanudada con los 8 min restantes). Asimismo, el ciclo de potencia en el Relé 8 solventó bloqueos transitorios en los sensores en menos de dos segundos, recuperando el bus sin reiniciar el microcontrolador ni cortar la sesión segura con el servidor.

***Figura 14\.*** Resiliencia y Tolerancia a Fallos de Red en Rutinas Hídricas.

**Caso 3: Toma de decisiones autónomas y mitigación de estrés microclimático.**  
Se verificó el desempeño agronómico de los motores de inferencia en la prevención de riesgos hídricos y térmicos. La sustitución de los sensores resistivos de gotas por el motor meteorológico garantizó una detección precisa de precipitaciones diurnas y nocturnas sin componentes expuestos a corrosión galvánica (cuyas métricas y contrastación contra bitácora se detallan en el Apéndice C). Paralelamente, el motor hídrico auditó con éxito las tareas programadas, aplicando vetos autónomos ante lluvia activa, precipitaciones recientes o saturación higrométrica diurna, impidiendo el sobre-riego y protegiendo las raíces de la asfixia radicular (análisis documentado en el Apéndice D). A su vez, los pulsos de humectación en piso durante horas de radiación cenital amortiguaron la temperatura ambiental mediante enfriamiento evaporativo sin mojar el follaje.

**Caso 4: Interacción y supervisión operativa.**  
Para validar la usabilidad y observabilidad del sistema, se evaluaron los flujos de interacción a través de las interfaces web y el asistente móvil. El cultivador gestionó eficazmente la activación manual segura con temporizador, la parametrización de rutinas, el monitoreo telemétrico y el inventario unívoco de especímenes. Asimismo, el canal de alertas en Telegram permitió la confirmación oportuna de mezclas agronómicas bajo el patrón Human-in-the-Loop y la recepción de avisos preventivos para el mantenimiento del filtro de disco y el reemplazo de baterías, consolidando una supervisión proactiva y compartida para el equipo de cultivadores.

**Documentación del Prototipo**  
El proceso de documentación constituyó una fase esencial para garantizar la comprensión, el mantenimiento y la transferencia tecnológica de la solución desarrollada. A nivel de ingeniería de software e infraestructura, las especificaciones de arquitectura contenerizada, los scripts de despliegue en servidor (\`.sh\`), las plantillas de configuración (\`.env\`) y la documentación técnica del firmware y servicios quedan formalizados en el Manual Técnico (Apéndice H), respaldado por la especificación concurrente del motor deliberativo en el Apéndice F.  
Asimismo, la memoria constructiva del despliegue físico de la infraestructura de borde (estaciones meteorológicas y tablero de conmutación) se consolida en el Apéndice G, documentando el prototipado evolutivo, el modelado 3D de las EMA y el montaje electromecánico en el orquideario.  
Por su parte, los procedimientos de interacción cotidiana y gestión del sistema se estructuran a través del Manual de Operación y Catálogo de Interfaces de Usuario (Apéndice E). Este documento guía al usuario en la explotación de la plataforma web a través de sus cinco módulos medulares: conmutación hidráulica segura con guardas climáticas, formulación rotativa de agroquímicos, inventario unívoco con seguimiento fenológico, telemetría ambiental y comercio botánico, integrándose con las notificaciones interactivas del asistente en Telegram para una gestión integral en campo.

**Capítulo V. Conclusiones y Recomendaciones**  
Una vez completadas las fases de ingeniería, implementación y validación experimental del sistema de gestión de invernaderos para el orquideario PristinoPlant, se procedió a la síntesis e interpretación crítica de los resultados obtenidos. A partir del contraste riguroso entre los objetivos planteados y el comportamiento operativo de la plataforma desarrollada, se derivan las principales conclusiones y recomendaciones para su evolución operativa.

**Conclusiones**  
La implementación del sistema de gestión de invernaderos basado en Internet de las Cosas (IoT) demostró ser una solución viable, robusta y autónoma para el orquideario PristinoPlant. La integración armónica entre hardware embebido en campo, servicios en la nube y la plataforma web permitió sustituir la gestión manual y empírica por un control telemétrico preciso en lazo cerrado. Esto garantizó la regulación continua del microclima, la trazabilidad individual de los ejemplares botánicos y la sostenibilidad operativa del cultivo, transformando el cuidado tradicional en una gestión técnica orientada por datos.  
En lo referente al análisis de conceptos y herramientas agronómicas para la definición del sistema, el diagnóstico *in situ* y la caracterización ecofisiológica de las orquídeas permitieron formalizar la especificación técnica mediante diecinueve (19) requerimientos funcionales y nueve (9) no funcionales. Esta línea base delimitó con rigor el alcance del proyecto, traduciendo las vulnerabilidades climáticas y las prácticas tradicionales del cultivo en criterios de ingeniería medibles y operativos.  
En cuanto a la etapa de diseño fundamentada en el análisis previo, la descomposición por capas estructuró una arquitectura modular, desacoplada y escalable. En esta fase se concibieron el circuito hidráulico presurizado, la infraestructura telemétrica bajo canales seguros MQTTS y la persistencia de series temporales en InfluxDB, formulando paralelamente la arquitectura del firmware embebido asíncrono y los algoritmos deliberativos de inferencia meteorológica y gobernanza hídrica que sirvieron de plano maestro para la construcción de la plataforma.  
Respecto al objetivo de implementación conforme al diseño concebido, la construcción del prototipo se ejecutó mediante siete (7) iteraciones guiadas por la metodología TDDM4IoTS y el modelo incremental, garantizando la entrega progresiva de software y hardware funcional. Este proceso permitió resolver oportunamente los retos electromecánicos y ambientales de campo: se optimizó el uso de memoria en los microcontroladores ESP32 delegando la persistencia a la nube, y se solventó la corrosión galvánica de los sensores resistivos de lluvia reemplazándolos por inferencia algorítmica y dotando al hardware de autorrecuperación automática ante micro-caídas.  
En lo concerniente a la validación experimental del sistema frente a los requerimientos analizados, las pruebas operativas confirmaron el cumplimiento de los veintiocho (28) requerimientos técnicos en régimen continuo y desatendido. El motor de inferencia meteorológica demostró una detección precisa durante cincuenta y siete (57) días de evaluación histórica contrastada con la bitácora de campo; en paralelo, el motor de inferencia hídrica auditó con éxito trescientas sesenta y nueve (369) tareas en producción, ejecutando ciento treinta y siete (137) vetos autónomos ante lluvia activa, precipitaciones recientes o saturación ambiental, lo que evitó el sobre-riego y protegió el cultivo del exceso de humedad.  
Finalmente, en cumplimiento del objetivo de documentación formal, se consolidó el compendio documental indispensable para garantizar la transferencia tecnológica y el mantenimiento continuo de la plataforma: el Manual Técnico (Apéndice F), que centraliza el enlace al repositorio digital y cataloga los artefactos esenciales de orquestación y despliegue; el Manual de Operación (Apéndice G), que formaliza las interfaces y procedimientos de interacción para el gobierno agronómico e hidráulico; y la memoria constructiva (Apéndice H), dedicada al registro documental del montaje electromecánico y modelado 3D del hardware.

**Recomendaciones**  
Con base en la experiencia empírica acumulada durante la operación in situ del sistema, se formulan las siguientes directrices técnicas para orientar la consolidación y escalabilidad del orquideario:  
Respecto al circuito hidráulico, se plantea instalar un filtro de sedimentos previo a la entrada de agua que respalde al filtro de disco de la bomba. Actualmente, contar con un único punto de filtrado provoca su saturación prematura tras seis ciclos de uso, reduciendo el caudal efectivo y forzando la bomba de agua; una etapa primaria de filtración espaciará las labores de mantenimiento del filtro y estabilizará el flujo en todo el circuito.  
En el área agronómica, conviene integrar sensores de humedad y temperatura de grado industrial con encapsulado impermeable y filtro sinterizado (tipo Sensirion SHT40 bajo bus I2C), insertados directamente en el medio de cultivo de macetas de pruebas. Esta instrumentación permitirá cuantificar en tiempo real las curvas de desecación y retención de humedad en distintas formulaciones de sustratos, facilitando a los cultivadores un entorno de experimentación objetivo para formular sustratos equilibrados que toleren tanto el exceso hídrico en temporadas lluviosas como la evaporación en periodos secos, sin exponer lotes de plantas al riesgo de anoxia radicular o fitopatógenos fúngicos.  
Asimismo, para robustecer la instrumentación de la Estación Meteorológica Automatizada Exterior (EMA Exterior), se plantea incorporar un pluviómetro mecánico de balancín (tipping bucket). Dicha mejora no debe limitarse a la manufactura aditiva en 3D del cono colector y balancín calibrado, sino abarcar el diseño de su circuito electrónico de acondicionamiento de señal con filtrado antirrebote para su conmutador magnético (reed switch), así como su integración formal dentro del runtime asíncrono del firmware del nodo a través de rutinas de interrupción por hardware (ISR). De esta manera, aun cuando el motor de inferencia meteorológica solventó con éxito la detección y caracterización de eventos pluviales, este subsistema electromecánico aportará una medición volumétrica cuantitativa directa de la lámina precipitada (en milímetros) sin bloquear el bucle de eventos ni la transmisión telemétrica concurrente, complementando la detección algorítmica y enriqueciendo el registro bioclimático histórico del orquideario.  
Finalmente, en materia de autonomía energética del hardware de campo, se recomienda dotar a la Estación Meteorológica Automatizada Interior (EMA Interior) de un módulo de captación solar fotovoltaica (energy harvesting) acoplado a su controlador de carga de litio. Al haber sido concebida como una unidad móvil dentro de una garita portátil para caracterizar gradientes microclimáticos entre sectores y mesas sin tender cableado eléctrico, la autosuficiencia fotovoltaica garantizará su servicio ininterrumpido y desatendido, preservando su portabilidad espacial y suprimiendo los ciclos periódicos de recarga manual de baterías.

**Referencias Bibliográficas**  
Arias, F. G. (2012). *El proyecto de investigación: Introducción a la metodología científica* (6ª ed.). Caracas, Venezuela: Editorial Episteme.  
Esteban Nieto, N. T. (2018). *Tipos de investigación*. Lima, Perú: Universidad Santo Domingo de Guzmán. Recuperado de [https\://core.ac.uk/outputs/250080756](https://core.ac.uk/outputs/250080756)   
Gubbi, J., Buyya, R., Marusic, S., & Palaniswami, M. (2013). Internet of Things (IoT): A vision, architectural elements, and future directions. *Future Generation Computer Systems*, *29*(7), 1645-1660. [https\://doi.org/10.1016/j.future.2013.01.010](https://doi.org/10.1016/j.future.2013.01.010)  
Guerrero-Ulloa, G., Hornos, M. J., & Rodríguez-Domínguez, C. (2020). TDDM4IoTS: A test-driven development methodology for Internet of Things (IoT)-based systems. En M. Botto-Tobar, L. Barba-Guamán, J. Bermeo, & O. S. Gómez (Eds.), *Applied technologies* (Vol. 1193, pp. 41-55). Cham, Suiza: Springer. [https\://doi.org/10.1007/978-3-030-42517-3\_4](https://doi.org/10.1007/978-3-030-42517-3_4) 

Hágsater, E., Dumont, V., Pridgeon, A. M., & IUCN/SSC Orchid Specialist Group. (1996). *Orchids: Status Survey and Conservation Action Plan*. Gland, Suiza: IUCN.

Hernández Sampieri, R., Fernández Collado, C., & Baptista Lucio, P. (2010). *Metodología de la investigación* (5ª ed.). México, D. F.: McGraw-Hill Interamericana.

Hornos, M. J., & Quinde, M. (2024). Development methodologies for IoT-based systems: Challenges and research directions. *Journal of Reliable Intelligent Environments*, *10*(3), 215-244. [https\://doi.org/10.1007/s40860-024-00232-4](https://doi.org/10.1007/s40860-024-00232-4) 

Hurtado de Barrera, J. (2010). *Metodología de la investigación: Guía para la comprensión holística de la ciencia* (4ª ed.). Caracas, Venezuela: Quirón Ediciones.

International Organization for Standardization. (2011). *Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models* (ISO/IEC 25010:2011). Ginebra, Suiza: ISO.

ISO/IEC/IEEE. (2018). *Systems and software engineering — Life cycle processes — Requirements engineering* (ISO/IEC/IEEE 29148:2018). Ginebra, Suiza: ISO/IEC/IEEE.

Kim, Y., & Lee, S. (2022). Effects of microclimate and vapor pressure deficit on growth and flowering of orchids in smart greenhouses. *Horticultural Science and Technology*, *40*(3), 285-296. [https\://doi.org/10.7235/HORT.20220027](https://doi.org/10.7235/HORT.20220027) 

Liao, M. S., & Chen, S. F. (2022). Monitoring and control of the orchid greenhouse microclimate based on the Internet of Things and machine learning. *Computers and Electronics in Agriculture*, *194*, 106753\. [https\://doi.org/10.1016/j.compag.2022.106753](https://doi.org/10.1016/j.compag.2022.106753) 

Majumder, S., Dickinson, C., & Mondal, P. (2019). Smart agriculture: IoT and cloud computing-based precision farming systems. *Sensors and Actuators A: Physical*, *290*, 11-23. [https\://doi.org/10.1016/j.sna.2019.03.011](https://doi.org/10.1016/j.sna.2019.03.011) 

Marinello, F., Zou, X., Liu, Z., Zhu, X., Zhang, W., Qian, Y., ... Mansoor, S. (2023). The path to innovations and opportunities in precision agriculture. *Agriculture*, *13*(8), 1577\. [https\://doi.org/10.3390/agriculture13081577](https://doi.org/10.3390/agriculture13081577) 

Moreno González, E. A. (2025). *Plataforma para facilitar la construcción y programación de estaciones meteorológicas orientadas a estudiantes de educación básica* (Trabajo de Grado de pregrado). Universidad Católica Andrés Bello, Ciudad Guayana, Venezuela.

OASIS. (2014). *MQTT Version 3.1.1* (OASIS Standard). Recuperado de [http\://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html](http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html) 

Prakash, S., Sharma, R., & Kumar, A. (2024). Precision irrigation and environmental management in protected cultivation: A review. *Agricultural Water Management*, *291*, 108620\. [https\://doi.org/10.1016/j.agwat.2023.108620](https://doi.org/10.1016/j.agwat.2023.108620) 

Pressman, R. S. (2010). *Ingeniería del software: Un enfoque práctico* (7ª ed.). México, D. F.: McGraw-Hill Interamericana.

Ramos-Galarza, C. (2021). Diseños de investigación experimental. *CienciAmérica*, *10*(1), 1-7. [https\://doi.org/10.33210/ca.v10i1.356](https://doi.org/10.33210/ca.v10i1.356) 

Rozas Bolívar, G. C. (2023). *Servidor para la interconexión de dispositivos IoT de los laboratorios de Ingeniería Informática e Ingeniería Civil de la UCAB Guayana* (Trabajo de Grado de pregrado). Universidad Católica Andrés Bello, Ciudad Guayana, Venezuela.

Sabino, C. (1992). *El proceso de investigación*. Caracas, Venezuela: Editorial Panapo.

Sommerville, I. (2011). *Ingeniería del software* (9ª ed.). México, D. F.: Pearson Educación.

Universidad Pedagógica Experimental Libertador. (2016). *Manual de trabajos de grado de especialización y maestría y tesis doctorales* (5ª ed.). Caracas, Venezuela: FEDUPEL.

**Apéndices** 

**Apéndice A \- Marco Normativo de Calidad**  
Tabla Ap-A1  
*Criterios de calidad para la formulación de requerimientos según IEEE 830 / ISO/IEC/IEEE 29148*

| Criterio | Descripción Normativa |
| :---: | ----- |
| No ambiguo | Admite una única interpretación por parte de desarrolladores y usuarios. |
| Completo | Describe todas las entradas, condiciones de procesamiento y salidas esperadas. |
| Verificable | Puede comprobarse objetivamente mediante inspección, prueba o demostración. |
| Consistente | No presenta contradicciones lógicas ni operativas con otros requerimientos. |
| Priorizable | Permite jerarquizar su implementación de acuerdo a las fases del desarrollo. |
| Modificable | Mantiene una estructura modular que facilita su revisión y ajuste sin efectos colaterales. |
| Trazable | Permite vincular la necesidad de origen con su diseño y componente ejecutable. |

*Nota. Adaptado de Systems and software engineering — Life cycle processes — Requirements engineering (ISO/IEC/IEEE 29148:2018).*

Tabla Ap-A2  
*Características de calidad del software según ISO/IEC 25010*

| Característica | Definición Estándar |
| :---: | ----- |
| Adecuación Funcional | Capacidad del producto para satisfacer las necesidades declaradas e implícitas bajo condiciones de uso específicas. |
| Eficiencia de Desempeño | Rendimiento relativo a la cantidad de recursos consumidos (tiempo de respuesta y memoria). |
| Compatibilidad | Grado en que el sistema intercambia información y comparte entorno común con otros componentes. |
| Usabilidad | Facilidad de comprensión, aprendizaje, operabilidad y accesibilidad para el usuario final. |
| Confiabilidad | Capacidad del sistema para mantener un nivel especificado de rendimiento y tolerar fallos en operación. |
| Seguridad | Protección de la información y salvaguarda del acceso a datos autorizados contra intrusiones. |
| Mantenibilidad | Efectividad y eficiencia con la que el producto puede ser modificado, corregido o adaptado. |
| Portabilidad | Facilidad con que el software puede ser transferido de un entorno operativo o hardware a otro. |

*Nota. Adaptado de Systems and software Quality Requirements and Evaluation (SQuaRE) (ISO/IEC 25010:2011).*

**Apéndice B \- Correspondencia Metodológica por Incremento**  
El presente apéndice consolida la descomposición modular y la trazabilidad metodológica del proyecto a lo largo de sus siete (7) incrementos funcionales, detallando los entregables técnicos generados y la articulación entre el Modelo Incremental de Pressman (2010) y la metodología TDDM4IoTS (Guerrero-Ulloa et al., 2020).

Tabla Ap-B1.   
*Módulos y entregables de ingeniería por incremento.*

| Inc. | Módulo | Entregables  |
| :---: | :---: | ----- |
| 1 | Plataforma Web Base y Catálogos taxonómico y agroquímico | Arquitectura web base, modelo de datos relacional para  catálogo taxonómico e insumos agronómicos. |
| 2 | Circuito Hidráulico, Tablero eléctrico y Automatización. | Circuito hidráulico de riego con 4 líneas, tablero eléctrico, y firmware base para conmutación de actuadores. |
| 3 | Infraestructura Backend Distribuida, Orquestación y Operaciones | Arquitectura backend en servicios contenerizados, bróker mqtt, servicio orquestador 24/7 e interfaces de control y programación del circuito hidráulico. |
| 4 | Estaciones Meteorológicas | Estaciones meteorológicas automatizadas (exterior e interior), firmware de adquisición telemétrica, mitigación de interferencias y monitoreo climático en tiempo real. |
| 5 | Inferencia de lluvia y Autonomía Hídrica | Motor de inferencia de riego basado en umbrales microclimáticos, motor heurístico de precipitación y documentación formal de validación en campo. |
| 6 | Inventario y comercio en línea | Modelo de gemelos digitales para seguimiento individualizado por ejemplar, control espacial en mesas de cultivo y comercio electrónico integrado. |
| 7 | Asistente Agronómico, Orquestación n8n | Integración de n8n para automatización de notificaciones y alertas al cultivador vía Telegram. |

Tabla Ap-B2.   
*Matriz de correspondencia metodológica por incremento.*

| Inc. | Fases Modelo Incremental | Fases TDDM4IoTS |
| :---: | ----- | ----- |
| 1 | Comunicación, Planeación, Modelado, Construcción | F1, F2, F3, F4, F7, F9 |
| 2 | Modelado, Construcción, Despliegue | F1, F2, F4, F5, F6, F7, F8 |
| 3 | Planeación, Modelado, Construcción, Despliegue | F1, F2, F3, F4, F7, F8, F9 |
| 4 | Modelado, Construcción, Despliegue | F1, F3, F5, F6, F7, F8, F10 |
| 5 | Construcción, Despliegue | F3, F5, F7, F8, F10, F11 |
| 6 | Modelado, Construcción, Despliegue | F1, F2, F4, F7, F11 |
| 7 | Modelado, Construcción, Despliegue | F4, F7, F8, F9, F11 |

**Nota.** Fases de TDDM4IoTS según Guerrero-Ulloa et al. (2020):

* *Bloque 1 (Iniciación y Requisitos):* 

  * F1 (Recopilación de Requisitos), 

  * F2 (Requisitos de Alto Nivel), 

  * F3 (Casos de Prueba Iniciales).

* *Bloque 2 (Diseño y Pruebas IoTS):* 

  * F4 (Arquitectura del Sistema IoTS), 

  * F5 (Especificación de Casos de Prueba IoTS), 

  * F6 (Criterios de Aceptación).

* *Bloque 3 (Construcción Guiada por Pruebas):* 

  * F7 (Creación del Entregable), 

  * F8 (Casos de Prueba \- TDD Red), 

  * F9 (Desarrollo \- TDD Green), 

  * F10 (Refactorización \- TDD Refactor).

* *Bloque 4 (Evaluación y Entrega):* 

  * F11 (Pruebas de Aceptación Final y Despliegue Operativo).

**Apéndice C \- Validación Experimental del Motor de Inferencia Meteorológica**  
El presente apéndice expone la metodología de validación, los registros de campo y los resultados experimentales obtenidos al evaluar el motor de inferencia meteorológica implementado en la plataforma de PristinoPlant. Este componente de software fue concebido para determinar en tiempo real la presencia, duración y cese de precipitaciones pluviales mediante el análisis de gradientes microclimáticos, sustituyendo de forma algorítmica los sensores físicos resistivos de lluvia que resultaron inviables por corrosión galvánica en la intemperie del orquideario.

**Metodología de validación por simulación histórica (Backtesting).** 

El motor de inferencia meteorológica, integrado en el servicio Scheduler, procesa de manera continua las lecturas transmitidas por la Estación Meteorológica Automatizada Exterior (EMA Exterior). El algoritmo evalúa en ventanas temporales deslizantes (10, 20 y 30 minutos) los cambios acoplados en temperatura ambiental (−ΔT), humedad relativa (+ΔHR) y niveles de radiación lumínica solar (lux), clasificados dinámicamente según la condición de cielo (Soleado, Nublado, Oscuro, Intermedio o Nocturno).  
Para verificar con rigor científico la exactitud del motor y calibrar sus umbrales operativos, se ejecutó una prueba de simulación histórica (backtesting) ejecutada por el script \`rebuild-rain-history.ts\`. La evaluación abarcó un período continuo de 117 días (desde el 25 de mayo de 2026), contrastando los eventos de precipitación deducidos por el sistema contra la bitácora de observación directa in situ mantenida manualmente por el cultivador en las instalaciones del orquideario durante los meses de junio, julio y agosto de 2026\.

**Historial de eventos de lluvia registrados en el orquideario.** 

La Tabla Ap-C1 consolida la totalidad de los cuarenta y cinco (45) eventos de precipitación registrados de forma manual durante los 57 días de observación contrastados (del 24 de junio al 19 de agosto de 2026), indicando fecha, horario, duración, notas descriptivas del fenómeno y la clasificación técnica asignada durante la contrastación algorítmica.

Tabla Ap-C1.   
*Bitácora de eventos de lluvia observados in situ.*

| N° | Identificador | Fecha y Horario | Duración | Descripción | Clasificación |
| :---: | :---: | :---: | :---: | ----- | :---: |
| 1 | 24-06-26-Rain-1 | 2026-06-2420:50 – 21:20 | 30 min | Lluvia nocturna que gatilló cese por estancamiento. | Verdadero Positivo |
| 2 | 01-07-26-Rain-1 | 2026-07-0112:15 – 12:30 | 15 min | Lluvia de mediodía, cese a las 12:30 pm. | Verdadero Positivo |
| 3 | 01-07-26-Rain-2 | 2026-07-0113:06 – 13:20 | 14 min | 1:06 pm lloviendo nuevamente. 1:20 pm ya escampó. | Verdadero Positivo |
| 4 | 01-07-26-Rain-3 | 2026-07-0116:04 – 16:20 | 16 min | 4:04 pm otra lluvia. 4:20 pm cesó. | Verdadero Positivo |
| 5 | 02-07-26-Rain-1 | 2026-07-0212:44 – 12:48 | 4 min | 12:44 pm una garúa con sol. Cese 12:48 pm. | Micro-evento Soleado |
| 6 | 02-07-26-Rain-2 | 2026-07-0216:40 – 17:30 | 50 min | 4:40-4:45 pm. Cesó 5:30 aproximadamente. | Verdadero Positivo |
| 7 | 02-07-26-Rain-3 | 2026-07-0218:02 – 18:30 | 28 min | 6:02 pm sigue garuando, 6:16 pm sigue lloviendo, 6:30 pm cese. | Verdadero Positivo |
| 8 | 02-07-26-Rain-4 | 2026-07-0219:00 – 20:00 | 60 min | 7:00 pm volvió a llover, 7:36 pm sigue, 8:02 pm escampado. | Limitación Justificada (1) |
| 9 | 05-07-26-Rain-1 | 2026-07-0511:56 – 12:06 | 10 min | Domingo 11:56 am garúa leve transitoria. | Verdadero Positivo |
| 10 | 05-07-26-Rain-2 | 2026-07-0512:40 – 13:50 | 70 min | 12:40 pm lluvia, 1:40 pm sigue fuerte. 1:50 pm paró. | Verdadero Positivo |
| 11 | 05-07-26-Rain-3 | 2026-07-0514:10 – 18:00 | 230 min | 2:10 pm garuando leve, 3:20 pm escampó, garuó hasta las 6:00 pm. | Verdadero Positivo |
| 12 | 06-07-26-Rain-1 | 2026-07-0617:45 – 17:55 | 10 min | Lunes 6 5:45 pm garúa mínima. Duró 10 min. | Verdadero Positivo |
| 13 | 07-07-26-Rain-1 | 2026-07-0712:50 – 14:02 | 72 min | Martes 7 12:50 pm lluvia, 1:55 pm sigue, 2:05 pm cesó. | Verdadero Positivo |
| 14 | 07-07-26-Rain-2 | 2026-07-0715:10 – 15:20 | 10 min | 3:10 pm comenzó a llover a cántaros. 3:20 pm cesó. | Verdadero Positivo |
| 15 | 07-07-26-Rain-3 | 2026-07-0715:30 – 15:35 | 5 min | 3:30 pm garuando leve. 3:35 pm dejó de garuar leve. | Micro-evento Soleado |
| 16 | 10-07-26-Rain-1 | 2026-07-1019:20 – 19:30 | 10 min | Viernes 10 de julio 7:20 pm \- 7:30 pm intenso pero pasajero. | Verdadero Positivo |
| 17 | 11-07-26-Rain-1 | 2026-07-1113:10 – 13:25 | 15 min | Sábado 11 de julio llovió a la 1:10 pm hasta las 1:25 pm. | Limitación Justificada (2) |
| 18 | 11-07-26-Rain-2 | 2026-07-1115:00 – 17:00 | 120 min | 3:00 pm leve. 3:22 pm sigue lloviendo. Garuando. | Verdadero Positivo |
| 19 | 11-07-26-Rain-3 | 2026-07-1119:15 – 19:45 | 30 min | 7:15 pm lloviendo fuerte. | Limitación Justificada (1) |
| 20 | 12-07-26-Rain-1 | 2026-07-1215:00 – 15:20 | 20 min | 12 de julio 3:00 pm garúa mínima. 3:14 pm fuerte. | Verdadero Positivo |
| 21 | 12-07-26-Rain-2 | 2026-07-1216:00 – 16:55 | 55 min | 4:00 pm inicio lluvia fuerte, 4:55 pm dejó de llover. | Verdadero Positivo |
| 22 | 12-07-26-Rain-3 | 2026-07-1218:34 – 19:10 | 36 min | 6:34 pm inicia otra lluvia. Paró a las 7:10 pm. | Limitación Justificada (1) |
| 23 | 13-07-26-Rain-1 | 2026-07-1314:16 – 14:20 | 4 min | Lunes 13 de julio 2:16 pm lluvia con sol. 2:20 pm paró. | Micro-evento Soleado |
| 24 | 13-07-26-Rain-2 | 2026-07-1314:24 – 14:30 | 6 min | 2:24 pm escuchó una nueva garúa. 2:30 pm dejó. | Verdadero Positivo |
| 25 | 15-07-26-Rain-1 | 2026-07-1510:00 – 10:18 | 18 min | 15 de julio 10:00 am garúa insignificante, 10:18 am cesó. | Verdadero Positivo |
| 26 | 15-07-26-Rain-2 | 2026-07-1512:10 – 12:20 | 10 min | 12:10 pm nueva garúa. Duró menos de 10 min. | Verdadero Positivo |
| 27 | 17-07-26-Rain-1 | 2026-07-1713:37 – 13:47 | 10 min | Viernes 17 de julio 1:37 pm garúa mínima. Duró 10 min. | Verdadero Positivo |
| 28 | 17-07-26-Rain-2 | 2026-07-1718:25 – 18:35 | 10 min | 6:25 o 6:30 pm está lloviendo. Duró 10 min aproximadamente. | Verdadero Positivo |
| 29 | 20-07-26-Rain-1 | 2026-07-2012:25 – 12:40 | 15 min | Lunes 20 de julio: 12:25 pm Inicio, 12:40 pm Cesa. | Verdadero Positivo |
| 30 | 20-07-26-Rain-2 | 2026-07-2012:50 – 13:00 | 10 min | 12:50 pm Inicio duro (se renueva con fuerza), 1:00 pm se estanca. | Verdadero Positivo |
| 31 | 23-07-26-Rain-1 | 2026-07-2316:00 – 16:30 | 30 min | Jueves 23 de julio: 4:00 pm lluvia, 4:30 pm cese por estancamiento. | Verdadero Positivo |
| 32 | 23-07-26-Rain-2 | 2026-07-2320:00 – 20:15 | 15 min | Jueves 23 de julio: 8:00 pm Lluvia, 8:15 pm cese. | Limitación Justificada (1) |
| 33 | 24-07-26-Rain-1 | 2026-07-2412:30 – 12:50 | 20 min | Viernes 24 de julio: 12:30 pm lluvia, 12:50 pm cesó. | Verdadero Positivo |
| 34 | 27-07-26-Rain-1 | 2026-07-2714:00 – 14:20 | 20 min | Lunes 27 de julio: 2:00 pm Garúa, 2:20 pm Cesó. | Verdadero Positivo |
| 35 | 28-07-26-Rain-1 | 2026-07-2812:09 – 12:18 | 9 min | Martes 28 de julio: 12:09 pm Garúa, 12:18 pm Cese solar. | Verdadero Positivo |
| 36 | 07-08-26-Rain-1 | 2026-08-0712:28 – 12:35 | 7 min | Viernes 7 de agosto: 12:28 pm inicio de garúa, 12:35 pm cese. | Verdadero Positivo |
| 37 | 07-08-26-Rain-2 | 2026-08-0713:00 – 13:15 | 15 min | Viernes 7 de agosto: 1:00 pm lluvia fuerte, 1:15 pm cese. | Verdadero Positivo |
| 38 | 08-08-26-Rain-1 | 2026-08-0811:29 – 13:05 | 96 min | Sábado 8 de agosto: 11:29 am lluvia, 1:05 pm cesó. | Verdadero Positivo |
| 39 | 09-08-26-Rain-1 | 2026-08-0914:35 – 14:40 | 5 min | Domingo 9 de agosto: 2:35 pm garúa, 2:40 pm cese. | Verdadero Positivo |
| 40 | 09-08-26-Rain-2 | 2026-08-0916:00 – 16:10 | 10 min | Domingo 9 de agosto: 4:00 pm Garúa, 4:10 pm cese. | Micro-evento Soleado |
| 41 | 14-08-26-Rain-1 | 2026-08-1408:20 – 08:43 | 23 min | Viernes 14 de agosto: 8:20 am nublado garuando, 8:43 am cesó. | Limitación Justificada (3) |
| 42 | 14-08-26-Rain-2 | 2026-08-1410:00 – 10:10 | 10 min | Viernes 14 de agosto: 10:00 am nueva lluvia, 10:10 am cesó. | Limitación Justificada (3) |
| 43 | 14-08-26-Rain-3 | 2026-08-1413:45 – 14:10 | 25 min | Viernes 14 de agosto: 1:45 pm lluvia, 1:53 pm fuerte, 2:10 pm cese. | Limitación Justificada (3) |
| 44 | 19-08-26-Rain-1 | 2026-08-1916:00 – 16:28 | 28 min | Miércoles 19 de agosto: 4:00 pm lluvia fuerte, 4:28 pm cesó. | Verdadero Positivo |
| 45 | 19-08-26-Rain-2 | 2026-08-1923:18 – 23:30 | 12 min | Miércoles 19 de agosto: 11:18 pm lluvia, 11:30 pm cesó. | Verdadero Positivo |

**Nota.** Nomenclatura de limitaciones justificadas: 

1. Ambiente Saturado: precipitación ocurrida tras lluvias previas acumuladas en el mismo día, manteniendo la humedad relativa plana (approx 97% \- 100%) e impidiendo gradientes higrométricos adicionales.  
2. Corte Eléctrico: interrupción de suministro eléctrico durante el evento, inhabilitando la captura telemétrica de la EMA Exterior.  
3. Falla Telemétrica: desfase horario e intercalación de paquetes en la estación exterior durante el período de mantenimiento del 10 al 17 de agosto.

**Resultados formales del motor de inferencia meteorológica.**

La Tabla Ap-C2 reúne el reporte formal generado por el script \`rebuild-rain-history.ts\`, desglosando la efectividad de las reglas de inferencia, la distribución de triggers de inicio, los criterios de cese y las métricas de sensibilidad obtenidas frente a la bitácora observada.  
Tabla Ap-C2.   
*Métricas y análisis del script rebuild-rain-history.ts*

| Evaluación | Métrica / Regla | Valor | Interpretación |
| :---: | :---: | :---: | ----- |
| Parámetros Globales de Reconstrucción | Período evaluado | 117 días | Desde el 25 de mayo de 2026 hasta la fecha de corte en producción. |
|  | Eventos pluviales inferidos | 110 eventos | Eventos de lluvia detectados por el motor en ventanas de 10 a 30 min. |
|  | Falsos positivos prevenidos (Vetos) | 26 vetos | Algoritmos de veto que impidieron activar lluvia ante caídas térmicas secas o ráfagas de viento. |
| Distribución de Triggers de Inicio | NIGHT 10M (Nocturno) | 27 | Detección nocturna por ascenso sostenido de HR y estabilidad térmica en 10 min. |
|  | DAY RAMA B SOLEADO SENSIBLE 10M | 25 | Caída térmica acelerada con cielo previamente despejado en ventana de 10 min. |
|  | DAY RAMA C INTERMEDIO SENSIBLE 10M | 13 | Disparo en cielo semicubierto con variación higrotérmica acoplada a 10 min. |
|  | DAY RAMA A OSCURO 10M | 8 | Disparo inmediato ante oscurecimiento repentino por nubes convectivas densas. |
|  | DAY RAMA C INTERMEDIO SENSIBLE 20M | 7 | Confirmación de lluvia en cielo intermedio mediante ventana ampliada de 20 min. |
|  | DAY RAMA B SOLEADO SENSIBLE 20M | 6 | Detección en día soleado con respuesta higrotérmica moderada a 20 min. |
| Distribución de Triggers de Inicio | DAY RAMA B SOLEADO ROBUSTO 30M | 6 | Confirmación robusta acumulada de 30 min en jornadas de alta radiación solar. |
|  | DAY RAMA A NUBLADO 10M | 6 | Detección en cielo encapotado de baja iluminancia en 10 min. |
|  | DAY RAMA B SOLEADO ROBUSTO 10M | 3 | Disparo de alta pendiente negativa en temperatura bajo sol intenso en 10 min. |
|  | DAY RAMA B SOLEADO SENSIBLE 30M | 3 | Detección acumulada a 30 min para precipitaciones tenues en día soleado. |
|  | DAY RAMA C INTERMEDIO SENSIBLE 30M | 2 | Confirmación de cese de radiación y meseta higrométrica en 30 min. |
|  | DAY RAMA B SOLEADO ROBUSTO 20M | 2 | Detección robusta de 20 min en condiciones de alta luminosidad. |
|  | DAY RAMA A NUBLADO 20M | 1 | Confirmación en cielo nublado prolongado. |
|  | DAY RAMA A OSCURO 30M | 1 | Disparo robusto bajo tormenta oscura de desarrollo gradual. |
| Distribución de Reglas de Cese | STAGNANT (Estancamiento) | 61 | Cese determinado por estabilización de la humedad en meseta y fin del enfriamiento. |
|  | THERMAL VARIATION (Variación térmica) | 39 | Cese identificado por ascenso térmico positivo tras la disipación de la nube. |
|  | SOLAR RECOVERY (Recuperación solar) | 8 | Cese automático al rebasar el umbral de iluminancia solar por despeje del cielo. |
|  | EMA OFFLINE (Desconexión de estación) | 2 | Cierre preventivo del evento ante pérdida prolongada de telemetría de campo. |
| Validación contra Bitácora Manual | Total de eventos reales registrados | 45 eventos | Bitácora presencial del cultivador en el período analizado. |
|  | Verdaderos Positivos (Detectados) | 33 eventos | Lluvia real identificada con solapamiento temporal exacto (±30 min de margen). |
|  | Falsos Negativos Brutos (Omitidos) | 12 eventos | Eventos no registrados de forma autónoma por la inferencia. |
|  | **Sensibilidad Bruta (Recall)** | **73.3 %** | **Relación directa entre eventos detectados y total de anotaciones manuales (33 / 45).** |
| Desglose de Falsos Negativos | Limitaciones físicas documentadas | 8 eventos | 4 por saturación higrométrica previa, 1 por corte eléctrico y 3 por mantenimiento. |
|  | Micro-eventos en día soleado (≤ 10 min) | 4 eventos | Garúas fugaces bajo radiación solar ≥ 26 klx sin impacto en el sustrato de cultivo. |
|  | Eventos significativos no explicados | 0 eventos | **Ninguna lluvia mayor a 10 min quedó sin ser detectada por el algoritmo.** |
|  | Micro-eventos omitidos en día nublado | 0 eventos | Ninguna llovizna en cielo nublado fue ignorada. |
| Desempeño Agronómico Ajustado | Base evaluable de lluvias con impacto | 33 eventos | Excluyendo contingencias físicas no algorítmicas y garúas de evaporación instantánea. |
|  | **Sensibilidad Ajustada (Recall)** | **100.0 %** | **El motor detectó el 100 % de las lluvias reales con relevancia para el riego (33 / 33).** |

**Nota.** *Fuente: Salida de ejecución de \`rebuild-rain-history.ts\` en el servicio \`Scheduler\` de PristinoPlant.*

**Análisis e interpretación técnica de los resultados.** 

El análisis de las métricas obtenidas aporta conclusiones fundamentales sobre la robustez y viabilidad de la solución inferencial implementada:

1. **Compensación de Limitaciones Físicas:** De los doce (12) falsos negativos registrados en la comparación bruta, ocho (8) corresponden a restricciones externas plenamente justificadas:

   1. En cuatro ocasiones (\`02-07-26-Rain-4\`, \`11-07-26-Rain-3\`, \`12-07-26-Rain-3\` y \`23-07-26-Rain-2\`), el orquideario ya había experimentado precipitaciones previas de gran intensidad en el mismo día (acumulando entre 50 y 120 minutos de lluvia). La atmósfera circundante se encontraba en un estado de saturación higrométrica plana (HR≈97%−100%), por lo que una precipitación nocturna adicional no produjo una derivada térmica ni higrométrica diferenciable. Desde la perspectiva agronómica, el riego programado ya se encontraba formalmente vetado por el evento previo, por lo que la no detección de la lluvia residual no comprometió en ningún momento la salud radicular de las orquídeas.

   2. El evento \`11-07-26-Rain-1\` coincidió con un corte municipal del suministro eléctrico que interrumpió el enlace telemétrico del nodo exterior, constituyendo una restricción de infraestructura y no un fallo del modelo algorítmico.

   3. Los eventos del 14 de agosto (\`14-08-26-Rain-1\`, \`2\` y \`3\`) tuvieron lugar durante una ventana de mantenimiento y sustitución del cableado de la EMA Exterior, período en el cual la telemetría se encontraba temporalmente desfasada.  
2. **Descarte Agronómico de Micro-Garúas Soleadas:** Cuatro (4) eventos de la bitácora correspondieron a lloviznas de duración mínima (entre 4 y 10 minutos) ocurridas en jornadas de intensa radiación solar cenital (≥ 26.000 lux). En estas condiciones, la tasa de evaporación en Ciudad Guayana supera la tasa de aporte hídrico de la precipitación: las gotas se evaporan de forma inmediata en las mallas de sombra y en las hojas superiores sin alcanzar a humectar el sustrato ni alterar el balance hídrico del cultivo. La decisión del motor de no clasificar estos eventos como lluvia evitó vetos innecesarios de riego en momentos de alta transpiración foliar.

3. **Cero Omisiones Significativas:** El valor de 0 eventos significativos no explicados (\> 10min) certifica que el modelo matemático no presenta puntos ciegos ante lluvias con volumen hídrico real.

En conclusión, la obtención de una Sensibilidad Ajustada del 100.0% y la prevención comprobada de 26 falsos positivos demuestran que el motor de inferencia meteorológica supera funcionalmente a los sensores resistivos convencionales, brindando una fuente confiable, inmune a la corrosión y con base científica para gobernar las decisiones del circuito de riego autónomo en PristinoPlant.

**Apéndice D \- Validación Experimental del Motor de Inferencia Hídrica**  
Este apéndice documenta la metodología de validación, los criterios de decisión algorítmica y el análisis empírico del motor de inferencia hídrica de la plataforma PristinoPlant a través de la trazabilidad de las operaciones de riego. Este componente, integrado en el servicio Scheduler, gobierna de forma autónoma la activación, el espaciamiento temporal y el veto preventivo de las rutinas de irrigación, humectación y dosificación, regulando el aporte hídrico para mitigar tanto el déficit hídrico como la saturación hídrica.

**Metodología de validación por trazabilidad operacional.** 

La validación del motor se fundamenta en la contrastación cronológica entre las operaciones ejecutadas por el planificador y los eventos de precipitación registrados a lo largo de 369 tareas procesadas entre mayo y septiembre de 2026\.  
Conforme a lo documentado en el Apéndice C, para garantizar el rigor científico del análisis se descartaron los registros generados por el sensor físico resistivo de gotas, cuyas lecturas quedaron invalidadas por corrosión galvánica y falsos contactos continuos. En consecuencia, la evaluación se circunscribe exclusivamente a los 110 eventos de lluvia inferida reconstruidos algorítmicamente por el motor meteorológico, los cuales se distribuyen en 74 días con precipitaciones confirmadas.  
El motor evalúa las lecturas de telemetría y el historial hídrico antes de despachar cualquier orden al nodo actuador, rigiéndose por las siguientes reglas de control:

1. Bloqueo en Tiempo Real (Hard Block): Inhibición inmediata de toda operación hidráulica ante lluvia inferida en curso.  
2. Alternancia Interdiaria: Veto de la rutina de riego por aspersión si el día previo se acumuló lluvia ≥ 20 minutos o se completó un riego.  
3. Lluvia Reciente (Ventanas Retrospectivas): Cancelación de humectación del suelo ante lluvias en las últimas 4 horas, o de nebulización ante lluvias en las últimas 8 horas.  
4. Saturación Hídrica Diurna: Cancelación de tareas si el promedio móvil de humedad relativa en 4 horas es ≥85%. Humedad Diaria Sostenida: Bloqueo preventivo al acumular entre 6 y 8 bloques horarios con humedad relativa promedio ≥98%.  
5. Acoplamiento Higrotérmico: Veto de humectación del suelo ante temperaturas ≤ 30ºC con humedad relativa ≥ 80%.

**Métricas globales y clasificación de vetos del motor de inferencia hídrica.**

Durante el período de evaluación operativa, comprendido entre mayo y septiembre de 2026, se procesaron 369 tareas hidráulicas en el servicio Scheduler. A continuación, se desglosan los resultados obtenidos mediante cuatro tablas independientes.

Tabla Ap-D1.   
*Volumen global y balance de ejecución de tareas hidráulicas.*

| Estado Operativo | Tareas Procesadas | Proporción (%) | Interpretación |
| :---: | :---: | :---: | ----- |
| Tareas programadas en el sistema | 369 tareas | 100.0 % | Universo completo de operaciones auditadas. |
| Tareas completadas exitosamente | 172 tareas | 46.6 % | Operaciones ejecutadas con verificación de apertura y cierre de válvulas. |
| Tareas canceladas / vetadas | 182 tareas | 49.3 % | Acciones inhibidas por reglas algorítmicas de inferencia o control manual. |
| Tareas expiradas | 15 tareas | 4.1 % | Ventana de oportunidad vencida (20 min sin enlace por corte eléctrico/red). |

Tabla Ap-D2.   
*Operaciones hidráulicas según el propósito de la rutina.*

| Propósito de la Tarea | Identificador del Sistema | Total Tareas | Proporción (%) | Desglose Operativo |
| :---: | :---: | :---: | :---: | ----- |
| Humectación de Suelo | Soil Wetting | 225 tareas | 61.0 % | 119 completadas, 98 canceladas, 8 expiradas. |
| Aspersión General | Irrigation | 63 tareas | 17.1 % | 21 completadas, 40 canceladas, 2 expiradas. |
| Humidificación | Humidification | 74 tareas | 20.0 % | 31 completadas, 40 canceladas, 3 expiradas. |
| Fertirrigación Foliar | Fertigation | 4 tareas | 1.1 % | 0 completadas, 2 canceladas, 2 expiradas. |
| Aplicación Fitosanitaria | Fumigation | 3 tareas | 0.8 % | 1 completada, 2 canceladas, 0 expiradas. |

Tabla Ap-D3.   
Distribución de intervenciones de control manual y contingencias operativas.

| Regla Algorítmica de Inferencia | Tareas Vetadas | Proporción de Vetos (%) | Criterio y Justificación Técnica |
| :---: | :---: | :---: | ----- |
| Parada manual temprana | 14 tareas | 7.7 % | Interrupción temprana iniciada por el operador desde la interfaz web por reajuste de rutina. |
| Cancelaciones manuales justificadas | 13 tareas | 7.1 % | Mantenimiento de filtros, calibración de válvulas o reprogramación voluntaria. |
| Reajustes y cierres de circuito de riego | 8 tareas | 4.4 % | Cierre preventivo del circuito hidráulico para evitar desbalances de presión. |
| Colisión prevenida  Inactivas | 3 tareas | 1.6 % | Bloqueo por solapamiento de rutinas concurrentes o rutinas en pausa voluntaria. |
| Expiradas por contingencia de enlace | 7 tareas | 3.8 % | Tareas no despachadas por falta transitoria de telemetría o interrupción de energía eléctrica. |
| **Total Intervenciones y Contingencias** | **45 tareas** | **24.7 %** | **Acciones de control manual directo y protección física de la infraestructura.** |

Tabla Ap-D4.   
*Clasificación de vetos del motor de inferencia hídrica.*

| Regla Algorítmica de Inferencia | Tareas Vetadas | Proporción de Vetos (%) | Criterio y Justificación Técnica |
| :---: | :---: | :---: | ----- |
| Veto por lluvia reciente (Lookback 4h / 8h) | 38 tareas | 20.9 % | Cancelación de humectación de suelo o nebulización por lluvia ocurrida en las últimas 4 u 8 horas. |
| Veto por alternancia interdiaria (lluvia previa) | 25 tareas | 13.7 % | Aspersión general omitida al registrarse lluvia (≥ 20 min) o riego completo en la víspera. |
| Veto por saturación hídrica diurna (4h) | 25 tareas | 13.7 % | 31 completadas, 40 canceladas, 3 expiradas. |
| Veto por humedad sostenida (≥98%) | 23 tareas | 12.6 % | Detección de temporal continuo al acumular de 6 a 8 bloques horarios de saturación (≥98%). |
| Bloqueo en tiempo real (Lluvia activa) | 19 tareas | 10.4 % | Inhibición inmediata (hard block) por coincidencia temporal con precipitación activa. |
| Veto acoplado temperatura / humedad | 8 tareas | 4.4 % | Omitidas al registrar Temp ≤ 30ºC acoplada a HR ≥ 80% (baja tasa evapotranspirativa). |
| Veto de respaldo nocturno / ambiente fresco | 2 tareas | 1.1 % | Cancelaciones preventivas por saturación nocturna o estabilidad microclimática fresca. |
| **Total de Vetos Autónomos del Motor** | **137 tareas** | **75.3 %** | **Decisiones algorítmicas autónomas que evitaron irrigaciones redundantes.** |

**Apéndice E \- Arquitectura y Trazabilidad del Scheduler**  
El presente apéndice expone la especificación arquitectónica, los subsistemas concurrentes y la bitácora de trazabilidad en tiempo real del microservicio Scheduler de la plataforma PristinoPlant. Desarrollado en Node.js y TypeScript bajo un contenedor Docker independiente con ejecución continua (24/7), este componente actúa como el orquestador soberano de la solución, mediando de forma desacoplada entre los microcontroladores en campo (ESP32), el bróker de mensajería MQTTS, la persistencia histórica en bases de datos (PostgreSQL e InfluxDB) y los flujos de mensajería interactiva hacia Telegram.

**Responsabilidades principales del servicio scheduler.**  
La arquitectura interna del Scheduler organiza siete (7) módulos operativos que ejecutan tareas programadas mediante expresiones temporales (croner), consumidores de eventos reactivos y controladores de enlace:

1. *Gestión de Sesión y Comunicación MQTTS (mqtt-handler):* Administra la conexión segura bajo TLS con el bróker Eclipse Mosquitto, estructurando el secuenciador de comandos (CommandSequencer) con acuse de recibo obligatorio (ACK), reintento automático y tiempo de estabilización post-reconexión.  
2. *Ciclo Circadiano y Clasificación Solar (day-classifier):* Computa la iluminancia promedio diurna para categorizar la jornada (SOLEADO, EXTREMADAMENTE SOLEADO, TEMPLADO), gobernando dinámicamente el encendido matutino y apagado nocturno del luxómetro (lux\_sampling:on/off).  
3. *Orquestación de la Estación en Reposo (ema-manager):* Coordina el ciclo de bajo consumo de la Estación Meteorológica Interior (EMA Interior), sincronizando su reloj interno (RTC), extrayendo sus lotes de telemetría y ordenando su retorno a sueño profundo (Deep Sleep).  
4. *Motor de Resiliencia y Watchdog de Sensores (watchdog):* Supervisa la disponibilidad de datos de los sensores, comandando ciclos de sincronización (sync\_climate) y ciclos de potencia en el hardware para desbloquear buses digitales sin reiniciar el nodo.  
5. *Autonomía Hídrica y Deliberación Algorítmica (inference-engine):* Evalúa los umbrales climáticos antes de autorizar cualquier conmutación sobre el circuito hidráulico, aplicando vetos por lluvia activa, ventanas retrospectivas, saturación y alternancia interdiaria.  
6. *Agenda Agronómica y Mantenimiento de Filtro:* Pre-agenda las rutinas de fertilización y fitosanitarias, marca la expiración de tareas no atendidas y audita la cadencia de limpieza del filtro de disco cada 2 días hacia Telegram.  
7. *Procesamiento Telemétrico y Cierre Diario (telemetry-processor):* Calcula a la medianoche los índices bioclimáticos consolidados del orquideario: Integral de Luz Diaria (DLI), Déficit de Presión de Vapor (VPD) y gradiente térmico día/noche (DIF), aplicando filtros de calidad por densidad de muestras.

**Evidencia empírica de trazabilidad en consola.**  
La Figura Ap-F1 documenta una ventana de ejecución real del microservicio Scheduler, capturando la interacción concurrente entre la detección algorítmica de precipitaciones, la gestión de eventos huérfanos ante pérdidas de red, el protocolo post-reinicio de microcontroladores y el cierre astronómico diario.

***Figura Ap-E1.*** Trazabilidad Operativa del Servicio Scheduler.

**Desglose secuencial de eventos críticos.**  
A partir de los registros auditados en la consola e ilustrados en la Figura Ap-F1 (comprendidos cronológicamente entre el 28 de septiembre a las 5:20 p.m. y el 29 de septiembre a las 12:01 a.m.), se desglosan los cinco (5) hitos operacionales que evidencian la autonomía deliberativa y resiliencia del sistema:

1. ***Apertura de Evento de Lluvia Inferida (05:20 p.m.):*** En las líneas iniciales de la Figura Ap-F1 se observa el instante en que el motor de inferencia meteorológica evaluó las series temporales de la EMA Exterior en ventanas deslizantes diurnas. Al registrar un incremento higrométrico abrupto (ΔHR=+14.1%) acompañado de un enfriamiento térmico de magnitud (ΔTemp=−5.5ºC) y una caída del 71% en la iluminancia solar (descendiendo desde un valor base de 10.031 lx hasta 2.874 lx), el algoritmo determinó una condición de lluvia diurna bajo nubosidad persistente, abriendo el evento pluvial en la base de datos para vetar de inmediato cualquier rutina de riego activa o programada.

2. ***Detección y Cierre de Evento Huérfano por Desconexión (06:15 p.m. – 06:21 p.m.):*** A las 6:15 p.m., tal como documenta la captura, el bróker MQTTS notificó la desconexión del microcontrolador exterior (NODE OFFLINE \[Actuador\]). En lugar de mantener el evento de lluvia abierto de forma indefinida —lo que habría bloqueado falsamente el riego del orquideario durante días—, el planificador activó una ventana de guarda de doce minutos. Al no reanudarse la telemetría, el sistema ejecutó a las 6:21 p.m. la regla determinista de salvaguarda EMA\_OFFLINE, reflejada en la consola con el cierre formal del evento huérfano y una duración calculada de 59 minutos.  
3. ***Recuperación Post-Reinicio y Sincronización Horaria (06:23 p.m.):*** Continuando con la cronología de la Figura Ap-F1, al restablecerse el suministro eléctrico del nodo actuador (\`NODE REBOOT\`), el planificador detectó su conexión en el tópico de estado. De forma inmediata, despachó el comando de sincronización horaria hacia el reloj interno (RTC) del microcontrolador para fijar la marca de 6:23 p.m. Este ajuste responde a dos propósitos operacionales fundamentales: sincronizar las marcas temporales de la telemetría con la hora local de Venezuela (UTC-4) para su correlación en base de datos, y garantizar que las publicaciones de los lotes telemétricos se alineen estrictamente con los múltiplos de diez minutos del reloj (:00, :10, :20, etc.) en lugar de contar deltas relativos desde el encendido. De este modo, si el nodo inicia actividades a las (12:05 p.m.), su primer envío ocurrirá exactamente a las (12:10 p.m.).El nodo confirmó la recepción mediante una trama de acuse de recibo (\`ACK\`) antes de que el servidor procediera con la activación del muestreo lumínico y la verificación de actuadores.  
4. ***Resiliencia de Transductores y Watchdog de Sensores (06:23 p.m. – 06:28 p.m.):*** Durante la fase de inicialización post-reinicio, la terminal advierte que la lectura del transductor higrotérmico falló transitoriamente (Clima: No se detecto el sensor DHT22). En respuesta, el subsistema de vigilancia del planificador activó una rutina de reintento agresivo (intento 1 de 6\) comandando la sincronización climática (sync\_climate). Tras recibir el acuse de recibo y restablecer el bus de datos, el watchdog certificó en consola la estabilización exitosa de los sensores a las 6:28 p.m., reanudando la captura telemétrica continua sin requerir la intervención presencial del operador.  
5. ***Ciclo Circadiano, Consulta Financiera y Cierre Diario (07:01 p.m. – 12:01 a.m.):*** En el segmento final de la Figura Ap-F1, al alcanzar las 7:01 p.m., el planificador constató el anochecer y emitió la orden lux\_sampling:off confirmada con ACK; este comando suspende el bus del luxómetro BH1750 durante la noche para evitar registros innecesarios de 0 lux y optimizar recursos. A las 8:30 p.m., un microflujo autónomo consultó la API oficial del Banco Central de Venezuela, obteniendo la tasa cambiaria de 857.88 Bs/USD para actualizar los precios en la tienda electrónica.  
   Finalmente, a las 12:01 a.m. del día siguiente, la consola evidencia el cierre diario completado: el servicio consolidó 2.228 registros del microclima exterior, calculando los descriptores agronómicos acumulados: Integral de Luz Diaria, Déficit de Presión de Vapor promedio y balance térmico. Asimismo, constató que la EMA Interior no transmitió datos durante dicha jornada, descartando el día mediante una advertencia de control de calidad (WARN) para no sesgar las estadísticas históricas del cultivo.

   **Ciclo de vida y protocolo de reposo con la estación interior (EMA).**

La auditoría extendida de las operaciones del Scheduler revela el riguroso protocolo de bajo consumo implementado para gobernar la Estación Meteorológica Interior a batería:

***Figura Ap-E2.*** Protocolo Horario de Reposo (Deep Sleep) \- Nodo EMA.  
Si durante este ciclo se produce una pérdida de paquete en el acuse de recibo (ACK), el Scheduler incorpora una guarda por tiempo límite (Timeout Fallback): \`⚠️ EMA marcado en SLEEP tras timeout de acuse (Fallback)\`. Esta regla previene que el servidor asuma falsamente que la estación permanece encendida consumiendo energía, preservando la coherencia del estado del gemelo digital en el backend.

**Resumen de gobernanza de vetos y recuperación en caliente.**  
La trazabilidad del servicio demuestra la aplicación determinista de las reglas de irrigación y resiliencia documentadas en el informe:

1. ***Recuperación en Caliente (Hot State Recovery):*** Ante una caída de red a los 2 minutos de una rutina de aspersión de 15 minutos, el planificador pausó la tarea; tras reconectarse el nodo un minuto después, reevaluó el clima y despachó un nuevo comando con los 13 minutos restantes (780 s), completando la cuota hídrica sin sobre-irrigar.  
2. ***Vetos Cruzados por Historial:*** Cancelación automática de aspersión matutina al registrarse lluvia inferida en el día anterior (alternancia interdiaria), veto de humectación ante lluvias en las últimas 4 horas o ante saturación diurna sostenida (≥85%).

**Apéndice F \- Manual Técnico**  
Para garantizar la reproducibilidad de la plataforma, facilitar la transferencia tecnológica y guiar las labores de administración y soporte por parte de futuros ingenieros, el código fuente, los esquemas de aprovisionamiento contenerizado y las guías de mantenimiento de PristinoPlant se encuentran centralizados en el repositorio público de GitHub:

* Repositorio del Proyecto: [https\://github.com/JulioFlors/orchidium-project](https://github.com/JulioFlors/orchidium-project)

Bajo una arquitectura de monorepositorio (Turborepo), este apéndice indexa los artefactos de ingeniería del proyecto (guías README.md, manifiestos Docker, scripts .sh y plantillas .env.template), detallando su rol operativo y ubicación en la rama main.

**Artefactos de documentación técnica.**

Tabla Ap-F1.  
*Índice de artefactos de documentación técnica en GitHub.*

| Componente / Módulo  | Descripción  | Enlace en GitHub |
| :---: | :---: | :---: |
| Monorepositorio | Arquitectura general, modelo de datos y entorno local  | [README.md](https://github.com/JulioFlors/orchidium-project/blob/main/README.md)  |
| Nodos Embebidos IoT | Firmware en MicroPython para SoCs ESP32 y sensores | [firmware/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/firmware/README.md)  |
| Infraestructura MQTT | Bróker Mosquitto contenerizado, TLS y seguridad | [infrastructure/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/README.md)  |
| Orquestación n8n | Asistente PristinoBot en Telegram y alertas de red | [infrastructure/n8n/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/n8n/README.md)  |
| Microservicio Scheduler | Motor de deliberación hídrica y scripts de backfill | [services/scheduler/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/README.md)  |
| Base Agronómica Web | Formulación de recetas químicas y catálogo biológico | [app/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/README.md)  |
| Estándares de UI/UX | Arquitectura de capas z-index, GPU y accesibilidad | [app/src/components/ui/action-menu/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/src/components/ui/action-menu/README.md)  |

***Arquitectura General y Monorepositorio.***

* *Enlace directo:* [JulioFlors/orchidium-project/](https://github.com/JulioFlors/orchidium-project/blob/main/README.md)[README.md](http://readme.md)  
* *Contenido y alcance técnico:*  
  * *Estructura del Monorepositorio:* Organización modular de paquetes bajo Turborepo y pnpm workspaces (app, firmware, infrastructure, packages/database, services).  
  * *Modelo de Datos de Triple Fuente de Verdad:* Resolución de discrepancias entre catálogo digital e inventario físico mediante los modelos Species (información botánica), ProductVariant (SKU comercial y precio) y Plant (activo biológico físico individual).  
  * Filosofía de Co-ubicación y Buenas Prácticas: Directrices de diseño modular para mantener la UI desacoplada de la lógica de negocio y estado.  
  * Guía de Despliegue Local: Procedimiento de arranque en entornos de desarrollo mediante Docker Desktop, Node.js 22 LTS (vía Corepack), cliente PostgreSQL y variables de entorno iniciales.  
  * Políticas de Integración de Servicios Externos: Configuración de la política CORS para la subida directa de activos fotográficos botánicos a Cloudflare R2 sin bloqueos en el navegador.

***Firmware embebido para nodos ESP32.***

* *Enlace directo:* [JulioFlors/orchidium-project/firmware/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/firmware/README.md)  
* *Contenido y alcance técnico:*  
  * *Entorno y Herramientas Embebidas:* Requisitos para flashear microcontroladores ESP32 con la imagen oficial de MicroPython (v1.26.0+) usando esptool.  
  * *Automatización de Despliegue con mprun:* Manual del comando personalizado mprun \-b \-l que interpreta archivos manifest.json para aprovisionar automáticamente librerías en la memoria flash de cada nodo.  
  * *Especificación de Transductores y Actuadores:* Circuitos de conexionado y protocolos para el sensor de temperatura/humedad DHT22, sensor de iluminancia BH1750 (bus I2C), módulo de relés de 4 canales y protecciones de conmutación de potencia.  
  * *Librerías Parchadas y Resiliencia:* Documentación de las modificaciones a la librería umqtt.simple2 para implementar reconexión automática ante micro-caídas y temporizadores locales de seguridad (fail-safe) que desenergizan las válvulas si se pierde la red.  
  * *Auditoría Telemétrica:* Procedimientos de validación de tópicos y payloads JSON bajo canales seguros MQTTS utilizando MQTT Explorer.

***Orquestación con n8n y asistente autónomo en telegram.***

* *Enlace directo:* [JulioFlors/orchidium-project/infrastructure/n8n/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/infrastructure/n8n/README.md)   
* *Contenido y alcance técnico:*  
  * *Flujo de Comandos de PristinoBot:* Arquitectura del workflow interactivo de Telegram (/status, /dosing, /help), detallando la depuración de conexiones paralelas en nodos Switch y consultas SQL con UNION ALL para unificar eventos pasados (DosingLog) con tareas proyectadas en agenda (DosingSchedule).  
  * *Normalización de Salida y API de Telegram:* Inyección de caracteres de ancho cero (\\u200B) para preservar saltos de línea e incorporación de diccionarios de traducción de zonas agronómicas.  
  * *Workflow de Alertas Correlacionadas de Nodos:* Lógica de supervisión continua sobre la tabla DeviceLog en PostgreSQL para monitorear el estado de las estaciones meteorológicas y el nodo actuador.  
  * *Algoritmo de Tolerancia a Micro-Fallos:* Regla de ventana temporal de 10 minutos continuos en estado OFFLINE para inhibir falsas alarmas ante reconexiones transitorias de Wi-Fi, distinguiendo entre cortes eléctricos generales y descargas de batería de la EMA.

***Microservicio Scheduler y procedimientos de reconstrucción de datos.***

* *Enlace directo:* [JulioFlors/orchidium-project/services/scheduler/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/README.md)  
* *Contenido y alcance técnico:*  
  * *Consolidación de Telemetría (Backfill):* Procedimiento para ejecutar el script backfill-history.ts utilizando contenedores temporales de Node.js en el VPS o en entornos locales, transfiriendo y compactando métricas higrotérmicas desde InfluxDB hacia PostgreSQL.  
  * *Reconstrucción Histórica de Precipitaciones:* Guía de uso del script rebuild-rain-history.ts para recalcular retroactivamente eventos de lluvia a partir de gradientes microclimáticos brutos, alimentando la base de datos de auditoría del motor hídrico.  
  * *Variables de Entorno Operativas:* Configuración de parámetros de conexión a InfluxDB (URL, Token criptográfico, Organización y Bucket) y rangos temporales de procesamiento (BACKFILL\_DAYS).

***Base de conocimiento agronómico y formulación de recetas.***

* *Enlace directo:* [JulioFlors/orchidium-project/app/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/README.md)  
* *Contenido y alcance técnico:*  
  * *Compendio Técnico de Insumos:* Fichas técnicas completas de fertilizantes de liberación controlada (Osmocote Plus), formulaciones NPK hidrosolubles (Solucat, Nitrifort, Bio-Fert 72, Triples 20-20-20), enraizantes (Razormin), bioestimulantes (Dalgin, Melaza) y correctores nutricionales (Calcio+Boro).  
  * *Fitosanitarios e Insecticidas:* Especificaciones de preparación por litro de agua (g/L y ml/L), principios activos, modo de acción y precauciones toxicológicas.  
  * *Modelado del Módulo de Laboratorio:* Fundamentación botánica para la parametrización de tareas de dosificación manual y cálculo automatizado de volumen en el tanque de mezcla.

***Estándares de implementación y accesibilidad de interfaces.***

* *Enlace directo:*  
  [JulioFlors/orchidium-project/app/src/components/ui/action-menu/README.md](https://github.com/JulioFlors/orchidium-project/blob/main/app/src/components/ui/action-menu/README.md)  
* *Contenido y alcance técnico:*  
  * *Jerarquía Estricta de Capas (Z-Index):* Escala normalizada desde z-0 (contenido base) hasta z-9999 (toasts prioritarios) para prevenir superposiciones visuales no deseadas.  
  * *Reglas de Aislamiento Gráfico:* Prohibición del uso de createPortal en menús de tarjeta y directivas para forzar aceleración por GPU (transform-gpu antialiased \[backface-visibility:hidden\]) para eliminar el parpadeo de texto (flicker) durante animaciones con Motion en Chromium.  
  * *Conformidad de Accesibilidad (WAI-ARIA):* Soporte de navegación por teclado mediante teclas de flecha arriba/abajo, escape y pérdida de foco (blur/Tab).

**Artefactos de orquestación y automatización.**

Tabla Ap-F2.  
*Artefactos de orquestación, automatización y configuración.*

| Artefacto / Archivo | Rol en el Servidor (VPS)  | Enlace en GitHub |
| :---: | :---: | :---: |
| docker-compose.yml | Orquestador maestro de la arquitectura contenerizada | [docker-compose.yml](https://github.com/JulioFlors/orchidium-project/blob/main/docker-compose.yml)  |
| deploy.sh | Automatización de despliegue continuo en producción | [deploy.sh](https://github.com/JulioFlors/orchidium-project/blob/main/deploy.sh)  |
| renew\_certs.sh | Renovación SSL/TLS con Certbot Docker y permisos | [renew\_certs.sh](https://github.com/JulioFlors/orchidium-project/blob/main/renew_certs.sh)  |
| .env.template | Plantilla de variables de entorno y guía de conexión | [.env.template](https://github.com/JulioFlors/orchidium-project/blob/main/.env.template)   |
| entrypoint.sh | Scripts de arranque con espera activa de bases de datos | [services/scheduler/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/entrypoint.sh)  |

***Manifiesto de orquestación contenerizada (docker-compose.yml).***

* *Enlace directo:* [JulioFlors/orchidium-project/docker-compose.yml](https://github.com/JulioFlors/orchidium-project/blob/main/docker-compose.yml)  
* *Contenido y decisiones de arquitectura:*  
  * *Desacoplamiento por Perfiles (profiles):*  
    * *Perfil local:* Despliega en la estación de desarrollo contenedores ligeros de PostgreSQL 17 (postgres-local), InfluxDB 3 (influxdb-local) y Mosquitto en puertos estándar (1883 y 9001), permitiendo la depuración local sin requerir conexión a internet.  
    * *Perfil cloud:* Gobierna la infraestructura de producción en el VPS bajo Ubuntu Server. Despliega PostgreSQL con canal seguro SSL obligatorio (puerto 5432), Mosquitto con puertos duales seguros (8883 bajo MQTTS para hardware ESP32 y 8884 bajo WSS con soporte de WebSockets para la app web en Vercel), InfluxDB 3 Core con TLS (puerto 8181), y los microservicios autónomos ingest, scheduler y weather-oracle.  
  * *Aislamiento y Redes Virtuales:* Redes Docker puente (bridge) que garantizan la comunicación inter-servicios mediante nombres de host internos (p. ej., postgres, mosquitto-local), evitando exponer sockets innecesarios a la red pública.  
  * *Persistencia de Volúmenes:* Mapeo de almacenamiento para los datos relacionales (/var/lib/postgresql/data), las series temporales de InfluxDB y los certificados criptográficos compartidos.

***Script de despliegue en servidor (deploy.sh).***

* *Enlace directo:* [JulioFlors/orchidium-project/deploy.sh](https://github.com/JulioFlors/orchidium-project/blob/main/deploy.sh)   
* *Contenido y flujo de ejecución en el VPS:*  
  * *Sincronización Segura del Código:* Ejecuta git fetch origin main y git reset \--hard origin/main, protegiendo de forma intacta los volúmenes de datos, certificados SSL y archivos de registro locales.  
  * *Construcción y Lanzamiento:* Ejecuta docker compose \--profile cloud build para compilar las imágenes optimizadas de los microservicios y levanta la pila con docker compose \--profile cloud up \-d \--remove-orphans.  
  * *Mantenimiento y Purga de Almacenamiento:* Ejecuta rutinas de limpieza automática mediante docker image prune \-a \-f y docker builder prune \-f, liberando espacio en disco al eliminar capas de construcción y versiones obsoletas de imágenes.  
  * *Directrices de Migración de Base de Datos:* Documenta los procedimientos de migración en producción delegados en el contenedor:  
    * docker compose exec scheduler npx prisma migrate deploy

***Automatización de certificados criptográficos SSL/TLS (renew\_certs.sh).***

* *Enlace directo:* [JulioFlors/orchidium-project/renew\_certs.sh](https://github.com/JulioFlors/orchidium-project/blob/main/renew_certs.sh)   
* *Contenido y relevancia para el hardware:*  
  * *Gestión de Dominios Múltiples:* Renueva y administra certificados Let's Encrypt mediante la imagen oficial certbot/certbot para los dominios mqtt.pristinoplant.com, vps.pristinoplant.com y n8n.pristinoplant.com.  
  * *Apertura y Cierre Automatizado de Firewall (UFW):* Detecta si el cortafuegos UFW está activo, abre temporalmente el puerto 80/tcp para el desafío standalone de Certbot y lo clausura inmediatamente al finalizar el proceso.  
  * *Optimización Criptográfica para Microcontroladores ESP32:* Resuelve la limitación de memoria RAM en el microcontrolador al momento del saludo TLS. Certbot genera cadenas completas (fullchain.pem) que desbordan el heap del ESP32; el script aísla y distribuye exclusivamente el certificado hoja (cert.pem) y la clave privada (privkey.pem) hacia el directorio de Mosquitto, fijando los permisos de usuario chown 1883:1883 y reiniciando el servicio para aplicar el cifrado sin saturar los nodos de campo.

***Plantilla de variables de entorno (.env.template).***

* *Enlace directo:* [JulioFlors/orchidium-project/.env.template](https://github.com/JulioFlors/orchidium-project/blob/main/.env.template)   
* *Contenido y guía operativa:*  
  * *Acceso y Administración del VPS:* Comandos documentados para conexión remota segura vía SSH (ssh root@ip, ssh root@vps.tu-dominio.com).  
  * *Almacenamiento de Medios en Cloudflare R2:* Claves de API (R2\_ACCESS\_KEY\_ID, R2\_SECRET\_ACCESS\_KEY), identificadores de cuenta y URLs públicas para la entrega de imágenes mediante CDN.  
  * *Autenticación Federada con Google OAuth 2.0:* Guía paso a paso para dar de alta las URIs de redireccionamiento autorizadas en Google Cloud Console tanto para desarrollo local, como para producción institucional.  
  * *Seguridad de Sesiones (Better Auth):* Generación de secretos criptográficos (BETTER\_AUTH\_SECRET) y configuración de la URL base canónica (BETTER\_AUTH\_URL=https\://pristinoplant.com).  
  * *Matriz de Credenciales MQTT por Roles:* Definición de usuarios y contraseñas diferenciadas con listas de control de acceso (ACL) para el microservicio de ingesta, el planificador (Scheduler), el nodo actuador y el frontend.  
  * *Persistencia Políglota:* Cadenas de conexión TCP para PostgreSQL local y en la nube (con pooling y unpooled para migraciones), junto a los tokens de autenticación de organización y buckets para InfluxDB 3\.

***Scripts de inicialización segura en microservicios ([entrypoint.sh](http://entrypoint.sh)).***

* *Enlace directo:*   
  * [services/scheduler/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/scheduler/entrypoint.sh)  
  * [services/ingest/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/ingest/entrypoint.sh)  
  * [services/weather-oracle/entrypoint.sh](https://github.com/JulioFlors/orchidium-project/blob/main/services/weather-oracle/entrypoint.sh)  
* *Contenido técnico:*  
  * *Espera Activa de Dependencias (Healthcheck Loops):* Implementa bucles de verificación mediante pg\_isready para suspender el inicio de las aplicaciones Node.js hasta que la base de datos relacional esté completamente receptiva.  
  * *Sondeo a InfluxDB 3:* Valida la respuesta HTTP del endpoint /api/v2/ping incorporando el encabezado de autorización criptográfica, evitando errores de inicialización y fallas en cascada al momento de levantar el servidor.

**Apéndice G \- Manual de Operación y Catálogo de Interfaces de Usuario**  
El presente apéndice constituye el manual de operación de la plataforma web de PristinoPlant. Su objetivo es guiar al usuario a través de la arquitectura funcional del sistema, presentando el flujo de operaciones asociado a cada una de sus rutas de navegación y las treinta y tres (33) interfaces que materializan la solución. La operación de la plataforma se organiza en cinco módulos principales:

1. ***Operaciones del Circuito Hidráulico y Riego Autónomo:*** Panel de control, gestión de colas, programador de rutinas y bitácora de auditoría histórica.  
2. ***Laboratorio y Dosificación Agronómica:*** Inventario de agroquímicos, planificador de recetas agroquímicas, programador de recetas y cronograma de dosificación.  
3. ***Catálogo Botánico Taxonómico e Inventario unívoco:*** Clasificación taxonómica, inventario unívoco de especímenes, seguimiento fenológico y conciliación de stock comercial.  
4. ***Telemetría y Monitoreo Ambiental:*** Proyección gráfica del microclima en tiempo real e histórico y análisis ecofisiológico por zonas.  
5. ***Comercio Electrónico y Gestión de Ventas:*** Portal público de la tienda botánica, selección de variantes vivas, checkout y conciliación de órdenes.

**Entorno de despliegue y acceso.**  
Para efectos de evaluación técnica y exploración interactiva, la solución se encuentra desplegada y disponible públicamente en producción bajo su dominio institucional oficial:

* *Portal Comercial y Tienda Botánica: *[**pristinoplant.com](https://pristinoplant.com)**  
* *Exploración Taxonómica y Catálogo Botánico:* [**pristinoplant.com/category/plants**](https://pristinoplant.com/category/plants)

A continuación, se exponen las interfaces del sistema (Figuras Ap-G1 a Ap-G33), agrupadas por módulo y documentadas según sus rutas y propósito funcional.  
 

**Operaciones del circuito hidráulico y riego autónomo.**  
Las interfaces de este bloque permiten al cultivador supervisar y gobernar la infraestructura electromecánica del invernadero (bomba de agua y electroválvulas), garantizando conmutaciones seguras mediante temporizadores locales de seguridad (fail-safe) y acuse de recibo bidireccional (ACK) vía MQTT.

***Centro de Control Manual Directo (/control).***  
La interfaz centraliza la conmutación inmediata de las cuatro líneas hidráulicas del orquideario: Línea 1 (Humidificación / Foggers), Línea 2 (Aspersión principal de mesas), Línea 3 (Humectación de suelo para enfriamiento pasivo) y Línea 4 (Dosificación agroquímica aislada). Cada línea cuenta con su tarjeta provista indicadores visuales para determinar si están activadas, deshabilitadas o procesando la conmutación del circuito. La operación manual tiene una duración por defecto de 5 min. El Nodo Actuador tiene como guarda local interrumpir la operación del circuito hidráulico ante la desconexión de red (Wifi/MQTT).

***Figura Ap-G1.*** Centro de Control Manual Directo de Actuadores Hidráulicos.

***Modal de advertencia y confirmación de agroquímicos (/control).***  
Dado que la manipulación de insumos fitosanitarios y fertilizantes concentrados exige rigurosas medidas de seguridad operacional, la conmutación de la Línea 4 requiere una confirmación interactiva explícita. El modal presenta al operador la lista de tareas de dosificación pendientes registradas en el laboratorio.

***Figura Ap-G2.*** Modal de Confirmación Linea de Agroquimicos

***Supervisión de cola de tareas y rutinas activas (/queue).***  
Esta pantalla supervisa en tiempo real las operaciones hídricas. Permite auditar las rutinas que se encuentran en ejecución inmediata, encoladas para los próximos minutos o diferidas temporalmente por el scheduler o el cultivador. Cada elemento visualiza la línea hidráulica involucrada, la duración programada, el origen del comando (manual o autónomo) y un menú desplegable para cancelación la rutina ingresando el motivo pertinente.

***Figura Ap-G3.*** Cola de Ejecución de Rutinas.

**Programador de rutinas recurrentes de riego (/schedules).**  
Permite establecer cronogramas automatizados periódicos de los circuitos hidráulicos mediante expresiones basadas en tiempo (Cron). El cultivador selecciona los días de la semana, la hora de inicio, la duración en minutos y la línea de riego a conmutar. Asimismo, la vista se encarga de validar que las rutinas no tengan problemas operativos entre ellas.

***Figura Ap-G4.*** Automatización de rutinas.

***Bitácora de auditoría histórica de operaciones (/history).***  
Registro cronológico inmutable de todas las conmutaciones y decisiones hídricas procesadas por el sistema. Cada tarjeta documenta la fecha y hora exacta, la línea hidráulica afectada, la duración efectiva de apertura, el operador o servicio emisor y el estado final de la tarea (Completada, Cancelada o Fallida). En caso de veto deliberativo, la interfaz detalla el motivo algorítmico específico.

***Figura Ap-G5.*** Bitácora de Operaciones y Registro de Vetos.

**Laboratorio y dosificación agronómica.**  
Transforma la formulación de tratamientos en un proceso metódico y escalable. El módulo gestiona un catálogo de insumos agroquímicos puros cuyas dosis se registran normalizadas por litro de agua, permitiendo formular mezclas compuestas para cualquier capacidad hídrica. A partir de estas recetas de nutrición foliar y fitosanidad, el sistema estructura ciclos rotativos anti-resistencia, automatiza su despacho hidráulico y audita el avance mediante un cronograma proyectado de seguimiento para rutinas manuales y automatizadas.

***Catálogo de insumos agroquímicos (/supplies).***  
Gestiona el catálogo de insumos agroquímicos. Para garantizar escalabilidad ante cualquier volumen de preparación, las dosis base se registran normalizadas por litro de agua.

***Figura Ap-G6.*** Inventario de Insumos Agroquímicos.

***Configuración de programas de agroquímicos rotativos (/recipes).***  
Estructura planes agronómicos secuenciales organizados en ciclos rotativos para su automatización.

***Figura Ap-G7.*** Asistente de Formulación de Planes Agroquímicos.

***Automatización de Rutinas de Dosificación Manual (dosing-schedules).***  
Permite automatizar la proyección de la dosificación manual de los planes agronómicos mediante expresiones basadas en tiempo (Cron). El cultivador selecciona los días de la semana, la hora de inicio y el programa a aplicar. 

***Figura Ap-G8.*** Rutinas de Dosificación Manual de Agronómicos.

***Agenda proyectada y programación de tratamientos (/dosing).***  
Interfaz de seguimiento para dosificación manual y automatizada, homóloga a las vistas de cola (/queue) e histórico (/history) del circuito hidráulico. Mediante un cronograma interactivo, supervisa las fechas y horas de aplicación de cada tratamiento proyectado, permitiendo crear aplicaciones independientes a los programas automatizados y permitiendo auditar el estado de cada rutina (pendiente, en espera, completada, cancelada, expirada).

*Figura Ap-G9.* Agenda Proyectada y Programación de Dosificación.

***Figura Ap-G10.*** Estados de las Rutinas de Dosificación Manual.

**Catálogo botánico taxonómico e inventario unívoco.**  
Este módulo materializa la individualización de cada ejemplar en el orquideario mediante el modelo de gemelos digitales, vinculando la taxonomía botánica, el tamaño de maceta, la trazabilidad fenológica de floración y la disponibilidad comercial en tienda.

***Catálogo taxonómico de especies botánicas (/catalog).***  
Organiza la colección de especies en una estructura jerárquica agrupada por Tipo de Planta y seccionada por bloques de género. Cada bloque de género incluye un menú contextual de administración para editar su denominación o eliminarlo de forma protegida (con validación de seguridad que bloquea la acción si posee especies hijas asociadas).

***Figura Ap-G11.*** Catálogo Taxonómico de Especies Botánicas.

***Figura Ap-G12.*** Modales de Creación Taxonómica.

***Formulario edición taxonómica de especie (/catalog/\[slug\]).***  
En los modales presentados en la **Figura Ap-G12** se registra la información mínima para crear una especie, dicho modal nos redirige a esta interfaz de Gestión Taxonómica e Imágenes presentada en la ***Figura Ap-G13***, en esta interfaz optimizará las imágenes al formato WebP y las cargará a un servidor R2 de cloudflare.

***Figura Ap-G13.*** Gestión Taxonómica e Imágenes.

***Inventario unívoco por ejemplar (/stock).***  
Interfaz de seguimiento de activos biológicos en cultivo. Agrupa las especies registradas mostrando para cada una el total acumulado de ejemplares.

***Figura Ap-G14.*** Product Grid del Inventario Unívoco.

***Ficha técnica de espécimen y bitácora fenológica (/stock/\[slug\]).***  
Ficha técnica y operacional dedicada al inventario de una especie específica. Integra un panel de analítica fenológica que consolida el benchmark histórico de floración (duración media de la flor en días, frecuencia anual y meses típicos de inflorescencia), el gestor de variantes comerciales por tamaño de contenedor (PotSize: Nro 5, Nro 7, Nro 10 y Nro 14\) con sus precios en USD, y la relación unívoca de plantas físicas en zonas de cultivo.

***Figura Ap-G15.*** Ficha Técnica de Espécimen y Bitácora Fenológica.

***Gestión de la interfaz del Landing Page (/shop-manager).***

***Figura Ap-G16.*** Configurar Heros Sliders del Landing Page.

***Figura Ap-G17.*** Configurar Categorías del Landing Page.

***Gestionar solicitudes y lista de espera de la tienda (/requests).***  
Permite administrar el interés de compra de clientes sobre especies botánicas temporalmente agotadas. Centraliza los registros de solicitud vinculando el número de teléfono del comprador con la especie y tamaño de maceta de interés, permitiendo notificar a los clientes tan pronto como nuevos ejemplares físicos de dicha especie alcanzan el estado comercial disponible.

***Figura Ap-G18.*** Interfaz de Solicitudes de Stock.

***Figura Ap-G19.*** Mensaje de Notificación para Clientes.

**Telemetría y monitoreo ambiental.**  
Estas vistas representan el núcleo de percepción del microclima, exhibiendo las magnitudes físicas transmitidas por las estaciones EMA Exterior e Interior, las derivadas analíticas y los indicadores psicrométricos de estrés vegetal.

***Dashboard telemétrico central en tiempo real (/monitoring).***  
Panel principal de supervisión microclimática del orquideario. Exhibe tarjetas de lectura instantánea que presentan las condiciones de intemperie (EMA Exterior) o las condiciones bajo malla sombra (EMA Interior) según el nodo seleccionado.

***Figura Ap-G20.*** Dashboard Telemétrico de Supervisión Microclimática en Tiempo Real.

***Figura Ap-G21.*** Telemetría Procesada de iluminancia EMA-Exterior.

***Figura Ap-G22.*** Telemetría Cruda de Temperatura EMA-Exterior.

***Análisis ecofisiológico e indicadores de microclima por zona (/botanics).***  
Interfaz de analítica agronómica avanzada que sintetiza el comportamiento ecofisiológico del cultivo. Evalúa la integral higrométrica diaria, las horas acumuladas bajo estrés térmico, los niveles medios de VPD y la radiación solar acumulada.

***Figura Ap-G23.*** Dashboard de Analítica Agronómica EMA-Exterior.

***Figura Ap-G24.*** Interfaz DIF Térmico EMA-Interior

***Monitor del oráculo meteorológico e inferencia de lluvia (/weather-oracle).***

***Figura Ap-G25.*** Oráculo Meteorológico.

**Comercio electrónico y gestión comercial.**  
Este bloque comprende la experiencia comercial del cliente externo en la tienda digital y las herramientas administrativas del orquideario para conciliar pagos multimoneda y coordinar despachos.

***Catálogo público de la tienda botánica (/category/plants).***  
Vista principal de exploración para el cliente final. Dispone de una cuadrícula de productos responsiva con fotografías botánicas de alta resolución, nombre científico, nombre común y rango de precios. Incorpora un motor de búsqueda por texto y filtros dinámicos por género taxonómico.

***Figura Ap-G26**.* Sección de Floración.

***Ficha comercial de producto botánico y selector de maceta (/plant/\[slug\]).***  
Ficha técnica y comercial de la especie. Presenta la galería de imágenes, ficha botánica descriptiva, consejos de cultivo y un selector de tamaño de maceta interactivo. Al seleccionar el contenedor deseado, la vista actualiza en tiempo real el precio y la disponibilidad, deshabilitando la opción de compra si no cuenta con ejemplares físicos disponibles.

***Figura Ap-G27.*** Detalle de Producto.

***Carrito de compras interactivo (/cart).***  
Permite al comprador auditar los especímenes seleccionados, modificar las cantidades respetando los límites de stock real, visualizar los subtotales en dólares o bolívares (alterna la moneda desde un toggle en el sidebar) y proceder al cierre de la compra. Dispone de almacenamiento persistente en el navegador para preservar los productos durante la sesión de compra.

***Figura Ap-G28**.* Carrito de Compras.

***Proceso de pago y datos de entrega (/checkout).***  
Formulario de formalización de compra donde el usuario suministra sus datos de facturación y selecciona la modalidad de entrega. Asimismo, permite seleccionar el método de pago preferente.

***Figura Ap-G29.*** Formulario de Formalización de Pedido.

***Figura Ap-G30**.* Revisión del Carrito y Facturación.

***Figura Ap-G31**.* Pedido Consolidado.

***Conciliación de órdenes y registro de venta directa (/orders).***  
Panel administrativo para el cultivador. Permite auditar las órdenes entrantes, verificar los comprobantes de pago suministrados por los clientes y transicionar el estado del pedido. Al confirmarse el despacho, la plataforma descuenta automáticamente las macetas físicas correspondientes en la matriz de inventario. Adicionalmente, incluye un módulo de venta directa en mostrador (/orders/sales) para registrar compras presenciales en el invernadero.

***Figura Ap-G32**.* Conciliación Administrativa de Órdenes.

***Figura Ap-G33.*** Historial de Ventas.

**Apéndice H \- Construcción de la Infraestructura en Campo**  
El presente apéndice documenta visualmente la construcción, montaje y despliegue físico de la infraestructura de borde en el orquideario. A través de una secuencia lógica de imágenes, se ilustra la ejecución real de las obras en campo, los retos electromecánicos resueltos y los rediseños que complementan lo expuesto en el informe.

**Prototipado evolutivo del Nodo EMA-Interior.**

***Figura Ap-H1.*** Primera Prueba en Exterior.

***Figura Ap-H2.*** Controlador de Carga de Baterías de Litio.

***Figura Ap-H3.*** Adecuaciones del Primer Prototipo.

***Figura Ap-H4.*** Montaje del Primer Prototipo

***Figura Ap-H5.*** Case del Primer Prototipo.

***Figura Ap-H6.*** Visualización del BH1750.

***Figura Ap-H7.*** EMA-Interior Primer Prototipo.

***Figura Ap-H8.*** EMA-Interior Segunda Modelación 3D.

***Figura Ap-H9.*** Piezas Case Protector Vista 1\.

***Figura Ap-H10.*** Piezas Case Protector Vista 2\.

***Figura Ap-H11.*** Cuerpo de la Garita.

***Figura Ap-H12.*** Base de la Garita.

***Figura Ap-H13.*** Adecuación para el BH1750.

**Prototipado evolutivo del Nodo EMA-Exterior.**

***Figura Ap-H14.*** Adecuación de Borneras EMA-Exterior.

***Figura Ap-H15.*** Instalación de Infraestructura EMA-Exterior.

***Figura Ap-H16.*** Adecuación Base Bombillo BH1750.

***Figura Ap-H17.*** Instalación DTH22 en Garita de Lluvia.

***Figura Ap-H18.*** Cableado del EMA-Exterior.