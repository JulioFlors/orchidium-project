# **Capitulo III. Marco Metodológico** 

Para el desarrollo del proyecto se emplearon dos enfoques metodológicos complementarios. Por una parte, la construcción de la estación meteorológica prototipo se guió por una metodología basada en prototipos, que permitió iterar sobre el diseño físico, la selección de sensores y el montaje hasta obtener una configuración estable y adecuada para el contexto escolar. Por otra parte, la programación de la estación y de la plataforma de software asociada se llevó a cabo mediante una metodología basada en el modelo incremental, organizando el desarrollo en incrementos sucesivos que incorporaron, probaron y perfeccionaron las funcionalidades del IDE y de la integración con la estación. 

El modelo de desarrollo basado en prototipos plantea la construcción de versiones preliminares del sistema para explorar alternativas de solución y aclarar requerimientos antes de consolidar un diseño final. Pressman señala que con frecuencia _«un cliente defina un conjunto de objetivos generales para el software, pero que no identifique los requerimientos detallados»_ (Pressman, 2010, p. 37), de modo que el prototipo funciona como un medio para hacer visibles esas necesidades y reducir la incertidumbre. Aunque este enfoque se presenta originalmente para software, la lógica de construcción y refinamiento sucesivo también puede aplicarse a sistemas físicos, como la estación meteorológica de este proyecto. 

Por otra parte, el modelo incremental se apoya en las actividades estructurales del proceso (Comunicación, Planeación, Modelado, Construcción y Despliegue), pero las organiza en incrementos sucesivos con retroalimentación: se comunica y planifica el objetivo de cada incremento, se modela y construye la funcionalidad priorizada, se despliega a los interesados para obtener feedback y se ajustan requisitos y plan para la siguiente iteración (Pressman, 2010, p. 39; p. 37). En nuestro caso, el enfoque incremental permitió obtener evidencia temprana sobre tecnologías y formas de interacción, al mismo tiempo que se consolidaba la arquitectura de la plataforma a través de incrementos funcionales claramente delimitados. Este modelo fue utilizado para la programación de la estación meteorológica. 

# **Tipo de Investigación** 

El presente trabajo se enmarca dentro de una investigación de tipo proyectiva, la cual, según Hurtado (2000), tiene como objetivo principal el diseño y desarrollo de propuestas innovadoras para resolver problemas específicos. Este tipo de investigación se caracteriza por su 

22 

enfoque práctico y aplicado, donde se busca crear soluciones viables basadas en un análisis riguroso de las necesidades y contextos particulares. Hurtado (2000) señala que: 

_"La investigación proyectiva se orienta hacia la creación de modelos, prototipos o sistemas que respondan a demandas concretas, ya sea en el ámbito tecnológico, educativo o social. Su valor radica en la capacidad de transformar el conocimiento teórico en aplicaciones prácticas que beneficien a la sociedad" (p. 325)._ 

En este sentido, el desarrollo de una plataforma para la construcción y programación de estaciones meteorológicas orientadas a estudiantes de educación básica se ajusta perfectamente a este enfoque, ya que busca ofrecer una solución educativa innovadora que fomente el pensamiento computacional y la comprensión de conceptos meteorológicos en los estudiantes. 

Además, este proyecto puede clasificarse como un proyecto factible, definido por la UPEL (2003) como una propuesta que combina la investigación documental y de campo para diseñar un modelo operativo viable. En este caso, la investigación se sustenta en un análisis teórico de los conceptos de pensamiento computacional y meteorología, así como en la implementación práctica de un prototipo funcional que será validado en un contexto educativo real. 

# **Técnicas e Instrumentos de Recolección de Datos** 

Para el desarrollo de esta investigación, se emplearon diversas técnicas e instrumentos de recolección de datos, siguiendo las recomendaciones de autores como Hernández, Fernández y Baptista (2010). Estas técnicas permitieron recopilar información relevante tanto para el diseño de la plataforma como para la validación de su funcionalidad. 

La revisión documental fue una técnica fundamental en la fase inicial del proyecto. Según Hernández et al. (2010), esta técnica implica "la consulta y análisis de bibliografía especializada, artículos científicos, informes técnicos y otros materiales que aporten información relevante para el estudio" (p. 53). En este caso, se revisaron fuentes relacionadas con el pensamiento computacional, la meteorología educativa y las tecnologías IoT , utilizando instrumentos como bases de datos académicas (Google Scholar, Scopus) y software de gestión bibliográfica (Zotero, Mendeley). 

La metodología incremental consta de cinco fases: 

# **Fases de la Metodología Incremental** 

**Comunicación y análisis de requerimientos generales.** En esta fase inicial se realiza la interacción con los interesados para identificar los objetivos principales del sistema. Se 

23 

determinan los requerimientos globales y se priorizan aquellos que resultan esenciales para los primeros incrementos. La comunicación constante es clave para que los usuarios y el equipo de desarrollo compartan una visión clara del producto. 

**Planeación del incremento.** Una vez establecidos los requerimientos, se procede a planificar el primer incremento. Esto incluye definir el alcance, las actividades, los recursos y el cronograma necesarios. La planeación no se limita al primer ciclo, sino que se actualiza y refina en cada incremento con base en la retroalimentación recibida. 

**Modelado del incremento (análisis y diseño).** En esta etapa se lleva a cabo el modelado de los elementos seleccionados: 

- **Análisis:** se especifican las funciones que debe cumplir el incremento, delimitando cómo interactuará con los usuarios y con otros componentes del sistema. 

- **Diseño:** se define la arquitectura inicial, se modelan los datos, los procesos y las interfaces, asegurando que la solución sea escalable para integrar incrementos posteriores. 

**Construcción (codificación y pruebas).** El incremento planificado se implementa a través de la programación de las funcionalidades diseñadas. Posteriormente, se aplican pruebas de unidad e integración para garantizar la calidad y el correcto funcionamiento del software. Cada incremento debe ser probado de forma independiente antes de integrarse al producto global. 

**Despliegue del incremento y retroalimentación.** Una vez completada la construcción, el incremento se entrega a los usuarios para su evaluación. Aquí ocurre la retroalimentación, fundamental para validar si los requerimientos fueron satisfechos, detectar errores o identificar necesidades adicionales. Al finalizar el despliegue se recopila la información para preparar el siguiente incremento. 

Las fases del modelo incremental se pueden ver con más detalle en la Figura 2. 

24 



<!-- Start of picture text -->
Modelo Incremental<br>ee<br>5 | Construccion (Cédigo, Prueba)<br>| a ovo omsnrenin<br>33 Incremento #1 sonoEntrega delcements<br>&<br>: a a<br>Tiempo del Calendario del Proyecto:<br><!-- End of picture text -->

_Figura 2. Modelo incremental del proceso de desarrollo de software. Nota. tomado de “Modelo incremental”, de. Ortiz, 2012, https://iswudistrital.blogspot.com/2012/09/ingenieria-de-software-i.html._ 

# **Fases del Modelo Basado en Prototipos.** 

En particular, Pressman describe que el “paradigma de hacer prototipos comienza con comunicación” (Pressman, 2010, p. 37), donde se definen objetivos y restricciones con los participantes, y luego se avanza en ciclos de diseño rápido, construcción y evaluación con retroalimentación. Las fases que describe son: 

**Comunicación y análisis de requerimientos.** En esta fase se debe interactuar con los interesados para identificar las necesidades principales del sistema físico: qué variables se deben medir, en qué contexto se va a utilizar, qué restricciones de seguridad, robustez y costo existen. El objetivo es aclarar el problema antes de definir la solución técnica. 

**Planificación y diseño del prototipo.** A partir de los requerimientos, se debe elaborar un plan inicial del prototipo: seleccionar de forma preliminar sensores, tarjetas de control, conectores y una disposición física básica. En esta etapa conviene definir esquemas de conexión y criterios de evaluación del prototipo, siguiendo la lógica de “plan rápido” y “diseño/modelado rápido” asociada al paradigma de prototipos. 

**Construcción del prototipo.** En la fase de construcción se deben ensamblar los componentes seleccionados, realizar las conexiones eléctricas y montar los sensores sobre una estructura provisional que permita verificar el funcionamiento básico del sistema. 

25 

**Evaluación y retroalimentación.** Una vez disponible el prototipo, se deben ejecutar pruebas de funcionamiento y uso: revisar la calidad de las lecturas, la estabilidad de las conexiones, la facilidad de montaje y mantenimiento, así como posibles riesgos en el contexto de aplicación. 

**Refinamiento y consolidación del diseño.** Con base en la retroalimentación, se deben ajustar los aspectos físicos y técnicos del prototipo: reorganizar cableado, mejorar conectores, reforzar la estructura y optimizar la ubicación de los sensores. Estos ciclos de refinamiento se repiten hasta consolidar un prototipo estable, robusto y manejable, preparado para su integración con otras plataformas (por ejemplo, el entorno de programación) y alineado con los requerimientos establecidos. 

# **Comparación de Modelos de Desarrollo Incremental, Espiral y Evolutiva** 

_Tabla 1. Cuadro comparativo de modelos de desarrollo._ 

|**Aspecto**|**Modelo**<br>**Incremental**|**Modelo Espiral**|**Enfoque evolutivo**|
|---|---|---|---|
|**Definición**|Proceso<br>de<br>desarrollo en el que<br>el<br>software<br>se<br>construye en una<br>serie de incrementos<br>funcionales,<br>cada<br>uno entregando una<br>versión parcial pero<br>operativa.|Modelo iterativo que integra<br>actividades<br>de<br>análisis,<br>diseño y construcción, con un<br>fuerte énfasis en la gestión y<br>mitigación<br>de<br>riesgos<br>(Boehm, 1988).|Enfoque<br>que<br>crea<br>prototipos<br>rápidos<br>(baja/alta fidelidad) para explorar y validar<br>requisitos/soluciones con usuarios; pueden<br>ser desechables o evolutivos.|
|**Origen**|Propuesto<br>como<br>alternativa<br>al<br>modelo en cascada<br>para reducir riesgos<br>y entregar resultados<br>parciales (Pressman,<br>2010).|Introducido por Barry Boehm<br>en 1988 como un modelo<br>evolutivo enfocado en el<br>control<br>de<br>riesgos<br>en<br>proyectos complejos.|Surge en los 70–80 como respuesta a la<br>rigidez del<br>modelo<br>cascada y a la<br>incertidumbre<br>de<br>requisitos;<br>luego<br>se<br>sistematiza en la literatura de ingeniería de<br>software.|
|**Enfoque**<br>**principal**|Entregas<br>funcionales rápidas<br>y continuas de partes<br>del sistema.|Identificación temprana y<br>control de riesgos en cada<br>ciclo de desarrollo.|Aprendizaje temprano y retroalimentación<br>continua<br>para<br>reducir<br>incertidumbre<br>(especialmente en UX y requisitos).|
|**Estructura**|Secuencia de ciclos:<br>análisis → diseño →<br>implementación →<br>pruebas,<br>repetidos<br>en cada incremento.|Cada espiral incluye cuatro<br>fases: planificación, análisis<br>de<br>riesgos,<br>desarrollo<br>y<br>evaluación.|Ciclos cortos construir → evaluar con<br>usuarios → recoger feedback → refinar.<br>Variantes: desechable y evolutivo.|
|**Riesgos**|Aborda riesgos de<br>forma<br>indirecta<br>mediante<br>entregas<br>sucesivas<br>y<br>retroalimentación<br>del usuario.|Se centra explícitamente en<br>identificar, analizar y mitigar<br>riesgos desde el inicio y en<br>cada ciclo.|Confundir prototipo con producto (deuda<br>técnica), descuidar no funcionales y dejar<br>cobertura incompleta.|



26 

|**Aspecto**|**Modelo**<br>**Incremental**||**Modelo Espiral**|**Enfoque evolutivo**|
|---|---|---|---|---|
|**Flexibilidad**|Alta, porque<br>incorporar re<br>adicionales<br>incrementos<br>posteriores.|permite<br>quisitos<br>en<br>|Muy alta, ya que los cambios<br>se consideran parte natural<br>del proceso.|Muy alta: permite explorar alternativas y<br>pivotar; requiere disciplina en trazabilidad y<br>documentación.|
|**Tiempo de**<br>**entrega**|Relativamen<br>dado<br>que<br>incremento<br>un<br>p<br>operativo.|te corto,<br> <br>cada<br>entrega<br>roducto|Puede ser más prolongado<br>debido al esfuerzo invertido<br>en análisis de riesgos y<br>planificación detallada.|Muy corto para demostrables y validación;<br>puede alargarse si se pretende reutilizar sin<br>refactorizar.|
|**Costo**|Generalment<br>menor, ya<br>requiere<br>exhaustivos<br>riesgos<br>en<br>etapa.|e<br>que no<br>análisis<br>de<br> <br>cada|Puede ser mayor, ya que la<br>gestión de riesgos implica<br>más recursos y tiempo.|Bajo al inicio; riesgo de retrabajo que<br>aumenta el costo total si se escala sin<br>rediseño. Moderado con buenas prácticas.|
|**Aplicación**<br>**ideal**|Proyectos m<br>o<br>grandes<br>requisitos g<br>claros,<br>per<br>detalles que<br>evolucionar.|edianos<br> <br>con<br>enerales<br>o<br>con<br>pueden<br>|Proyectos grandes, costosos y<br>de alta complejidad, donde la<br>gestión de riesgos es crítica.|Requisitos inciertos/cambiantes, exploración<br>de interfaz/experiencia, innovación/POC e<br>integración HW/SW (IoT).|
|**Ejemplo de**<br>**uso**|Desarrollo<br>aplicaciones<br>modulares,<br>de<br>infor<br>software edu|de<br> <br>sistemas<br>mación,<br>cativo.|Sistemas<br>críticos<br>como<br>aeroespaciales, militares o<br>financieros, donde fallar es<br>muy costoso.|MVP de apps, prototipos de interfaces<br>educativas, POC de sensores/telemetría<br>(estación meteorológica).|



Aquí se presenta una matriz de decisión para comparar los enfoques Prototipos, Incremental y Espiral con base en criterios alineados al proyecto (contexto educativo/IoT, necesidad de entregas tempranas, flexibilidad ante cambios, gestión de riesgos, costo y complejidad de implementación). Cada criterio tiene un peso (la suma es 1) y cada modelo se califica de 1 a 5 (5 = mayor conveniencia). El puntaje total resulta de multiplicar cada calificación por su peso y sumar los resultados. La Tabla 2 resume los valores asignados y sustenta la elección metodológica que se expone al final de esta sección. 

_Tabla 2. . Criterios a evaluar de las metodologías_ 

|**Modelo**|**Ajuste 0.25**|**Entregas**<br>**0.20**|**Flexibilidad**<br>**0.20**|**Riesgos 0.15**|**Recursos**<br>**0.10**|**Complejidad**<br>**0.10**|**Total**|
|---|---|---|---|---|---|---|---|
|**Incremental**|5 (1.25)|5 (1.00)|4 (0.80)|3 (0.45)|4 (0.40)|4 (0.40)|4.30|
|**Espiral**|3 (0.75)|3 (0.60)|5 (1.00)|5 (0.75)|2 (0.20)|2 (0.20)|3.50|
|**Prototipos**|5 (1.25)|5 (1.00)|5 (1.00)|2 (0.30)|3 (0.30)|4 (0.40)|4.25|



27 

Hay dos alternativas que resaltan claramente en la matriz de decisión. Aunque el modelo de Prototipos (4,25) obtiene la mayor puntuación global y resulta especialmente adecuado para la fase inicial de exploración y viabilidad de hardware y comunicación, en este proyecto dicho enfoque se emplea para la construcción preliminar de la estación meteorológica y la verificación de sus componentes físicos. No obstante, para la presente investigación se decidió adoptar una metodología basada en el modelo incremental como marco principal para la construcción y validación sistemática del producto software, mediante entregas funcionales sucesivas. 

