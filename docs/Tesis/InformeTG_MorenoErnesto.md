

<!-- Start of picture text -->
UCAB ESCUELAINFORMATICADE INGENIERIA- GUAYANA<br><!-- End of picture text -->

Universidad Católica Andrés Bello 

Facultad de Ingeniería 

Escuela de Ingeniera Informática Guayana 

# **Plataforma para Facilitar la Construcción y Programación de Estaciones Meteorológicas Orientadas a Estudiantes de Educación Básica.** 

Trabajo de Grado 

presentado ante la 

# **Universidad Católica Andrés Bello** 

como parte de los requisitos para optar al título de 

# **Ingeniero en Informática** 

Realizado por  Moreno González, Ernesto Antonio 

Tutor Académico 

Lárez Mata, Jesús José 

Fecha 

Noviembre, 2025 



<!-- Start of picture text -->
Hw Prolongacién Av, Aléntico. Puerto Ordaz. Periodo: 202615<br>aiyGy Telf.: (0286) 600-02-36 Fax: (0286) 600-02-36 NRC: 17307<br>. Facultad de Ingenieria<br>acs Escuela de Ing. Informatica<br>ACTA DE TRABAJO DE GRADO<br>Ciudad Guayana, 24 de Noviembre de 2025<br>Los suscritos profesores; Jesus Larez Mata, Franklin Bello Castillo y Romel Silva Bricefio,<br>integrantes del jurado calificador del Trabajo de Grado intitulado "Plataforma para Construccién y<br>Programacién de Estaciones Meteorolégicas Orientadas a Estudiantes de Educacién Basica",<br>elaborado por el bachiller Moreno Gonzalez, Ernesto Antonio, cédula de identidad N° 27836463,<br>para optar al Titulo de Ingeniero en Informatica, certifican que, habiendo examinado dicho trabajo,<br>consideramos que es merecedor de la calificacion de<br>—__spiecinusye (19) puntos.<br>i Measjon bonorifica per svagotle dnnevader en ef d56 de Leenelegla<br>Le bate Flow pera peteuenr fa edveawen fdacca<br>us Larez Mata<br>ore Zr Le<br>eo “ot<br>s 2 a<br>is)<br>Franklin Bello Castillo el Bricefio<br>% ey,<br>Leesant 27<br>Secretaria General<br>ce Escuela<br>‘terete por: belloca: Fecha y Mora de impresién 26°112025 122229 m Pace 1401<br><!-- End of picture text -->

ii 

# **Dedicatoria** 

_A quien siempre fue mi ejemplo a seguir,_ **_Antonio González Barcia_** _gracias por todo lo que hiciste por mí. Espero algún día poder contarte todo lo bueno que me ha pasado. Te dedico este trabajo y todos mis logros siempre, abuelo._ 

iii 

# **Agradecimientos** 

A mi madre, que desde el primer día creyó en mí, jamás me soltó la mano y nunca dejo darme ánimo, confianza, valentía y amor. 

A mi familia, que siempre estuvieron para mi cuando los necesitaba, sin ellos esto no lo hubiera podido materializar. 

A Said, a quien fue como mi padre desde que lo conozco y nunca dejo de enseñarme ni dejo de inspirarme a mejorar cada día. 

A los profesores Franklin Bello y Luz Medina, que fueron claves en mi vida académica y sin su apoyo, enseñanzas, sabiduría y paciencia no estuviera ni a mitad de este camino. 

A mi tutor, Jesús Laréz, por la paciencia y compromiso conmigo y con este trabajo. 

A Andrés, que durante casi la totalidad del desarrollo de este proyecto siempre brindó su apoyo incondicional. Gracias por tantos conocimientos mi amigo costeño. 

A mis amigos de la universidad, Angelymar, Cesar, Noel, Hoffman, Roberson, Angie, hicieron que esta etapa fuera con diferencia la que más disfrute de mi vida. Especialmente darle las gracias a mi compañero de armas durante más de la mitad de la carrera y un gran amigo que me llevare siempre, Arturo Canga. 

A mi entrenador personal, Ken, sin su experiencia, disciplina y paciencia no hubiera podido alcanzar este nivel en la vida, siempre es necesario mantener un balance de mente, cuerpo y alma. Jamás lo hubiera podido alcanzar sin todo lo que me has enseñado. 

A mis entrenadores de tenis de mesa, Hiraldes Ortiz y Carlos Calderón, sin sus enseñanzas en la disciplina que más me apasiona y la cual puedo practicar a un gran nivel. Me enseñaron disciplina, coordinación, esfuerzo y sobre todo perseverancia. 

iv 

# **Índice de contenido** 

|Dedicatoria<br>……………………………………………………………………………….ii|
|---|
|Agradecimientos ....................................................................................................................iv|
|Índice de contenido ................................................................................................................. v|
|Índice de Tablas .....................................................................................................................vi|
|Índice de Figuras .................................................................................................................. vii|
|Resumen<br>……………………………………………………………………………..ix|
|Introducción ……………………………………………………………………………….1|
|Capitulo I. El Problema........................................................................................................... 2|
|Objetivo General ................................................................................................................. 6|
|Objetivos Específicos .......................................................................................................... 6|
|Capitulo II. Marco Teórico ................................................................................................... 10|
|Antecedentes ..................................................................................................................... 10|
|Bases Teóricas ................................................................................................................... 14|
|Capitulo III. Marco Metodológico ........................................................................................ 21|
|Tipo de Investigación ........................................................................................................ 21|
|Técnicas e Instrumentos de Recolección de Datos ........................................................... 22|
|Capítulo IV. Desarrollo y Resultados ................................................................................... 28|
|Selección de Componentes................................................................................................ 37|
|Construcción (ensamblaje y conexión) ............................................................................. 39|
|Pruebas de Funcionamiento. ............................................................................................. 40|
|Entorno De Desarrollo ...................................................................................................... 40|
|Desarrollo del Entorno de Programación .......................................................................... 41|
|Validación ......................................................................................................................... 63|
|Capítulo V. Conclusiones. .................................................................................................... 64|
|Recomendaciones .............................................................................................................. 65|
|Referencias Bibliográficas .................................................................................................... 66|
|Apéndices<br>………………………………………………………………………………71|



v 

# **Índice de Tablas** 

|Tabla 1.|Cuadro comparativo de modelos de desarrollo. ............................................ 25|
|---|---|
|Tabla 2.|. Criterios a evaluar de las metodologías ...................................................... 26|
|Tabla 3.|Tecnologías para estaciones meteorológicas para fines educativos. ............ 30|
|Tabla 4.|Piezas, sensores y actuadores utilizados. ...................................................... 36|
|Tabla 5.|Plan de pruebas y resultados obtenidos. ....................................................... 61|



vi 

# **Índice de Figuras** 

|Figura 1.|Tarjeta BBC Micro:bit y pines de entrada/salida. ......................................... 19|
|---|---|
|Figura 2.|Modelo incremental del proceso de desarrollo de software. ......................... 24|
|Figura 3.|Diagrama de conexiones de la Iot:Bit y sensores. ........................................ 32|
|Figura 4.|Weather:bit Kit by SparkFun. ....................................................................... 38|
|Figura 5.|Kit Elecfreaks Smart Science micro:bit IoT Sensors. ................................... 38|
|Figura 6.|Estación meteorología weather:bit ensamblada. ........................................... 39|
|Figura 7.|Conexión estación-weather:bit...................................................................... 39|
|Figura 8.|Diseño de la primera Arquitectura del Sistema. ........................................... 43|
|Figura 9.|Código en Makecode para hacer la conexión con ThingSpeak. ................... 44|
|Figura 10.|Diagrama de humedad relativa en ThingSpeak. ........................................... 45|
|Figura 11.|Primera visualización de los datos de ThingSpeak. ...................................... 45|
|Figura 12.|Diseño del canva para el entorno de desarrollo. ........................................... 46|
|Figura 13.|Aplicación web del entorno de desarrollo. ................................................... 47|
|Figura 14.|Arquitectura del sistema con NodeRed......................................................... 48|
|Figura 15.|Datos entraste en bróker Mosquitto. ............................................................. 49|
|Figura 16.|Datos de Influx y Node-RED ........................................................................ 49|
|Figura 17.|Micro:Bits conectadas por protocolo serial. ................................................. 51|
|Figura 18.|Humedad relativa enviada por puente MQTT .............................................. 52|
|Figura 19.|Conexiones y suscripciones al bróker vía portal de EMQX. ........................ 54|
|Figura 20.|Arquitectura final del sistema. ...................................................................... 55|
|Figura 21.|Resultado de conexión Nodo temperatura. ................................................... 56|
|Figura 22.|Humedad relativa en el dashboard. ............................................................... 56|
|Figura 23.|Nodo Display ................................................................................................ 58|
|Figura 24.|Pantalla OLED con mensaje enviado desde el IDE. ..................................... 58|
|Figura 25.|Zona de desarrollo “DevZone” ..................................................................... 60|
|Figura 26.|Gráficos de variables climáticas seleccionadas. ........................................... 60|
|Figura Ap-A1.|Nodos de tipo sensor .................................................................................... 71|
|Figura Ap-A2.|Nodos operadores (esperando por la conexión con un nodo de tipo sensor)72|
|Figura Ap-A3.|Nodo cloud (desconectado): ......................................................................... 72|
|Figura Ap-A4.|Nodos sensores conectados a Nodo cloud .................................................... 73|



vii 

|Figura Ap-A5. Nodos sensores, operadores y cloud conectados entre sí. ............................ 73|
|---|
|Figura Ap-A6. Primer diseño de la toolbox .......................................................................... 74|
|Figura Ap-A7. Segundo diseño de la toolbox ....................................................................... 75|
|Figura Ap-B1. Sensor de partículas ...................................................................................... 76|
|Figura Ap-B2. BME280........................................................................................................ 76|
|Figura Ap-B3. Micro: Bit con Iot: Bit .................................................................................. 77|
|Figura Ap-B4. Velata ............................................................................................................ 78|
|Figura Ap-B5. Anemómetro ................................................................................................. 79|
|Figura Ap-B6. Pluviómetro .................................................................................................. 80|
|Figura Ap-C1. Apuntes Día 1 ............................................................................................... 81|
|Figura Ap-C2. Apuntes de pruebas de protocolos de comunicación (izquierda) y diseños|
|preliminares (derecha) .......................................................................................................... 82|
|Figura Ap-C3. Apuntes de pruebas de la ESP ...................................................................... 82|
|Figura Ap-C4. Primer esquema de arquitectura del sistema................................................. 83|
|Figura Ap-C5. Esquema del sistema incluyendo un broker remoto ..................................... 83|
|Figura Ap-C6. Diseños de la aplicación con InfluxDB como base de datos temporal ......... 84|
|Figura Ap-C7. IDE local y aplicación final .......................................................................... 84|
|Figura Ap-C8. Diseños de los nodos de operadores ............................................................. 85|
|Figura Ap-C9. Diseño del sistema final con IDE y dashboard ............................................. 86|
|Figura Ap-C10. Vistas de la aplicación final con menú Dev Zone ...................................... 87|



viii 



<!-- Start of picture text -->
UCAB ESCUELA DE INGENIERIA<br>INFORMATICA-GUAYANA<br><!-- End of picture text -->

Universidad Católica Andrés Bello 

Facultad de Ingeniería Escuela de Ingeniera Informática Guayana 

# **Plataforma para Facilitar la Construcción y Programación de Estaciones Meteorológicas Orientadas a Estudiantes de Educación Básica.** 

Realizado por  Moreno González, Ernesto Antonio 

Tutor Académico Lárez Mata, Jesús José 

Fecha Noviembre, 2025 

# **Resumen** 

Este trabajo presenta el desarrollo de una plataforma para facilitar la construcción y programación de estaciones meteorológicas escolares, con el propósito de apoyar el pensamiento computacional y la comprensión de conceptos básicos de meteorología a partir de datos reales del entorno. La propuesta se enmarca en la educación STEM y el Internet de las Cosas, integrando sensores físicos, programación visual por bloques y visualización interactiva de datos. Para la construcción de la estación basada en Micro:Bit se adoptó una metodología basada en prototipos, que permitió iterar sobre la selección de sensores, tarjetas y formas de montaje hasta lograr una configuración segura y manejable. Para el desarrollo del software se siguió una metodología basada en el modelo incremental, que organizó el trabajo en incrementos funcionales que abarcan la estación física, un entorno tipo nodo, un backend de procesamiento y almacenamiento y un dashboard web. La comunicación entre estación, servidor e IDE se realiza mediante MQTT, y las consultas de datos actuales e históricos se apoyan en la base de datos. La propuesta se alinea con los Objetivos de Desarrollo Sostenible, en particular el ODS 4 (educación de calidad) y el ODS 13 (acción por el clima), al promover educación climática y competencias digitales en STEM. Las pruebas por incremento permitieron verificar la captura, transmisión y visualización de variables meteorológicas y la latencia y robustez del sistema. Se concluye que la plataforma cumple los objetivos y constituye un soporte replicable para actividades educativas sobre clima y ambiente en educación básica. 

**Palabras clave:** pensamiento computacional, estación meteorológica, Internet de las Cosas (IoT), programación visual por bloques, educación básica. 

ix 

# **Introducción** 

La investigación aborda la necesidad de contar con recursos didácticos sencillos, atractivos e interactivos que permitan a niñas y niños de educación básica comprender fenómenos meteorológicos y reflexionar sobre el clima y el medio ambiente a partir de datos de su propio entorno, superando las limitaciones de materiales tradicionales poco contextualizados o excesivamente abstractos. Se plantea, a continuación, el desarrollo de una plataforma que facilite la construcción y programación de estaciones meteorológicas educativas orientadas a estudiantes de educación básica, apoyando el desarrollo del pensamiento computacional y el interés por las áreas STEM (ciencia, tecnologías, ingeniería y matemáticas, por sus siglas en inglés) mediante el uso de sensores físicos, programación visual por bloques y el paradigma del Internet de las Cosas (IoT). 

El trabajo se sustenta teóricamente en aportes sobre pensamiento computacional, aprendizaje basado en proyectos y enfoque construccionista, así como en principios de ingeniería de software aplicada a entornos educativos. Adicionalmente, la propuesta se alinea con los Objetivos de Desarrollo Sostenible, en particular el ODS 4 (educación de calidad) y el ODS 13 (acción por el clima), al promover la alfabetización digital y climática a partir de la observación sistemática del entorno local mediante herramientas tecnológicas. 

Metodológicamente se adopta un enfoque de tipo experimental, apoyado en dos enfoques complementarios: una metodología basada en prototipos para la construcción de la estación meteorológica, que permite la selección de sensores, tarjetas y formas de montaje hasta alcanzar un diseño robusto y manejable; y una metodología basada en el modelo incremental de desarrollo de software, que organiza de manera iterativa el diseño, construcción y validación de la solución digital a través de una serie de incrementos funcionales. 

El documento se organiza en cinco capítulos: en el Capítulo I se presenta el planteamiento del problema, la justificación y los objetivos del trabajo; en el Capítulo II se expone el marco teórico y los antecedentes; en el Capítulo III se describe el marco metodológico; en el Capítulo IV se detalla el desarrollo del proyecto y los resultados obtenidos a partir de los incrementos; y en el Capítulo V se presentan las conclusiones y recomendaciones. 

# **Capitulo I. El Problema** 

# **Planteamiento del Problema** 

El uso intensivo de las Tecnologías de la Información y Comunicación (TIC) ha dado forma a la Sociedad de la Información y del Conocimiento. El pensamiento computacional se ha convertido en una competencia esencial y una parte crucial de la alfabetización digital. Según Zapata-Ros (2015), esta alfabetización es fundamental para el pleno desarrollo e integración de las personas en la sociedad actual, ayudando a evitar la exclusión. La demanda de profesionales calificados en las industrias tecnológicas resalta la necesidad de fomentar estas habilidades desde las primeras etapas del desarrollo individual (p. 1). 

Zapata-Ros (2015) afirma que las competencias de codificación son solo la parte visible de una forma de pensar más amplia y específica, que facilita la organización de ideas y la representación lógica (p. 1). El pensamiento computacional no solo es útil en el ámbito de la programación y el desarrollo de sistemas, sino que también propicia el análisis y la relación de ideas, cruciales para la resolución de problemas en diversos contextos. Por lo tanto, esta forma de pensar se convierte en una herramienta clave para afrontar los retos de la sociedad actual y mejorar la calidad de vida. 

El desarrollo del pensamiento computacional en los niños es crucial para su crecimiento cognitivo y el fortalecimiento de habilidades de resolución de problemas. Wing (2006) define el pensamiento computacional como una habilidad fundamental para todos, no solo para los científicos de la computación. Además, sostiene que este tipo de pensamiento implica resolver problemas, diseñar sistemas y comprender el comportamiento humano, aplicando conceptos clave de la ciencia de la computación. Al integrar el pensamiento computacional en la educación temprana, los niños aprenden a descomponer problemas complejos, a reconocer patrones y a desarrollar soluciones de forma eficiente. Estas habilidades no solo son esenciales en el ámbito de la computación, sino que también fomentan el pensamiento crítico y la capacidad de abordar desafíos en diversas áreas de la vida (p. 33). 

Papert (1980), otro pionero en el campo del pensamiento computacional, argumenta que este es esencial para que los niños aprendan a construir su propio conocimiento de manera activa (p. 120). Así mismo sugiere que, al involucrar a los estudiantes en la construcción de artefactos computacionales, como simulaciones o programas, estos desarrollan una comprensión más 

3 

profunda de conceptos abstractos al hacerlos concretos y manipulables (p. 21). 

En el contexto de una estación meteorológica educativa, los niños pueden usar herramientas computacionales para simular y analizar datos meteorológicos. Esta interacción práctica con la tecnología les permite entender conceptos como el clima y el tiempo de una manera tangible, lo que facilita la construcción de conocimientos complejos y fomenta la curiosidad científica. 

Históricamente, las estaciones meteorológicas han sido herramientas fundamentales para el monitoreo y predicción del clima, utilizadas principalmente por expertos y aficionados. Estas estaciones suelen estar equipadas con diversos sensores para medir variables como la temperatura, la humedad, la presión atmosférica, la velocidad y dirección del viento, entre otras (Mansouri, E. 2014). No obstante, su uso educativo ha sido limitado por la complejidad técnica (instalación, protocolos, logística) y por la falta de recursos y formación docente para integrarlo al currículo y a estándares, además de restricciones de tiempo y, en ciertos contextos, costos de instrumentación (Bungum y Mogstad, 2024, p. 450) 

Las estaciones meteorológicas son una excelente manera de que los niños exploren y comprendan lo que sucede en el exterior. Estas herramientas permiten a los pequeños interactuar fácilmente con los cambios del clima, ya sea que haga sol o esté lloviendo. Además, pueden despertar un interés duradero por la ciencia y enseñarles sobre los fenómenos meteorológicos. Elegir la estación adecuada es clave: los más pequeños requieren opciones simples, mientras que los adolescentes se benefician de estaciones más avanzadas y detalladas. 

Al permitir que los niños y jóvenes interactúen con los datos y observen los patrones del clima, se promueve una experiencia de aprendizaje activa que se alinea con las teorías de Papert (1980, p. 21) y Wing (2006, p. 33). Los niños aprenden a recopilar, analizar y representar datos meteorológicos, desarrollando así habilidades de pensamiento crítico y resolución de problemas. Esta aplicación práctica de la ciencia de la computación no solo refuerza conceptos fundamentales de la educación STEM (Ciencia, Tecnología, Ingeniería y Matemáticas por sus siglas en inglés), sino que también fomenta la creatividad y la innovación, habilidades esenciales para el siglo XXI. 

La visualización de los datos del tiempo y clima de una manera simple, interactiva e intuitiva permite a los niños ver patrones y comprender la información más fácilmente. Los gráficos, tablas y representaciones visuales ayudan a reforzar conceptos abstractos y hacerlos más concretos. En el caso de una estación meteorológica para niños, ver los datos en gráficos simples 

4 

(como la temperatura a lo largo del día) les ayudará a relacionar lo que ven con lo que ocurre en la vida real. Esto aumenta la comprensión de las tendencias climáticas y los cambios en el ambiente, algo crucial en la educación temprana sobre el clima (Hewitt, 2016, p. 713). 

Por otra parte, es necesario inculcar en la población la necesidad de utilizar protector solar desde temprana edad, en un estudio realizado por la González-Delatorre, Terán-Ángel, OrtegaMoreno y Montilla-Calderón (2023) en 94 participantes, el 48,9% ha sufrido en promedio entre 1 a 10 quemaduras por entrenamientos al aire libre. El 70,2% realiza actividades físicas de 3 a 5 días a la semana. El 59,2% no emplea protector solar en días nublados. El estudio determinó un alto riesgo (13,8 %) y muy alto riesgo (4,3 %) de desarrollar melanoma a futuro (p. 203; 207). Esto demuestra que parte de la población andina utiliza fotoprotección, sin embargo, no están todos conscientes de que el índice de rayos UV puede seguir siendo alto a pesar de la nubosidad como menciona el Dr. Manuel Del Solar Chacaltana hasta un 80 % de la radiación UV atraviesa las nubes o la bruma, “Debemos entender que la radiación ultravioleta no se bloqueará con la nubosidad, lo que sí podría detener un poco es la radiación calórica. Un día nublado puede ser hasta más dañino para la piel, ya que nos confiamos por la ausencia de los rayos solares. Si seguimos exponiéndonos de esa manera, nuestra piel podría sufrir quemaduras a corto plazo o acumularían radiación para el futuro” (Gobierno del Perú, 2024, párr. 3). 

Según la Organización Mundial de la Salud, OMS (2019), las enfermedades por lluvia no son la excepción, la llegada de las precipitaciones trae riesgos de contagiarse de enfermedades que afectan el sistema respiratorio. La enfermedad respiratoria que mayor tasa de mortalidad infantil en el mundo es la neumonía, la neumonía mató a más de 808 000 niños menores de 5 años en 2017, lo que representa el 15% de todas las muertes de niños menores de 5 años.  Entre las personas con riesgo de neumonía también se incluyen los adultos mayores de 65 años y las personas con problemas de salud preexistentes. 

En la actualidad, es fundamental fomentar el pensamiento computacional en el contexto de la alfabetización digital desde las primeras etapas educativas (Bers 2020, pp. 9-10). Tal como señala Bers (2020) en Coding as a Playground, la programación y el pensamiento computacional pueden ser herramientas poderosas para los niños cuando se presentan de manera accesible y atractiva (pp. 7; 9). Sin embargo, los recursos educativos actuales suelen ser demasiado complejos, lo que dificulta la comprensión de los niños y limita su interés. En un mundo donde la tecnología juega un papel crucial en la vida cotidiana, es esencial crear herramientas educativas que combinen 

5 

interactividad y simplicidad, logrando captar el interés de los más jóvenes mientras se les enseña a interactuar con el clima y el medio ambiente de manera significativa. 

Ha habido un creciente interés en el desarrollo de dispositivos tecnológicos que puedan ser utilizados como herramientas educativas. Ejemplos de esto, son los kits de robótica educativa, aplicaciones interactivas y juegos didácticos que buscan hacer más accesible el aprendizaje en diversas áreas. En el caso de las estaciones meteorológicas escolares, ya existen orientaciones para su implementación didáctica (Fries-Gaither, 2008, párr. 2). Sin embargo, la adopción amplia especialmente en educación básica, se ha visto limitada por la complejidad técnica, la falta de tiempo y formación docente, así como por costos y logística (Bungum y Mogstad, 2024). 

Es necesario que los niños y jóvenes se sientan parte del proceso de aprendizaje desde el inicio, para eso surgió la iniciativa de desarrollar una estación meteorológica que pueda ser armada por componentes. La programación por bloques facilita la enseñanza, ya que transforma un proceso que podría ser difícil en algo interactivo y comprensible. Los niños no solo aprenden sobre el clima, sino también sobre la lógica detrás de los sistemas y el pensamiento computacional (Banzi, Shiloh. 2014). 

Por lo anteriormente expuesto, se propuso de crear los componentes de software que se integren en un entorno de desarrollo que no solo facilite la construcción y programación de estaciones meteorológicas para educación básica, basadas en tecnologías como Arduino o similar. Esta plataforma que debe ser intuitiva, interactiva y educativa, facilitando a los estudiantes desarrollar el pensamiento computacional al tiempo de comprender conceptos básicos de meteorología mientras interactúan con datos reales de su ambiente. 

# **Objetivo General** 

Desarrollar una plataforma para facilitar la construcción y programación de estaciones meteorológicas orientada a estudiantes de educación básica. 

# **Objetivos Específicos** 

- **1)** Analizar conceptos relacionados con la construcción y programación de estaciones meteorológicas, a fin de caracterizar la plataforma a construir, así como su entorno de desarrollo en el contexto de potenciar el pensamiento computacional para estudiantes de educación básica. 

- **2)** Diseñar plataforma para la construcción y programación de estaciones meteorológicas de acuerdo al análisis realizado. 

- **3)** Construir la plataforma de la estación metereológica, componentes de software e integrarlos al entorno de desarrollo de acuerdo al diseño realizado. 

- **4)** Validar el funcionamiento de la plataforma de la estación meteorológica y su entorno de desarrollo programando aplicaciones para diferentes casos de pruebas. 

- **5)** Realizar la documentación de la plataforma de la estación meteorológica y el software realizado. 

# **Alcance** 

El trabajo de grado experimental planteado tiene como fundamento la ingeniería informática, concretamente en la rama del Internet de las Cosas (IoT) aplicado hacia la educación. El proyecto consiste en el diseño y construcción de una plataforma de una estación meteorológica, con sus componentes de software a ser integrado en un Entorno de Desarrollo de Software (IDE) que facilite la programación de aplicaciones por estudiante de los últimos grados de educación básica. Así como las respectivas validaciones desarrollando aplicaciones de usuario finales haciendo uso de una estación prototipo con diferentes casos de estudio. 

Queda expresamente fuera del alcance la evaluación pedagógica del impacto en niñas y niños (aprendizajes, motivación o resultados académicos) y la realización de ensayos controlados en aula. El objetivo del autor es desarrollar y entregar el software y el hardware funcional con su documentación correspondiente, no demostrar efectos educativos en la población infantil. 

7 

El proyecto propuesto se realizó en Ciudad Guayana, Venezuela y tuvo una duración de 52 semanas abarcando: 

- Análisis de conceptos: un análisis exhaustivo de los conceptos de construcción y programación de estaciones meteorológicas, evaluando las herramientas y tecnologías IoT necesarias para el diseño de una plataforma educativa. Esto permitió caracterizar tanto los elementos de hardware como de software que formarán parte de la estación meteorológica y el entorno de desarrollo. 

- Diseño de la plataforma: A partir del análisis, se realizó el diseño de una plataforma integrada que facilite la construcción y programación de estaciones meteorológicas para estudiantes de educación básica. El diseño incluyó una interfaz amigable y herramientas que promuevan el desarrollo del pensamiento computacional en los estudiantes. 

- Construcción e integración: La plataforma se construyó de acuerdo con el diseño aprobado, integrando los componentes de hardware y software en un IDE especializado. La estación meteorológica prototipo servirá como base para que los estudiantes puedan programar aplicaciones y realizar prácticas. 

- Validación mediante pruebas: Se llevó a cabo la validación de la plataforma mediante aplicaciones de usuario final que cubrieron diversos casos de estudio. Estas pruebas asegurarán que la plataforma funcione correctamente en contextos reales y educativos. 

- Documentación completa: Se elaboró la documentación técnica detallada de la plataforma y el software desarrollado. Esta documentación incluyó guías de uso para educadores y estudiantes, así como los manuales de desarrollo y mantenimiento. 

# **Limitaciones** 

El desarrollo del proyecto presentó los siguientes inconvenientes: 

- Adquirir los componentes en Venezuela fue difícil debido a la poca variedad que ofrecen los proveedores y al ser casi en su totalidad productos importados, estos resultaron ser costosos. 

# **Justificación** 

El impacto de este proyecto abarca tanto a los estudiantes como a la comunidad educativa en general. Al implementar esta estación meteorológica en las escuelas, se espera que tanto los maestros como los padres se beneficien del acceso a la información climática local, la cual podrá 

8 

integrarse en diversas disciplinas académicas. A largo plazo, el proyecto tiene el potencial de inspirar a los estudiantes a seguir carreras en áreas STEM, campos que son fundamentales para el desarrollo sostenible y tecnológico de la región. 

Además, el diseño de la plataforma está orientado a la accesibilidad y adaptación a un contexto educativo local, donde las herramientas tecnológicas educativas son limitadas. Por lo que al contar con una interfaz intuitiva y fácil de manejar para los niños y jóvenes, les permitirá aprender de manera autónoma y creativa. Este enfoque no solo hace que el proyecto sea original, sino que también lo diferencia de otros recursos educativos al centrarse en la integración de la tecnología como una herramienta activa en el proceso de enseñanza-aprendizaje. 

El aprendizaje de conceptos meteorológicos a través de proyectos de computación física no solo enriquece el currículo escolar, sino que también fomenta la alfabetización digital desde una perspectiva holística. Los estudiantes podrán desarrollar habilidades críticas en la observación, análisis y comprensión de fenómenos naturales, a la vez que aprenden a utilizar tecnología para resolver problemas y tomar decisiones informadas. Al interactuar con la estación meteorológica, adquirirán no solo conocimientos técnicos, sino también un mayor sentido de responsabilidad ambiental. 

En la actual Sociedad de la Información y del Conocimiento, el desarrollo del pensamiento computacional se ha convertido en un componente esencial de la alfabetización digital. Este tipo de pensamiento no solo implica el uso de la tecnología, sino también el aprendizaje a través de ella. Es fundamental que los estudiantes no solo aprendan sobre las tecnologías, sino que también las utilicen activamente en su proceso de aprendizaje. En este sentido, el proyecto propuesto busca integrar la computación física, en particular mediante el uso de una estación meteorológica, para enseñar conceptos relacionados con el clima y el medio ambiente de una manera interactiva y práctica. 

Este enfoque no solo fortalece las habilidades tecnológicas de los estudiantes, sino que también les permite aplicar dichas habilidades en el contexto del monitoreo meteorológico, promoviendo una comprensión más profunda de los fenómenos naturales y su relación con la conservación del medio ambiente. De este modo, los estudiantes no solo desarrollarán habilidades en ciencia y tecnología, sino que también crearán conciencia sobre el impacto del cambio climático y la importancia del cuidado de la salud y el entorno. 

El acceso a una educación de calidad es fundamental para el desarrollo de competencias 

9 

digitales y el pensamiento computacional, elementos esenciales en la sociedad actual. Este proyecto contribuye al ODS 4, específicamente a la meta 4.4, que busca "incrementar el número de jóvenes y adultos con habilidades relevantes, incluidos conocimientos técnicos y vocacionales, para el empleo, el trabajo decente y el emprendimiento" (ONU, 2015). Al proveer una plataforma educativa interactiva, el proyecto facilita el aprendizaje de conceptos científicos y tecnológicos de forma accesible, permitiendo que los estudiantes desarrollen habilidades prácticas aplicables en el ámbito STEM, que son cruciales para su futuro. 

E <mark>l proyecto aborda la meta 13.3 del ODS 13, que tiene como objetivo "mejorar la educación, la concienciación y la capacidad humana e institucional sobre la mitigación del cambio climático, la adaptación, la reducción de sus efectos y la alerta temprana" (ONU, 2015). Al integrar temas de clima y medio ambiente en la educación, los estudiantes aprenden a observar y analizar datos meteorológicos, desarrollando una comprensión crítica de los fenómenos climáticos y del impacto humano en el ambiente. La interacción directa con la estación meteorológica fomenta un sentido de responsabilidad climática en los jóvenes, promoviendo prácticas sostenibles y un mayor compromiso con la protección del planeta.</mark> 

# **Capitulo II. Marco Teórico** 

# **Antecedentes** 

**Robot orientado a promover el desarrollo del pensamiento computacional en niños de educación inicial.** Morán (2023) en su trabajo de grado realizó un entorno de programación por bloques mediante un robot educativo, así pudo ayudar a los niños a mejorar su pensamiento crítico y lógico para empezar a programar desde temprana edad. 

El proyecto de Morán se sustenta en las bases teóricas como la robótica educativa, programación física, los componentes del pensamiento computacional y el principio de activación. 

La robótica educativa, juega un papel vital al ofrecer un entorno práctico donde los niños pueden explorar conceptos abstractos de manera tangible. A través de la interacción con robots educativos, los niños desarrollan un pensamiento estructurado y lógico, fortaleciendo así sus habilidades para enfrentar desafíos cognitivos y mejorar su pensamiento crítico desde una etapa temprana. 

Este enfoque es particularmente relevante en la sociedad actual, donde las habilidades digitales y tecnológicas son indispensables para el futuro desarrollo académico y profesional. Morán destaca que, al fomentar el pensamiento computacional en los primeros años de vida, se sientan las bases para una alfabetización tecnológica que es cada vez más necesaria en el mundo moderno. 

**The scratch weather dashboard.** En el ámbito de la programación visual para la enseñanza del clima, se han desarrollado experiencias que demuestran la viabilidad de integrar datos meteorológicos a entornos accesibles para escolares. Vargas (s. f.) presenta _The Scratch Weather Dashboard_ , una guía práctica para que Scratch interactúe con estaciones meteorológicas y represente variables como temperatura, presión y viento mediante sprites que anuncian valores y elementos gráficos como termómetros y veletas animadas en tiempo real (pp. 1–6). Este antecedente evidencia que, desde una interfaz lúdica y de baja barrera de entrada, es posible conectar mediciones del tiempo con representaciones visuales significativas para los estudiantes. 

**Using weather data in Scratch.** En la misma línea, Lane (2023) documenta cómo utilizar datos meteorológicos en vivo dentro de Scratch mediante la consulta a una API Open-Meteo y su posterior visualización e interacción con sprites. El autor muestra un flujo completo desde la obtención de datos hasta su despliegue que sirve como puente entre la programación por bloques y el trabajo con información del mundo real, reforzando el potencial pedagógico de la 

11 

programación basada en datos en contextos introductorios. 

En conjunto, estos antecedentes confirman que existe un interés sostenido por acercar la meteorología escolar a través de dashboards interactivos y programación visual. Sin embargo, ambos enfoques se centran principalmente en el consumo de datos (ya sea de estaciones existentes o de APIs en línea) y en prototipos de actividad más que en una plataforma integrada de hardware y software especialmente diseñado para educación básica. 

**Entorno de robótica educativa multiagente orientado a favorecer el desarrollo del pensamiento computacional en jóvenes cursantes de educación media.** Espejo (2022), en su trabajo desarrolló un entorno de robótica educativa multiagente, para favorecer el pensamiento computacional en jóvenes cursantes de educación media. El desarrollo se sustentó en los conceptos de robótica, robótica multiagente, robótica educativa, pensamiento computacional y habilidades cognitivas y de interacción social. 

El entorno resultante cuenta con agentes, los cuales realizan tareas en una arena de realidad aumentada que refleja sus interacciones mediante una proyección generada por un entorno virtual, el cual obtiene información del entorno físico mediante visión por computador y dota a los agentes de sensores y actuadores virtuales para que sean capaces de seguir instrucciones, las cuales son programadas a través de MakeCode. 

Para esto Espejo se enfocó en la resolución de problemas, el entorno multiagente permite a los estudiantes experimentar y resolver problemas mediante la interacción con los robots en una arena de realidad aumentada. Los agentes realizan tareas y resuelven problemas colaborativamente, lo que fomenta la creatividad y el pensamiento crítico. 

**Programación visual: antecedentes y relevancia en la educación.** La programación visual es un paradigma de programación que utiliza elementos gráficos (bloques, diagramas, íconos) en lugar de código textual para representar estructuras lógicas y algoritmos. Según Myers (1990), este enfoque "facilita la comprensión de conceptos abstractos al convertir la sintaxis textual en representaciones tangibles y manipulables" (p. 14). Es especialmente útil en contextos educativos, ya que reduce la barrera de entrada para principiantes y fomenta el aprendizaje mediante la experimentación visual. 

Tiene sus raíces en los trabajos pioneros de Seymour Papert con el lenguaje LOGO en la década de 1960. Papert (1980) argumentaba que "los niños aprenden mejor cuando interactúan con herramientas que les permiten construir conocimientos de forma activa" (p. 32). LOGO introdujo 

12 

la idea de programar mediante comandos gráficos, como mover una tortuga en pantalla, sentando las bases para entornos posteriores como Scratch y Blockly. 

En 2003, el MIT Media Lab desarrolló Scratch, una plataforma de programación visual basada en bloques diseñada para niños. Según Resnick et al. (2009), Scratch "democratiza el acceso a la programación al eliminar la complejidad sintáctica y centrarse en la creatividad y la lógica" (p. 62). Estudios posteriores han demostrado que Scratch mejora el pensamiento computacional en estudiantes de educación básica (Brennan y Resnick, 2012). 

Microsoft MakeCode: Plataforma de bloques para programar dispositivos como Micro:bit. Estudios muestran que mejora la comprensión de conceptos físicos en estudiantes de 10 a 14 años (Sentance, Waite, Hodges, MacLeod & Yeomans, 2017, p. 531). 

**Node-RED: Una plataforma de desarrollo basada en flujos.** Node-RED es una herramienta de programación visual orientada a la creación de flujos de trabajo y sistemas interconectados, particularmente en el contexto del Internet de las Cosas (IoT) y la automatización de procesos. Este entorno de desarrollo fue creado inicialmente por IBM en 2013 y ha ganado popularidad debido a su enfoque en la simplicidad, flexibilidad y capacidad para interconectar múltiples servicios y dispositivos a través de una interfaz gráfica amigable. 

Node-RED utiliza una interfaz de usuario basada en un editor visual donde los "nodos" representan las unidades de procesamiento de datos o acciones, que pueden conectarse mediante líneas que simulan el flujo de datos entre ellos. Cada nodo puede representar un dispositivo físico, un API, o un bloque de procesamiento de datos que facilita la creación de sistemas complejos de manera accesible incluso para usuarios con conocimientos básicos de programación (Hampson et al., 2016). 

Entre las principales ventajas de Node-RED se destacan: 

- Desarrollo visual: El uso de una interfaz gráfica permite a los usuarios integrar distintos sistemas mediante la simple "conexión" de nodos, evitando la escritura extensa de código (Aasman, 2017). 

- Extensibilidad: Node-RED ofrece una biblioteca en constante crecimiento de nodos adicionales que permiten integrar servicios como bases de datos, protocolos IoT, APIs, y más. Esto lo convierte en una herramienta ideal para la creación rápida de prototipos (Verborgh et al., 2018). 

- Programación asíncrona y dirigida por eventos: Node-RED está diseñado para manejar 

13 

flujos de datos en tiempo real, lo cual es crucial para aplicaciones como la recolección de datos de sensores IoT y la automatización de procesos industriales (Wolfram, 2020). Node-RED ha sido ampliamente adoptado en el ámbito de IoT debido a su capacidad para integrar dispositivos de diferentes fabricantes y servicios web a través de protocolos como MQTT y HTTP. Su diseño modular y basado en eventos lo convierte en una herramienta robusta para la gestión de redes de dispositivos inteligentes y la automatización del hogar, así como en entornos industriales para la monitorización y control de procesos en tiempo real (Wang, 2020). 

Según estudios recientes, Node-RED ha demostrado ser una solución efectiva para la orquestación de microservicios y la integración de datos heterogéneos provenientes de múltiples fuentes (Sahu & Oinam, 2021). Su capacidad para manejar grandes volúmenes de datos y su facilidad de uso le han permitido posicionarse como una plataforma de referencia para desarrolladores e ingenieros en el campo de la automatización. 

Node-RED ha revolucionado el desarrollo de sistemas integrados mediante su enfoque visual y modular, que simplifica la creación de flujos de trabajo complejos. Su amplia gama de aplicaciones en IoT, automatización y procesamiento de datos en tiempo real lo consolidan como una herramienta clave en el desarrollo de tecnologías emergentes. Las características de extensibilidad, escalabilidad y la facilidad de uso hacen que Node-RED sea una opción poderosa para desarrolladores y empresas que buscan implementar soluciones tecnológicas de manera rápida y eficiente. 

**Estrategia en la enseñanza de las ciencias para fortalecer la competencia “indaga” a través de la meteorología.** Varios proyectos han explorado el uso de estaciones meteorológicas como herramienta educativa. Por ejemplo, la investigación de Arroyo, S. & Espinosa, S. (2020), en su estudio titulado Estaciones Meteorológicas en el Aula: Una Estrategia para Aprender Ciencias Naturales, describe los objetivos de la investigación como: i) describir la experiencia para la enseñanza de las ciencias, que permitió implementar el Servicio Meteorológico Escolar (SME), y ii) describir la estrategia de enseñanza de las ciencias que permite fortalecer la competencia de indagación a través del SME. 

El enfoque de la investigación fue cualitativo y su diseño, investigación acción. La experiencia contó con la participación de 22 estudiantes; 15 integrantes, distribuidos entre el primer y quinto grado, conformaron el SME, y siete estudiantes de segundo grado participaron directamente de la estrategia indaga. 

14 

Los hallazgos indican que los estudiantes transitan por todas las etapas de la estrategia indagación: problematización, diseño de estrategias para indagar, generación y registro de datos, análisis de datos, evaluación y comunicación. Finalmente, se concluye que, mediante la experiencia de innovación de la enseñanza de las ciencias, fue posible implementar el SME. Además, la estrategia de enseñanza de las ciencias permitió fortalecer la competencia de indagación en los estudiantes participantes en el estudio. 

# **Bases Teóricas** 

**Educación basada en STEM.** STEM, es un enfoque pedagógico centrado en la enseñanza de Ciencia, Tecnología, Ingeniería y Matemáticas (Science, Technology, Engineering, and Mathematics, por sus siglas en inglés), ha ganado prominencia en las últimas décadas como una respuesta a la creciente demanda de habilidades tecnológicas y científicas en el siglo XXI. Esta metodología educativa busca preparar a los estudiantes para un entorno laboral que requiere competencias técnicas avanzadas, pensamiento crítico y habilidades de resolución de problemas complejos (Bybee, 2013). 

El enfoque STEM se caracteriza por ser interdisciplinario y orientado a la resolución de problemas. Esto implica que las cuatro áreas principales: ciencia, tecnología, ingeniería y matemáticas, no se enseñan de manera aislada, sino de forma integrada, en un contexto que promueve la aplicación de conceptos en situaciones del mundo real. Según Caprile, Palmén, Sanz, y Dente (2015), este enfoque fomenta la creatividad y la innovación en los estudiantes, ya que les permite aplicar lo aprendido en proyectos que reflejan los desafíos contemporáneos. 

Una de las principales fortalezas de la educación STEM es su capacidad para desarrollar habilidades cognitivas de orden superior. Los estudiantes no solo aprenden conceptos teóricos, sino que también desarrollan competencias esenciales como el análisis, la síntesis de información y el razonamiento lógico (Honey, Pearson y Schweingruber, 2014). Estas habilidades son críticas en la formación de futuros profesionales en áreas científicas y tecnológicas, sectores clave en la economía global actual. 

Así mismo numerosos estudios destacan los beneficios de la implementación de un enfoque STEM en la educación primaria y secundaria. Un informe de la National Research Council (2012) subraya que los estudiantes expuestos a un currículo STEM tienden a desarrollar una mejor comprensión de las disciplinas científicas y matemáticas, así como una mayor disposición a seguir 

15 

carreras en campos relacionados con la tecnología y la ingeniería. 

Además, la educación basada en STEM promueve la equidad de género en áreas tradicionalmente dominadas por hombres. Según Bianchini et al. (2020), al brindar oportunidades de aprendizaje equitativas, las niñas y jóvenes tienen mayor probabilidad de interesarse en estas áreas, lo que contribuye a cerrar la brecha de género en estos campos. 

No obstante, la implementación de la educación STEM también enfrenta desafíos. Uno de los principales problemas es la falta de docentes capacitados para enseñar de manera efectiva en este enfoque interdisciplinario (Margot & Kettler, 2019). Muchos sistemas educativos aún tienen dificultades para adaptar sus currículos y capacitar a los maestros en las competencias requeridas para enseñar STEM. 

**_Beneficios en la educación STEM._** La programación visual ha sido ampliamente adoptada en entornos educativos debido a sus ventajas pedagógicas: 

- Accesibilidad: Permite a los estudiantes concentrarse en la lógica algorítmica sin preocuparse por errores sintácticos (Kelleher y Pausch, 2005, p. 8-10). 

- Motivación: La retroalimentación visual inmediata (ej. gráficos, animaciones) aumenta el interés de los estudiantes (Maloney, Resnick, Rusk, Silverman y Eastmond, 2010, p. 16:116:15). 

- Colaboración: Facilita el trabajo en equipo mediante proyectos compartibles y modulares (Repenning et al., 2015). 

En el contexto del proyecto, la integración de programación visual en la plataforma meteorológica permitirá a los estudiantes: 

- Programar sensores (ej. termómetros, pluviómetros) mediante bloques. 

- Visualizar datos climáticos en tiempo real a través de gráficos interactivos. 

- Diseñar algoritmos para predecir patrones meteorológicos simples. 

**Conceptos clave para la observación climática con estaciones meteorológicas educativas.** 

En este apartado se sintetizan los conceptos fundamentales que sustentan el uso de estaciones meteorológicas con fines educativos. Se presentan nociones sobre clima, variabilidad y educación climática, así como los principales instrumentos y tecnologías asociadas (sensores, Arduino y otros dispositivos) que permiten a estudiantes de educación básica adquirir y procesar datos meteorológicos. 

16 

**_Conocimiento climático._** Comprensión de la influencia del clima en la sociedad y cómo las actividades humanas impactan el sistema climático global. Una persona con conocimiento climático puede evaluar información científica y tomar decisiones informadas. (U.S. Global Change Research Program, 2009) 

**_Adaptación climática._** Iniciativas y medidas implementadas para reducir la vulnerabilidad de sistemas humanos y naturales ante los efectos actuales y futuros del cambio climático. (Intergovernmental Panel on Climate Change, 2007) 

**_Variabilidad climática_ .** Fluctuaciones naturales en las condiciones climáticas dentro del rango normal de extremos en una región específica. (National Oceanic and Atmospheric Administration, 2023). 

**_Observación climática._** Recopilación de datos sobre el clima utilizando estaciones meteorológicas, satélites, y otras herramientas, que proporcionan información esencial para entender y predecir el comportamiento climático (Longworth, B. 2008) 

**_Educación climática._** Proceso de enseñanza y aprendizaje sobre la ciencia del clima y los impactos del cambio climático, destinado a aumentar la comprensión y la capacidad de adaptación de las personas y comunidades (NOAA, 2023). 

**_Sensores._** Los sensores son dispositivos que detectan cambios en el entorno físico o químico y convierten estos cambios en señales eléctricas que pueden ser medidas o procesadas (Fraden, J. 2016) 

**_Anemómetro._** Un anemómetro es un instrumento utilizado para medir la velocidad del viento. Es fundamental en meteorología y en diversas aplicaciones industriales donde es importante monitorear el flujo de aire (Lutgens, F. K., & Tarbuck, E. J. 2019). 

**_Veleta._** Una veleta es un instrumento utilizado para indicar la dirección del viento. Generalmente se encuentra montada en techos o estructuras elevadas para captar correctamente la dirección del viento predominante (Ahrens, C. D. 2012). 

**_Barómetro._** Un barómetro es un instrumento que mide la presión atmosférica. Es crucial en la predicción meteorológica, ya que los cambios en la presión atmosférica pueden indicar cambios en las condiciones climáticas (Lutgens, F. K., & Tarbuck, E. J. 2019). 

17 

**_Termómetro._** Un termómetro es un dispositivo que mide la temperatura de un entorno o de un objeto. Existen varios tipos, incluidos los de mercurio, digitales, y de infrarrojos (Hewitt, P. G. 2016). 

**_Pluviómetro._** Un pluviómetro es un instrumento utilizado para medir la cantidad de precipitación caída en un área específica durante un periodo de tiempo determinado (Aguado, E., & Burt, J. E. 2015). 

**Internet of Things (IoT).** Internet of Things (IoT). El concepto de IoT fue acuñado por Kevin Ashton en 1999. Desde una perspectiva arquitectónica, Gubbi, Buyya, Marusic y Palaniswami (2013) presentan una visión cloud-céntrica y describen tres componentes del IoT hardware (sensores/actuadores), middleware (almacenamiento y cómputo bajo demanda) y presentación (visualización/interpretación) señalando que la proliferación de dispositivos conectados en redes “comunicantes-actuantes” es lo que crea el IoT (p. 1647). Estos dispositivos abarcan desde sensores industriales y electrodomésticos inteligentes hasta vehículos conectados, capaces de intercambiar datos y habilitar decisiones automáticas (Gubbi et al., 2013). 

El Internet de las Cosas representa una evolución tecnológica que ha permitido la interconexión digital de objetos físicos con la red de internet, con el objetivo de recopilar, intercambiar y procesar datos de manera automática y eficiente. Desde su concepción, el IoT ha impulsado una transformación en cómo interactúan los dispositivos, permitiendo que objetos cotidianos tengan capacidades de comunicación autónomas sin la necesidad de intervención humana constante (Ashton, 2009, p. 97). 

El IoT está estructurado en una arquitectura escalonada que comprende varias capas: 

- Capa de percepción: Consiste en los sensores y dispositivos que capturan datos del entorno físico, como la temperatura, humedad o el estado de una máquina. 

- Capa de red: A través de esta capa, los datos se transmiten hacia sistemas centrales mediante redes inalámbricas, Wi-Fi o tecnologías de comunicación específicas para IoT, como LPWAN o 5G. 

- Capa de procesamiento: Una vez que los datos son recogidos, se analizan utilizando tecnologías como la computación en la nube y computación en el borde (edge computing) para generar información útil y accesible. 

- Capa de aplicación: Representa la interfaz donde los usuarios pueden interactuar con los datos procesados. Aquí se integran las aplicaciones que gestionan los sistemas de IoT, 

18 

como hogares inteligentes, fábricas automatizadas o ciudades inteligentes (Gubbi et al., 2013). 

IoT es una tecnología clave en la transformación digital del siglo XXI, permitiendo la conectividad de dispositivos de manera eficiente, segura y escalable. Si bien las aplicaciones de IoT son amplias y van desde la gestión de ciudades inteligentes hasta la automatización industrial, es necesario abordar los desafíos de seguridad, interoperabilidad y privacidad para garantizar su implementación efectiva y segura en el futuro. 

**Alfabetización digital** . Se refiere al conjunto de habilidades, conocimientos y competencias necesarias para utilizar de manera eficaz las tecnologías de la información y la comunicación (TIC) en diferentes contextos, como el personal, educativo y profesional. En la era digital actual, la capacidad de interactuar con herramientas digitales es crucial, ya que influye en la forma en que las personas acceden, evalúan, gestionan y comunican la información. La alfabetización digital no se limita únicamente a saber usar dispositivos tecnológicos, sino que también implica comprender las dinámicas de los entornos digitales, el impacto de las redes sociales, la ética en el uso de la información, y la seguridad en línea. 

Zapata-Ros (2012) define la alfabetización digital como la habilidad no solo de interactuar con dispositivos tecnológicos, sino también de emplearlos críticamente, con conciencia del contexto en el que se utilizan. Según el autor, el desarrollo de estas competencias es fundamental para participar activamente en la sociedad del conocimiento, caracterizada por la constante creación, acceso y distribución de información digital. 

En este sentido, la alfabetización digital no solo se circunscribe a la adquisición de competencias técnicas, sino que también abarca aspectos más profundos como el pensamiento crítico, la resolución de problemas y la creatividad en el uso de las TIC. De acuerdo con ZapataRos (2012), esta alfabetización debe promover un aprendizaje autónomo y la capacidad de colaboración a través de medios digitales, factores esenciales en el aprendizaje a lo largo de la vida y la adaptación a los cambios tecnológicos. 

Además, Zapata-Ros (2015) destaca la importancia de que las instituciones educativas integren de manera sistemática la enseñanza de competencias digitales en los programas de formación, no solo como habilidades prácticas, sino como un componente esencial del currículo, que promueva una ciudadanía digital responsable y crítica. El autor subraya que una adecuada alfabetización digital puede contribuir significativamente a la reducción de la brecha digital, 

19 

promoviendo la equidad en el acceso y uso de las TIC entre diferentes sectores de la población. 

**Micro:bit.** Este dispositivo está diseñado para ayudar a los estudiantes de 8 a 13 años se familiaricen con el pensamiento con el pensamiento algorítmico, la ciencia programación, juegos y robots. Por lo tanto, los estudiantes pueden crear sus propios contenidos específicos, estimular la creatividad (Stanojević, 2021). Posee un botón donde aparece el logo, dos botones identificados como “A” y “B” y cinco pines donde dos están reservados para alimentación y tierra como se puede observar en la Figura 1. 



<!-- Start of picture text -->
Logo touch pin<br>(ap Ss<br>treeee<br>ofiiog<br>see#eee<br>peree<br>input/output Pins ————<br><!-- End of picture text -->

_Figura 1. Tarjeta BBC Micro:bit y pines de entrada/salida._ 

_Nota. Tomado de micro: bit pins, de Microsoft, s. f., MakeCode. https://makecode.microbit.org/device/pins._ 

**Comunicación serial.** Consiste en el envío de bits de información de manera secuencial a través de una única línea. Este tipo de comunicación difiere de la comunicación en paralelo que consiste en enviar simultáneamente un conjunto de datos a través de varias líneas (Díaz Mulas, 2016, p. 15). 

**MQTT** . El protocolo MQTT (Message Queuing Telemetry Transport) se define como “un protocolo de transporte de mensajería cliente-servidor basado en el patrón de publicación/suscripción. Es liviano, abierto, simple y diseñado para ser fácil de implementar” (OASIS, 2014, p. 1). Estas características lo hacen especialmente adecuado en contextos de Machine to Machine (M2M) e Internet of Things (IoT), donde los dispositivos cuentan con recursos limitados y las redes presentan restricciones de ancho de banda. 

Asimismo, el estándar enfatiza que el protocolo “funciona sobre TCP/IP, u otros protocolos de red que proporcionen conexiones bidireccionales, ordenadas y sin pérdidas” (OASIS, 2014, p. 

20 

1). Entre sus principales ventajas se encuentran: el uso del modelo publicar/suscribir para desacoplar aplicaciones, la independencia del contenido de los mensajes y la provisión de tres calidades de servicio para la entrega de mensajes: _at most once_ , _at least once_ y _exactly once_ (OASIS, 2014, p. 2). 

**Dataflow.** Dentro de la ingeniería de software, la programación dataflow se considera un paradigma en el cual las aplicaciones se representan internamente como un grafo dirigido de nodos de procesamiento conectados por aristas que modelan el flujo de datos. Cada nodo (o bloque) posee puertos de entrada y salida, recibe datos, realiza una transformación sobre ellos y envía el resultado al siguiente nodo, de manera que una aplicación se concibe como la composición de bloques fuente, de procesamiento y de salida enlazados por aristas dirigidas (Sousa, 2012, p. 2). 

Desde el punto de vista del modelo de ejecución, un programa _dataflow_ puede describirse como un grafo dirigido cuyos nodos son operaciones primitivas (por ejemplo, operaciones aritméticas o de comparación) y cuyos arcos representan dependencias de datos entre dichas operaciones. Conceptualmente, los datos fluyen como “tokens” a lo largo de los arcos, que se comportan como colas FIFO; un nodo se “dispara” y se ejecuta tan pronto como todos los operandos requeridos están disponibles, en lugar de esperar a que un contador de programa avance secuencialmente como en el modelo de Von Neumann (Johnston, Hanna y Millar, 2004, p. 3). Esta semántica hace que múltiples instrucciones puedan ejecutarse en paralelo siempre que no compartan dependencias de datos. 

Una consecuencia importante de este enfoque es que cada nodo se modela como un bloque de procesamiento independiente, sin efectos secundarios, que se activa automáticamente cuando llegan nuevos datos. Esto permite lograr concurrencia implícita sin que el programador tenga que gestionar hilos, semáforos u otros mecanismos de sincronización de bajo nivel (Sousa, 2012, pp. 1–2). En la práctica, el paradigma _dataflow_ se ha utilizado tanto para explotar arquitecturas de cómputo paralelo como para servir de base a numerosos lenguajes de programación visual, donde el desarrollador, o incluso usuarios finales, construyen aplicaciones conectando bloques funcionales en un diagrama de flujo de datos (Sousa, 2012, p. 4; Johnston et al., 2004, pp. 1–2). Este tipo de representación gráfica y orientada al flujo de información es especialmente afín a entornos de programación por bloques y a aplicaciones educativas basadas en nodos y conexiones, como las que se utilizan para orquestar sensores y actuadores en escenarios de Internet de las Cosas. 

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

# **Capítulo IV. Desarrollo y Resultados** 

# **Análisis y Estudio Inicial** 

A la hora de iniciar un proyecto es necesario colocar las bases fundamentales que servirán para poder realizar el análisis inicial. El análisis se centraba en la Programación Visual y sus componentes. El análisis se organizó en tres ejes: (a) construcción de la estación (sensores, acondicionamiento, microcontrolador y buses/energía), (b) programación y arquitectura IoT (modelo de publicación/suscripción, formato de datos y flujo de información desde el dispositivo hasta la visualización), y (c) entorno de desarrollo educativo (programación visual por bloques con enfoque dataflow, criterios de usabilidad escolar y apoyo al pensamiento computacional). A partir de estos ejes se derivan las funcionalidades y las restricciones de la plataforma y se justifica la selección tecnológica utilizada en el resto del capítulo. 

Se revisaron lenguajes de programación visual por bloques populares en contextos educativos (p. ej., Scratch y Blockly), por su facilidad de uso y su potencial para desarrollar pensamiento computacional. Resnick (2009) y colegas subrayan que programar “apoya el pensamiento computacional, ayudando a aprender estrategias importantes de resolución de problemas y de diseño” (p. 62). Además, los entornos para principiantes deben ofrecer “low floor, high ceiling y wide walls” (barrera de entrada baja, techo alto y paredes anchas) para permitir progresión y diversidad de proyectos (Resnick et al., 2009, p. 63). 

La evidencia empírica sobre Micro:Bit en escuelas del Reino Unido muestra una valoración positiva por parte del alumnado: reportan facilidad de uso, motivación y un fuerte sentido de creatividad (“creating cool stuff”), además de tangibilidad y oportunidades de colaboración en el aula (Sentance et al., 2017, p. 532). En entrevistas, docentes describen usos multidisciplinares (p. ej., enlazar sensores con ciencias y arte) y destacan que la experiencia ayuda al aprendizaje de programación y a “entender la tecnología” (Sentance et al., 2017, pp. 533–534). Asimismo, el ecosistema Micro:Bit incluye sensores integrados y conectividad (p. ej., BLE/radio), que facilitan proyectos con datos del entorno en tiempo real (Sentance et al., 2017, p. 531). Los datos meteorológicos (temperatura, humedad, luminosidad) se transmitieron mediante el protocolo MQTT gracias a una integración al shield del Micro:Bit IoT:Bit, este posee una ESP8266 incorporada que nos permite conectarnos a la red y utilizar el protocolo MQTT, dicho protocolo fue seleccionado por su ligereza y eficiencia en IoT (Banks y Gupta, 2014). 

29 

La literatura sobre programación temprana documenta como patrones consolidados el uso de bloques encajables drag-and-drop y la retroalimentación inmediata para favorecer secuencias, bucles y depuración con niños pequeños (Bers, 2021, pp. 1–3). En este caso la interfaz tomó como referencia el modelado orientado al flujo (DFD), que representa entradas y salidas con flechas y transformaciones con nodos/burbujas, una metáfora visual de datos que “fluyen” por el sistema (Pressman, 2010, pp. 159–161). Este enfoque respalda el “toque” de nodos y flechas que distinguimos frente al apilado vertical de bloques. 

Este enfoque se alinea con el paradigma de programación por flujo de datos (dataflow), donde el programa se modela como un grafo dirigido de operaciones (nodos) conectadas por arcos de dependencias de datos; una operación “dispara” su ejecución cuando sus operandos están disponibles (Johnston, Hanna y Millar, 2004, p. 4). 

**Pruebas iniciales con ESP8266: exploraciones de “eco” y decisión de plataforma.** 

**_Comunicación y análisis de requerimientos del prototipo._** Como parte de la fase exploratoria se planteó construir un prototipo de comunicación basado en módulos ESP8266, con el objetivo de validar la viabilidad de utilizar esta familia de dispositivos como canal inalámbrico principal de la estación meteorológica. En esta etapa se discutieron los requerimientos del prototipo: contar con un enlace confiable de ida y vuelta, evaluar distintos buses de comunicación entre el microcontrolador y el módulo (UART, I2C y SPI) y estimar la complejidad de integración hardware y firmware asociada a cada alternativa. 

**_Planificación y diseño del prototipo._** A partir de esos requerimientos se diseñó un prototipo centrado en una prueba de “eco”: enviar un mensaje desde el controlador hacia el ESP8266, reenviarlo a través de la red y recibir una respuesta de vuelta en el microcontrolador. Se definieron tres variantes de diseño para el enlace local: 

- uso de UART con temporizador y reintentos, 

- uso de I2C en configuración maestro–esclavo, 

- uso de SPI en modo maestro–esclavo con lectura inmediata del buffer. 

Cada variante debía cumplir el mismo criterio básico: demostrar un eco confiable con la menor complejidad de integración posible. 

30 

**_Construcción del prototipo._** En la fase de construcción se implementaron los “sketches” de prueba correspondientes a cada variante, configurando el ESP8266 y el controlador para ejecutar la secuencia de envío, reenvío y recepción del mensaje. Se instrumentó la medición de tiempos, conteo de errores y verificación de integridad de los datos, y se trabajó con varias unidades físicas de ESP8266 para descartar fallos puntuales de hardware. 

**_Evaluación y retroalimentación._** Durante la evaluación se observó que las tres variantes lograron completar el ciclo de eco con éxito, pero presentaron distintos niveles de complejidad en la configuración de registros, manejo de errores y sincronización. La retroalimentación de esta fase permitió concluir que, aunque el ESP8266 resultaba técnicamente viable como base de comunicación, su integración directa añadía una carga de diseño y mantenimiento elevada para el contexto escolar previsto. 

Esta evidencia se tomó como insumo para avanzar hacia soluciones más integradas, como el uso de accesorios tipo IoT:Bit con ESP8266 incorporado, y para refinar la matriz de decisión sobre tecnologías de estación meteorológica presentada en la sección siguiente. En particular, los resultados del prototipo con ESP8266 se incorporaron en la evaluación comparativa de controladores (Tabla 3: Evaluación de tecnologías para estaciones meteorológicas con fines educativos), donde se valoró su complejidad de integración frente a alternativas como Arduino, Micro:Bit y Raspberry Pi. A partir de dicha evaluación se concluyó que, para el contexto escolar considerado, Micro:Bit ofrecía un mejor equilibrio entre facilidad de uso, soporte educativo e integración de sensores, por lo que se adoptó como plataforma principal de la estación. 

_Tabla 3. Tecnologías para estaciones meteorológicas para fines educativos._ 

|**Controlador**|**ESP**|**Ardu**|**ino**|**Micro:Bit**|**RasberryPi**|
|---|---|---|---|---|---|
|Interface|Módulo<br>Wi-Fi;<br>requiere placa base y<br>conversor<br>USB–<br>seriales externos|Uso<br>de<br>(shields<br> <br>comunicac<br>shields<br>meteorológ|_shields_<br>de<br>E/S,<br>ión,<br>icos)|_Carriers_educativos<br>IoT:Bit<br>y<br>Weather:Bit<br>con<br>conectores RJ45 y<br>buses I2C pensados<br>para docencia|HATs y pines GPIO;<br>requiere montaje y<br>sistema operativo|
|Sensor|Compatible<br>con<br>sensores<br>digitales/I²C;<br>normalmente<br>se<br>conectan<br>como<br>módulos<br>sueltos,<br>con<br>cableado<br>y<br>resistencias<br>a<br>medida.|Varios<br>analógicos<br>digitales;<br>ecosistema<br>módulos y<br>sensores<br>(temperatu<br>humedad, l|pines<br> <br>y<br>amplio<br> <br>de<br>shields de<br>ra,<br>uz, etc.).|Shields con varios<br>sensores integrados<br>y<br>puertos<br>para<br>conectar<br>sensores<br>adicionales<br>por<br>I2C/GPIO,<br>con<br>cableado<br>simplificado<br>y<br>documentación<br>didáctica.|Compatible con gran<br>variedad de sensores<br>por GPIO, I2C, SPI<br>y<br>USB;<br>suele<br>requerir librerías y<br>configuración<br>de<br>bajo nivel.|



31 

|**Controlador**|**ESP**||**Arduino**||**Micro:Bit**|**Rasber**|**ryPi**|
|---|---|---|---|---|---|---|---|
|Actuador|No<br>actuadores<br>integrados;<br>añaden<br>externos|incluye<br> <br>se<br>módulos|Salidas<br>digitales/PW<br>relés,<br>pantallas, etc.|M para<br>servos,<br>|Matriz LED 5×5,<br>salidas para servos,<br>zumbador y pantalla<br>OLED vía IoT:Bit|GPIO<br>pantall<br>zumba<br>actuado|para relés,<br>as,<br>dores u otros<br>res|
|Observaciones|Requiere<br>integración<br>nivel<br>y<br>manual; se<br>pruebas ini<br>debido a<br>descartó<br>opción prin|mucha<br>de bajo<br>cableado<br>usó en<br>ciales, y<br>eso se<br>como<br>cipal.|Alternativa<br>pero<br>exige<br>montaje y no<br>orientada al n<br>educación<br>considerado.|viable,<br> <br>más<br>está tan<br>ivel de<br>básica|Alternativa principal<br>por<br>su<br>enfoque<br>educativo<br>que<br>simplifican<br>la<br>conexión<br>de<br>sensores<br>y<br>actuadores.|Potente<br>sobredi<br>para el<br>prototi<br>mayor<br>de adm<br>el cont<br>Precio|<br>pero<br>mensionada<br>objetivo del<br>po<br>y<br>con<br>complejidad<br>inistración en<br>exto escolar.<br>elevado.|



Se adquirió una Iot:Bit con ESP8266 integrado, que ofrece una capa de hardware más estable (alimentación, conversión USB–serial y trazas probadas) y reduce el riesgo de integración en las primeras etapas. Con esta base y un enlace funcional, el proyecto evolucionó desde el prototipado exploratorio a una metodología incremental, estructurando entregas funcionales por iteración (adquisición de datos, publicación, almacenamiento y visualización). 

**Esquema de conexión de sensores** . Para documentar la construcción de la estación se elaboró un esquema de conexión de los sensores (Figura 3), donde se encuentra la tarjeta micro:bit montada sobre la placa IoT:Bit y la distribución de los módulos de sensores y actuadores en la estructura física. En dicho esquema se indica qué sensores se conectan a los puertos disponibles de la weather:bit y cuáles se enlazan a la tarjeta IoT:bit, en este caso la BME280 estará conectada a los puertos 19 y 20; a su vez estará conectada a los puertos de alimentación y tierra número 20. La pantalla OLED ira en puertos 19 y 20 tipo hembra (los centrales) al igual que los puertos de alimentación y tierra centrales. Por último, el sensor de partículas tendrá su salida de datos conectada en los puertos de la columna 1 y los que encienden el LED del sensor en la columna 13. 

32 



<!-- Start of picture text -->
= = oe es Sn pid<br>ins bora<br>Pep isiiiiislisiitisccinincuinicocoe ie BME280<br>° °pic ——=2S<br>|<br>|<br>eves LEON our<br>Se ae<br><!-- End of picture text -->

_Figura 3. Diagrama de conexiones de la Iot:Bit y sensores._ 

Producto del análisis se han determinado los siguientes requisitos 

# **Requisitos Funcionales.** 

- El sistema debe permitir la lectura de sensores de variables meteorológicas como temperatura, humedad, presión, lluvia y viento. 

- El sistema debe permitir la integración de distintos tipos de sensores. 

- Construir la estación meteorológica a partir de componentes de procesamiento, sensores, actuadores “Compatibles” con capacidad “plug and play”. 

- Se tiene proveer de herramientas que asistan a la construcción y verificación del correcto funcionamiento de la estación meteorológica, para lo cual tiene mostrar los componentes conectados y su lectura en tiempo real (raw y/o unidades de ingeniería). 

- Programar el comportamiento de la estación meteorológica, con base en lectura de los sensores y entradas del usuario y la capacidad de procesar y almacenar información meteorológica, que permita su manipulación y visualización en diferentes unidades y escala de tiempo (muestra, minutos, horas, días, semanas, meses, años). 

33 

- Ofrecer una aplicación web que permita operar, agrupar, filtrar y visualizar los datos actuales e históricos de diferentes estaciones meteorológicas. 

- La estación prototipo debe medir velocidad y dirección del viento, precipitación, temperatura, humedad y presión. 

- La estación prototipo debe generar lecturas de forma continua y transmitirlas a la plataforma de software (servidor/IDE). 

# **Requisitos No Funcionales** 

- El sistema deberá permitir la programación solo de forma visual, basada en bloques, sin edición directa de código textual, para garantizar que esté alineado con las capacidades cognitivas de estudiantes de educación básica. 

- La estación meteorológica tiene que ofrecer una construcción que garantice la seguridad de personas y los equipos. 

- Los componentes de la estación meteorológica tienen que permitir un ensamble de forma fácil, que eviten malas conexiones. 

- Se deben ofrecer guías en línea para escoger y ensamblar los diferentes componentes en funciones de las necesidades de los usuarios. 

- La guía debe ofrecer detalles de los componentes, así como el fundamento de su funcionamiento. 

- El entorno de programación debe proveer de una interfaz de programación intuitiva, basada en “drag and drop”, que sea fácil de utilizar y de interés para niños y jóvenes. 

- Programación se tiene que realizar bajo el paradigma de dataflow. 

- Se deben ofrecer la capacidad de utilizar en cualquier momento las diferentes escalas de tiempo para las variables meteorológicas, por ejemplo, actual, última, minutos, horas, días, semanas, meses, años, con su marca de tiempo en cualquiera de las interfaces. 

- Capacidad de almacenamiento varios años de las variables meteorológicas, que posibilite realizar análisis de los datos. 

- Garantizar la seguridad y privacidad de los datos, particularmente lo referente a uso de video e imágenes de la localidad. 

- Se deben usar estándares propios de IoT. 

34 

- Los sensores y tarjetas de la estación prototipo deben ser seguros y manejables en un entorno escolar, utilizando conectores robustos y montaje sencillo. 

- La estación prototipo debe ser compatible de forma directa con tarjetas Micro:Bit. 

- La estación prototipo debe disponer de conectores dedicados para los medidores de viento y lluvia (anemómetro, veleta y pluviómetro). 

- La estación prototipo debe soportar buses de comunicación estándar, al menos I2C y entradas digitales, para facilitar la lectura de datos desde el servidor y el IDE. 

# **Descripción General de la Plataforma** 

El diseño conceptual establece qué es la plataforma y qué hace, sin comprometerse todavía con tecnologías, librerías o detalles de implementación. La solución propuesta se concibe como un sistema educativo para la adquisición, transporte, procesamiento y visualización de datos meteorológicos, acompañado de un entorno de programación por bloques con enfoque dataflow que permite a estudiantes de educación básica construir programas conectando fuentes de datos, operaciones y salidas de forma comprensible y progresiva. 

Desde la perspectiva de uso, intervienen dos actores principales. El estudiante diseña y ejecuta flujos sencillos de adquisición, transformación y visualización de datos, observando resultados en tiempo real y recibiendo retroalimentación inmediata. Y la estación meteorológica (como dispositivo del entorno) provee las lecturas de los distintos sensores que alimentan la plataforma. 

En el modelo de información, los conceptos centrales son: estación (como origen lógico de datos, identificable y con estado operativo), sensor (tipo, unidad y rango), lectura (registro con tiempo y valor), flujo (representación del programa del estudiante como grafo de procesamiento), nodo (unidad funcional de ese grafo, que puede operar como fuente, operador o salida) y conexión (relación dirigida entre nodos que expresa dependencia de datos). 

Los servicios esenciales del sistema se describen mediante casos de uso de alto nivel. En primer término, la plataforma registra estaciones y sensores y valida su disponibilidad lógica. A continuación, adquiere lecturas desde la estación, envía esos datos hasta el núcleo de la plataforma y los pone disponibles para consumo por los flujos de programación y por el panel de visualización. El entorno de bloques permite al estudiante construir flujos conectando nodos fuente (lecturas crudas o agregadas), nodos operador (p. ej., filtros, escalados o cálculos de mínimos, máximos y promedios) y nodos de salida (gráficas, indicadores o eventos). Finalmente, la plataforma visualiza 

35 

en un tablero los valores en tiempo real y resúmenes por estación y sensor, y registra la actividad para facilitar el seguimiento docente. 

El flujo de datos conceptual se articula en tres etapas. En el origen, las fuentes generan lecturas periódicas con las que se inicia el ciclo. En la ingesta y procesamiento, la plataforma normaliza unidades, comprueba integridad y calcula agregados por ventana temporal cuando corresponde. En el consumo, los datos se emplean de dos maneras complementarias: por un lado, los flujos diseñados en el editor de bloques utilizan las lecturas como entradas, encadenan operadores y producen salidas observables; por otro, el dashboard consulta y presenta series temporales, estados de conexión y resúmenes que sintetizan la información para el estudiante y el docente. De forma transversal, el sistema mantiene la coherencia semántica (una lectura es válida si contiene valor, unidad y tiempo razonable) y la integridad temporal (se evitan registros anómalos por fuera de un margen definido). 

Este diseño conceptual incorpora también atributos de calidad que guían las decisiones posteriores: usabilidad (barrera de entrada baja, feedback inmediato y correspondencia visual entre “nodo–conexión” y flujo real de datos), confiabilidad (tolerancia a intermitencias en la comunicación y recuperación automática), seguridad y privacidad (uso educativo con datos mínimos, sin información personal de estudiantes) y desempeño proporcional al contexto de aula (actualización en tiempo cercano al tiempo real y retención histórica acotada). 

Como resultado, el diseño conceptual se establece como contrato funcional: define actores, conceptos, servicios y flujo de información de manera independiente de la tecnología. Sobre esta base se estructura el desarrollo incremental del capítulo siguiente: cada incremento implementa una porción verificable del contrato (p. ej., adquisición y validación de lecturas, construcción de flujos básicos, visualización en tablero), manteniendo trazabilidad entre requisitos, casos de uso y artefactos entregados. 

# **Tecnologías Utilizadas en el Desarrollo del IDE.** 

- Frontend: React y ReactFlow para bloques visuales. 

- Comunicación: Mosquitto MQTT (Eclipse Foundation, 2023) para integración con bróker. 

- Backend: Node.js y Express.js para gestionar flujos de datos. 

# **Tecnologías Utilizadas en el Desarrollo del Dashboard** 

- Frontend: React y Typescript para visualización de la información enviada desde el 

36 

entorno. 

# • Comunicación: EMQX Bróker MQTT 

# **Estación Weather:Bit** 

La estación meteorológica el cual será la encarga de todos los periféricos del sistema y capturar los datos está conformada en su parte física por tres sensores principales, el pluviómetro, el anemómetro y la veleta. Estos sensores están conectados a un shield de la Micro:Bit mediante puertos RJ45 que reciben los datos. 

# **Sensor: Bit/IoT:Bit** 

Dado la limitación en puertos en la tarjeta portadora Weather:Bit se propone el uso de la tarjeta portadora Iot:Bit, la cual no solo permite disponer más puertos y dispone de un chip WIFI ESP8266 para conectarse a Internet. Entre los sensores que fueron agregados a la estación se encuentran: 

- BME 820: Este sensor puede medir temperatura, humedad, altitud y presión. 

- Sensor de partículas: este sensor puede detectar la polucion del aire y medir su calidad. 

- Pantalla OLED: pantalla que puede mostrar cadenas de caracteres 

Todos los sensores, actuadores y tarjetas procesadoras y de extensión, consideradas para el ensamblado de la estación aparecen listados en la Tabla 4. 

_Tabla 4. Tarjetas procesadoras, sensores y actuadores._ 

|**Ítem**|**Descripción /**<br>**Modelo**|**Cantidad**|<sup>**Procedencia**</sup><br>**/ Kit**|**Función principal**|**Interfaz / Notas**|
|---|---|---|---|---|---|
|1|**BBC micro:bit v2**|**2**|Placas base|Microcontrolador<br>para adquisición y<br>orquestación|Conectadas a shields; una con<br>**Weather:Bit**y otra con**IoT:Bit**|
|2|**IoT:Bit**|1|Kit IoT:Bit|Expansión<br>y<br>**conectividad Wi-**<br>**Fi**<br>**(ESP8266**<br>**integrado)**|Puertos adicionales para sensores;<br>publicación de telemetría|
|3|**Weather:Bit**|1|Estación<br>Weather:Bit|Expansión<br>para<br>sensores<br>meteorológicos|Conectores**RJ45**para anemómetro,<br>veleta y pluviómetro|
|4|**Sensor**<br>**de**<br>**partículas**|1|Kit IoT:Bit|Medición<br>de<br>calidad<br>de<br>aire/partículas|Conexión al**IoT:Bit**(puerto del kit)|
|5|**BME280**|1|Kit IoT:Bit|Temperatura,<br>humedad, presión y<br>altura.|Conexión al**IoT:Bit**|



37 

|**Ítem**|<sup>**Descripción**</sup><br>**/**<br>**Modelo**|<br>**Cantidad**|<sup>**Procedencia**</sup><br>**/ Kit**|**Función princ**|**ipal**|**Interfaz / Notas**|
|---|---|---|---|---|---|---|
|6|**Veleta**|1|Estación<br>Weather:Bit|Dirección<br>viento|del|Conexión**RJ45**al**Weather:Bit**|
|7|**Anemómetro**|1|Estación<br>Weather:Bit|Velocidad<br>viento|del|Conexión**RJ45**al**Weather:Bit**|
|8|**Pluviómetro**|1|Estación<br>Weather:Bit|Precipitación||Conexión**RJ45**al**Weather:Bit**|
|9|**Pantalla OLED**|1|Kit IoT:Bit|Dispositivo<br>salida|de|Mostrar datos enviados desde el IDE|



Para más detalle estos componentes ver Apéndice B. 

# **Caso de Estudio y Construcción Del Prototipo De Estación Meteorológica** 

Para los efectos del desarrollo y la posterior evaluación se define un caso de estudio en el que se construye una estación meteorológica prototipo a partir de los sensores y actuadores listados en la Tabla 4. El objetivo de este caso de estudio es disponer de una plataforma física real, en un entorno controlado, que permita verificar el funcionamiento del entorno de programación y del dashboard bajo condiciones similares a las que se encontrarían en una institución de educación básica. 

# **Selección de Componentes** 

A partir de estos criterios se seleccionó la tarjeta SparkFun weather:bit como placa portadora principal para la Micro:Bit, dado que integra sensores ambientales (temperatura, humedad, presión y luz) y expone conectores modulares para medidores de viento y lluvia, lo que permite conformar una estación meteorológica compacta y específica para proyectos educativos. Para la medición de velocidad del viento, dirección del viento y precipitación se empleó un kit de medidores meteorológicos compatible, compuesto por anemómetro, veleta y pluviómetro, cada uno con su respectivo conector telefónico y elementos de sujeción mecánica para el mástil de la estación. Dado el número limitado de puertos disponibles en el shield principal, se incorporó además una segunda tarjeta Micro:Bit con un shield de expansión (Bit/IoT:Bit) para conectar sensores adicionales descritos en la Tabla 4, entre ellos un sensor ambiental tipo BME, un sensor de partículas para calidad del aire y una pantalla OLED para la visualización local de lecturas. El kit de weather:bit y el de IoT:Bit se puede visualizar con más detalle en la Figura 4 y Figura 5. 

38 



<!-- Start of picture text -->
4 8 = - % °<br>os<br>A<br><!-- End of picture text -->

_Figura 4. Weather:bit Kit by SparkFun. Nota. Tomado de SparkFun weather:bit – micro:bit Carrier Board (Qwiic), de SparkFun Electronics, s. f._ 



<!-- Start of picture text -->
Gums |a x. a oe 1<br>iotkit Re, | sa swe,<br>_- gee<br>h fh @f @ 6 ff<br><!-- End of picture text -->

_Figura 5. Kit Elecfreaks Smart Science micro:bit IoT Sensors._ 

_Nota. Tomado de Smart Science micro:bit IoT Sensors Kit without micro:bit board (Elecfreaks EF08203), de Elecfreaks, s. f._ 

39 

# **Construcción (ensamblaje y conexión)** 

El ensamblaje de la estación se realizó en dos niveles. En el nivel electrónico, la tarjeta Micro:Bit principal se insertó en el conector de borde de la weather:bit, asegurando el contacto con todos los pines necesarios. Los cables de los medidores de viento y lluvia se conectaron a los puertos modulares de la placa (tipo RJ), respetando la asignación de cada sensor (anemómetro, veleta y pluviómetro) según la documentación del fabricante. La segunda  Micro:Bit, montada sobre la tarjeta de expansión, se utilizó para alojar los sensores adicionales, conectados mediante sus correspondientes pines digitales o bus I2C, según el tipo de dispositivo (sensor ambiental, sensor de partículas y pantalla OLED). Los medidores de viento y lluvia se fijaron a un mástil mediante las abrazaderas y brazos de montaje incluidos en el kit, asegurando que los elementos móviles (copas del anemómetro, veleta y balancín del pluviómetro) quedaran libres de obstáculos para su correcto funcionamiento. En la Figura 6 y la Figura 7 se puede observar la estación luego de ser ensamblada y la weather:bit con la cual se realiza la conexión respectivamente. 



_Figura 6._ Estación meteorología weather:bit ensamblada. 



_Figura 7. Conexión estación-weather:bit_ 

40 

# **Pruebas de Funcionamiento.** 

Una vez construido el prototipo, se ejecutó una serie de pruebas de funcionamiento básico sobre cada subsistema. En primer lugar, se verificó la lectura individual de cada sensor mediante programas de prueba en la Micro:Bit, observando en la pantalla OLED y en la salida serial que las variables ambientales y meteorológicas respondieran a cambios reales (por ejemplo, movimiento del anemómetro, inclinación de la veleta o activación del pluviómetro). Posteriormente, se comprobó la comunicación entre la estación y el servidor (vía enlace serie y posterior publicación en el bróker MQTT), confirmando que las lecturas se recibían correctamente en el entorno de desarrollo y, más adelante, en el dashboard web. Estas pruebas permitieron validar que el conjunto de sensores y tarjetas seleccionadas satisface los requerimientos planteados y constituye una base adecuada para los incrementos de software desarrollados en los capítulos siguientes. 

# **Entorno De Desarrollo** 

La aplicación fue desarrollada con la librería react-flow de React, la cual nos permite utilizar nodos los cuales mediante conexiones llamadas “edges” puede interconectarse entre sí y obtener distintos tipos de comportamientos según las instrucciones que se les asignen. Los nodos presentan distintos tipos de comportamiento, para este proyecto se proponen tres tipos de nodos: 

- Nodos sensores: este tipo de nodo muestran la salida de los datos levantados por el servidor provenientes de la estación, estos nodos poseen la capacidad de conectarse a nodos operadores para realizar ciertas operaciones con ellos o conectarse directamente a los nodos de conexión. Se pueden ver los nodos de tipo sensor con más detalle en el Apéndice 1. 

- Nodos operadores: entre los comportamientos de estos nodos está el mostrar el resultado de la operación que se elija, ya sea promedio, mínimo o máximo. Al realizarse la conexión con un nodo de tipo sensor estos nodos actuaran bajo ese tipo dato. Estos nodos no permiten conexiones con otros nodos operadores, pero si con nodos de conexión o visualización. Se pueden ver los nodos de tipo operador con más detalle en el Apéndice 2. 

- Nodos conexión o visualización: estos nodos solo reciben conexiones, no pueden conectarse para enviar algún tipo de dato. El propósito de dichos nodos es activar comportamientos en el dashboard final o realizar la conexión con el bróker, por ejemplo, el “Nodo Cloud”. Se pueden ver los nodos de tipo sensor con más detalle en el Apéndice 3. 

41 

# **Conexión local MQTT** 

La existencia del bloque Cloud está relacionada directamente con el pase de los datos via protocolo MQTT. Cuando un nodo sensor u operador es conectado al nodo Cloud este envía hacia el bróker Mosquitto una el dato con un formato de tópico que le permitirá ser identificado para procesarlo más adelante. 

# **Puente MQTT** 

Un puente actúa como un paso de datos entre dos partes de la arquitectura, en este caso el puente fue realizado mediante un script de Python que permite conectar el bróker local en Mosquitto con un bróker remoto en la nube. 

# **Conexión remota MQTT.** 

El bróker remoto puede manejar grandes cantidades de datos provenientes de las distintas estaciones, el formato con el que llegan los tópicos permite identificar de que estación provienen los datos y cual tipo de dato con su respectivo valor. Aquí deben agregarse manualmente los usuarios y sus contraseñas para que la conexión entre el bridge y el bróker se pueda realizar, de lo contrario el bridge no tendrá acceso y no podrá enviar los datos provenientes de la estación meteorológica. 

# **Dashboard WebApp** 

La parte final de la arquitectura, la WebApp en su servidor se conecta al bróker remoto donde está siempre a la escucha, de haber algún cambio en el tópico principal esta leerá el nombre de la estación identificada en el mismo tópico y añadirá dicha estación a los resultados mostrados en el dashboard junto a los datos que este mandando la misma. 

# **Desarrollo del Entorno de Programación** 

Siguiendo las fases definidas en el modelo incremental descrito en el Capítulo III — comunicación, planeación, análisis y diseño (modelado), construcción (código y pruebas) y despliegue (entrega y retroalimentación)— el desarrollo del sistema se organizó en una serie de incrementos. Cada incremento produjo una versión parcial pero operativa del sistema, que fue presentada al tutor para su revisión, permitiendo ajustar el alcance y orientar los incrementos siguientes a partir de los resultados, incidentes y aprendizajes técnicos obtenidos. 

42 

# **Incremento 1: servicio en la nube** 

- **Comunicación:** las fundaciones del proyecto toman conceptos de NodeRed donde se ejecutan instrucciones mediante las conexiones entre nodos, este usando el paradigma de dataflow, primero se visualizó una interfaz de nodos simples, parecida a NodeRed y que recibiera datos mediante un servidor de terceros, ThingSpeak, que por una API suministrada por ellos permitiera mostrar los datos almacenados en el cliente. 

- **Planeación:** Con base en esa visión, se planificó un incremento centrado en: (a) ensamblar la tarjeta micro:bit con la tarjeta weather:bit; (b) seleccionar un servicio de nube sencillo para pruebas (ThingSpeak); y (c) diseñar una primera arquitectura lógica que conectara la estación con dicho servicio. Se definió como criterio de éxito que al finalizar el incremento fuese posible visualizar en la nube al menos una de las variables meteorológicas capturadas por la estación. 

- **Modelado:** En esta fase se analizaron las capacidades de la plataforma micro:bit, la tarjeta weather:bit y el servicio ThingSpeak, identificando el flujo básico de datos estación → internet → canal en la nube. A partir de ese análisis se elaboró una primera arquitectura del sistema, donde la estación actuaba como origen de datos y ThingSpeak como destino de almacenamiento y visualización, tal como se esquematiza en la Figura 8. El modelo se centró en un único sentido de flujo (publicación de datos) y dejó explícitas las limitaciones de escalabilidad y personalización del servicio externo. 

43 



<!-- Start of picture text -->
Sensores y actuadores IN 1 Ly Lp<br>©<br>‘oO peer leg<br>paeen loT-Bit<br>ia Micro:Bitcon<br>222. ¢ 2<br>Protocolo HTTP Mit<br>Plataforma de ThingSpeak Cd ThingSpeak<br>API autogenerada por ThingSpeak Wit<br>Cliente ry<br><!-- End of picture text -->

_Figura 8. Diseño de la primera Arquitectura del Sistema._ 

- **Construcción:** Para la construcción se ensambló físicamente la estación y se programó la micro:bit utilizando bloques de Microsoft MakeCode, configurando la lectura de los sensores y el envío periódico de datos a ThingSpeak mediante la interfaz de red disponible (Figura 9). Se realizaron pruebas funcionales para verificar que los datos llegaban correctamente al canal y se almacenaban con la marca de tiempo correspondiente. Durante estas pruebas se evidenciaron restricciones en la gestión de colas y en la flexibilidad del servicio, así como retrasos cuando se enviaban múltiples mediciones de forma continua. 

44 



<!-- Start of picture text -->
Anseinnize ove wien with QD) reiene<br>coe [Ego<br>eeetaeen| | te<br>[o)<br>[S)<br><!-- End of picture text -->

_Figura 9. Código en Makecode para hacer la conexión con ThingSpeak._ • **Despliegue:** El resultado fue obtenido fue estación trabajando con un servicio en la nube. La retroalimentación permitió reconocer el valor de esta prueba de concepto, pero también dejó claro que la dependencia de un servicio externo poco configurable y las limitaciones en el control de los datos no eran adecuadas para el entorno educativo previsto. A partir de esta discusión se orientó el siguiente incremento hacia el diseño de un entorno propio de programación y visualización, más cercano al paradigma _dataflow_ y menos dependiente de plataformas externas. Se puede observar en la Figura 10 y Figura 11 los resultados del campo humedad y temperatura de ThingSpeak. 

45 



<!-- Start of picture text -->
•<br><!-- End of picture text -->



<!-- Start of picture text -->
Field 5 Chart GO<br>85.0 Humidity [%H]<br>— 80.0<br>&=<br>= 75.0 k<br>: Humidity [%H]: 72.957<br>z 00<br>Zz 0 Wed Nov 19 2025<br>60.0 20:04:13 GMT-0400<br>18:00 20 Nov 06:00 12:00<br>Date<br>ThingSpeak.com<br><!-- End of picture text -->



<!-- Start of picture text -->
Figura 10. Diagrama de humedad relativa en ThingSpeak.<br><!-- End of picture text -->



<!-- Start of picture text -->
I<br>L<br><!-- End of picture text -->

_Figura 11. Primera visualización de los datos de ThingSpeak._ 

# **Incremento 2: Entorno Desarrollo Basado en Nodos** 

- **Comunicación:** Tras validar la conexión básica con la nube, en las sesiones con el tutor se identificó la necesidad de ofrecer un entorno de programación visual coherente con el enfoque de _dataflow_ . Se acordó que el segundo incremento se centraría en la creación de un entorno de desarrollo gráfico, separado del servicio de nube, que permitiera manipular nodos representando sensores, operadores y salidas. 

- **Planeación:** En el análisis se revisaron distintas opciones de programación visual, seleccionando la librería React Flow por su soporte a grafos de nodos, manejo de conexiones 

46 

y facilidad de integración con React. A partir de ello se modeló la estructura del entorno: se definieron los tipos de nodos (sensores, operadores y nodos de conexión/visualización), su representación gráfica y los paneles de la interfaz. Se diseñaron el _toolbox_ de estaciones y el canvas principal, cuyas propuestas iniciales se ilustran posteriormente en las figuras y apéndices correspondientes. 

- **Modelado:** la librería React Flow se hace un fuerte en la manera de comunicar sus nodos entre si mediante conexiones. Se tomaron en cuenta un diseño tipo “toolbox” donde se pudiera arrastrar los nodos desde una barra lateral y soltarlos en un “canva”. La idea original del diseño era poder seleccionar las estaciones en una barra lateral y luego fue reemplazado por la idea de poder arrastrar los nodos para darles la posibilidad a los usuarios de programar su estación como en la Figura 12. Los bocetos iniciales se pueden ver con más detalle en el Apéndice Ap-C1. 



_Figura 12. Diseño del canva para el entorno de desarrollo._ 

- **Construcción:** Se implementó una aplicación web basada en React y React Flow, junto con un servidor capaz de suministrar la definición de nodos y manejar el estado de los proyectos construidos por el usuario. Durante esta fase se desarrolló la lógica de arrastrar y soltar nodos, conectar puertos y guardar el grafo resultante. Se ejecutaron pruebas funcionales sobre el IDE visual, verificando la creación, conexión y eliminación de nodos, así como la estabilidad de la interfaz en navegadores de escritorio. Otros diseños que se 

47 

tuvieron en mente para la toolbox se pueden ver con más detalle en los Apéndice Ap-A6 y Ap-A7. 

- **Despliegue:** el producto resultante fue una aplicación web capaz de mostrar la data recolectada en nodos en tiempo real. Pero con inconvenientes para mostrar resultados como promedio, máximo y mínimo. Esto fue debido a que esos datos son almacenados en memoria mediante arreglos que son reiniciados cada 5 min para calcular el promedio con dichos datos. El resultado obtenido puede apreciarse en la Figura 13, para ver con más detalle el resto de nodos pueden dirigirse al Apéndice Ap-A1. 

Ce7 _Figura 13. Aplicación web del entorno de desarrollo._ 

# **Incremento 3: Bróker y Node-red** 

- **Comunicación:** Con el entorno visual ya en marcha, se acordó con el tutor que el siguiente paso sería conectar el IDE con un flujo de datos más realista basado en mensajería MQTT y Node-RED, aprovechando la amplia documentación de esta herramienta para IoT. En las discusiones se enfatizó la importancia de mantener la simplicidad para el usuario final, aun cuando la infraestructura subyacente fuese más compleja. 

- **Planeación:** Se planificó la incorporación de: (a) un bróker MQTT; (b) un flujo en NodeRED capaz de recibir, transformar y reenviar datos; y (c) una arquitectura en la que el entorno de desarrollo pudiera interoperar con Node-RED y con servicios de almacenamiento. Asimismo, se estableció la intención de que esta solución pudiera 

48 

ejecutarse tanto en contenedores Docker como en dispositivos de bajo costo como Raspberry Pi. 

- **Modelado:** En el análisis se definieron los tópicos MQTT a utilizar, las rutas de mensajes y el papel de Node-RED como orquestador de flujos. Se modeló una arquitectura donde la estación publicaba datos en un bróker, Node-RED los procesaba y los reenviaba a servicios de almacenamiento o a la interfaz de usuario, como se muestra en la Figura 14. Este modelo permitía separar la adquisición de datos de la lógica de presentación, a costa de introducir una nueva pieza en la infraestructura. 



<!-- Start of picture text -->
Vv<br>SPQ) 2etSt0<br>moseuitto<br>= 2s = Node-rea<br>=> a<br>—<br></>J=ET Servidorde<br>ei<br><!-- End of picture text -->

_Figura 14. Arquitectura del sistema con NodeRed._ 

- **Construcción:** Se desplegó Node-RED, se configuró un flujo de nodos para suscribirse a los tópicos de la estación, transformar los mensajes y encaminarlos a los componentes correspondientes. Se construyeron las conexiones con el bróker MQTT y se implementaron scripts para levantar y detener los servicios de forma consistente. Las pruebas funcionales 

49 

mostraron que Node-RED permitía recibir, procesar y reenviar datos, pero también evidenciaron la dependencia de una conexión a internet estable para completar el ciclo. 

- **Despliegue:** La solución basada en Node-RED se entregó como versión funcional del sistema al tutor, señaló la complejidad de desplegar y mantener este componente en el contexto escolar previsto. La retroalimentación destacó la vulnerabilidad ante caídas de conectividad y la dificultad de exponer Node-RED directamente a docentes y estudiantes. Como consecuencia, se decidió replantear la arquitectura en el siguiente incremento, eliminando Node-RED y migrando hacia una conexión local por cable serial.  En las figuras 15 y 16 se pueden ver los datos recolectados por la estacion en el broker Mosquitto, en Node-RED y en InfluxDB. 



<!-- Start of picture text -->
= M<br>Z<br>fre192.168,fies! QTT Explorer Q<br>Y broke<br>Uptime . pOsauhto vary on 29<br>Pclients (71, 28onds 2<br>load ©<br>Dstore> mess, soe 1<br>> subse. a<br>*iptions 9<br>pshaved sub<br>> retaingd *"ltions<br>man »> trtespoblis, 905 2 . f<br>Vhs<br>a)<br>a<br><!-- End of picture text -->

_Figura 15. Datos entraste en bróker Mosquitto._ 



<!-- Start of picture text -->
Q Search results 84 rows<br>humidity temperature tise<br>4<br>01 7.8 2025-02-25123 :38:35.878Z<br>35.1 7.8 2025-€2-25123 :38:36.877Z<br>35.4 7.8 2025-02-25123 :38:37.881Z<br>58.4 78 2028-92-25723:38:38.8832<br>“4<br>7 © 9 ols +<br><!-- End of picture text -->



<!-- Start of picture text -->
Tall nodes +| | @all ><br>msg2572/2025, payload 740.29-Object m. node: debug 2 a<br>+ { humidity: 54.8, temperature:<br>17.2, timestamp: 1740526829742}<br>25722025, 740300, m. nose 2 =<br>msq payload Object<br>> { humidity: 54.8, temperatures 8<br>|| 25722025,17.2, timestamp:7.40.31 p.m Oynode; debug 2 eed<br>+ { humidity: 54.8, temperature:<br>Roa<br><!-- End of picture text -->

_Figura 16. Datos de Influx y Node-RED_ 

50 

# **Incremento 4: Conexión Vía Cable Serial** 

- **Comunicación:** A partir de las limitaciones observadas con Node-RED, se discutió con el tutor la necesidad de garantizar que la plataforma pudiera operar de forma confiable en aulas con conectividad limitada o inexistente. Se acordó que el cuarto incremento se concentraría en rediseñar la arquitectura para que la estación se comunicara por cable serial con un servidor local, eliminando la dependencia directa de servicios remotos. 

- **Planeación:** Se planificó entonces: (a) reemplazar el flujo estación → bróker remoto → Node-RED por un esquema estación → puerto serial → servidor local; (b) mantener la lógica de nodos en el IDE sin exigir cambios al usuario final; y (c) asegurar que el sistema siguiera siendo capaz de almacenar y consultar datos históricos. Se definió como objetivo que el sistema fuese totalmente funcional aun sin conexión a internet. 

- **Modelado:** En el análisis se revisaron las características del enlace serial entre la estación y el servidor local, definiendo el formato de tramas, la frecuencia de envío y los mecanismos de control de errores. A partir de ello se modeló una nueva arquitectura en la que el servidor local recibía los datos por el puerto serial y los reenviaba al bróker MQTT local, manteniendo el paradigma de publicación/suscripción. Se rediseñaron los nodos para que continuaran representando comportamientos comprensibles, pero desacoplados de la infraestructura remota. 

• **Construcción:** Se implementó la lógica de lectura del puerto serial en el servidor local y se configuró el bróker MQTT para operar únicamente en la red interna; se adaptó la estación para enviar sus mediciones usando el protocolo serial definido y se ajustaron los componentes del IDE para que consumieran los datos de este nuevo flujo. Las pruebas realizadas confirmaron que los datos eran recibidos y procesados sin depender de internet y que se podían obtener los valores mínimo y máximo para las variables meteorológicas a partir de las muestras capturadas. En este mismo incremento también se abordó el desarrollo de los nodos operadores del IDE, definiendo operadores básicos que reciben como entrada las mediciones publicadas por los nodos de tipo sensor y aplican transformaciones sencillas pero útiles en el contexto de la estación meteorológica escolar, como el cálculo de valores mínimos y máximos o la comparación frente a umbrales, modelados como bloques que procesan los datos entrantes y emiten el resultado hacia otros 

51 

nodos de conexión o visualización, manteniendo la lógica de programación por flujo de datos. 

• **Despliegue:** La nueva arquitectura sin Node-RED se presentó al tutor como una versión más robusta y adecuada para el entorno escolar, al operar de forma independiente de la conectividad externa y simplificar el despliegue en aula. En esta misma entrega se mostraron también los nodos operadores incorporados al IDE, evidenciando cómo permitían calcular mínimos, máximos y verificar umbrales directamente sobre las mediciones de la estación, haciendo más explícitas las transformaciones de datos para niñas y niños. La retroalimentación fue positiva respecto a ambos aspectos, aunque se señaló la conveniencia de no renunciar por completo a la posibilidad de replicar datos en la nube, lo que motivó que el siguiente incremento se orientara al diseño de un mecanismo de puente MQTT entre el bróker local y uno remoto. En la Figura 17 se pueden observar la conexión realizada en ambas Micro:Bit. 



_Figura 17. Micro:Bits conectadas por protocolo serial._ 

# **Incremento 5: puente MQTT** 

- **Comunicación:** Tras estabilizar la operación local, se discutió con el tutor la conveniencia de ofrecer un mecanismo opcional para replicar datos hacia un bróker remoto, de forma que la escuela o el docente pudieran consultar la información desde fuera de la red local si 

52 

lo necesitaban. Se acordó que este incremento se centraría en incorporar esa capacidad sin alterar la experiencia de uso del entorno de programación. 

- **Planeación** La planificación contempló: (a) estudiar las herramientas de Mosquitto para implementar un puente entre brokers; (b) definir qué tópicos debían replicarse y bajo qué condiciones; y (c) desarrollar un servicio que ejecutara el puente de manera robusta, manejando reconexiones y errores de red. Se fijó como criterio de éxito que los datos publicados en el bróker local pudieran aparecer, sin intervención del usuario, en el bróker remoto. 

- **Modelado:** En el análisis se identificaron los tópicos relevantes (por ejemplo, los asociados a variables meteorológicas) y se modeló el flujo de datos local → remoto a través del puente MQTT. Se diseñó el puente como un servicio intermedio desacoplado de la lógica del IDE, de modo que la aplicación continuara publicando en el bróker local sin cambios. El modelo especificó los parámetros de conexión, las reglas de reintento y los mecanismos de supervisión del servicio. 

- **Construcción:** Se implementó el puente utilizando las facilidades de Mosquitto y/o un script en Python para gestionar la conexión entre el bróker local y el remoto. Durante la construcción se configuraron certificados, credenciales y políticas de reconexión para asegurar la continuidad del flujo de datos en presencia de fallos de red. Las pruebas consistieron en publicar mensajes de prueba desde el entorno de desarrollo y verificar, mediante herramientas de suscripción, que los datos llegaban correctamente al bróker remoto (como se aprecia en la Figura 18 para el nodo de humedad). 



<!-- Start of picture text -->
[L>oR] sit tation-local/humidit uni ation idity | b'<br>{"value":44.25,"timestamp" :1762651801258, "period": nu.<br>[LoR] sit tation-local/humidit unit ationed idity | b'<br>[L+R] sites/station-local/humidit units/station@1/humidity | b'<br>[L+R] sit tation-local/humidity -> uni atione1 idity | b'<br>{"value":44.16€ »6666€ 4,"t tan 1762651806427, "period" :null<br><!-- End of picture text -->

_Figura 18. Humedad relativa enviada por puente MQTT_ 

- **Despliegue:** La solución del puente MQTT se incorporó al entorno como un servicio de infraestructura, transparente para el usuario final. En la entrega al tutor se comprobó que el sistema podía operar únicamente con el bróker local y, adicionalmente, replicar datos en la nube cuando esta opción estuviera disponible. La retroalimentación confirmó que este 

53 

diseño equilibraba robustez local y extensibilidad remota, y sirvió para orientar el siguiente incremento hacia la construcción de un servidor específico para el dashboard. 

# **Incremento 6: Desarrollo del Servidor del Dashboard** 

- **Comunicación:** Con el flujo de datos estabilizado, se acordó con el tutor que era necesario centralizar el acceso a la información en un servidor que ofreciera una API clara para el dashboard. En las conversaciones se enfatizó la importancia de desacoplar la interfaz gráfica de los detalles de MQTT y del puente, de manera que el dashboard consumiera datos a través de servicios web bien definidos. 

- **Planeación:** Se planificó el desarrollo de un servidor, implementado en Node.js, con responsabilidades definidas: (a) suscribirse a los tópicos relevantes del bróker local; (b) almacenar los datos en una base de datos; y (c) exponer una API REST para consulta de datos en tiempo real e históricos. Se estableció como meta que cualquier cliente (incluido el dashboard) pudiera acceder a la información sin conocer detalles de la infraestructura de mensajería. 

- **Modelado:** En la fase de modelado se diseñó la lógica del servidor, definiendo los modelos de datos para las variables meteorológicas, las tablas o colecciones de almacenamiento y los endpoints principales (por ejemplo, listar últimas lecturas, obtener series temporales o consultar estaciones registradas). Se describió el servidor como un componente intermedio entre el bróker y las interfaces de usuario, lo que permitió formalizar el papel de la API dentro de la arquitectura global. 

- **Construcción:** Se implementó el servidor en Node.js, configurando la suscripción a los tópicos MQTT y la escritura de los datos en la base de datos seleccionada. Se desarrollaron los endpoints REST y se añadieron mecanismos básicos de registro y manejo de errores. Las pruebas funcionales verificaron que el servidor recibía los datos en tiempo real, los almacenaba correctamente y respondía a las solicitudes del dashboard con la información esperada. En la Figura 19 se puede ver distintas conexiones exitosas con el bróker. 

54 



<!-- Start of picture text -->
Sessions Subscriptions<br><!-- End of picture text -->

_Figura 19. Conexiones y suscripciones al bróker vía portal de EMQX_ . 

- **Despliegue:** El servidor se integró con el resto de la plataforma y se presentó al tutor como el núcleo de servicios de datos para el dashboard. La retroalimentación validó esta separación de responsabilidades y sugirió aprovechar la API para mostrar tanto datos en vivo como históricos. Ello condujo al siguiente incremento, dedicado específicamente a la construcción del dashboard y su integración con la API del servidor. 

# **Incremento 7: Aplicación Cliente Dashboard Web** 

- **Construcción:** Con la API disponible, se discutió con el tutor la forma que los niños, así como los docentes, visualizarían los datos de la estación. Se acordó que el dashboard debía ofrecer una interfaz web responsiva, centrada en tarjetas y gráficos simples, que mostrara las variables meteorológicas sin exponer detalles técnicos como tópicos o configuración del bróker. 

- **Planeación:** Se planificó un dashboard que: (a) consumiera exclusivamente la API del servidor; (b) mostrara valores actuales y tendencias recientes de variables seleccionadas; y (c) permitiera, en una fase posterior, incorporar filtros y selección de estaciones. Se definieron las pantallas principales y se establecieron criterios de usabilidad y legibilidad acordes con el público objetivo. 

- **Modelado:** En el análisis se revisaron las necesidades de visualización y se modeló la arquitectura del dashboard, incluyendo los componentes de presentación y su interacción con la API. Se definieron las estructuras de datos que el frontend recibiría (por ejemplo, colecciones de mediciones con marca de tiempo) y se diseñó la arquitectura final del sistema, donde el dashboard se conectaba al servidor sin necesidad de acceder al bróker, como se muestra en la Figura 20. 

55 



<!-- Start of picture text -->
fa Sensores y actuadores<br>Subscrite Serial USB<br>{Pp a<br>J4 oS =|<br>Protocolo HTPP<br>MongoDB<br>(Datos persistentes) APIRest<br>Subscribe TT Publish<br>Broker MATT local ( ) ( ’ ) ( ; )<br>Bridge MOTT<br>Broker MOTT REMOTO (699)<br>Subscribe<br>fe)<br>‘Server del Dashboard </>) = i<br>(=<br>al APIRest<br>Dashboard Ls<br><!-- End of picture text -->

_Figura 20. Arquitectura final del sistema._ 

56 

- **Construcción:** La construcción se realizó utilizando React y TypeScript para el frontend, integrando componentes que consultan la API del servidor y muestran los datos en tablas, indicadores y gráficos. Se implementó la lógica para actualizar las lecturas en tiempo casi real y para asociar cada panel del dashboard a una variable meteorológica específica. Las pruebas confirmaron que, al conectar un nodo de tipo sensor en el entorno de desarrollo, los datos fluían hasta el dashboard y se visualizaban correctamente como en la Figura 21 y 

22. 



<!-- Start of picture text -->
| WeatherReal-time environment St a ltionmonitoring Dashboardfrom distributed sensors<br>station01 6 19:26<br>23.9°C<br>De: AG OF<br>® vomaiy<br><!-- End of picture text -->

_Figura 21. Resultado de conexión Nodo temperatura._ 



<!-- Start of picture text -->
44%<br>® Humidity<br>© tie<br><!-- End of picture text -->

_Figura 22. Humedad relativa en el dashboard._ 

- **Despliegue:** El dashboard se desplegó como parte de la solución completa y se presentó al tutor, quien valoró positivamente la claridad de la interfaz y su alineación con los objetivos educativos. La retroalimentación incluyó sugerencias como la necesidad de que la estación no solo reciba datos y envié al bróker si no que pueda enviar devuelta a la estación meteorológica. 

# **Incremento 8: Nodo Display** 

- **Comunicación:** En este punto del proyecto se discutió con el tutor que, aunque el dashboard web ofrecía una visualización rica, era deseable que la estación pudiera mostrar 

57 

mensajes breves directamente en el aula, sin depender del navegador. Se acordó entonces dedicar un incremento a incorporar un nodo de tipo _display_ que permitiera enviar textos a una pantalla OLED conectada a la estación. 

- **Planeación:** Se planificó el flujo completo para esta funcionalidad: (a) añadir al IDE un nodo de tipo Display; (b) extender la API del servidor con un endpoint específico para recibir mensajes de texto; y (c) implementar en el firmware de la estación el manejo de comandos que actualizan la pantalla OLED a través del puerto serial. Se establecieron como criterios de éxito la correcta visualización de mensajes, el manejo básico de caracteres especiales y la tolerancia a desconexiones del puerto . 

- **Modelado:** En el análisis se revisaron las restricciones de la pantalla OLED (debe enviar por campo de texto y por conexiones) y del enlace serial, definiendo un formato de mensajes adecuado. Se modeló el flujo IDE → API (servidor local) → puerto serial → estación, especificando el uso de comandos tipo DISPLAY|longitud|mensaje y un comando de limpieza (CLEAR). El diseño incluyó la decisión de validar y filtrar las cadenas del lado del IDE/servidor para proteger al firmware de entradas inválidas. 

• **Construcción** En la construcción se implementó en el IDE el componente visual Display, permitiendo que el usuario conecte este nodo a otros nodos de datos o de control y defina el mensaje a enviar. En el servidor se creó el endpoint /display, encargado de recibir el mensaje, validarlo y escribir la trama correspondiente en el puerto serial. En el firmware de la estación se añadió el manejador de comandos DISPLAY y CLEAR, junto con lógica para descartar tramas incompletas sin bloquear el lazo principal. Las pruebas unitarias y de integración verificaron que los mensajes enviados desde el IDE se mostraban correctamente en la pantalla OLED y que el sistema se recuperaba adecuadamente tras desconexiones. El nodo display y la pantalla OLED con el mensaje se pueden ver en las Figuras 23 y 24. 

58 



_Figura 23. Nodo Display_ 



_Figura 24. Pantalla OLED con mensaje enviado desde el IDE._ 

- **Despliegue:** Esta funcionalidad se integró en la plataforma y se presentó al tutor como un mecanismo de retroalimentación inmediata en el propio dispositivo físico. La retroalimentación destacó el valor pedagógico de que niñas y niños vean el efecto directo de sus programas en la estación, más allá del dashboard web. También se identificaron oportunidades futuras, como asociar el nodo Display a estados del clima o alertas específicas, que quedan abiertas como líneas de trabajo para iteraciones posteriores. 

59 

# **Incremento 9: DevZone y datos meteorológicos.** 

- **Comunicación:** En esta etapa se discutió la necesidad de que los datos capturados por la estación meteorológica no solo se registraran y transmitieran, sino que también pudieran visualizarse datos anteriores en el dashboard. Se acordó que la “DevZone” (zona de desarrollo, por sus siglas en inglés.) debía ofrecer un área de gráficos donde los estudiantes pudieran observar la evolución de las variables meteorológicas seleccionadas. 

- **Planeación:** Se planificó que los datos enviados por la estación se almacenaran en arreglos temporales en el servidor, organizados por variable (temperatura, humedad, velocidad del viento, precipitación, etc.). A partir de estos arreglos, el dashboard generaría gráficos solo para aquellas variables que el usuario seleccionara y arrastrara explícitamente hacia la DevZone. Asimismo, se definió una acción de “Crear” dentro del entorno, de modo que los gráficos se generaran únicamente cuando el estudiante confirmara la configuración deseada. 

- **Modelado:** En el modelado se describió el flujo de datos desde la estación hasta los componentes visuales del dashboard. Se definieron estructuras de datos en memoria para almacenar las muestras recientes de cada variable y se diseñaron los elementos gráficos que representarían las variables seleccionables en la DevZone. También se modeló el comportamiento de los bloques, estos tomarán la lista de variables arrastradas al lienzo, una vez se presiones el botón “Crear”, aparecerán uno o más gráficos asociados al arreglo temporal correspondiente, actualizable con nuevas mediciones. 

- **Construcción:** En la fase de construcción se implementó la lógica para recibir las mediciones de la estación, almacenarlas en arreglos temporales y enlazarlas con los componentes de la DevZone. Se desarrollaron los elementos que pueden ser arrastrados al área de trabajo para indicar qué variable se desea visualizar y se programó la acción de “Crear” para instanciar los gráficos en el dashboard. Durante esta etapa se realizaron pruebas funcionales variando las combinaciones de variables seleccionadas y el ritmo de llegada de datos, verificando que los gráficos se actualizarán correctamente con la información contenida en los arreglos temporales. Los resultados se pueden ver en las Figuras 25 y 26. 

60 



<!-- Start of picture text -->
Zona de desarrollo Cerrar<br>Arrastra aqui cualquier bloque del dashboard para<br>“capturarlo”.<br>airQuality - station01 x<br>Métrica airQuality<br>Estacion station01<br>v 867<br>Hora 21:09<br>humidity « station01 x<br>Métrica humidity<br>Estacion station01<br>Valo 5433<br>Hora 21:09<br>CREAR<br><!-- End of picture text -->

# _Figura 25. Zona de desarrollo “DevZone”_ 



<!-- Start of picture text -->
Vista en tiempo real over<br>Gréficas temporaes de los widgets seleccionados en la DevZone.<br>sirQualitysTATioNot 8.17 a humiditystHnioN 53.33<br><!-- End of picture text -->

_Figura 26. Gráficos de variables climáticas seleccionadas._ 

- **Despliegue:** El incremento se integró al IDE como una funcionalidad adicional del dashboard, disponible cuando la estación está enviando datos al servidor. Desde la perspectiva del usuario, el flujo de trabajo consiste en arrastrar las variables de interés a la DevZone, pulsar “Crear” y observar cómo los gráficos comienzan a reflejar en tiempo casi real los cambios en las condiciones meteorológicas. Este 

61 

despliegue permitió cerrar el ciclo de captura, transmisión y visualización de los datos, facilitando el análisis de tendencias y comparaciones para los estudiantes. 

# **Pruebas y Resultados** 

En este apartado se presentan de forma sintética las pruebas y resultados obtenidos durante el desarrollo del prototipo. Las pruebas se ejecutaron de manera incremental al cierre de cada entrega, abarcando adquisición de datos en la estación, publicación y transporte (MQTT), almacenamiento en el backend, cálculo de agregados y visualización en el dashboard, así como aspectos de robustez (reconexión ante fallas de red), rendimiento y usabilidad técnica. Para cada caso se registraron evidencias (logs, métricas de latencia y pérdida, conteos por ventana, capturas de interfaz y videos breves) y se verificaron los criterios de aceptación definidos. El plan de pruebas completo, con procedimientos, casos, datos esperados y formatos de registro, puede verse a continuación en la Tabla 5. 

_Tabla 5. Plan de pruebas y resultados obtenidos._ 

|||**Iteración 1**||
|---|---|---|---|
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Unitaria|Lectura de sensores<br>(Weather:Bit en Micro:bit)|Aprobado|Lecturas estables de temperatura, humedad,<br>presión y lluvia.|
|Integración|Enlace RF Micro:bit (IoT:Bit)|Parcial|Pérdidas intermitentes; latencia 15–20 s; la veleta<br>enviaba cadenasyafectaba el resto de variables.|
|Integración|Envío HTTP a ThingSpeak|Parcial|Publicación funcional pero dependiente de<br>Internet; retardo acumuladopor RF/HTTP.|
|Sistema|Flujo E2E (sensores → RF →<br>ThingSpeak)|Parcial|Visualización<br>final<br>posible,<br>con<br>duplicados/omisiones por la inestabilidad RF.|
|||**Iteración 2**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Unitaria|Render y manipulación de<br>nodos (React Flow)|Aprobado|Nodos<br>arrastrables<br>desde<br>toolbox;<br>aristas<br>configurables.|
|Integración|Actualización en tiempo real<br>en nodos|Aprobado|Datos se reflejan en vivo en la interfaz.|
|Integración|Cálculo de agregados<br>(promedio/máx/mín)|Parcial|Agregados inestables: los arreglos en memoria se<br>reinician cada 5 min.|
|||**Iteración 3**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Integración|Pipeline MQTT → Node-RED<br>→ App|Parcial|Flujo de datos correcto, pero requiere<br>instalación/activación de Mosquitto y Node-<br>RED.|
|Sistema|Panel con datos de bróker +<br>Node-RED|Parcial|Muestra datos en tiempo real; mayor<br>complejidad operativa y dependencia de<br>Internet.|



62 

_Continuación Tabla 5: Plan de pruebas y resultados obtenidos._ 

|||**Iteración 4**||
|---|---|---|---|
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
||Cnión rial (UART) a|||
|Integración|oex se<br>backend|Aprobado|Recepción estable, sin retardo ni pérdidas.|
|Integración|Publicación a bróker**local**|Aprobado|Procesamiento en backend y envío al bróker<br>local sin depender de Internet.|
|Sistema|Operación**offline**end-to-end|Aprobado|Plataforma funcional aun sin conexión; mejora<br>de confiabilidad y latencia.|
|||**Iteración 5**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**<br>|
|Integración|Bridge local ↔ bróker general|Aprobado|Reenvío correcto de tópicos con retardo<br>mínimo y sin pérdidas.|
|Robustez|Reconexión automática|Aprobado|Recupera la transmisión ante caídas de red o<br>|
||||del bróker destino.|
|||**Iteración 6**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Integración|Suscripción a bróker general<br>(MQTT)|Aprobado|Recepción y almacenamiento correctos en el<br>servidor.|
|Integración|Endpoints REST para<br>dashboard|Aprobado|API operativa; baja latencia en respuestas.|
|Desempeño|Tiempos de respuesta del<br>servidor|Aprobado|Entrega estable para consumo del frontend en<br>tiempo real.|
|||**Iteración 7**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Sistema/UI|Visualización en tiempo real<br>por estación y sensor|Aprobado|Datos correctos desde la API del servidor;<br>actualización continua.|
|Integración|Consumo de API (HTTP)|Aprobado|Sincronización<br>consistente<br>en<br>distintos<br>navegadores.|
|Usabilidad|Diseño responsive y<br>portabilidad|Aprobado|Interfaz usable en laptop, tablet y móvil.|
|||**Iteración 8**||
|**Tipo de prueba**|**Título**|**Resultado**|**Observaciones**|
|Integración|Envío de mensaje desde el<br>IDE a la pantalla OLED|Parcial|Mensajes de longitud corta y media se<br>muestran completos y sin caracteres corruptos<br>en la pantalla conectada a la estación. Las<br>cadenas largas no se ven completamente.|



63 

## _<u>Continuación Tabla 5: Plan de pruebas y resultados obtenidos.</u>_ 

|||**Iteración 9**||
|---|---|---|---|
|**Tipo deprueba**|**Título**|**Resultado**|**Observaciones**|
|Sistema/UI|Generación de gráficos a partir<br>de variables seleccionadas|Aprobado|Solo se generan gráficos para las variables<br>arrastradas a la DevZone; al pulsar “Crear” se<br>muestran correctamente en el dashboard.|
|Integración|Actualización en tiempo real<br>de gráficos con datos de la<br>estación|Aprobado|Las gráficas se actualizan con baja latencia usando<br>los arreglos temporales; no se observan bloqueos<br>en la interfaz durante la recepción continua de<br>datos.|
||Visualización simultánea de||Con varias series activas los gráficos se mantienen|
|Desempeño|múltiples<br>variables<br>meteorológicas|Aprobado|fluidos y legibles; el consumo de recursos sigue<br>siendo aceptable para el uso en aula.|



# **Validación** 

Durante el desarrollo se optó por una validación incremental del prototipo: al finalizar cada incremento integrando hardware, firmware y componentes del software se realizó una demostración funcional ante el Ing. Jesús Lárez, tutor del proyecto. En estas sesiones se presentaron los resultados alcanzados, se revisaron los criterios de aceptación asociados a cada objetivo técnico (captura, transmisión, almacenamiento y visualización de datos) y se documentaron observaciones y ajustes sugeridos. Con base en esa evidencia (videos breves, capturas de interfaz, registros de mensajes y consultas a la base de datos), el tutor emitía su visto bueno o indicaba correcciones puntuales que se incorporaban en el siguiente ciclo. Este mecanismo permitió asegurar, de forma progresiva, que cada entrega añadiera valor y quedara alineada con el alcance definido. 

Es importante destacar que quedó expresamente fuera del alcance del proyecto la evaluación pedagógica del impacto en niñas y niños (aprendizajes, motivación o resultados académicos) y la realización de ensayos controlados en aula. En consecuencia, la validación realizada se centró en verificar la operatividad y usabilidad técnica del sistema frente a los requerimientos establecidos, confirmando con el visto bueno del tutor que el prototipo con su documentación cumple con los objetivos planteados y está listo para ser utilizado como soporte en contextos educativos, sin pretender demostrar efectos educativos en la población infantil. 

# **Capítulo V. Conclusiones.** 

El desarrollo de la Plataforma para Construcción y Programación de Estaciones Meteorológicas Orientadas a Estudiantes de Educación Básica permitió mostrar la posibilidad de integrar conceptos de pensamiento computacional con herramientas tecnológicas de carácter didáctico. El proyecto logró materializar un prototipo funcional que, además de captar y transmitir datos meteorológicos en tiempo real, facilitó la interacción de forma práctica con componentes físicos y software educativo. Esto contribuyó directamente a los objetivos de alfabetización digital y al cumplimiento de los ODS 4 (educación de calidad) y 13 (acción por el clima) planteados en la investigación, destacando la pertinencia de la propuesta en el contexto educativo actual. 

El desarrollo de un prototipo inicial permitió explorar alternativas de comunicación y sentar las bases para la construcción de la estación meteorológica definitiva. A partir de las limitaciones encontradas, se depuraron supuestos técnicos, se identificaron restricciones de integración y se tomó la decisión de migrar hacia una plataforma más adecuada para el contexto escolar. Estos resultados sirvieron para delimitar con mayor precisión los requisitos funcionales y no funcionales de la solución, de modo que las decisiones técnicas iniciales se transformaron en insumos concretos para el diseño de la plataforma final. 

Asimismo, la aplicación de una metodología basada en el modelo incremental resultó idónea, dado que permitió construir iterativamente los módulos de hardware y software, evaluando su funcionamiento en cada ciclo y ajustando el diseño conforme a los resultados, siguiendo la aproximación propuesta por Pressman (2010) para el desarrollo de software educativo. De esta manera, los aprendizajes obtenidos en las pruebas técnicas tempranas se incorporaron en los incrementos posteriores sin comprometer la estabilidad de la solución, evitando anclar el proyecto a decisiones tecnológicas frágiles. 

El estudio bibliográfico y documental permitió identificar que, aunque existen múltiples desarrollos de estaciones meteorológicas de carácter científico, su aplicación educativa en niveles básicos es limitada. Igualmente, se evidenció que el pensamiento computacional es un elemento clave para la formación integral en edades tempranas, pero requiere recursos adaptados, interactivos y de baja complejidad para su adecuada asimilación. 

El diseño de la plataforma integró tanto la arquitectura de hardware como el software asociado, cuidando que la complejidad técnica se adaptara a un nivel escolar básico. El empleo de programación por bloques permitió abstraer los procesos de comunicación y transmisión de datos, 

65 

facilitando que los estudiantes comprendieran la lógica subyacente sin necesidad de dominar lenguajes de programación complejos. 

Las pruebas realizadas confirmaron la operatividad del sistema, verificando la correcta captura, transmisión, almacenamiento y visualización de datos meteorológicos. Además, se verificó la facilidad para la construcción y programación mediante un entorno amigable, alcanzado la orientación pedagógica planteada. La validación mostró el potencial de la plataforma para de despertar el interés de los usuarios y fomentar la exploración científica en el aula. 

Se elaboró una documentación completa que describe tanto la arquitectura del sistema como los procedimientos de construcción, instalación y uso. Este material no solo fue esencial durante el desarrollo, sino que se constituye de una guía práctica que permitirá la replicación del proyecto en otros contextos educativos, favoreciendo su sostenibilidad y escalabilidad. 

# **Recomendaciones** 

Se recomienda realizar estudios posteriores que midan de manera sistemática el impacto de la plataforma en el desarrollo del pensamiento computacional, la alfabetización digital y la comprensión de conceptos climáticos en niñas y niños. Esto puede incluir el diseño de actividades de aula, instrumentos de evaluación antes y después de la intervención y el análisis de resultados con muestras más amplias. 

Con miras a un despliegue escolar sostenido, es recomendable incorporar mejoras explícitas en accesibilidad (contrastes adecuados, tamaños de fuente configurables, mensajes claros, compatibilidad con lectores de pantalla). 

Se propone explorar la integración de nuevos sensores (p. ej, ruido ambiental, radiación solar) y el diseño de proyectos que vinculen ciencias naturales, matemática y tecnología, reforzando la idea de trabajar con datos reales del entorno para abordar problemas vinculados con el clima y el ambiente desde el aula. 

Finalmente, se recomienda que cualquier despliegue institucional de la plataforma vaya acompañado de espacios de formación para docentes, donde se aborden nociones básicas de pensamiento computacional, uso de la estación meteorológica, interpretación de los datos y posibles estrategias didácticas para integrar la herramienta en sus planificaciones. 

# **Referencias Bibliográficas** 

- Aasman, J. (2017). _Practical Data Integration with Node-RED_ . ACM Press. 

- Aguado, E., & Burt, J. E. (2015). _Understanding Weather and Climate_ (7th ed.). Pearson. 

- Ahrens, C. D. (2012). Meteorology Today: An Introduction to Weather, Climate, and the Environment (10th ed.). Cengage Learning. 

- Arroyo, S., & Espinosa, S. (2020). Estaciones Meteorológicas en el Aula: Una Estrategia para Aprender Ciencias Naturales. Revista de Educación, 27(2), 45-60 

- Ashton, K. (2009). That 'internet of things' thing. _RFID Journal_ , 22(7), 97-114. 

- Banzi, M., & Shiloh, M. (2014). _Getting Started with Arduino_ (3rd ed.). Maker Media. <u>https://www.arduino.cc/</u> 

- Bers, M. U. (2020). Coding as a playground: Programming and computational thinking in the early childhood classroom. Routledge. 

- Bianchini, J. A., & Cavazos, L. M. (2020). Learning to teach science in ways that promote gender equity. _Cultural Studies of Science Education_ , 15(2), 313-339. <u>https://doi.org/10.1007/s11422-020-09990-4</u> 

- Boehm, B. W. (1988). A spiral model of software development and enhancement. _ACM SIGSOFT Software Engineering Notes_ , 11(4), 14-24. https://doi.org/10.1145/2235.2236 

- Brennan, K., & Resnick, M. (2012). New frameworks for studying and assessing the development of computational thinking. Proceedings of the 2012 Annual Meeting of the American Educational Research Association, 1-25. 

- Bungum, B., & Mogstad, E. (2024). Building and programming a weather station: Teachers’ views 

   - on values and challenges in a comprehensive STEM project. _Research in Science &_ 

   - _Technological Education, 42_ (2), 450–466. <u>https://doi.org/10.1080/02635143.2022.2103108</u> 

- Bybee, R. W. (2013). _The Case for STEM Education: Challenges and Opportunities_ . NSTA Press. Caprile, M., Palmén, R., Sanz, P., & Dente, G. (2015). Encouraging STEM studies for the labour market. _European Union_ . https://doi.org/10.2861/803 

- Díaz Mulas, B. (2016). _UART: Universal Asynchronous Receiver-Transmitter_ . Trabajo de Fin de Grado. Universidad Carlos III de Madrid. 

67 

EMQ (s. f.). _About Us_ . EMQ Technologies Inc. Recuperado el 1 de septiembre de 2025, de <u>https://www.emqx.com/en/about</u> 

- Espejo, P. (2022). Entorno de Robótica Educativa Multiagente Orientado a Favorecer el Desarrollo del Pensamiento Computacional en Jóvenes Cursantes de Educación Media [Tesis de Pregrado, Universidad Católica Andrés Bello]. 

- Fraden, J. (2016). _Handbook of Modern Sensors: Physics, Designs, and Applications_ (5th ed.). Springer. doi:10.1007/978-3-319-19303-0 

- Fries-Gaither, J. (2008). _Weather stations: Teaching the Science and Technology Standard_ . Beyond Penguins and Polar Bears. <u>https://beyondpenguins.ehe.osu.edu/issue/weather-andclimate-from-home-to-the-poles/weather-stations-teaching-the-science-and-technologystandard</u> 

- Gobierno del Perú. (2024). _Especialistas advierten tener cuidado con radiación ultravioleta en los días nublados de verano_ . <u>https://www.gob.pe/institucion/hnch/noticias/895891especialistas-advierten-tener-cuidado-con-radiacion-ultravioleta-en-los-dias-nublados-deverano</u> 

- González-Delatorre , A., Terán-Ángel, G., Ortega-Moreno, M. E. ., & Montilla-Calderón , L. E. (2023). Determinación de los hábitos de exposición solar y prácticas de fotoprotección, en individuos que se ejercitan al aire libre, en la región andina venezolana. _Iatreia_ , _36_ (2). 197209 https://doi.org/10.17533/udea.iatreia.169 

- Gubbi, J., Buyya, R., Marusic, S., & Palaniswami, M. (2013). Internet of Things (IoT): A vision, architectural elements, and future directions. _Future Generation Computer Systems_ , 29(7), 1645-1660. 

- Hampson, C., Mulligan, G., & Scott, B. (2016). _A Visual Introduction to Node-RED and IoT Development_ . Journal of Internet Technologies, 3(1), 22-30. 

- Hernández, R., Fernández, C., & Baptista, P. (2010). _Metodología de la investigación_ . México: McGraw-Hill. 

- Hewitt, P. G. (2016). _Conceptual Physics_ (12th ed.). Pearson. 

- Honey, M., Pearson, G., & Schweingruber, H. (2014). _STEM Integration in K-12 Education: Status, Prospects, and an Agenda for Research_ . National Academies Press. 

- Hurtado, J. (2000). _Metodología de la investigación holística_ . Caracas: Fundación Sypal. 

68 

- Intergovernmental Panel on Climate Change (IPCC). (2007). _Impacts, Adaptation and Vulnerability_ . Cambridge University Press 

   - <u>https://www.ipcc.ch/site/assets/uploads/2018/03/ar4_wg2_full_report.pdf</u> 

- Johnston, W. M., Hanna, J. R. P., y Millar, R. J. (2004). Advances in dataflow programming languages. _ACM Computing Surveys, 36_ (1), 1–34. https://doi.org/10.1145/1013208.1013209 

- Kelleher, C., & Pausch, R. (2005). Lowering the barriers to programming: A taxonomy of programming environments and languages for novice programmers. ACM Computing Surveys, 37(2), 83-137. 

- Longworth, B. (2008). _Oceanographic Sampling and Climate Observation_ . globalchange.gov 

- Lutgens, F. K., & Tarbuck, E. J. (2019). _The Atmosphere: An Introduction to Meteorology_ (14th ed.). Pearson. 

- Maloney, J., Resnick, M., Rusk, N., Silverman, B., & Eastmond, E. (2010). The Scratch programming language and environment. ACM Transactions on Computing Education, 10(4), 1-15. 

- Mansouri, E. (2014). _Innovative Software for Personal Weather Stations in Schools_ . Weather Underground. WeatherSTEM. 

- Margot, K. C., & Kettler, T. (2019). Teachers’ perception of STEM integration and education: A systematic literature review. _International Journal of STEM Education_ , 6(1), 2-18. <u>https://doi.org/10.1186/s40594-019-0192-1</u> 

- Mlefever. (2020). _Weather Stations: Teaching the Science and Technology Standard - Beyond Penguins and Polar Bears_ . Beyond Penguins And Polar Bears - Just Another Sites.EHE. <u>https://beyondpenguins.ehe.osu.edu/issue/weather-and-climate-from-home-to-thepoles/weather-stations-teaching-the-science-and-technology-standard</u> 

- Morán, K. (2023). Robot Orientado a Promover el Desarrollo del Pensamiento Computacional en Niños de Educación Inicial. [Tesis de Pregrado, Universidad Católica Andrés Bello]. 

- Myers, B. A. (1990). Taxonomies of visual programming and program visualization. Journal of Visual Languages & Computing, 1(1), 97-123. 

- National Oceanic and Atmospheric Administration (NOAA). (2023). _Understanding Climate Variability_ . noaa.gov. 

69 

- National Research Council. (2012). _A Framework for K-12 Science Education: Practices, Crosscutting Concepts, and Core Ideas_ . The National Academies Press. 

NOAA. (2023). _Climate Education Resources_ . climate.gov 

- OASIS. (2014). _MQTT Version 3.1.1_ . Edited by Andrew Banks & Rahul Gupta. OASIS Standard, 29 October 2014. 

- ONU. (2015). _Transformar nuestro mundo: La Agenda 2030 para el Desarrollo Sostenible_ . Naciones Unidas. 

- Ortiz, M. (2012, 9 de septiembre). Modelo incremental. En Ingeniería de Software. https://iswudistrital.blogspot.com/2012/09/ingenieria-de-software-i.html 

- Papert, S. (1980). _Mindstorms: Children, Computers, and Powerful Ideas_ . Basic Books. 

- Pressman, R. S. (2010). _Ingeniería del software: un enfoque práctico_ (7ª ed.). McGraw-Hill. 

- Purcell, M. E. (2019). Hubris, revelations and creative pedagogy: Transformation, dialogue and modelling “professional love” with LEGO®. _Journal of Further and Higher Education_ , 43(10), 1391-1403. https://doi.org/10.1080/ 0309877X.2018.1490948 

- Repenning, A., Webb, D. C., Koh, K. H., Nickerson, H., Miller, S. B., Brand, C., … Repenning, N. (2015). Scalable Game Design: A strategy to bring systemic computer science education to schools through game design and simulation creation. _ACM Transactions on Computing Education, 15_ (2), Article 11. https://doi.org/10.1145/2700517 

- Quyen, K. T., Van Bien, N., & Thuan, N. A. (2023). Micro: bit in Science Education: A systematic review. _Jurnal Penelitian dan Pembelajaran IPA_ , _9_ (1), 1-14. 

- Resnick, M., et al. (2009). Scratch: Programming for all. Communications of the ACM, 52(11), 60-67. 

- Sahu, P., & Oinam, A. (2021). Node-RED: Simplifying IoT Application Development. _International Journal of Information Systems_ , 8(4), 45-59. 

- Schmitt, A., Carlier, F., & Renault, V. (2018). _Dynamic bridge generation for IoT data exchange via the MQTT protocol_ . Procedia Computer Science, 130, 90–97. https://doi.org/10.1016/j.procs.2018.04.016 

- Sentance, S., Waite, J., Hodges, S., MacLeod, E., & Yeomans, L. E. (2017). “Creating cool stuff”: Pupils’ experience of the BBC micro:bit. In _Proceedings of the 48th ACM Technical Symposium on Computer Science Education (SIGCSE ’17)_ (pp. 531–536). https://doi.org/10.1145/3017680.3017749 dl.acm.org+1 

70 

- Sousa, T. B. (2012). _Dataflow programming: Concept, languages and applications_ . In _Doctoral Symposium on Informatics Engineering (DSIE 2012)_ . Oporto, Portugal. 

- University of Ohio. (2008). _Weather Stations: Teaching the Science and Technology Standard_ . <u>Beyond Penguins and Polar Bears.</u> 

- U.S. Global Change Research Program. (2009). _Conocimiento Climático: Los Principios Esenciales de la Ciencia Climática_ . www.globalchange.gov . 

- UPEL (2003). _Manual de trabajos de grado de especialización y maestría y tesis doctorales._ Caracas: FEDUPEL. 

- Verborgh, R., Vander Sande, M., & De Wilde, T. (2018). Web Services Integration with NodeRED: Enhancing IoT Applications. _Journal of Web Engineering_ , 15(2), 112-130. 

- Wang, X. (2020). Orchestrating IoT with Node-RED: Challenges and Best Practices. _Sensors_ , 20(14), 3928. 

- Wing, J. M. (2006). Computational Thinking. _Communications of the ACM_ , 49(3), 33-35. <u>https://doi.org/10.1145/1118178.1118215</u> 

- Wolfram, D. (2020). _Real-Time Data Processing in IoT with Node-RED_ . Springer. 

- World Health Organization: WHO. (2019). _Pneumonia_ . <u>https://www.who.int/healthtopics/pneumonia/#tab=tab_1</u> 

- Zapata Ros, M. (2012). _La alfabetización digital y la sociedad del conocimiento: claves para la inclusión digital_ . RED, Revista de Educación a Distancia, (32). 

Zapata Ros, M. (2015). _Competencias digitales en el ámbito educativo: marco conceptual y propuestas de acción_ . Innovación Educativa, (25), 37-48. 

# **Apéndices** 

# **Apéndice A** 



<!-- Start of picture text -->
tx] ° °<br>Temperatura Presion Velocidad Viento<br>e e e<br>—C --hPa ~-mis<br>° ° °<br>Humedad Calidad Aire Direccién Viento<br>e<br>~% _ _<br>9 °<br>Altitud e Pluviosidad e<br>St) -mm<br><!-- End of picture text -->

_Figura Ap-A1. Nodos de tipo sensor_ 

72 



<!-- Start of picture text -->
J @1h @3h @6n c<br>% Esperando sensor<br>5 @th @3nh @6n C<br>% Esperando sensor<br>@ih @3h @6h<br>& Esperando sensor<br><!-- End of picture text -->

_Figura Ap-A2. Nodos operadores (esperando por la conexión con un nodo de tipo sensor)_ 



<!-- Start of picture text -->
e Cloud<br>Desconectado<br><!-- End of picture text -->

_Figura Ap-A3. Nodo cloud (desconectado):_ 

73 



<!-- Start of picture text -->
°<br>Temperatura<br>e<br>—°C°, e Cloud<br>°<br>Humedad<br>-%<br>°<br>Presion<br>e<br>--hPa<br><!-- End of picture text -->

_Figura Ap-A4. Nodos sensores conectados a Nodo cloud_ 



<!-- Start of picture text -->
° Cloud<br>Temperatura \ — J<br>|<br>—C<br>oe undefined Humedad<br>Humedad Conectado a: Humedad<br>~% @1n @an @on<br><!-- End of picture text -->

_Figura Ap-A5. Nodos sensores, operadores y cloud conectados entre sí._ 

74 



<!-- Start of picture text -->
a . .<br>® Bloques a<br>Programables oe<br>| Sensores a<br>.<br>||<br>.|<br>| Operadores Oe<br>;<br>| |<br>a.<br><!-- End of picture text -->

_Figura Ap-A6. Primer diseño de la toolbox_ 

75 



<!-- Start of picture text -->
a<br>Toolbox<br>°<br>sensor<br>°<br>‘Temperatura<br>e<br>Cc<br>°<br>Humedad<br>~%<br>°<br>Presion<br>.<br>hPa<br><!-- End of picture text -->

_Figura Ap-A7. Segundo diseño de la toolbox_ 

76 

# **Apéndice B** 



_Figura Ap-B1. Sensor de partículas_ 



_Figura Ap-B 2. BME280_ 

77 



_Figura Ap-B 3. Micro: Bit con Iot: Bit_ 

78 



<!-- Start of picture text -->
—\<br><o || 5<br>Wee ames '<br>||<br>|<br>bee<br>=" A<br><!-- End of picture text -->

_Figura Ap-B 4. Velata_ 

79 



<!-- Start of picture text -->
e40<br><!-- End of picture text -->

_Figura Ap-B 5. Anemómetro_ 

80 



_Figura Ap-B6. Pluviómetro_ 

81 

# **Apéndice C** 



<!-- Start of picture text -->
©@6eO Pacer yor) a as<br>raeg NesOh ot “ORT: z===<br>~ Anome ithe f f Ploqucs | Nog "aim<br>=\klem fey] ses . ais<br>Re ei eee<br>: 8 Oump a =<br>Conder mucho. UV = Foceeor Soy sa =<br>5Pouin > Goch erleal Pp, en<br>Pace jolie : OT 50no. liza f, ci SS==<br>ara — sh<br>Z _ —<br>ee miied— as = a<br><!-- End of picture text -->

_Figura Ap-C1. Apuntes Día 1_ 

82 



<!-- Start of picture text -->
(PeaceROE aieS aee Raefl $4 0<br>J RTA BEER DBae =<br>0r<br>)<br><!-- End of picture text -->

_Figura Ap-C2. Apuntes de pruebas de protocolos de comunicación (izquierda) y diseños_ 

_preliminares (derecha)_ 



_Figura Ap-C3. Apuntes de pruebas de la ESP_ 

83 



_Figura Ap-C4. Primer esquema de arquitectura del sistema_ 



_Figura Ap-C5. Esquema del sistema incluyendo un broker remoto_ 

84 



_Figura Ap-C6. Diseños de la aplicación con InfluxDB como base de datos temporal_ 



_Figura Ap-C7. IDE local y aplicación final_ 

85 



_Figura Ap-C8. Diseños de los nodos de operadores_ 

86 



_Figura Ap-C9. Diseño del sistema final con IDE y dashboard_ 

87 



_Figura Ap-C 10. Vistas de la aplicación final con menú Dev Zone_ 

