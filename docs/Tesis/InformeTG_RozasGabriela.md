

### **UNIVERSIDAD CATÓLICA ANDRÉS BELLO** 

### **FACULTAD DE INGENIERÍA** 

**ESCUELA DE INGENIERÍA INFORMÁTICA** 

### **Servidor para Interconexión de Dispositivos IoT de Laboratorios de Ingeniería Informática y Civil - UCAB Gy** 

### **Trabajo de Grado** 

presentado ante la 

### **UNIVERSIDAD CATÓLICA ANDRÉS BELLO** 

como parte de los requisitos para optar al título de 

### **INGENIERO EN INFORMÁTICA** 

Realizado por Rozas Bolívar, Gabriela Carolina 

Tutor industrial Bolívar Sánchez, María Victoria Tutor académico Fonseca Droy, Francisco José Fecha Septiembre, 2023 

¥—<—| UNIVERSIDAD CATOLICA ANDRES BELLO Prolongacién Av. Atléntico. Puerto Ordaz. (IElyYey]7 elt: (0286)Facultad 600-02-36 de Fax Ingenieria (0286) 600-02-36 

SS 

Escuela de Ingenieria Informatica 

Periodo: 202415 

NRC: 17464 

## ACTA DE TRABAJO DE GRADO 

Ciudad Guayana, 22 de Noviembre de 2023 

Los suscritos profesores: José Fonseca Droy, Oriana Renaud Pascual y Romel Silva Bricefio, integrantes del jurado calificador del Trabajo de Grado intitulado "Servidor para interconexién de dispositivos loT de laboratorios de Ingenieria Informatica y Civil - UCAB Guayana", elaborado por la bachiller Rozas Bolivar, Gabriela Carolina, cédula de identidad N° 25274402, para optar al Titulo de merecedorIngeniera en Informatica, certifican que, eee rag eeumniado dicho trabajo, consideramos que es puntos. de la calificacionde_Dx'2 cs¢e'e (14) 

Observaciones: 



<!-- Start of picture text -->
Jose Fonseca Dr<br>€)<br>ro CATOLCsion Gotan) /<br>-<br>afsee OD@. ea)<br>Oriana Renaud Pascual os 5 Romef Silya Bricefio<br>Jurado Jura‘<br>g UCAB ry<br>Ri cevin SF<br>Secretaria General<br>c.c. Escuela<br>Impreso por: Imedinac Fecha y Hora de Impresién: 22/11/2023 12:49:44 p.m<br><!-- End of picture text -->

Pagina 1 de2 

### **Dedicatoria** 

_El presente trabajo se lo dedico a mis padres, quienes siempre me han apoyado, y me impulsan a ser una mejor persona cada día._ 

### **Agradecimiento** 

_A mis padres, por siempre apoyarme en los momentos difíciles, e insistirme que debía avanzar, y nunca desfallecer._ 

_A mis hermanos, por acompañarme y apoyarme toda mi vida._ 

_Al profesor José Fonseca, mi tutor académico, por todo su apoyo y paciencia a lo largo de la realización de este trabajo, también por sus consejos, orientaciones y compartir sus experiencias._ 

_A la profesora María Victoria Bolívar, por ejercer como mi tutora industrial. Al profesor Jesús Larez, por darme orientaciones y prestar apoyo al momento de prestar los equipos que fueron utilizados para la maqueta física del prototipo realizado en Venezuela._ 

### **Índice de Contenido** 

|**Introduc**|**ción**|1|
|---|---|---|
|**Capítulo**|**I. El Problema**|2|
|Planteami|ento del Problema|2|
||Objetivo General|5|
||Objetivos Específicos|5|
|Alcance||5|
|Limitacio|nes|6|
|Justificaci|ón|6|
|**Capítulo**|**II. Marco Teórico**|**7**|
|Antecede|ntes|7|
|Base Teor|icas|8|
||Inmótica|8|
||Sensores|8|
||Actuadores|9|
||Arquitectura de la red|9|
||Raspberry Pi 4 Modelo B|10|
||Raspberry Pi OS|10|
||Fotorresistencia (LDR)|10|
||Módulo de relé de 4 canales|11|
||Sensor digital de temperatura y humedad (DHT11 y DHT22)|12|
||Sensor de agua|12|
||Sensor PIR de movimiento (Sensor HC-SR501)|13|
||Arduino UNO R3|13|
||Arduino MEGA 2560 R3|13|
||ESP8266 NodeMCU|14|
||Visual Studio Code|14|
||Computación Virtual en Red (VNC)|14|



|RealVNC|15|
|---|---|
|Arduino Software (Arduino IDE)|15|
|I2C (Circuito Inter-Integrado)|15|
|MQTT (Message Queuing Telemetry Transport)|16|
|Python|17|
|Eclipse Mosquitto|17|
|Remote Dictionary Server (Redis)|17|
|Celery|17|
|Django|18|
|Sqlite3|19|
|Django Channels|19|
|**Capítulo III. Marco Metodológico**|**21**|
|Tipo de Investigación|21|
|Técnicas e Instrumentos de Recolección de Datos|21|
|**Capítulo IV. Desarrollo y Resultados**|**23**|
|Metodología de Desarrollo Utilizada|23|
|Procedimiento Metodológico|24|
|**Capítulo V. Conclusiones y Recomendaciones**|**67**|
|**Referencias Bibliográficas**|**68**|
|**Apéndices y/o Anexos**|**71**|
|Anexo A|71|
|Anexo B|72|
|Anexo C|73|
|Apéndice A|74|
|Apéndice B|75|
|Apéndice C|76|
|Apéndice D|76|



ii 

### **Índice de tablas** 

|Tabla 1. Comparativa entre Raspberry Pi 4 modelo B, Raspberry Pi 3 modelo B, e Iduino Yun|
|---|
|Shield ............................................................................................................................................ 25|
|Tabla 2. Sensores, actuadores y dispositivos IoT utilizados para la construcción del prototipo y su|
|aplicación ...................................................................................................................................... 26|
|Tabla 3. Eventos que lleva a cabo el Arduino UNO R3 según el valor de x ................................ 49|



iii 

### **Índice de figuras** 

|Figura 1.**Símbolo de LDR**........................................................................................................... 10|
|---|
|Figura 2.**LDR configurada en Pull down (a) y Pull up (b)**...................................................... 11|
|Figura 3.**Módulo relé de 4 canales**............................................................................................. 11|
|Figura 4.**Sensores de temperatura/humedad DHT11 y DHT22**............................................. 12|
|Figura 5.**Sensor de agua**............................................................................................................. 13|
|Figura 6.**Arduino UNO R3**......................................................................................................... 13|
|Figura 7.**Arduino MEGA 2560 R3**............................................................................................ 14|
|Figura 8.**Arquitectura MQTT**................................................................................................... 16|
|Figura 9.**Comunicación en Celery**............................................................................................. 18|
|Figura 10.**Arquitectura de desarrollo de Django**..................................................................... 19|
|Figura 11.**Configuración de Django Channels**......................................................................... 20|
|Figura 12.**Aplicación de la metodología Scrum**........................................................................ 23|
|Figura 13.**Maqueta completa del prototipo realizado en Venezuela**...................................... 27|
|Figura 14.**Resultados obtenidos del prototipo desarrollado en Venezuela**............................ 28|
|Figura 15.**Esquemas de conexión realizado en Venezuela (Izquierda), y realizado en Chile**|
|**(Derecha)**...................................................................................................................................... 29|
|Figura 16.**Esquema eléctrico del ESP8266 NodeMCU**............................................................ 30|
|Figura 17.**Esquema eléctrico del Arduino MEGA 2560 R3**.................................................... 31|
|Figura 18.**Esquema eléctrico del Arduino UNO R3 y su relación con el Arduino MEGA**|
|**2560 R3**......................................................................................................................................... 31|
|Figura 19.**Esquema eléctrico del Raspberry Pi conectando en un bus I2C con el Arduino**<br>**MEGA 2560 y el Arduino UNO**................................................................................................. 32|



iv 

|Figura 20.**Maqueta completa del prototipo realizado en Chile.**............................................. 33|
|---|
|Figura 21.**Actividades del administrador**................................................................................. 34|
|Figura 22.**Actividades de los usuarios registrados**................................................................... 34|
|Figura 23.**Actividades de los todos los usuarios**....................................................................... 35|
|Figura 24.**Diseño de las tablas en el módulo "iot" de la base de datos**.................................. 36|
|Figura 25.**Esquema del funcionamiento del servidor**.............................................................. 38|
|Figura 26.**Diseño de la página de Laboratorios - Laboratorio de Prototipos**....................... 39|
|Figura 27.**Diseño de la página de Registros – Laboratorio de Prototipos**............................. 40|
|Figura 28.**Lecturas de los sensores conectados al ESP8266 NodeMCU recibidas del**|
|**Raspberry Pi**................................................................................................................................ 42|
|Figura 29.**Registro, o register.html**............................................................................................ 44|
|Figura 30.**Editar perfil, o profile.html**...................................................................................... 44|
|Figura 31.**Iniciar sesión, o login.html**........................................................................................ 45|
|Figura 32.**Cerrar sesión, o logout.html**..................................................................................... 46|
|Figura 33.**Inicio, o home.html**.................................................................................................... 46|
|Figura 34.**Backup, o Backup.html**............................................................................................. 47|
|Figura 35.**Área administrativa del servidor web**..................................................................... 47|
|Figura 36.**Acerca de, o About.html**........................................................................................... 48|
|Figura 37.**Detectando los dispositivos conectados al bus I2C con el comando i2cdetect**...... 50|
|Figura 38.**Temperatura y humedad relativa del laboratorio de prototipo y niveles**............ 58|
|Figura 39.**Control de las luces del laboratorio de prototipo y niveles de iluminación**......... 59|
|Figura 40.**Control de los AC y detección de presencia, seguridad y fugas**............................ 60|



v 

|Figura 41.**Registro del histórico - Barra de selección**.............................................................. 60|
|---|
|Figura 42.**Registro del histórico - Temperatura**...................................................................... 61|
|Figura 43.**Registro del histórico - Humedad relativa**.............................................................. 61|
|Figura 44.**Registro del histórico - Gráficas de nivel de luminosidad y horas de encendido**62|
|Figura 45.**Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la**<br>**sección 1**....................................................................................................................................... 62|
|Figura 46.**Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la**|
|**sección 2**....................................................................................................................................... 62|
|Figura 47.**Registro del histórico - Presencia**............................................................................. 63|
|Figura 48.**Raspberry Pi 4 Modelo B y asignación de pines**..................................................... 71|
|Figura 49.**Módulo HC-SR501 y sus partes**............................................................................... 72|
|Figura 50.**Crowtail ESP8266 NodeMCU y sus partes**............................................................. 73|
|Figura 51.**Registro del laboratorio de prototipos exportado en Excel (.xls)**.......................... 75|



vi 



### **UNIVERSIDAD CATÓLICA ANDRÉS BELLO** 

### **FACULTAD DE INGENIERÍA ESCUELA DE INGENIERÍA INFORMÁTICA** 

### **Servidor para Interconexión de Dispositivos IoT de Laboratorios de Ingeniería Informática y Civil - UCAB Gy** 

Autor: Rozas Bolívar, Gabriela Carolina Tutor: Fonseca Droy, Francisco José Fecha: Septiembre, 2023 

### **Resumen** 

Los estudiantes de la UCAB Guyana han utilizado los servicios de los laboratorios para realizar tecnologías, trabajos de asesoría y consultoría, entre otras actividades de carácter académico, reconociendo la capacidad técnica de las instalaciones y la responsabilidad del personal encargado. Luego de realizar una serie de entrevistas no estructuradas a las entidades pertinentes, que en este caso fueron: María Victoria Bolívar, coordinadora de los laboratorios y los docentes que utilizaban las instalaciones; se averiguó que el laboratorio de Desarrollo de Aplicaciones Móviles y Multimedia, de Informática; y el laboratorio de Ingeniería Sanitaria, de Civil; deben cumplir con unos requisitos de calidad que se encuentran establecidos en las normas ISO 9001 y 17025; y que cada instalación cuenta con un técnico que es responsable de su supervisión y control, pero que en ocasiones estos debe ausentarse, bien sea porque deba estar en otra área de la universidad, o fuera del recinto. 

Para dar respuesta a la situación descrita, se realizó una propuesta para la implementación de la Inmótica en la UCAB Guayana como aporte a la Implantación de la Norma 14001:2004, que satisfaga los requerimientos actuales y permita la integración con otros sistemas. Se precisó del uso de la metodología ágil basado en Scrum, donde se levantaron y analizaron los requerimientos del proyecto para luego priorizarlos. El desarrollo de los objetivos planteados dio como resultado un prototipo de servidor que cuenta con una maqueta física para simular la ambientación de ambas instalaciones; y un servidor web para la gestión de información. 

Palabras clave: _Inmótica, Servidor web, Prototipo, Gestión de información._ 

vii 

### **Introducción** 

La tecnología del Internet de las Cosas (IoT) es un tema de vanguardia en la actualidad, puesto que proporciona recursos que mejoran la calidad de vida de las personas a nivel mundial. 

La implementación de esta tecnología en las organizaciones, busca soluciones en los ámbitos como el ahorro de costes y la eficiencia en la cadena de suministro. Entre las aplicaciones más importantes la tecnología IoT se encuentra la inmótica, que es: “El conjunto de tecnologías aplicadas al control y automatización inteligente de edificios no destinados a vivienda, como hoteles, comercios, escuelas, universidades, hospitales y edificios terciarios” (Fonseca, 2023). 

Como parte de los requisitos para optar al título de Ingeniero en Informática de la UCAB Guayana se desarrolló un modelo inmótico que permite la interconexión de los dispositivos IoT del laboratorio de Desarrollo de Aplicaciones Móviles y el laboratorio de Ingeniería Sanitaria de la Universidad Católica Andrés Bello, sede Guayana; para promover la innovación en las tecnologías en la sede. 

Para lograr esto, se utilizó la metodología de desarrollo ágil basado en Scrum, la cual se define como: “Una herramienta de gestión de proyectos de desarrollo ágil, para equipos extra pequeños de hasta 7 personas con roles multi-funcionales que les permite organizar mejor el trabajo y dividirlos en iteraciones (Sprints) de alrededor de un mes.” (RamiGlez, 2015). 

La investigación realizada es de diseño experimental, con un grado de profundidad a nivel descriptivo, realizando un análisis y estudio de los proyectos inmóticos realizados por Guatume (2019), Vera Borges (2019) y Ávila Gallegos (2020), donde utilizaron tecnologías IoT. 

En este trabajo se presenta el desarrollo de un sistema IoT con servidor web, empleando el framework de desarrollo web Django en Raspberry Pi modelo B, que permite conocer en tiempo real las condiciones ambientales y estados de operación de los elementos del laboratorio, tales como: Temperatura, humedad relativa, presencia, humedad del piso, luminosidad, estado de las luces y aire acondicionados; como también, poder encender/apagar las luces y aire acondicionados de manera local, y guardar en una base de datos el registro histórico semanal de las condiciones de temperatura, humedad relativa, luminosidad, horas de encendido de las luces y horas de presencia en el laboratorio. 

2 

### **Capítulo I. El Problema** 

### **Planteamiento del Problema** 

La evolución de internet ha sido constante, y hoy en día se logra visualizar como una de las nuevas vertientes de esta evolución al Internet de las Cosas, IoT, Internet of Things. 

Rose, Eldridge, & Chapin (2015), definen el Internet de las Cosas como un marco en el que todas las cosas tienen una presentación y una presencia en Internet, más específicamente, expresan que el IoT tiene como objetivo ofrecer nuevas aplicaciones y servicios que sirvan de puente entre el mundo físico y el virtual, en que las comunicaciones ‘máquina a máquina’, M2M, representa la comunicación básica que permite las interacciones entre las cosas y las aplicaciones en la nube. (p. 18). 

La comunicación M2M se define como: “A technology which allows both Wireless and wired systems to communicate with other devices of the same type.” [Una tecnología que permite que tanto los sistemas inalámbricos como los cableados se comuniquen con otros dispositivos del mismo tipo] (Kalyani, Dudy, & Pareek, 2015, p.17). 

Serrano (2019), señala que un entorno M2M debe contar con algunos elementos imprescindibles: 

- Máquinas que se encarguen de la gestión de la información. 

- Dispositivos M2M, que son los que se conectan a una máquina remota y dan comunicación al servidor. 

- El propio servidor encargado de la gestión del envío y la recepción de la información. 

- La red de comunicación ya sea por cable o por redes inalámbricas (párr. 8). 

Si en un sistema encontramos varias máquinas con información a gestionar, se debe implementar un protocolo de comunicación en los dispositivos M2M que permita un rápido intercambio de información entre el servidor y el cliente. 

Comer (1996), señala que el término servidor se aplica a cualquier programa que ofrece un servicio que se puede obtener en una red. Un servidor acepta la petición desde la red, realiza el 

3 

servicio y devuelve el resultado al solicitante (p. 327). El solicitante o cliente es un programa ejecutable que manda una petición a un servidor y espera una respuesta (p. 328). 

La Universidad Católica Andrés Bello, UCAB, es una institución de educación superior integrante de la Compañía de Jesús; su fundación fue decretada en el año 1951 por Episcopado Venezolano y realizada en 1953, en la ciudad de Caracas, por la Compañía de Jesús. Según la ley es una universidad privada, la cual inicialmente se construyó bajo el nombre de Universidad Católica llevándose a cabo su modificación a Universidad Católica Andrés Bello, por autorización del Ministerio de Educación, el 7 de julio de 1954. 

El 2 de octubre de 1997, el Consejo Nacional de Universidades publica en Gaceta Oficial número 36.313 la creación de la Extensión Guayana de la Universidad Católica Andrés Bello, UCAB Guayana. En el año 1998 comenzó el área de Pregrado con tres escuelas: Administración y Contaduría, Educación y Derecho. En octubre de 1999, una vez culminado el segundo módulo de aulas y los edificios de los laboratorios, dieron inicio a las demás carreras: Relaciones industriales, Ingeniería Industrial y Comunicación Social. En el 2005 iniciaron las carreras Ingeniería Civil e Ingeniería Informática. 

En los espacios de la UCAB Guayana se encuentran calificados laboratorios de Ingeniería, tales como: Materiales y Ensayos, Mecánica de Suelos, Circuitos Electrónicos y Arquitectura del Computador. Además, Computación IV, Base de Datos, Sistemas Operativos y Redes, Aplicaciones Móviles y Multimedia e Ingeniería Sanitaria, entre otros. 

El laboratorio de Desarrollo de Aplicaciones Móviles y Multimedia, Labam, de Informática, que cuenta con 15 computadores de escritorio o PC, un escritorio y PC para el docente, y un mesón central. El Labam tiene como objetivo que los estudiantes desarrollen hardware y software destinado a aplicaciones móviles, robótica, redes, entre otros. 

El laboratorio de Ingeniería Sanitaria, Labis, de Civil, que tiene como objetivo apoyar y capacitar a los estudiantes en los procesos de transformación y transporte de los contaminantes en las aguas, evaluando los diversos parámetros de calidad como son los análisis fisicoquímicos, microbiológicos y biológicos, el análisis de la calidad del agua potable, natural y residual. 

4 

Para el desarrollo del servidor se escogieron estos laboratorios por su cercanía y pertenecer a dos escuelas distintas, facilitando cualquier posible implementación. Actualmente, estas instalaciones deben de cumplir con unos requisitos de calidad que se encuentran establecidos en las normas ISO 17025 y 9001. 

De acuerdo a la plataforma tecnológica para la gestión de excelencia ISOTools Excellence (2022), la normativa ISO/IEC 17025 es una norma orientada a la evaluación de la conformidad la cual se desarrolló para guiar a los laboratorios en la administración de calidad y requerimientos técnicos para su adecuado funcionamiento. 

La normativa ISO 9001 es una norma elaborada por la Organización Internacional para la Estandarización, ISO, que se aplica a los Sistemas de Gestión de Calidad de organizaciones públicas y privadas, independientemente de su tamaño o actividad empresarial. 

Un Sistema de Gestión de Calidad, SGC, es la documentación de los procesos y planes de una organización para alcanzar los objetivos de calidad. (SafetyCulture, 2023) 

Para obtener un SGC con certificación ISO 9001 y 17025, la coordinadora de laboratorios María Victoria Bolívar aplicó estrategias y procedimientos que cumplan con las normativas de manera manual. 

Las recomendaciones para centros informáticos mediano y grande como el Labam, establece que la temperatura de la instalación debe mantenerse en los 21°C ± 1°C, con variaciones inferiores al 5% por hora. La humedad relativa se debe mantener en un 50% ± 5%, con variaciones inferiores al 5% por hora. El 90% de las partículas de polvo superiores a 1 micrón debe ser eliminadas por filtros UV. 

A diferencia del caso anterior, la temperatura del Labis no debe superar los 21°C, con una variación de ± 5°C, además, la humedad relativa debe mantenerse menor al 85%. 

La escuela de Informática dispone de un técnico que es responsable de supervisar todos los laboratorios, encargándose de que no haya presencia de estudiantes sin autorización fuera del horario asignado; que los aires acondicionados, luces y computadoras estén apagadas cuando el 

5 

recinto este vacío, y que las cerraduras de las puertas estén colocadas con sus cerrojos. Sin embargo, el técnico de los laboratorios cumple con una jornada laboral, por lo que no siempre está presente para cumplir sus funciones. Además, hay ocasiones en las que debe ausentarse, bien sea porque deba estar en otra área de la universidad, o estar fuera del recinto. En esos casos, él debe ir a la escuela de Informática para delegar sus funciones a otra persona, mas no sus responsabilidades. Debido a esto, se pierde el control del uso de los laboratorios que actualmente lleva el técnico. 

A diferencia de Labam, Labis tiene un técnico dedicado única y exclusivamente a ese laboratorio y tiene su oficina dentro de este, lo que facilita el control. 

La situación antes descrita conllevó a desarrollar el presente TIG con el propósito de dar respuesta a la problemática planteada, por la cual se hace necesario realizar una Propuesta para la Implementación de la Inmótica en la UCAB Guayana como aporte a la Implantación de la Norma 14001:2004, que satisfaga los requerimientos actuales y permita la integración con otros sistemas. 

### **Objetivo General** 

Desarrollar un servidor para la interconexión de dispositivos IoT de los laboratorios de las Escuelas de Ingeniería Informática y Civil de la UCAB Guayana. 

### **Objetivos Específicos** 

- Caracterizar los requerimientos en el laboratorio de Desarrollo de Aplicaciones Móviles y Multimedia, y el laboratorio de Ingeniería Sanitaria. 

- Diseñar un servidor que interactúe con los dispositivos y usuarios, y que gestione la información recibida. 

- Construir un servidor que permita la interconexión entre dispositivos IoT y usuarios. 

- Validar el funcionamiento del sistema a través de un prototipo. 

- Elaborar la documentación formal del sistema. 

### **Alcance** 

La solución propuesta consiste en un proyecto de Ingeniería Informática, en el cual se desarrolló un prototipo que simula las condiciones del laboratorio de Ingeniería Sanitaria de la 

6 

Escuela de Ingeniería Civil y el laboratorio de Desarrollo de Aplicaciones Móviles y Multimedia de la Escuela de Informática, de la UCAB Guayana. 

Para el prototipo se desarrolló un servidor local, conectado a sensores y actuadores. 

### **Limitaciones** 

Por motivos externos se desarrolló un prototipo en dos ambientes similares, con algunas diferencias. Inicialmente, se empezó a desarrollar el prototipo en Venezuela de manera presencial, donde se estaba cerca de los laboratorios, se podía interactuar de manera inmediata con los tutores, tanto académico como el industrial, al igual que se tenían más recursos y apoyo disponibles. Posteriormente, se continuó trabajando con el mismo prototipo en Chile, bajo otras condiciones, donde las consultas se realizaban de manera remota. 

### **Justificación** 

Esta investigación es un aporte para lograr el Objetivo Desarrollo Sostenible Nro. 9 de las Naciones Unidas de: “Construir infraestructuras resilientes, promover la industrialización inclusiva y sostenible y fomentar la innovación”. 

En la Meta 9.5: “Aumentar la investigación científica y mejorar la capacidad tecnológica de los sectores industriales de todos los países, en particular los países en desarrollo, entre otras cosas fomentando la innovación y aumentando considerablemente, de aquí a 2030, el número de personas que trabajan en investigación y desarrollo por millón de habitantes y los gastos de los sectores públicos y privados en investigación y desarrollo”. 

Al implementar este proyecto dentro de la UCAB Guayana la estamos convirtiendo en una infraestructura resiliente, que se puede adaptar rápidamente a los cambios y que fomenta la innovación. 

7 

### **Capítulo II. Marco Teórico** 

A continuación, se abordarán algunos trabajos que sirvieron de referencia para el tema de investigación, además de los conceptos utilizados en el desarrollo de este trabajo que, a su vez, es la noción base que reside en este documento. 

### **Antecedentes** 

Guatume (2019), elaboró un trabajo final de grado para la Universidad Nacional Experimental Politécnica “Antonio José de Sucre” (UNEXPO) llamado: “Diseño de un servidor IoT que permita interconectar dispositivos mediante el protocolo websockets”, el cual contribuyó en marcar una base para el desarrollo del modelo inmótico para el trabajo de grado, tomando como idea el uso del protocolo websockets para la comunicación de los dispositivos físicos con el servidor web, gestionando y almacenando la información recibida por los sensores en una base de datos. El uso de websockets proporcionó dinamismo a la interfaz gráfica del servidor, debido a que no era necesario refrescar la página web para visualizar la lectura de los sensores o controlar los actuadores, actualizándose en tiempo real. 

En la UCAB Guayana, Vera Borges (2019) elaboró un trabajo especial de grado titulado: “Propuesta para Universidad Católica Andrés Bello Extensión Guayana de un Sistema gestor de edificaciones enfocado a los laboratorios”, el cual concluyó de la siguiente manera: Que se desarrollara una aplicación web en vez de una aplicación nativa resultó eficiente, ya que hizo que el tiempo de desarrollo fuera más rápido y resultara sumamente sencillo de utilizar para personas que están acostumbradas a usar un explorador día a día (p. 119) 

Django como framework para desarrollo de aplicaciones web es una excelente opción, este carece de capacidades asíncronas, lo que llevó a buscar alternativas a su forma de trabajar con respecto a las acciones que se realizaran dentro de la aplicación (p. 119) 

En este antecedente se enfatiza la idea de crear un servidor web con el framework de desarrollo web Django para la gestión de los laboratorios de la UCAB Guayana; con la problemática de que este carecía de capacidades asíncronas. Partiendo de esta premisa, se realizó una investigación para solventar esta dificultad, utilizando el gestor de tareas Celery para realizar 

8 

tareas de manera asíncrona, y la librería Channels para implementar el protocolo Websockets en Django. Además, para efectos del presente trabajo de grado se decidió usar un modelo de Raspberry Pi como servidor y controlador. 

La propuesta de investigación presentada por Ávila Gallegos, (2020), bajo el nombre de: “Automatización de los sistemas de acceso, iluminación y monitoreo del laboratorio de electrónica de la Universidad Católica de Cuenca sede Azogues usando tecnología IoT”, que concluyó en: Obtener un sistema de control automático conlleva un período de estudio, investigación y pruebas. Los resultados obtenidos durante el largo proceso de investigación para la automatización del laboratorio de electrónica de la Universidad Católica de Cuenca han sido alentadores; buscar metodologías que permitan desarrollar sistemas de control a bajo costo es una oportunidad para el desempeño académico. (p. 40) 

Este proyecto orientado en el área de la inmótica que presenta una problemática similar a la que se presenta en este trabajo de grado. 

### **Base Teoricas** 

### **Inmótica** 

La inmótica se define como: “El conjunto de tecnologías aplicadas al control y automatización inteligente de edificios no destinados a vivienda, como hoteles, centros comerciales, escuelas, universidad, hospitales y todos los edificios terciarios” (Fonseca, 2023). 

### **Sensores** 

La Real Academia de la Lengua Española (citado por Serna Ruiz, Ros García, & Rico Noguera 2010), define a un sensor como un: “Dispositivo que detecta una determinada acción externa, temperatura, presión, etc., y la transmite adecuadamente” (p. ix) 

Pero también podemos encontrar muchas definiciones, como por ejemplo la de Serna, Ros y Rico (2010), que definen un sensor como “un dispositivo de entrada que provee una salida manipulable de la variable física medida” (p. 17) 

9 

Bajo esta premisa, podemos decir que los sensores son un dispositivo de entrada, ya que sirven como un intermediario entre la variable física que se desea medir (como puede ser la temperatura, humedad, movimiento, o el nivel de luz de un entorno) y el sistema de medida. 

### **Actuadores** 

Ramírez, Jiménez, & Carreño (2014), consideran al actuador como “un dispositivo con la capacidad de generar una fuerza que ejerce un cambio de posición, velocidad o estado de algún tipo sobre un elemento mecánico, a partir de la transformación de energía” (p. 26). 

Es decir, mientras que los sensores están diseñados y fabricados para recibir una determinada información, los actuadores son dispositivos que permiten a los sistemas de control “actuar” sobre el “mundo real” y realizar las acciones deseadas. 

### **Arquitectura de la red** 

Perdomo, Caizabuano, & Altamirano (2018), definen a la arquitectura de red como: La conceptualización o visualización de cómo deben diseñarse y funcionar las redes informáticas en relación con sus propósitos y medios tecnológicos disponibles (p. 106). 

Entre las topologías de red utilizadas en el proyecto se encuentran: 

- Red en bus (bus o “conductor común”) o Red lineal (line), se caracteriza por tener un único canal de comunicaciones (denominado bus, troncal o backbone) que se conecta diferentes dispositivos. 

- Red en estrella (star), las estaciones están conectadas directamente a un punto central (concentrador) y todas las comunicaciones se han de hacer necesariamente a través de éste, por cuanto no están conectados entre sí. 

- Red en árbol (tree) o Red jerárquica donde los nodos están colocados en forma de árbol. Desde una visión topológica, la conexión en árbol es parecida a una serie de redes en estrella interconectadas salvo en que no tiene un nodo central. (p. 120) 

10 

### **Raspberry Pi 4 Modelo B** 

La Raspberry Pi es una computadora de bajo costo y tamaño compacto, del porte de una tarjeta de crédito, que puede ser conectada a un monitor de computador o una TV, y usarse con un mouse y teclado estándar. 

El Raspberry Pi 4 que se utilizó para el desarrollo del prototipo es el Modelo B. Para garantizar el buen funcionamiento del Raspberry Pi se debe utilizar la fuente de alimentación oficial 4B, 5.1V, 3A, tipo C. 

El Raspberry Pi tiene 40 conectores GPIO (general-purpose input/out) en su cabecera, tal y como se puede ver en el Anexo A, al que se puede conectar distintos tipos de equipos, sensores simples y módulos externos. (Github, 2023). 

### **Raspberry Pi OS** 

Raspberry Pi OS (previamente llamado Raspbian), es un sistema operativo gratuito basado en Debian, optimizado para el hardware Raspberry Pi y es el sistema operativo recomendado para su uso. El sistema operativo viene con más de 35.000 paquetes: Software pre-compilado e incluido en un formato agradable para su fácil instalación. (RaspberryPi, 2023) 

### **Fotorresistencia (LDR)** 

Una fotorresistencia o LDR (del inglés, light dependent resistor), es un componente eléctrico cuya resistencia se modifica dependiendo de la intensidad de luz que incide sobre ella. 

Existen 2 tipos de fotorresistencias, según la forma en que se polarizan: lineal y no lineal. 

En la figura 1, el símbolo LDR utilizado en los circuitos se basa en el símbolo del circuito de resistencia, pero mostrando la luz en forma de flechas que brillan sobre esta. 



_Figura 1._ **Símbolo de LDR** 

Adaptado de _Qué es y cómo funciona una LDR (resistencia dependiente de la luz) - Símbolo de la LDR,_ por TecnoSalva, 2020, tecnosalva.com (https://www.tecnosalva.com/que-es-y-como-funciona-una-ldr/) 

11 

Existen dos formas de conectar un LDR en un circuito, dependiendo del fin deseado: 

- Mayor luz, mayor voltaje: Al incidir una mayor cantidad de luz provocará una menor caída de voltaje entre la fuente y el pin de referencia (Vout), por lo tanto, se obtendrá una lectura de mayor valor (Pull-down, ver la figura 2). 

- Mayor luz, menor voltaje: Al incidir una mayor cantidad de luz provocará una mayor caída de voltaje o diferencial de potencial entre la fuente y el pin de referencia (Vout), por lo tanto, se obtendrá una lectura de menor valor. (Pull-up, ver la figura 2). 



<!-- Start of picture text -->
+ +<br>LOR Resistor<br>Vout Vout<br>‘Resistor ae<br>(a) (b)<br><!-- End of picture text -->

_Figura 2._ **LDR configurada en Pull down (a) y Pull up (b)** Adaptado de _LDR o fotoresistor o fotoresistencia, - Formas de conectar un fotoresistor_ por MecatrónicaLATAM, 2021, mecatronicalatam.com (https://www.mecatronicalatam.com/es/tutoriales/sensores/sensor-de-luz/ldr/). 

### **Módulo de relé de 4 canales** 

Son placas de circuitos que albergan 4 unidades relés, con otros componentes, tales como 4 LEDs indicadores, diodos de protección, transistores, resistencias y otras partes. El módulo de relé mediante la activación de sus bobinas permite encender/apagar dispositivos eléctricos a través de sus contactos. Ver figura 3. 



<!-- Start of picture text -->
Te% 7<br>Z LW ps<br>ie Cad Mts<br>a ae<br>5<br><!-- End of picture text -->

_Figura 3._ **Módulo relé de 4 canales** Adaptado de _Módulo Relé 4 canales 5 Volt,_ triacs (https://triacs.cl/modulos/259-modulo-rele-4-canales-5-volt-.html) 

12 

### **Sensor digital de temperatura y humedad (DHT11 y DHT22)** 

De acuerdo a Llamas (2016), el DHT11 y el DHT22 (o AM2302) son: “dos modelos de una misma familia de sensores, que permiten realizar la medición simultánea de temperatura y humedad” (párr. 1) 

Un procesador interno que realiza la medición, proporciona una salida digital, que se obtiene desde un microprocesador como Arduino, o el ESP8266 MCU (marca Crowtail). 

Ambos sensores presentan un encapsulado de plástico similar, distinguiéndose por el color y su tamaño (ver en la figura 4). El DHT11 es un sensor pequeño que presenta una carcasa azul, mientras que el sensor DHT22 es más grande y presenta un exterior de color blanco. 



<!-- Start of picture text -->
DHT11 DHT22<br><!-- End of picture text -->

_Figura 4._ **Sensores de temperatura/humedad DHT11 y DHT22** Adaptado de _Medir temperatura y humedad con Arduino y sensor_ por Llamas L., 2016, luisllamas.es (https://www.luisllamas.es/arduino-dht11-dht22/) 

El sensor DHT11 que se utilizó en el prototipo fue el modelo Crowtail 2.0, y el sensor DHT22 fue el modelo 140C80. 

### **Sensor de agua** 

El sensor de agua es un sensor de reconocimiento usado para confirmar la presencia de lluvia, el nivel de agua en un determinado punto, o generar una alerta por fuga de agua. Es un sensor que consume poco voltaje y altamente sensible, que está compuesto de un conector, un bloque resistivo pull-up de 1MΩ y una serie de líneas conductivas conectadas a tierra. El sensor utilizado en la construcción del prototipo fue el modelo Crowtail de la figura 5. 

13 



_Figura 5._ **Sensor de agua** Tomado de _Crowtail – Water Sensor_ por Elecrow Bazaar, 2019, https://www.elecrow.com/wiki/index.php?title=Crowtail-_Water_Sensor, derechos reservados por elecrow.com 

### **Sensor PIR de movimiento (Sensor HC-SR501)** 

El módulo HC-SR501 es un sensor de movimiento pasivo infrarrojo (PIR), de bajo costo, pequeño, que se utiliza para detectar movimiento de personas. Como se puede ver en el anexo B, el sensor utiliza 2 potenciómetros y un jumper que permiten modificar: La sensibilidad de detección, tiempo de activación, y respuesta ante detección repetitivas. (Punto Flotante S.A, 2017) 

### **Arduino UNO R3** 

Un Arduino UNO R3 es una placa de microcontrolador de código abierto basado en el microcontrolador Atmega328P y desarrollado por Arduino.cc. La placa está equipada con conjunto de pines de Entrada/Salida digitales y analógicas que pueden conectarse a varias placas de expansión y otros circuitos (ver la figura 6). 



_Figura 6._ **Arduino UNO R3** 

Adaptado de _Arduino UNO R3,_ https://mcielectronics.cl/shop/product/arduino-uno-r3-arduino-10230/, derechos reservados por mcielectronics.cl 

### **Arduino MEGA 2560 R3** 

El Arduino MEGA 2560 R3 es una placa de desarrollo de código abierto basada en el microcontrolador Atmega2560 (ver en la figura 7). 

14 



_Figura 7._ **Arduino MEGA 2560 R3** Adaptado de _Arduino MEGA 2560 R3,_ https://mcielectronics.cl/shop/product/arduino-mega-2560-r3-arduino10231/, derechos reservados por mcielectronics.cl 

### **ESP8266 NodeMCU** 

NodeMCU es la placa de desarrollo de código abierto basada en el chip ESP8266 (ESP12), que utiliza el lenguaje de programación LUA, compatible con el entorno de programación Arduino IDE, ideal para proyectos de electrónica y robótica avanzados, que necesiten una gran potencia de proceso y comunicaciones WiFi. 

La version NodeMCU que se utilizó en el prototipo es el modelo Crowtail-ESP8266 Node MCU que se puede ver en el Anexo C. 

### **Visual Studio Code** 

Visual Studio Code es un editor de código fuente ligero pero potente que se ejecuta en escritorio y que está disponible para Windows, macOS y Linux. Viene con soporte integrado para Javascript, TypeScript y Node.js y tiene un rico ecosistema de extensiones para otros lenguajes y tiempos de ejecución (como C++, C#, Java, Python, PHP, Go, .NET). 

### **Computación Virtual en Red (VNC)** 

La Computación Virtual en Red (VNC) es, en esencia, “un sistema de visualización remota que permite al usuario ver un entorno informático de “escritorio” no solo en la máquina donde se está ejecutando, sino desde cualquier lugar en Internet y desde una amplia variedad de arquitecturas de máquinas” (Cambridge University Engineering Department, 1999) 

15 

### **RealVNC** 

RealVNC es una empresa que ofrece software multiplataforma de acceso remoto. El software, igualmente llamado RealVNC, consta de un servidor y una aplicación cliente para implementar el protocolo Virtual Network Computing, VNC, permitiendo el control de la pantalla de otro equipo de forma remota. 

Los clientes de RealVNC usan la aplicación VNC Viewer para acceder al ordenador servidor desde cualquier parte del mundo y desde cualquier dispositivo a través de Internet. 

Mientras que el equipo que se desea controlar utiliza VNC Connect, que consta de una aplicación VNC Server y otros programas de apoyo. VNC Connect ofrece una versión gratuita para uso personal, que está limitada a controlar 5 computadoras por hasta 3 usuarios. 

### **Arduino Software (Arduino IDE)** 

De acuerdo a Peña (2020), el entorno de desarrollo integrado o IDE de Arduino es una aplicación gratuita, multiplataforma, que puede utilizarse para escribir y cargar programas en placas de Arduino y también en aquellas que sean compatibles. Pero no solo eso, gracias a núcleos generados por terceros, también se puede utilizar para cargar programas en placas de desarrollo de otros proveedores (p. 9) 

### **I2C (Circuito Inter-Integrado)** 

De acuerdo a Carletti (2007), el bus I2C (I<sup>2</sup> C) es la abreviatura de Inter-IC (Inter integrated circuits), un tipo de bus diseñado por Philips Semiconductors a principios de los 80s, que se utiliza para conectar circuitos integrados (ICs). El I2C es un bus con múltiples maestros, lo que significa que se pueden conectar varios chips al mismo bus y que todos ellos pueden actuar como maestro, sólo con iniciar la transferencia de datos. Este bus se utiliza en muchos dispositivos, en especial en equipos de video como monitores de computadora, televisores y videocaseteras (p. 1). 

En un bus I2C existen dos tipos de dispositivos: 

16 

- Maestro (Master): Dispositivo que determina los tiempos y la dirección del tráfico en el bus. Es el único que aplica los pulsos de reloj en la línea. Cuando conectan varios dispositivos maestros a un mismo bus la configuración obtenida se denomina “multi-maestro”. 

- Esclavo (Slave): Todo dispositivo conectado al bus que no tiene la capacidad de generar pulsos de reloj. Los esclavos reciben señales de comando y de reloj generados desde el maestro. 

### **MQTT (Message Queuing Telemetry Transport)** 

MQTT (Conocido actualmente como Transporte de telemetría MQ) es un protocolo de mensajería ligero que sigue un modelo de publicación/suscripción, diseñado para telemetría M2M en entornos de bajo ancho de banda. Los objetivos del protocolo MQTT son los siguientes: 

- Minimizar el ancho de banda. 

- Establecer comunicación bidireccional entre dispositivos. 

- Minimizar los requerimientos de los dispositivos, tanto en recursos como en consumo. 

- Garantizar la fiabilidad y cierto grado de seguridad. 

De acuerdo a Hernández (s.f.), la arquitectura MQTT sigue una topología de estrella (ver la figura 8), teniendo un nodo central conocido como bróker, que hace de servidor. El bróker es el encargado de gestionar la red y transmitir los mensajes (payload) a los receptores. Hay muchos brokers disponibles, tales como: Mosquitto, HiveMQ, RabbitMQ, Mosca, Aedes, entre otros. 



_Figura 8._ **Arquitectura MQTT** Adaptado de _Arquitectura de un Sistema MQTT,_ por Luis del Valle Hernández, 2023, https://programarfacil.com/esp8266/mqtt-esp8266-raspberry-pi/, derechos reservados por programarfacil.com 

17 

La arquitectura de publicación/suscripción de MQTT está basada en eventos. Una sesión MQTT se divide en cuatro etapas: conexión, autenticación, comunicación y terminación. (Anonimo, s.f.) 

El soporte de MQTT para aplicaciones en Python es proporcionado por la librería Paho. 

### **Python** 

Es un lenguaje de programación de alto nivel, ya que contiene implícitas algunas estructuras de datos, tales como: listas, diccionarios, conjuntos y tuplas, que permiten realizar algunas tareas complejas en pocas líneas de código y de manera legible. (Challenger-Pérez, DíazRicardo, & Becerra-García, 2014) 

### **Eclipse Mosquitto** 

Eclipse Mosquitto es un broker de mensajes de código abierto, distribuido bajo licencia EPL/EDL, que implementa las versiones 5.0, 3.1.1 y 3.1 del protocolo MQTT. Mosquitto está programado en C y es compatible con Windows, Linux y Mac; es liviano y adecuado para su uso en muchos dispositivos, desde una computadora de placa única y de bajo consumo, hasta servidores completos. 

### **Remote Dictionary Server (Redis)** 

Remote Dictionary Server (Redis), es un motor de base de datos en memoria, basado en el almacenamiento en tablas de hashes, de código abierto, utilizado por los desarrolladores como base de datos, caché, agente de mensajes (broker) y cola. Está escrito en ANSI C por Salvatore Safilippo, quien trataba de mejorar la escalabilidad de su empresa emergente italiana. 

### **Celery** 

De acuerdo a Guerra (2022), Celery es un sistema distribuido sencillo, flexible y fiable para procesar grandes cantidades de mensajes. Es una cola de tareas centrada en procesamiento en tiempo real y que admite también la programación de tareas periódicas. 

18 

Una cola de tareas es un sistema de cola que permite a un cliente ejecutar tareas de manera asíncrona. Como se puede ver en la figura 9, desde el servidor web el cliente se encarga de agregar tareas a la cola de mensajes (bróker), mientras que estas son ejecutadas por nodos (workers). 

Una tarea (task) es una unidad de trabajo que será ejecutada por un worker como, por ejemplo: Enviar un correo, generar un reporte, subir una imagen, entre otros. 



<!-- Start of picture text -->
Servidorwien Wort<br>— Ey<br><!-- End of picture text -->

_Figura 9._ **Comunicación en Celery** Adaptado de _Utilizando Celery para configurar una cola de tareas_ , por Jorge Guerra, 2022, https://www.youtube.com/live/f35EoGYL7A4?si=Tt6Tvnb4SbJM95z6 

### **Django** 

Díaz (2019), define Django como un framework web gratuito y de código abierto, de alto nivel, escrito en Python. Django tiene diferentes funciones, tales como: 

- Crear sitios web complejos, de forma rápida y sencilla. 

- Facilitar la realización de tareas repetitivas, pesadas y comunes al crear el sitio web. 

- Reutilizar código de un sitio web a otro. 

En cuanto a su estructura, Django se inspira en la filosofía de desarrollo Modelo Vista Controlador, MVC, para trabajar con su propia estructura conocida como Model Template View, MTV. Este patrón consiste en dividir cualquier aplicación en tres grandes módulos: Model, Template y View (ver la figura 10). 

19 



<!-- Start of picture text -->
A Model Template View r<br>“a °<br>_\\<br>= oy<br><!-- End of picture text -->

_Figura 10._ **Arquitectura de desarrollo de Django** Adaptado de _Curso Django. Introducción e Instalación.Vídeo 1_ por Juan Díaz, 2019, https://youtu.be/7XO1AzwkPPE?si=VM1I3IUL1234OzOP 

El Model es el módulo que se encarga de obtener y gestionar información de una base de datos. El Template es el módulo encargado de mostrar la información al usuario, y con el que el usuario puede interactuar. El View es el módulo encargado de gestionar todas las comunicaciones que existen entre la Template y el Model. 

Django soporta las bases de datos: PostgreSQL, MariaDB, MySQL, Oracle y SQLite. 

### **Sqlite3** 

SQLite es una librería de C que provee una base de datos ligera basada en disco que no requiere un proceso de servidor separado y permite acceder a la base de datos usando una variación no estándar del lenguaje de consulta SQL (Python Software Foundation, 2023). 

### **Django Channels** 

Channels es un proyecto diseñado específicamente para Django con el objetivo de crear aplicaciones con comunicación en tiempo real de manera nativa, ofreciendo la capacidad de manejar protocolos que requieren una conexión persistente, manteniendo intacta su integración con el sistema de sesiones, autenticación y el resto del framework (Zepeda, 2021). 

Como se puede ver en la figura 11, Django channels coloca una capa intermedia que se encarga de procesar las peticiones HTTP a las vistas de Django y las conexiones websocket a un consumer http o un consumer websocket. 

20 



<!-- Start of picture text -->
— HTTP<br>Navegador — Python api<br>— Websocket<br>— Channel (ASG!)<br>wee/wessocker<br>Savew<br>Interface<br>{mensajes<br>| por http mensajesporwebsocket | Procesos por worker<br>CONSUMER<br>carr)<br>| HttpResponse<br>CONSUMER<br>a Procesosen<br>(WEBSOCKET) segundo plano<br><!-- End of picture text -->

_Figura 11._ **Configuración de Django Channels** Adaptado de _Django channels: consumers, scope y eventos,_ por Zepeda E., 2021, https://coffeebytes.dev/djangochannels-consumers-scope-y-eventos/ 

Un webocket es una conexión persistente que existe entre el navegador de un usuario y un servidor web. Un canal o channel es un modelo que permite que varios procesos se comuniquen entre sí por medio de la transmisión de mensajes. Django channels requiere de un servidor ASGI para manejar conexiones de manera asíncrona. 

ASGI, del inglés Asynchronous Server Gateway Interface, es una interfaz para Python que permite interactuar con servidores web de manera asíncrona. A diferencia de una petición HTTP, las conexiones que se realizan con ASGI son persistentes. 

Para utilizar Django Channels es necesaria la instalación de la librería Daphne, la cual permitirá utilizar un servidor ASGI en un proyecto Django. 

21 

### **Capítulo III. Marco Metodológico** 

Para resolver el problema planteado y realizar la investigación correspondiente para el desarrollo del trabajo de grado, se utilizaron un conjunto de técnicas y procedimientos, que ofrecieron una visión de las actividades a realizar para cumplir con los objetivos plateados. 

### **Tipo de Investigación** 

La estrategia que se adapta mejor al trabajo de grado es: La investigación de diseño experimental, ya que según Ramos-Galarza (2021): “Se caracteriza por la manipulación intencionada de la variable independiente y el análisis de su impacto sobre una variable dependiente” (p.1). En este caso, se desarrolla un prototipo de servidor donde se analiza y manipulan un grupo de variables independientes, tales como: La temperatura, humedad relativa, luminosidad, presencia, aire acondicionados, entre otros; los cuales impactan sobre las variables dependientes, que son: El laboratorio de Ingeniería Sanitaria, de la Escuela de Ingeniería Civil; y el laboratorio de Desarrollo de Aplicaciones Móviles, de la Escuela de Ingeniería Informática. 

El grado de profundidad con que se aborda el problema es a nivel: Descriptivo, ya que según Esteban Nieto (2018), la investigación descriptiva tiene como objetivo: “Recopilar datos e informaciones sobre las características, propiedades, aspectos o dimenciones de las personas, agentes e instituciones de los procesos sociales” (p. 2). Este nivel de investigación permite caracterizar los dispositivos y equipos que se utilizan para la construcción de la maqueta física del prototipo, definir y describir las variables independientes que se manejan en el servidor web, respondiendo a preguntas concernientes del sujeto de estudio. 

### **Técnicas e Instrumentos de Recolección de Datos** 

Las técnicas de recolección de datos que se utilizaron para dar respuesta a los objetivos planteados en el trabajo de grado fueron las siguientes: 

- Entrevista no estructurada: Es una entrevista hecha sin guion previo, donde se tiene como referentes la información sobre el tema, y se va construyendo a medida que avanza, con las respuestas que se dan (Peláez, et al., 2013). 

22 

Durante el desarrollo del trabajo de grado se realizó este tipo de entrevista a la coordinadora de laboratorios María Victoria Bolívar, y a los docentes que utilizaban el laboratorio de Ingeniería Sanitaria, de la Escuela de Ingeniería Civil; y el laboratorio de Desarrollo de Aplicaciones Móviles, de la Escuela de Ingeniería Informática en la semana, con la finalidad de conocer los requerimientos funcionales y no funcionales del modelo inmótico de las instalaciones, en base a la experiencia de los entrevistados. 

El instrumento utilizado para recolectar la información que se obtuvo de las entrevistas fue una libreta de anotaciones. 

- Observación directa: Es un método de recolección de datos que consiste en observar el objeto de estudio dentro de una situación particular. Todo esto se hace sin necesidad de intervenir o alterar el ambiente en el que se devuelve el objeto. De lo contrario, los datos que se obtengan no van a ser válidos (OK diario, 2019). 

Se empleó este método para recolectar información en tiempo real sobre los eventos del entorno estudiado. El instrumento utilizado para recolectar la información que se obtuvo de las observaciones fue una libreta de anotaciones. 

23 

### **Capítulo IV. Desarrollo y Resultados** 

### **Metodología de Desarrollo Utilizada** 

Para asegurar el desarrollo de este proyecto y el cumplimiento de los objetivos planteados, se adoptó la metodología de desarrollo ágil basado en Scrum. Esta metodología se define como: “Una herramienta de gestión de proyectos de desarrollo ágil, para equipos extra pequeños de hasta 7 personas con roles multi-funcionales que les permite organizar mejor el trabajo y dividirlos en iteraciones (Sprints) de alrededor de un mes.” (RamiGlez, 2015). 

En la figura 12 se resume el proceso. 



<!-- Start of picture text -->
Codificacién<br>JeraRequerimientosFase: Definiciénde‘ Reunionditt L) Control de<br>pooo--------- 2da Fase: Seleccién LA versiones<br>H 1 de priorizacién de<br>11]1 Product Backlog | | requerimientos<br>'<br>H ce,\ _ 3ra Fase: Sprint<br>| Disefiode vistas | 1|<br>H Requeridas 1<br>1loseeememmee!'<br>.| [ed iGastionde cambios Pruebas<br>Sta Fase: Retrospectiva <——— EntregableAta Fase:<br><!-- End of picture text -->

_Figura 12._ **Aplicación de la metodología Scrum** 

Inicialmente se levantaron y analizaron los requerimientos del proyecto, o Product Backlog, para luego priorizarlos. Se creó un sprint backlog, con la lista de funcionalidades que serían desarrolladas entre 1 a 4 semanas. De acuerdo a esta lista, se fueron realizando varios ciclos de desarrollo iterativo o sprints, donde cada 2 semanas se realizaban reuniones con el tutor académico para mostrar el desarrollo de los módulos que conformaban el proyecto, los cuales se fueron validando con la realización de pruebas. Finalmente, cuando se cumplieron todos los requerimientos, se procedió a entregar la versión final del software al cliente, o Product owner, adjuntando en la entrega un video que demuestra que el proyecto desarrollado es funcional. 

24 

### **Procedimiento Metodológico** 

Con la finalidad de desarrollar un servidor para la interconexión de dispositivos IoT de los laboratorios de las Escuelas de Ingeniería Informática y Civil de la UCAB Guayana se realizaron una serie de entrevistas no estructuradas a las entidades pertinentes, que en este caso fueron: la coordinadora de laboratorios María Victoria Bolívar, y los docentes que utilizaban el laboratorio de Ingeniería Sanitaria, Labis, de la Escuela de Ingeniería Civil; y el laboratorio de Desarrollo de Aplicaciones Móviles, Labam, de la Escuela de Ingeniería Informática en la semana. Con estas entrevistas se logró recopilar la siguiente información: 

- La escuela de Informática dispone de un técnico que es responsable de supervisar los laboratorios, mantener el control de acceso, controlar la operación de los aires acondicionados, encendido/apagado de luces y computadoras, y el cierre de los laboratorios. 

- Labis dispone de un técnico dedicado única y exclusivamente a ese laboratorio. 

- Ambos técnicos realizan actividades laborales adicionales a las indicadas anteriormente, por lo que no siempre están presentes para cumplir con sus funciones en los laboratorios. 

- Ante la ausencia de un técnico, sus funciones son delegadas a un profesor o un trabajador de la Escuela. Debido a esto, se pierde parte del control del uso de los laboratorios. 

- Los laboratorios deben cumplir con unos estándares ISO 1705 y la 9001. 

- La temperatura y la humedad relativa de los laboratorios son indicadores importantes para el buen desempeño y funcionamiento de los equipos, y para la comodidad de las personas que estén dentro del laboratorio durante la jornada. 

Para cumplir con los estándares ISO se definieron cada uno de los requerimientos funcionales y no funcionales que tendría el modelo inmótico para Labam y Labis, dando como resultado el prototipo desarrollado en este trabajo de grado, habiendo considerado los siguientes aspectos: 

- Conocer las condiciones y estados de operación de los elementos del laboratorio, tales como: Luces, seguro de la puerta y aire acondicionados. 

25 

- Conocer a tiempo real las condiciones ambientales del laboratorio: Temperatura, humedad relativa, humedad del piso, luminosidad y presencia. 

- Desarrollar una base de datos donde se guarde el registro de la temperatura, humedad relativa, luminosidad y horas de presencia dentro del laboratorio. 

- Elaborar un registro de histórico semanal de las diferentes variables del laboratorio. 

- Desarrollar un sistema que permita controlar de forma local el encendido/apagado de las luces y aire acondicionados. 

Luego de haber definido los requerimientos, se procedió a realizar una investigación sobre lo que es la inmótica y cómo se aplica. A partir de la información obtenida, se establecieron los elementos teóricos y prácticos que determinaron la necesidad de desarrollar e implementar un sistema IoT con servidor, las fases de su desarrollo y su relación con el problema planteado. Para seleccionar el procesador central del sistema, se compararon las opciones tecnológicas que se muestran en la tabla 1. 

_<u>Tabla 1. Comparativa entre Raspberry Pi 4 modelo B, Raspberry Pi 3 modelo B, e Iduino Yun Shield</u>_ 

||**Raspberry Pi 4 Modelo B**|**Raspberry Pi 3 Modelo B**|**Iduino Yun**<br>**Shield**|
|---|---|---|---|
|Procesador|Broadcom BCM2711, cuatro<br>núcleos Cortex-A72 (ARM V8) 64-<br>bit SoC @ 1,5 GHz|Broadcom BCM2837, cuatro<br>núcleos Cortex-A53 @ 1,2GHz|400 MHz, 24<br>MIPS|
|Memoria RAM|4 GB|1 GB|64 MB|
|Almacenamiento|No posee, ya que requiere una|No posee, ya que requiere una|16 MB|
|interno|tarjeta MicroSD|tarjeta SD||
|USB|2 puertos USB 2.0, y 2 puertos<br>USB 3.0|4 puertos USB 2.0|1 puerto USB<br>flash|
|Alimentación|5V DC a través del conector USB-<br>C (mínimo 3A)|Fuente de alimentación<br>microUSB conmutada<br>actualizada de hasta 2.5A|4.5 V a través del<br>Arduino Vin pin|
|HDMI|Integrado|Integrado|No tiene|
|Ethernet|Integrado|Integrado|Integrado|
|WiFi|Integrado|Integrado|Integrado|
|Bluethooth|5.0|4.1|No tiene|
|Sistema operativo|Raspbian|Raspbian|OpenWrt|



Con el fin de cubrir los requerimientos del laboratorio se seleccionó un Raspberry Pi 4 Modelo B como procesador central del sistema, considerando sus capacidades, tales como: 

- Su sistema operativo; que posee una GUI minimalista que facilita su configuración y uso. 

26 

- Su tamaño pequeño, permite transportarlo de un sitio a otro fácilmente. 

- Cuenta con un procesador de cuatro núcleos. 

- El Raspberry Pi 4 modelo B trabaja con Python 3. 

- Soporte de internet inalámbrico, como Wi-fi y Bluetooth. 

- El Raspberry Pi 4 modelo B incorpora una tarjeta microSD seleccionable. Se utilizó una tarjeta microSD de 64GB para tener suficiente espacio en el Raspberry Pi para la instalación de librerías y programas necesarios para el desarrollo del servidor. 

- El Raspberry Pi 4 modelo B posee pines de entrada/salida a los que se pueden conectar componentes electrónicos, tales como sensores, LEDs, entre otros; los cuales se pueden manejar con librerías desarrolladas en Python que vienen instaladas con el sistema operativo. 

Después de caracterizar cada uno de los componentes disponibles y experimentar con ellos por separado, se seleccionaron los sensores, actuadores y dispositivos IoT que se muestra en la Tabla 2 para la construcción del prototipo. 

<u>Tabla 2.</u> _<u>Sensores, actuadores y dispositivos IoT utilizados para la construcción del prototipo y su aplicación</u>_ 

|**Componente**|**Tipo de componente**|**Aplicación**|
|---|---|---|
|LDR no lineal|Sensor de luz|Medir nivel de iluminación|
|DHT22, DHT11|Sensores digitales|Medir temperatura y humedad relativa|
|PIR HC-SR501|Sensor de movimiento|Detectar presencia|
|ER-CT0042CWS|Sensor de agua|Detectar fuga de agua|
|Módulo Relé de 4 canales<br>5 voltios|Actuador electromagnético|Encender/Apagar luces y aires acondicionados|
|DIP Switch de 4<br>posiciones|Interruptor eléctrico|Simular el seguro de la puerta|
|Arduino UNO R3|Placa de desarrollo de<br>código abierto|Controlar los actuadores del prototipo|
|Arduino MEGA 2560 R3|Placa de desarrollo de<br>código abierto|Leer los sensores que se encuentran en el interior<br>del laboratorio|
|ESP8266 NodeMCU|Placa de desarrollo de<br>código abierto|Leer los sensores que se encuentran fuera del<br>laboratorio|
|Raspberry Pi 4 Modelo B|Ordenador mono-placa|Computadora donde se encontrará instalado el<br>servidor y el bróker MQTT|



En el manual de usuario que se encuentra en el Apéndice A, se explica cómo se configuró el Raspberry Pi 4 Modelo B para el desarrollo del proyecto. 

De acuerdo a los criterios de selección de tecnología obtenidos y los componentes disponibles, en el laboratorio de Prototipos se realizó el diseño y construcción del prototipo, dando 

27 

como resultado la maqueta física que se muestra en la figura 13, que sirvió simular la ambientación de ambas instalaciones. 



_Figura 13._ **Maqueta completa del prototipo realizado en Venezuela** 

Se programaron tres comandos en Django: i2creader, i2cwriter y mqtt_connect. 

Para crear un comando en Django se creó desde la terminal de Visual Studio Code un directorio management/commands en la carpeta “iot” del proyecto, donde se crearon los archivos i2c.writer.py, i2creader.py y mqtt_connect.py. 

Dentro de los tres archivos se creó una clase llamada Command que hereda de la variable BaseCommand. Dentro de esta clase existe un método llamado handle donde colocó el código que se ejecutará cuando se use el comando en concreto. 

El archivo i2creader.py permite la comunicación entre el Raspberry Pi y el Arduino UNO que se encuentra conectado a los sensores de la figura 13, utilizando el protocolo I2C; donde el Raspberry Pi es el maestro y el Arduino es el esclavo 11. 

Para ejecutar i2reader.py, se escribe en la terminal de Visual Studio Code lo siguiente: “python manage.py i2creader”. Al ejecutar este comando, cada 10 segundos se imprime la información recibida por los sensores en la terminal, de manera ordenada. 

28 

El archivo I2cwriter.py permite la comunicación entre el Raspberry Pi y los Arduinos conectados a los actuadores usando el protocolo I2C, siendo el Raspberry Pi el maestro y los Arduinos los esclavos 12 y 13. 

Para ejecutar i2cwriter.py, se escribe en la terminal de Visual Studio Code lo siguiente: “python manage.py i2cwriter”. Al ejecutar este comando, se imprime una línea de texto donde se le pide al usuario la sección a la que desee acceder: 1 o 2; dependiendo de lo que se elija, puede: 

- Sección 1: Seleccionar un enchufe (1-2), y elegir Conectar/Desconectar (1-0). 

- Sección 2: Seleccionar un AC (1-2) o luces (3-4), y elegir Encender/Apagar (1-0). 

El archivo mqtt_connect.py permite la comunicación entre el Raspberry Pi y el ESP8266 NodeMCU conectado a los sensores, a través del protocolo MQTT. 

Para ejecutar mqtt_connect.py se escribe en la terminal de Visual Studio Code lo siguiente: “Python manage.py mqtt_connect.py”. Al ejecutar este comando, cada 10 segundos en la terminal el número de la lectura que se realizada, para comprobar que no se repiten mensajes, y los mensajes recibidos de los tópicos a los que está suscrito el Raspberry Pi como cliente. 

De lo desarrollado se obtuvieron los resultados que se muestran en la figura 14. 



_Figura 14._ **Resultados obtenidos del prototipo desarrollado en Venezuela** 

29 

Por razones de fuerza mayor y de lo informado a los tutores, el desarrollo del prototipo tuvo que continuar en Chile. Debido a esto, para cumplir con los requerimientos establecidos en el proyecto, el diseño de la maqueta física tuvo que adaptarse a las nuevas condiciones. Se adquirieron nuevos equipos y se adaptó parte del código programado del sistema realizado en Venezuela, en acuerdo con el tutor académico se simplificó el esquema de conexiones, considerando que si el prototipo funcionaba para un laboratorio también funcionara para dos. 

Se utilizó un Raspberry Pi 4 modelo B para programar el servidor que controlaría los tres dispositivos IoT: Un Arduino UNO R3, un ESP8266 NodeMCU y un Arduino MEGA 2560 R3; los cuales estarían conectados a los sensores y actuadores en una topología de red de tipo estrella, como su muestra en el lado derecho de la figura 15. 



<!-- Start of picture text -->
=<br>aes XS<br>‘Actuador Actuador Mtoe<br>C=) (Arduino MEGA 2560) (Arduino UNO)<br>CQIS) de2canales ‘de 4 médulos ZZ \S©<br>BDDOQOOD SOEDAOoICD OOOO<br><!-- End of picture text -->

_Figura 15._ **Esquemas de conexión realizado en Venezuela (Izquierda), y realizado en Chile (Derecha)** 

Se diseñaron varios esquemas electrónicos individuales que conforman el prototipo actual, donde los dispositivos IoT serían conectados física e inalámbricamente con el Raspberry Pi. 

El diseño del primer circuito se encarga de medir la temperatura y humedad relativa exterior, y detectar humedad en el piso del laboratorio, que muestra en la figura 16, el cual estaría conectado fuera del laboratorio. Su dispositivo central es el ESP8266 NodeMCU, que al poseer un módulo WiFi trabaja bajo el protocolo MQTT para comunicarse con el Raspberry Pi de manera inalámbrica, alimentado con una fuente de 3.3 voltios. La lista de componentes utilizados para construir el circuito se encuentra en el Apéndice A. 

30 



<!-- Start of picture text -->
433V Interfaz de ESP8266<br>bateria Nodemcu<br>a gob<br>eo Eile oE=zte<br><!-- End of picture text -->

_Figura 16._ **Esquema eléctrico del ESP8266 NodeMCU** 

El diseño del segundo circuito permite medir la temperatura y humedad relativa interior, detectar presencia, luminosidad, el estado del seguro de la puerta y de los aires acondicionados que se muestra en figura 17, donde el Arduino MEGA 2560 R3 sería el controlador que recibe información de los sensores, debido a que, a comparación a un Arduino UNO, este dispositivo posee mayor número de pines de entrada para conectar sensores, mayor cantidad de memoria flash y mejor procesador. El circuito es alimentado con una fuente de 5 voltios, utilizando la lista de componentes que se muestran el Apéndice A. 

En este circuito se conectaron dos fotorresistencias pull-up en las entradas analógicas A0 y A1, para prever falsos estados que se produzcan por el ruido generado por el circuito. El Vout de las fotorresistencias pull-up leídos por los pines analógicos de Arduino será el resultado del valor de la resistencia fijado 10k menos el valor resistivo de LDR, que varía según la luminosidad. 

31 



<!-- Start of picture text -->
aoo ok)<br>COLEURSCa cee<br>+5V +5V +5V<br>= i | LE 4<br>ik|<br>Ne) L<br>Ei i LT<br>GND 9 9 GND<br><!-- End of picture text -->

_Figura 17._ **Esquema eléctrico del Arduino MEGA 2560 R3** 

Posteriormente, se diseñó el circuito de la figura 18, donde el Arduino UNO R3 sería el controlador de luces y aire acondicionados. El circuito fue alimentado con una fuente de 5 voltios, utilizando los componentes que se muestran el Apéndice A. 

También se realizó una conexión de salidas del Módulo de relé, para recibir desde el Arduino MEGA 2560 R3 el valor lógico de los estados, HIGH o LOW de los aires acondicionados. 



<!-- Start of picture text -->
vec Nd IN3.IN2. INI. GND |LsD4 ARDUINO<br>— DS06 UNO<br>000 000 000 000<br>+5V = ae<br>_<br>| 200 |<br>dd r dk Ld |<br>GND<br><!-- End of picture text -->

_Figura 18._ **Esquema eléctrico del Arduino UNO R3 y su relación con el Arduino MEGA 2560 R3** 

32 

Por último, se diseñó el circuito de la figura 19, para la comunicación entre el Arduino MEGA 2560 R3 (Esclavo 1) y el Arduino UNO R3 (Esclavo 2) con el Raspberry Pi 4 Modelo B (Maestro) en una topología de tipo bus de comunicación I2C. Los componentes utilizados para la construcción de este circuito se pueden ver en el Apéndice A. 



<!-- Start of picture text -->
+V +5V<br>? ESCLAVO1<br>=<br>MAESTRO E<br>ESCLAVO2<br>scl UNO<br><!-- End of picture text -->

_Figura 19._ **Esquema eléctrico del Raspberry Pi conectando en un bus I2C con el Arduino MEGA 2560 y el Arduino UNO** 

Como se puede ver en la figura 19, solamente se precisaron de dos pines para la comunicación I2C, es decir, que todos los dispositivos se conectaron con los mismos cables: 

- SDA: Utilizado para el intercambio de datos. 

- SCL: Empleado como señal de reloj. 

Adicionalmente, se precisó de una tercera conexión para hacer referencia a la tierra (GND), pero como esta es común para todos los dispositivos de un circuito no se incluye en el esquema. 

La presencia de las resistencias pull-up en los pines SDA y SCL, son importantes para que la comunicación funcione correctamente, ya que I2C es un bus colector-abierto. 

Para que los Arduinos pudieran comunicarse correctamente con el Raspberry Pi por I2C, se alimentaron con una fuente de 5V y se conectaron unas resistencias de 4.7K para que el voltaje de entrada al Raspberry Pi no supere los 3.3V. 

33 

En la figura 20 se puede apreciar el montaje final de las maquetas explicadas anteriormente, 

formando un solo circuito. 



_Figura 20._ **Maqueta completa del prototipo realizado en Chile.** 

De acuerdo a los requerimientos establecidos, se identificó como necesidad fundamental establecer un control de acceso y un sistema de gestión de la información de los dispositivos IoT desde un servidor web, bajo el concepto de versatilidad y comodidad para los usuarios y administradores. Para poder crear el sistema que permitiera interconectar a los usuarios con los dispositivos se identificaron los subsistemas que permitieran llevarlo a cabo. 

Se eligió el entorno de desarrollo integrado de Arduino (Arduino IDE) como herramienta para programar el Arduino UNO R3, el Arduino MEGA 2560 R3 y el ESP8266 NodeMCU, debido a su sencillez, accesibilidad y compatibilidad. Se eligió el framework de web Django que se eligió para desarrollar el servidor web dentro del Raspberry Pi 4 modelo B, por los siguientes motivos: 

- Es un software de código abierto, y fácil de instalar. 

- Su framework es seguro, organizado y utiliza patrones de arquitectura del software. 

- Posee una alta calidad en su documentación. 

34 

- Ofrece herramientas para su administración. 

El siguiente paso fue definir los casos de uso que representaría una vista externa del sistema. Mediante estos diagramas podemos ver con más detalles las funcionalidades generales del servidor web, así como saber quiénes pueden acceder a las mismas. 

La figura 21 muestra los diferentes módulos y funcionalidades que tendrá a su disposición el rol administrador (o superusuario) del servidor. Como tal, un cliente con el rol de administrador va a tener los permisos necesarios para poder encargarse de todas las labores de gestión del sistema. 



<!-- Start of picture text -->
-semen ><br>Usuarios, eT = eR<br>Tas Sena,<br>Exportar historico ba<br>Gel bsese<br>Administrador tend ‘Visualizar la<br>Acceder al Area ends informacién<br><!-- End of picture text -->

_Figura 21._ **Actividades del administrador** 

La figura 22 muestra los diferentes módulos y funcionalidades que tendrá a su disposición un usuario que se haya registrado en el servidor. 



<!-- Start of picture text -->
ena<br>Senay, luminosidad<br>t<br>registradosUsuarios Ver “aboratorode laboratorio de prototipos<br><!-- End of picture text -->

_Figura 22._ **Actividades de los usuarios registrados** 

35 

Como tal, un usuario que se registre en el servidor podrá supervisar y manejar los elementos que se encuentran en el laboratorio, y ver la información registrada a lo largo de la semana, de lunes a viernes, de 7 am a 7 pm, como la temperatura, humedad relativa, luminosidad y presencia. 

Un usuario con el rol de “Administrador” también se considera como un “Usuario registrado” en el sistema. 

La figura 23 muestra los diferentes módulos y funcionalidades que tendrá a su disposición todos los usuarios, ya sean los que están registrados, como los que no están registrados. 



<!-- Start of picture text -->
A<br>los usuarios<br><!-- End of picture text -->

_Figura 23._ **Actividades de los todos los usuarios** 

Como tal, todos los usuarios podrán acceder a la página de Inicio y a la página “Acerca de” del servidor web, donde obtendrá información sobre el servidor. 

En el tiempo que se trabajó en Venezuela se comenzó a desarrollar un grupo de funciones en Javascript que permitieran al usuario comunicarse con los dispositivos IoT cada 10 segundos desde el front-end del servidor Django, siendo una manera más directa de comunicarse con los dispositivos en tiempo real. Sin embargo, tras un análisis exhaustivo y realizar varias pruebas de campo, se consideró que esta solución no era eficiente, ya que a futuro generaría múltiples conexiones que sobrecargaría el sistema. 

Por tanto, se concluyó que la solución más eficiente era desarrollar las funciones de comunicación en Python para que se ejecutaran desde el back-end del servidor Django, de modo que el Raspberry Pi fuese quien solicitara información a los dispositivos IoT cada 1 minuto y se guardara en una base de datos local. Esto con el fin de que cuando el usuario lo solicitara, en tiempo real solo se necesitara extraer los últimos datos guardados en la base de datos. 

36 

Para evitar que la base de datos se llene rápidamente, se borran los datos antiguos de las tablas cada cierto tiempo, dejando los más recientes guardados. 

Se determinó que la temperatura externa, la humedad relativa externa y la humedad del piso eran variables de menor prioridad en la base de datos; ya que la temperatura y la humedad relativa exterior solo se utilizan para ser comparadas con las presentes en el laboratorio, mientras que la humedad de piso no cambia su estado rápidamente en el tiempo, y solo alerta al usuario cuando existe una fuga. Por tanto, la información antigua se borraría después de dejar una nueva. 

En contraste con lo anterior, la temperatura, humedad relativa, luminosidad y presencia del laboratorio es prioridad para guardar en la base de datos, por lo que, para evitar que se llene rápidamente, cada 1 minuto se guardará la información recibida en una tabla de datos. Después de 1 hora y 1 minuto se calculará el promedio, para guardar el resultado en una tabla de datos aparte, borrando las muestras utilizadas, dejando sólo las del minuto 0 y el minuto 1. 

En base a este análisis, dado a la complejidad del problema, para el almacenamiento de los datos de los sensores de los dispositivos IoT se diseñó una base de datos simple para un solo laboratorio, dando como resultado las entidades que se muestran en la figura 24. 



<!-- Start of picture text -->
Temperatura exterior ~ Humedad exterior > Humedad piso =<br>+ id INTEGER NN + id INTEGER NN + id INTEGER NN<br>Interior ~ Promedio temperatura ~ Promedio presencia ~<br>+ id INTEGER NN + id INTEGER NN * id INTEGER NN<br>temp VARCHAR NN temp VARCHAR NN mov VARCHAR NN<br>hum VARCHAR NN dia_inicio DATETIME NN dia_inicio DATETIME NN<br>presencia VARCHAR NN dia_fin DATETIME NN dia_fin DATETIME NN<br>tum2 VARCHAR. NN Gee) = Promedio luminosidad ~<br>ACA VARCHAR NN — Vancuae NN lum object VARCHAR” NN<br>dia_horaleida DATETIME NN dia fin DATETIME NN gales DATETIME NN<br><!-- End of picture text -->

_Figura 24._ **Diseño de las tablas en el módulo "iot" de la base de datos** 

Donde las funciones de las tablas diseñadas serían las siguientes: 

- Temperatura_exterior: Guarda el valor de la temperatura exterior que recibe del ESP8266 NodeMCU, con la fecha-hora en la que se guardó la lectura. 

37 

- Humedad_exterior: Guarda el valor de la humedad exterior que recibe del ESP8266 NodeMCU, con la fecha-hora en la que se guardó la lectura. 

- Humedad_piso: Guarda cada 5 minutos el valor de la humedad de piso que recibe del ESP8266 NodeMCU, con la fecha-hora en la que se guardó la lectura. 

- Interior: Guarda las variables que recibe del Arduino MEGA 2560 R3: temperatura, humedad relativa, presencia, luminosidad de las secciones 1 y 2, estado del seguro de la puerta, estado de los aires acondicionados 1 y 2, y la fecha-hora que se recibió la información. 

- Promedio_temperatura: Se encarga de guardar el resultado del promedio de temperatura de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. 

- Promedio_humedad: Se encarga de guardar el resultado del promedio de temperatura de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. 

- Promedio_presencia: Guarda el resultado del promedio de presencia de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. 

- Promedio_luminosidad: Guarda el resultado del promedio de luminosidad de un grupo de muestras y el objeto/lugar de donde se tomaron; donde dia_inicio es la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. 

Para el registro de usuarios, se utilizó el modelo de tabla User que ofrece el framework de Django, y se añadió la tabla Perfil que creó Schafer (2018) en su tutorial de Django. Donde Perfil tiene una relación uno a uno con el modelo User, donde User es el modelo padre. 

Los atributos del modelo Perfil son los siguientes: 

- Id: Identificador único de tipo entero, que está predefinido en el modelo en la base de datos. 

- User: ID heredado del modelo User, es único. 

- Avatar: Un atributo que contiene la imagen avatar del usuario. 

38 

Una vez que se definieron los casos de uso y los procesos realizados en el back-end, se diseñaron los módulos para el servidor web, esquema que se muestra en la figura 25. 



<!-- Start of picture text -->
Raspbian<br>() dj U<br>Ceejosquitto Mart y} Django EIEN celery Beat Redis Queue:<br>(MarT Broker) asincronas (Broker)<br>Tareas para que<br>eventy Celery ejecute<br>Celery<br>Workers<br>ce Ge ee Co<br>8saiites<br><!-- End of picture text -->

_Figura 25._ **Esquema del funcionamiento del servidor** 

Se diseñó el módulo Server, que sirve como módulo central para el servidor web. Es un módulo que contiene el mapa URL que sirve para redirigir las peticiones HTTP a la vista apropiada, basándose en la petición que realice el usuario; contiene el código fuente de los archivos estáticos que se distribuyen automáticamente a través de los otros módulos: Imágenes, ficheros en CSS, Javascript, y PDF; y las configuraciones necesarias para realizar ciertas tareas del servidor. 

Se diseñó el módulo Users, que contiene las funciones necesarias para generar el formulario que permite el registro de usuarios en el servidor. 

Se diseñó el módulo web_plataform, que contiene múltiples vistas que se encargan de ejecutar las tareas más simples de la plataforma web del servidor, por ejemplo: Visualizar la página de Inicio, crear un fichero .xls para los administradores que deseen exportar un respaldo de la base de datos; o visualizar los manuales de usuario y administrador. 

Se diseñó el módulo “mqtt”, donde se encuentran las funciones necesarias para la implementación del protocolo de comunicación MQTT. 

Se diseñó el módulo “iot”, que contiene las funciones necesarias para la implementación del Internet de las Cosas utilizando el protocolo I2C para comunicarse con los Arduinos, 

39 

guardando la información recibida por los sensores en la base de datos. En este módulo estaría guardadas las vistas: Panel de control del laboratorio, y los Registros de la semana. 

Después de terminar el esquema del funcionamiento del servidor, se diseñó un prototipo visual que sería desarrollado en código. Comenzando por la página de Inicio y la página de Acceso, tomando de referencia el blog realizado por Schafer (2018), como base del diseño de la interfaz. 

Se diseñó la página de control para los administradores donde se pudiera gestionar la información de los laboratorios y los usuarios, tomando el modelo de Django Admin, dado a su simplicidad y utilidad. 

Seguidamente, se diseñó la página de control: “Laboratorios – Laboratorio de Prototipos”, que se muestra en la figura 26. 



<!-- Start of picture text -->
tt<br>a<br>snot<br>bg] Bd<br>i x<<br><!-- End of picture text -->

_Figura 26._ **Diseño de la página de Laboratorios - Laboratorio de Prototipos** 

40 

Seguidamente, se diseñó la página del registro histórico: “Registros – Laboratorio de Prototipos”, que se muestra en la figura 27. 



<!-- Start of picture text -->
FIs<br>=<br><!-- End of picture text -->

_Figura 27._ **Diseño de la página de Registros – Laboratorio de Prototipos** 

Tomando como base los diseños preliminares y utilizando las herramientas de programación elegidas, inició la tercera fase del proyecto: Construir el servidor IoT que permitiera la interconexión entre los dispositivos y usuarios. 

Para comunicar el ESP8266 NodeMCU con el servidor se utilizó el protocolo de comunicación MQTT. Para implementarlo, se instaló en el Raspberry Pi el bróker Eclipse Mosquitto, el cual se eligió por ofrecer las siguientes ventajas: 

- Es un bróker MQTT de código abierto, liviano y adecuado para servidores de baja potencia. 

- Es multiplataforma, capaz de instalarse en Mac, Debian, Windows, Ubuntu y en Raspberry Pi. 

- Posee su propio servidor, donde se pueden realizar pruebas para el paso de mensajes. 

41 

Luego de instalar Mosquitto en el Raspberry Pi, se configuró el servicio para se ejecutase cada vez que el sistema del equipo iniciara, y la autenticación del cliente para utilizar el bróker. Esta configuración se explica con más detalle en el Apéndice C, el manual de usuario. 

Posteriormente se realizaron pruebas para comprobar el funcionamiento del bróker, se programaron los clientes: El servidor y el ESP8266 NodeMCU, para que se comunicaran mediante Mosquitto. Durante este proceso se tuvieron en cuenta los siguientes factores: 

- Que ambos clientes estén conectados a la misma red Wi-Fi y a la IP de red donde se encontrara el broker, que este caso fue la red WiFi “Rozas” y la IP 192.168.100.18 del Raspberry Pi. 

- Conocer uno de los usuarios y clave guardados en el fichero passwd, para poder utilizar el broker; que este caso fue el usuario rasp-broker, clave ucab*ucab. 

- Conectarse al mismo puerto que el broker, que en este caso es el puerto 1883. 

- Los tópicos donde el ESP8266 NodeMCU publicaría mensajes serían los siguientes: “esp8266/temperature” para la temperatura exterior, “esp8266/humidity” para la humedad relativa exterior, y “esp8266/water” para la humedad del piso. 

Para programar el ESP8266 NodeMCU se utilizaron las librerías que se muestran en el Apéndice D, el manual técnico. Luego de que el dispositivo se conectara a la red Rozas, este procedió a conectarse al broker MQTT, para posteriormente iniciar el siguiente bucle: 

- Cada 60000 milisegundos (1 minuto) el ESP8266 procede a leer la temperatura y la humedad del sensor DHT11, para luego enviar un mensaje a los tópicos “esp8266/temperature” y “esp8266/humidity” con los datos en formato entero. 

- Cada 300000 milisegundos (5 minutos) el ESP8266 procede a leer el sensor de agua, para luego enviar un mensaje al tópico “esp8266/water” con el dato: “1” si el sensor estaba mojado, “0” si el sensor estaba seco. 

Los tiempos se eligieron por los cambios significativos y ratio de cambio de cada sensor. 

El sensor DHT11 de temperatura y humedad envía una señal al ESP8266 NodeMCU cada 2 segundos, como el tiempo de lectura debe ser mayor que el tiempo en que el sensor envía la señal 

42 

al dispositivo, se decidió que la lectura del sensor fuera cada 1 minuto. El muestreo del sensor de agua no variará mucho en el tiempo ya que depende de si hay una fuga de agua o no, por lo que se decidió que la lectura será cada 5 minutos, mientras que el muestreo del sensor DHT11 puede variar significativamente de acuerdo a las condiciones ambientales fuera de los laboratorios. 

Para comprobar que el ESP8266 NodeMCU cumpliera con los requerimientos se utilizó la terminal del Raspberry Pi para comunicarse con el dispositivo. Para las pruebas, utilizamos tres terminales para suscribirnos a los tópicos de manera simultánea. Dando como resultado la lectura de los sensores que llegaban en forma de mensajes en los tiempos definidos (ver figura 28). 



_Figura 28._ **Lecturas de los sensores conectados al ESP8266 NodeMCU recibidas del Raspberry Pi** 

Para programar el servidor que permitiera comunicar el Raspberry Pi con los dispositivos IoT, se creó un proyecto “Server” en el editor Visual Studio Code. Luego, se creó un entorno virtual con la librería estándar virtualenv de Python, donde se instalarían todas las librerías para el funcionamiento del servidor. Las librerías de Python que fueron instaladas en el entorno virtual se muestran en el manual técnico, que se encuentra en el Apéndice D. 

Luego de activar el entorno virtual, se instaló la librería de Django para la creación del proyecto “Server”, que contiene la base de datos y los módulos que en conjunto son el back-end del servidor web. Por defecto, se creó el módulo Server, donde se halla el núcleo del servidor. 

También se añadió un favicono que el servidor web pudiera mostrar en cada página, utilizando una imagen que pertenece a la Open Automation Software. 

El módulo “Server” contiene una serie de archivos que permiten realizar los ajustes necesarios para realizar las tareas: 

- Que el formato de las vistas del servidor se muestre en español. 

43 

- Que tome por internet el timezone, que en este caso es “America/Santiago”, para poder realizar las operaciones que requieran el uso de fecha y hora. 

- Tener un registro de todas las aplicaciones/módulos que se crearon, la localización de los ficheros estáticos y los detalles de configuración de la base de datos. 

- El archivo celery.py que permite ejecutar funciones de las librerías Celery y django-celerybeats, y que contiene el cronograma de las tareas que se ejecutarán en el servidor. 

- El esquema de URLs, que da acceso al usuario a vistas que forman parte del servidor web. 

- El archivo asgi.py fue modificado para integrar Channels y Daphne al servidor web, de modo que el servidor trabaje con los protocolos de comunicación HTTP y Websockets. 

Se desarrolló la interfaz web que forma parte del front-end del servidor web, comenzando con las páginas que tomaran menor tiempo de programación: Inicio y Ayuda. 

Para facilitar el desarrollo de la interfaz web se utilizó la librería Bootstrap 4, y se adaptó el diseño del blog que implementó Schafer (2018) en su tutorial de Django. Se creó la plantilla base.html, que sería referenciada por cada una de las vistas para evitar repetir código. 

Para la interfaz gráfica del servidor se crearon los módulos “web_plataform” y “users”. 

El módulo “users” se configuró siguiendo el tutorial del desarrollador Schafer (2018), para crear los sistemas de registro y autenticación de usuarios del servidor web, mejorando el diseño de los formularios con la librería Crispy Form, que contiene un paquete de plantillas y CSS del framework bootstrap. Se implementó un token CSRF de Django en las vistas, para prevenir agujeros de seguridad. Para los administradores, Django ofrece una página de acceso en Django Admin, para darle acceso a la interfaz. 

En el módulo “users” se creó el archivo Forms.py para generar los formularios “Registrar” y “Editar perfil”, que llenaría el usuario para realizar dichos procesos, incluye registrar datos como: username, email, password1, password2, y avatar. Para facilitar el proceso de creación de usuario y validación de los campos, se importó el formulario de creación de usuario que viene en Django: UserCreationForm; también se importó la clase Form de Django para la creación del formulario, que contiene atributos con predefinidos, tales como: email. 

44 

En el módulo “users” se modificó el archivo Views.py para crear funciones que reciban la web request del usuario y retorne una web response en formato HTML. 

La función Register() dirige al usuario a la vista register.html que se muestra en la figura 29. Para facilitar este proceso, se importó a esta función la clase UserRegisterForm codificada en Forms.py para gestionar las casillas del formulario. Si el formulario se llenó correctamente, se envía la información a la base de datos para crear el usuario. 



<!-- Start of picture text -->
Registro<br>‘iT RAGECe mano Uncaman as. tory QU<br>casa contac<br><!-- End of picture text -->

_Figura 29._ **Registro, o register.html** 

La función Profile() permite al usuario editar su perfil, dirigiendo al usuario a la vista profile.html que se muestra en la figura 30. Si el usuario ha iniciado sesión, puede realizar una pertición POST para actualizar su username, email y avatar en la base de datos. 



<!-- Start of picture text -->
admin<br>Eaitar pert<br>‘Requendo.150 caracies como maximo, Uncamente twas, ghesy @//+H/_<br>oe ces gmatam<br>estar [CoeNo hecosen<br><!-- End of picture text -->

_Figura 30._ **Editar perfil, o profile.html** 

45 

Se modificaron los archivos Admin.py y Models.py para registrar el modelo Perfil en la base de datos del servidor, y que la tabla se muestre al ingresar en Django Admin. 

Los campos que conforman el modelo Perfil son: Id, user y avatar. El campo Id está predefinido en Django, es de tipo entero, y se va incrementando a medida que ingresa información nueva. El campo user define una relación Uno-Uno entre el modelo Perfil y el modelo Users, que viene predefinido. El campo avatar guarda una imagen que el usuario usará de avatar hasta que lo cambie al editar su perfil, una función la dimensionará automáticamente a 300px * 300px. 

Se creó el archivo Signals.py, que contiene unas funciones que se activan cuando se presentan un evento en específico, a saber: 

- Crear un nuevo Perfil en la base de datos cuando se crea un nuevo usuario. 

- Actualizar el Perfil de usuario, luego de actualizar los campos asociados en la tabla User. 

Las URLs de register, profile, login, y logout se encuentran en el urlpatterns del archivo urls.py en el módulo Server. 

Para crear el sistema de autenticación de usuarios en el servidor web, donde los usuarios puedan iniciar sesión (login), cerrar sesión (logout), y haber iniciado sesión con su cuenta para acceder a ciertas páginas del servidor, se utilizó el front-end que provee Django con las funciones login y logout. Para lograr esto, se importó la clase views de django.contrib.auth, y se realizaron las configuraciones para dirigir al usuario a las clases vistas definidas por Django: LoginView y LogoutView, las cuales se encargaran de la lógica de los formularios, excepto las plantillas. 

Se creó la plantilla login.html que se muestra en la figura 31. 



<!-- Start of picture text -->
ior 1OT<br>Login<br>a)<br><!-- End of picture text -->

_Figura 31._ **Iniciar sesión, o login.html** 

46 

Después, se creó la plantilla logout.html que se muestra en la figura 32. 



<!-- Start of picture text -->
Se ha cerrado la sesion<br><!-- End of picture text -->

#### _Figura 32._ **Cerrar sesión, o logout.html** 

Para mejorar el diseño de las páginas login.html, logout.html y register.html se utilizó la librería Crispy Form, y se agregó al código la etiqueta oculta del token CSRF para fines de seguridad. De esta manera, después de registrarse existosamente en el servidor, el usuario será dirigido a la página de Login, para iniciar sesión y ser dirigido a la página: Inicio. Ciertas opciones del menú del servidor web se mostrara de acuerdo a los casos de uso. Si alguno de los usuarios quiere acceder a cierto URL que no le corresponde, será redirigido a la página de Inicio. 

El módulo “web_plataform” contiene el grupo de URLs que da acceso a algunas páginas del servidor según la request del usuario, tales como: Inicio, Ayuda y Backup. Las funciones que dan acceso a estas páginas se encuentran en view.py, a saber: 

- Home(): Es una función que recibe por parámetros una web request de cualquier usuario que quiere acceder a la página de inicio, dirigiéndolo a home.html que se muestra en la figura 33. 



<!-- Start of picture text -->
Te damos la bienvenida a este servidor.<br>De el siguiente paso, para tener accesoa los siguientes servicios loT del servidor:<br>+ Otecemos vistvidad a nvesros usuarios registrados sobre los sensores y acuadores conectados<br>Permitmos a nuestros usuarios registrados el control sobre los actundores conectados al servo, al servidor<br><!-- End of picture text -->

#### _Figura 33._ **Inicio, o home.html** 

- Backup(): Posee un decorador @login_required para dirigir al usuario a la página de login si no ha iniciado sesión. Si el usuario inició sesión, pero no es un administrador, se le redirigirá a la página home.html. Si cumple con las condiciones mencionadas, se le dirigirá a la página backup.html que se muestra en la figura 34, donde puede descargar un respaldo en formato excel (.xls) del histórico del laboratorio de prototipos, o entrar al Área Administrativa. 

47 



<!-- Start of picture text -->
Area Administrativa<br>Pagina donde puede acceder al Area administrativa del servidor, donde podra gestionar fos usuavios,<br>registrados, y a informacion registrada en la base de datos.<br>My Backups<br>Pagina donde se puede descargar un archivo de la base de datos que contenga la informacién de la<br>temperatura, humedad, luminosidad y presencia leido hasta ahora en los laboratorios.<br>Laboratorio de prototipos<br><!-- End of picture text -->

_Figura 34._ **Backup, o Backup.html** 

El Área Administrativa es una aplicación que provee Django, donde se pueden añadir, 

modificar y eliminar información de la base de datos (ver figura 35). 



<!-- Start of picture text -->
enane<br><!-- End of picture text -->

_Figura 35._ **Área administrativa del servidor web** 

- Export_excel(): Esta función se ejecuta cuando se presiona el botón “Exportar en Excel (.xls)”, posee un decorador @login_required que sirve para dirigir al usuario a la página de login si no ha iniciado sesión. Si el usuario no es un administrador, se le redirigirá a la página home.html. Pero si cumple con las condiciones, se descargará un archivo Excel (ver figura 34) llamado “registro_lab_prototipos_<<fecha actual en formato día/mes/año>>”, que contendrá el registro histórico de la temperatura, humedad relativa, luminosidad en la sección 1 y sección 2, y presencia que está guardado en la base de datos (ver Apéndice B). 

48 

- About(): Es una función que sirve para dirigir al usuario a la página de Ayuda o about.html (ver figura 36), donde se visualizan los manuales. Si el usuario no ha iniciado sesión no se mostrarán los manuales. El manual de usuario se mostrará a los usuarios registrados. Y el manual de usuario y el técnico se mostrará a los administradores. 



<!-- Start of picture text -->
BSSS ee<br>oer Manual de administracion<br>Servidor loT - Manual<br>Servidor loT - Manual técnico<br><!-- End of picture text -->

_Figura 36._ **Acerca de, o About.html** 

Se creó el módulo “mqtt”, donde se modificó el archivo apps.py, que contiene el código que permite utilizar el protocolo MQTT como un proceso background thread. 

El background thread es iniciado por una clase llamada MqttClient(), a la cual se le pasa la IP del broker 192.168.100.18, el puerto 1883 y un arreglo que contiene los tópicos a los que se suscribirá el servidor: “esp8266/temperature”, “esp8266/humidity”, “esp8266/water”. 

Al iniciar el hilo, en la clase MqttClient() se ejecuta el método connect_to_broker() que configura la instancia cliente para conectarse al bróker de manera asíncrona, accediendo al bróker con el usuario “rasp-broker” y la clave “ucab*ucab”. Cuando ya esté conectado, el cliente se subscribirá a los tópicos contenidos en el arreglo. 

De esta forma, mientras el servidor este en ejecución, el servidor web también estaría conectándose al bróker de manera asíncrona, sin bloquearse. 

Cada vez que el servidor recibiera un mensaje de los tópicos, la información sería guardada en la base de datos en el modelo correspondiente, junto con la fecha y hora en la que se recibió el mensaje, de la siguiente manera: 

49 

- La información del tópico “esp8266/temperature” será guardada en el modelo Temperatura_exterior. 

- La información del tópico “esp8266/humidity” será guardada en el modelo Humedad_exterior. 

- La información del tópico “esp8266/water” será guardada en el modelo Humedad_piso. 

Tras guardar los mensajes recibidos desde el bróker en la base de datos, el mensaje anterior guardado será borrado de la base de datos; pues solo se visualizará el estado más reciente de la temperatura y la humedad relativa exterior para compararla con el interior del laboratorio, y comprobar en el momento si el piso está húmedo o no. 

El Arduino MEGA 2560 R3 se programó para que leyera los siguientes sensores: DHT22, LDR, y PIR; leer el estado del seguro de la puerta y los aires acondicionados. Para el script se utilizaron las librerías que se muestran en el Apéndice D, el manual técnico. 

Como esclavo, al Arduino MEGA2560 R3 se le asignó la dirección 11 (u #0x0b) en el bus I2C, y se programó para esperar la solicitud del Maestro, el Raspberry Pi, para enviar las lecturas. Cuando se presenta el evento, comenzará a leer sensor por sensor, guardando la información recibida en un arreglo de bytes de 8 elementos, que es enviado al maestro. 

Como esclavo, el Arduino UNO R3 se le asignó la dirección 12 (u #0x0b) en el bus I2C, y se programó para esperar una solicitud del Maestro, el Raspberry Pi, para que guardarla en una variable “x” de tipo entero y llevar a cabo el evento correspondiente. Dependiendo del valor de x, el Arduino UNO R3 realizaría una acción, como se muestra en la tabla 3. Para el script se utilizaron las librerías que se muestran en el Apéndice D, el manual técnico. 

_<u>Tabla 3. Eventos que lleva a cabo el Arduino UNO R3 según el valor de x</u>_ 

|**Valor de x**|**Evento**|
|---|---|
|10|Apagar luces de la sección 1|
|11|Encender luces de la sección 1|
|20|Apagar luces de la sección 2|
|21|Encender luces de la sección 2|
|30|Apagar AC 1|
|31|Encender AC 1|
|40|Apagar AC 2|
|41|Encender AC 2|



50 

Tras programar los Arduinos, se configuró el Raspberry Pi para que permitiera el uso del protocolo I2C en el equipo. Los detalles se muestran en el manual de usuario, en el Apéndice C. 

Se comprobó que los dispositivos IoT estuviesen conectados al equipo con ayuda del comando: “i2cdetect -y 1”. Dando como resultado lo que se muestra en la figura 37, donde se muestra las direcciones del Arduino MEGA 2560 (#0x0b uo 11) y el Arduino UNO (#0x0c uo 12). 



<!-- Start of picture text -->
ni@raspberrypi: i2edetect -y 1<br>12345 7 9abcdeeét<br><!-- End of picture text -->

_Figura 37._ **Detectando los dispositivos conectados al bus I2C con el comando i2cdetect** 

Después de comprobar que los dispositivos IoT se conectaban al Raspberry Pi, se creó el módulo “iot” en el servidor. 

En el módulo “iot” se modificaron los archivos i2creader.py e i2cwriter.py que fueron creados anteriormente, adaptándose a los componentes utilizados en el prototipo desarrollado en Chile, con la finalidad de usar los comandos para comprobar que el servidor recibe información del Arduino MEGA 2560 R3, o enviar mensajes al Arduino UNO. 

Luego de comprobar que el servidor estaba recibiendo la información de los dispositivos y guardándose en la base de datos, se procedió a construir el dashboard que mostraría la recolección de datos de los sensores en tiempo real y los botones para manejar los actuadores. Para ello, en el módulo “iot” se creó la plantilla lab_one_dashboard.html, tomando de base el modelo realizado en la fase de diseño. 

Para funcionar correctamente, lab_one_dashboard.html utiliza un grupo de archivos estáticos ubicados en la carpeta static del módulo Server, para definir la apariencia visual de la tabla de control y hacer que funcione, los archivos: Switch.css, Gauge.css, y Realtime.js. 

51 

Realtime.js es el archivo que añade las características interactivas de lab_one_dashboard.html para que funcione como un panel de control del laboratorio, utilizando websockets para recibir información de consumers.py a tiempo real y que se muestre en la interfaz. Para más detalles, revisar el manual técnico en el Apéndice D. 

Luego de validar el funcionamiento de la plantilla lab_one_dashboard.html, se procedió a crear la página donde se mostraría el histórico de registros de Temperatura, Humedad relativa, Luminosidad/Horas de encendido y Presencia, con sus respectivas gráficas. Para ello, se creó la plantilla lab_two_dashboard.html, utilizando de base el modelo realizado en la fase de diseño. 

Lab_two_dashboard.html utilizó el siguiente grupo de archivos estáticos ubicados en la carpeta static que se encuentra en el módulo Server: Tables.css, Historical.css, e Historical.js. 

Historical.js añade las características interactivas de lab_two_dashboard.html, utilizando websockets para recibir información de consumers.py y muestre el registro histórico de la semana de la temperatura, humedad relativa, luminosidad y presencia, junto a sus respectivas gráficas. 

Para mantener una conexión persistente en la página lab_one_dashboard.html, manteniendo intacta la integración de funciones con el resto del framework de Django, se implementó el protocolo websockets utilizando las librerías Channels, Redis y Celery. 

Django Channels coloca una capa intermedia que se encarga de procesar las peticiones HTTP a las vistas de Django y las conexiones websocket a un consumer websocket. 

Para entender cómo funciona la librería Channels se estudiaron varios casos donde fue implementada: El tutorial que viene en la documentación oficial de Channels donde implementan un Chat Server, el tutorial de Channels simplificado de Ivy (2022) donde envían por mensaje un número generado aleatoriamente desde el consumer, los tutoriales de Red Eyed Coder Club (2020) donde utilizan Channels, Celery y Chart.js para construir diferentes aplicaciones en tiempo real, y el tutorial Very Academy (2020) donde construyen un Chatroom asíncrono. 

Se configuró el servidor para usar ASGI, del inglés Asynchronous Server Gateway Interface, utilizando funciones de la librería Daphne para manejar la naturaleza asíncronica de la 

52 

librería Channels. Se creó el archivo Asgi.py en el módulo Server, el cual contiene la configuración de rutas que debe utilizar Channel, ws_urlpatterns, que le indica qué consumers debe ejecutar cuando reciba un HTTP request del usuario; similar a la configuración URLs de Django. Para más detalles, revisar el manual técnico en el Apéndice D. 

Una vez que se terminó de configurar el ASGI en el servidor, se crearon los consumidores, o consumers. Un consumidor es una abstracción de un canal o channels en forma de clase, similar a las Views de Django, donde se implementa los métodos que se encargarán de manejar los eventos o acciones de los usuarios. Existen varios tipos de consumidores en Channels, que dependiendo de la clase que herede se encargará de manejar un evento distinto. 

Para el desarrollo del proyecto se creo un archivo llamado consumers.py en el módulo “iot”, que contiene el código de los consumidores: Lab2Consumer y RecordConsumer. 

Lab2Consumer es un consumidor o clase, que hereda la clase AsyncWebsocketConsumer para poder manejar conexiones websockets de manera asíncrona. Está enlazado con lab_one_dashboard.html. A diferencia de un WebsocketConsumer, Lab2Consumers maneja channel_layer y todos sus métodos, incluyendo: connect(), disconnect() y receive(), estan definidos de manera asíncrona. 

Connect() es un evento que se ejecutará cuando un usuario se conecte al canal websockets. Su función es agregar al usuario registrado a un channel_layer definido como “lab_event”, extraer la última información del laboratorio guardada en base de datos, y enviarla dentro de un objeto JSON por el canal de websockets para que se muestre en la página de Laboratorio de Prototipos. 

Disconnect() es un evento que permite desconectar al usuario del channel_layer “lab_event” del canal websockets. 

Receive() es un evento que se ejecuta cuando un mensaje es envíado por el canal websockets. Los mensajes recibidos estarán dentro de un objeto JSON, por lo que son decodificados con el método json.loads() para convertirlos en un diccionario/registro de Python, guardando la información en una variable llamada text_data_json. El registro text_data_json estará formado por los siguientes elementos: message y type, que sería el mensaje y método a ejecutar. 

53 

Si la variable type es igual a “action_event” se llamará a la función write_module del archivo i2cwriter.py, pasando por referencia la dirección 12, que pertenece al Arduino UNO R3, y message, que será la acción o evento que llevará a cabo el Arduino. 

El mapeo objeto-relacional, ORM, de Django es una pieza de código síncrona, por lo que se requirió utilizar el decorator database_sync_to_async en los métodos que maneja la clase Lab2Consumer, con los que extrae información la base de datos. 

Para utilizar la channel_layer “lab_event” en Lab2Consumer, para que los usuarios registrados que accedan a la vista lab_one_dashboard.html reciban los mismos mensajes en tiempo real, se necesitó instalar un broker en el Raspberry Pi, e instalar la librería Python asociada. 

Entre los brokers más usados para aplicaciones web en Django que utilizan la librería Channels, tenemos Redis y RabbitMQ. Al final, se eligió Redis, ya que en comparación a RabbitMQ, Redis es más rápido, ya que procesa los mensajes principalmente en memoria. Además, puede enviar hasta decenas de millones de mensajes por segundo, mientras que RabbitMQ gestiona hasta decenas de miles de mensajes por segundos. 

Redis funciona mejor en aplicaciones que requieren procesamiento de datos en tiempo real y almacenamiento caché de baja latencia; mientras que RabbitMQ es más adecuado para tranferir archivos de gran tamaño entre aplicaciones. 

Para instalar Redis en el Raspberry Pi, se siguieron los pasos del tutorial de Khan (2022). Para conocer más detalles, revisar el manual técnico en el Apéndice D. 

Luego, se instaló la librería channels-redis en el entorno virtual, y desde Settings.py se configuró el servidor para que pudiera acceder a la base de datos caché de la aplicación Redis por medio de su puerto 6379. 

De esta manera, cada Consumer que acceda a la vista lab_one_dashboard.html, y envíe un mensaje, este mensaje será recibido por el resto de conexiones y el tipo de mensaje estará asociado a un método en Lab2Consumer: 

54 

- Update_lab_data: Contiene la última información agregada a la tabla Interior de la base de datos, enviada desde el consumidor en formato JSON. 

- Update_temp_ext: Contiene la última información agregada a la Temperatura_exterior de la base de datos, enviada desde el consumidor en formato JSON. 

- Update_hum_ext: Contiene la última información agregada a la Humedad_exterior de la base de datos enviada desde consumidor en formato JSON. 

- Update_hum_floor: Contiene la última información agregada a la Humedad_piso de la base de datos enviada desde consumidor en formato JSON. 

- Action_event: Contiene el mensaje enviado desde historical.js, por un usuario que se haya conectado al grupo lab_event. 

Para más detalle, revisar el manual técnico en el Apéndice D. 

RecordConsumer es un consumidor, o clase, que hereda la clase WebsocketConsumer y está enlazado con lab-two-dashboard.html. Funciona de manera síncrona y sus métodos principales son: connect(), disconnect(), receive() y get_previous_week_data(). 

Connect() es un método que se ejecutará cuando un usuario quiera conectarse en el canal websockets. Si el usuario está registrado en el servidor, se conectará al canal websockets. 

Disconnect() es un método que sirve para desconectar al usuario del canal websocket. 

Receive() es un método que recibe los mensajes del websocket, donde message es un objeto JSON que al descifrarse contendra un número entre 0 y 3; el cual se pasa por parámetro junto con el número 0, que representa la semana actual, para ejecutar el método get_previousweek_data(). 

Get_previous_week_data() es un metódo que recibe por parámetro una variable “option”, que dependiendo de su valor extrae información de un campo en específico de la tabla Interior en la base de datos, que fuese registrado en la semana, entre las 7 am y 7 pm. Si la opción es 0, devuelve la temperatura; si la opción es 1, devuelve la humedad relativa; si la opción es 2, devuelve la luminosidad; y si la opción es 3, devuelve la presencia. 

55 

Para calcular el rango de fechas, entre lunes y viernes, se utilizaron funciones de la librería datetime: today(), weekday() y timedelta(). Después, se utilizó la función filter() de Django para extraer la de las tablas la información que fue tomada entre esas dos fechas, entre las 7 am y 7 pm. Posteriormente, el resultado de la búsqueda se guardaría en un arreglo myData[], que es guardado en un objeto JSON y enviado por el canal de websockets como un mensaje de tipo “user_request”. 

Para enlazar los consumers con los websockets, se creó un archivo llamado routing.py en el módulo “iot”, donde todas las conexiones a la url ws://127.0.0.1:8000/ws/lab-one/ creararán una instancia de Lab2Consumer; y donde todas las conexiones a la url ws:// 127.0.0.1:8000/ws/labtwo/ crearán una instancia de RecordConsumer. Se utilizó el método as_asgi() en cada enrutamiento, para retornar un ASGI wrapper application que instanciara un nuevo consumidor por cada conexión. Para conocer más detalles, revisar el manual técnico en el Apéndice D. 

Seguidamente, se terminó de realizar la codificación en realtime.js e historical.js para implementar la comunicación por websockets. Javascript provee de un objeto Websocket para manejar las conexiones, el cual se declaró de manera global en ambos archivos, pasando la URL ws://127.0.0.1:8000/ws/lab-one en realtime.js y ws://127.0.0.1:8000/ws/lab-two en historical.js, como parámetro para que el socket sepa a dónde tiene que conectarse. 

En realtime.js el socket que recibirá el mensaje del consumidor Lab2Consumer será un objeto JSON que, al ser decodificado, contiene la lectura de los sensores, y el tipo de mensaje con el que se identificaría dentro del canal websockets: event_update. La información recibida se mostrará en la consola del navegador y se guardarán en diferentes variables para su uso. 

Para el funcionamiento de los actuadores en realtime.js, el socket enviará un mensaje en un objeto JSON, que contiene el método del consumer Lab2Consumer a ejecutar: ac1_event() o ac2_event(), y el mensaje enviado: message; que indicará si hay que encender/apagar el aire acondicionado del laboratorio. 

En historical.js, el usuario selecciona el registro histórico que desea ver, como: la temperatura, humedad relativa, luminosidad/horas de encendido o presencia. La opción elegida, 

56 

de 0 a 3, se envía en un objeto JSON a través del canal websocket, donde el tipo de mensaje es el método del consumer RecordConsumer que se ejecutará: user_request. 

Tras comprobar que la comunicación websockets entre el back-end y front-end del servidor web funcionaba, se procedió a instalar la librería Celery para poder realizar tareas periodicas de manera automática durante la ejecución del servidor. 

Se creó el archivo Celery.py en el módulo Server, se configuró siguiendo el tutorial de Red Eyed Coder Club (2020), adaptándo el código para definir la instancia Celery. Las variables globales necesarias para la configuración de Celery se codificaron en el archivo Settings.py del módulo Server, como la URL que permite el acceso al broker Redis y la timezone utilizada. 

La librería Celery provee workers al servidor de Django. Un worker es una función que ejecuta una cola de tareas, o tasks. Los tasks son funciones que están definidas en el proyecto. Cada worker trabaja en un proceso por separado, mientras que Django le envía la cola de tasks al broker, que en este caso es Redis. Una vez que un worker termina con un task, guardara el resultado en la caché de Redis. Posteriormente, estos resultados serán buscados desde el archivo app.py. 

Se modificó el archivo __init__.py para que la app declarada en celery.py pueda ser importada cada ver que se ejecute el servidor. 

Seguidamente, se creó el archivo tasks.py en el módulo “iot” para declarar los tasks que realizará el worker de Celery. Se instaló la librería Django-celery-beat para ejecutar los tasks definidos a ciertos intérvalos de tiempos, siguiendo los pasos de la guía oficial de Celery. Los tasks que ejecutara el worker son los siguientes: 

- I2creader(): Intenta comunicarse con esclavo 11, el Arduino MEGA2560 R3, para recibir la lectura de los sensores y guardarla en la base de datos. La función se ejecutará cada 1 minuto. 

- Average_data: Calcula el promedio de la temperatura, humedad relativa, luminosidad y presencia para guardarla en la base de datos. Para ello, se extrae la información que fue guardada en la tabla Interior entre la hora anterior actual, en el minuto 0, y la hora actual en el minuto 0, 59 segundos y 59 milisegundos. Como por ejemplo: 14:00:00:00 – 15:00:59:59. Si se encontraron resultados, se separa los resultados en 4 arreglos: temperature, humidity, lum1, 

57 

lum2 y mov; para después calcular los promedios de manera separada, guardarlas en su respectiva tabla y de último borrar la información de la tabla Interior cuyo campo dia_hora_leida sea menor a la hora actual. Esta función se ejecutará cada 1 hora, minuto 1. 

- Turn_on_AC: Utiliza la función write_module() declarada en i2cwriter.py para enviar dos mensajes a la dirección del esclavo 12, el Arduino UNO, para indicarle que debe encender los aires acondicionados. La función se ejecutará a las 6:50 am, de Lunes a Viernes. 

Dentro del archivo task.py se declararon unos decorator: receiver(post_save, sender), que permite a ciertas funciones ejecutarse cuando una tabla dentro de la base de datos recibe información. También se declaró una variable global llamada channel_layer, que recibe la función get_channel_layer() de la librería Channels, permitiendo enviar mensajes a la channel_layer “lab_even” fuera del consumer. Las funciones en las que se utiliza el decorator son las siguientes: 

- Event_post_add: Si ingresan datos a la tabla Interior (Lab) de la base de datos, extrae el último dato registrado para enviarla formato JSON al channel layer “lab_events”. 

- Event_post_temp_ext: Si ingresan datos a la tabla Temperatura_exterior de la base de datos, extrae el último dato registrado para enviarla en formato JSON al channel layer “lab_events”. 

- Event_post_hum_ext: Si ingresan datos a la tabla Humedad_exterior de la base de datos, extrae el último dato registrado para enviarla en formato JSON al channel layer lab_events. 

- Event_post_hum_floor: Si ingresan datos a la tabla Humedad_piso de la base de datos, extrae el último dato registrado para enviarla en un objeto JSON al channel layer “lab_events”. 

La página Laboratorios – Laboratorio de Prototipos se divide en dos partes: 

- A la izquierda se muestran las lecturas de los sensores y los botones que controlan las luces y aires acondicionados. El lado izquierdo se divide en cuatro secciones: Temperatura y humedad relativa, luces, aire acondicionado, y seguridad. 

- A la derecha se muestra el mapa del laboratorio con la ubicación de la secciones y sensores, el mapa se desplaza hacia arriba o hacia abajo para que pueda verse en todo momento. 

Como se puede ver en la figura 38, en la sección “Temperatura y Humedad relativa” se muestra la temperatura en grados celcius, el procentaje de humedad relativa, interior y exterior, 

58 

del laboratorio de prototipos y la fecha y hora en que se realizó la última actualización. El ícono de temperatura pertenece a la página toppng.com y el icono de humedad relativa pertenece a la página pngegg.com. El nivel de temperatura interior, donde muestra un gauge, adaptado del modelo que se muestra en el tutorial de Corso (2020), que indica si el nivel de temperatura es: 

- Muy bajo: Si la temperatura es menor a 5 °C 

- Bajo: Si la temperatura es mayor o igual a 5 °C, pero menor a 21°C 

- Normal: Si la temperatura es igual a 21 °C 

- Alto: Si la temperatura es mayor a 21 °C, pero menor o igual a 25 °C 

- Muy alto: Si la temperatura es mayor a 25 °C 

El nivel de humedad relativa interior, donde muestra un gauge, adaptado del modelo que se muestra en el tutorial de Corso (2020), que indica si el nivel de humedad relativa es: 

- Normal: Si la humedad relativa es menor de 85% 

- Alto: Si la humedad relativa es igual o mayor del 85% 



<!-- Start of picture text -->
Temperatura y Humedad relativa a<br>Interior as<br>Hy 14°C 18°CExterior Dtcrane kO | Nien=tepne<br>ou 92% Py $<br>Nivel de Nivel de | sge<br>temperatura(interior)Interior humedad(interior)Interior gon‘eeSom. OQJe \YY 33<br><!-- End of picture text -->

_Figura 38._ **Temperatura y humedad relativa del laboratorio de prototipo y niveles** 

Como se puede ver en la figura 39, la sección de “Luces” es donde se puede controlar las luces de la sección 1 y 2 del laboratorio de prototipos. Donde el estado de los botones de las secciones cambia de manera automática dependiendo de la luminosidad: 

- Encendido: La luminosidad de la sección es mayor o igual a 0, y menor o igual a 30. 

59 

- Apagado: La luminosidad de la sección es mayor que 30, y menor o igual a 255. 

El nivel de lumninosidad de la sección 1 y sección 2 se muestra con un gauge, adaptado del modelo que se muestra en el tutorial de Corso (2020), que indica si el nivel de luz es: 

- Muy fuerte: Si la luminosidad en la sección es mayor o igual a 0, y menor o igual a 30. 

- Fuerte: Si la luminosidad en la sección es mayor que 30, y menor o igual a 102. 

- Media: Si la luminosidad en la sección es mayor que 102, y menor o igual a 153. 

- Debil: Si la luminosidad en la sección es mayor que 153, y menor o igual a 204. 

- Nula: Si la luminosidad en la sección es mayor que 204, y menor o igual a 255. 



<!-- Start of picture text -->
*%<br>Lar] Lary<br>Seccién 1 Secci6n 2 be BS<br>Apaqado ©$Encenddo eas xf a ||a<br>|4)<br>lluminacion 3<br>(Seccion 1) (Secciénlluminacion2) i g= e<br>— wy<br>t= Oo Fi<br>Fre (8) say nnn becca e Detecorfal e|<br>Aire acondicionado<br>|| .<br><!-- End of picture text -->

_Figura 39._ **Control de las luces del laboratorio de prototipo y niveles de iluminación** 

Como se puede ver en la figura 40, en la sección “Aire acondicionado” se puede controlar los aires acondicionados de la sección 1 y 2 del laboratorio de prototipos. Donde el estado de los botones cambia de manera automática dependiendo del estado de los aire acondicionados: 

- Encendido, si el valor recibido es 1. 

- Apagado, si el valor recibido es 0. 

Como se puede ver en la figura 43, la sección “Seguridad” es donde se muestra si hay presencia en el laboratorio de prototipos, si el seguro de la puerta esta colocado, y si existe una fuga de agua. Donde el estado de estas variables cambia de acuerdo a los siguientes valores: 

60 

- Uno (1): Hay presencia (verde), el seguro de la puerta está pasado (verde), el piso está mojado (rojo). 

- Cero (0): No hay presencia (rojo), el seguro de la puerta está desbloqueado (rojo), el piso está seco (verde). 



<!-- Start of picture text -->
Aire acondicionado<br>NAL WA2 LT<br>Apagado Apagado Za as<br>rete . |S.<br>Seguridad t | $ge)<br>| | 3°a)rye|<br>i vy<br>mOWt~i C.ry g<br><!-- End of picture text -->

_Figura 40._ **Control de los AC y detección de presencia, seguridad y fugas** 

Como se puede ver en la figura 41, la interfaz “Registro del historico” se compone de una barra de selección que muestra una lista con las siguientes opciones: Temperatura, Humedad relativa, Luminosidad/Horas de encendido y Presencia; tras seleccionar una opción si se le da click al botón “Mostrar datos registrados”, se mostrará una gráfica y una tabla. 



<!-- Start of picture text -->
Registro del historico Registro del historico<br>—<br><!-- End of picture text -->

_Figura 41._ **Registro del histórico - Barra de selección** 

Si seleccionamos la opción “Temperatura”, se mostrará una gráfica lineal donde se ve el promedio total de la temperatura en la semana actual, de lunes a viernes, y una línea negra que indica si la temperatura en el día superó o no los 25 grados celcius. Debajo de la gráfica se muestra una tabla donde se puede ver con más detalle las temperaturas que hubo durante el día, de 7 am a 7 pm (ver la figura 42). 

61 



<!-- Start of picture text -->
Historico dela semana 2205/2023 a 271052023 atti<br><!-- End of picture text -->

_Figura 42._ **Registro del histórico - Temperatura** 

Si seleccionamos la opción “Humedad”, se mostrará una gráfica lineal del promedio total de la humedad relativa en la semana actual, de lunes a viernes, y una línea negra que indica si la humedad relativa en el día es igual o mayor a 85%. Debajo de la gráfica se muestra una tabla donde se puede ver en detalle las temperaturas que hubo durante el día, de 7 am a 7 pm (ver la figura 43). 



<!-- Start of picture text -->
Historica de la semana 22/08/2023 al 27708/2023 _oaeapepaeed<br><!-- End of picture text -->

_Figura 43_ . **Registro del histórico - Humedad relativa** 

Si seleccionamos la opción luminosidad/horas de encendido, se mostrará un grupo de gráficas y tablas que contienen la lectura semanal de la sección 1 y 2 (ver en la figura 44). 

Primero, se mostrará unas gráficas en barras del promedio del nivel de luminosidad y la sumatoria las horas de encendido en ambas secciones durante el día, de 7 am a 7 pm, de lunes a viernes, donde la sección 1 se representa en color azul y la sección 2 en color rojo. Para calcular el nivel de luminosidad, se realizó una sustracción entre 255 y la luminosidad medida; ya que entre mas alta es el valor medido, entre 0 y 255, mas oscuro está el ambiente. 

62 



<!-- Start of picture text -->
Mtnde serra 202023 27052023<br>i<br>] |<br>== 1 ———<br><!-- End of picture text -->

_Figura 44._ **Registro del histórico - Gráficas de nivel de luminosidad y horas de encendido** 

Debajo de las gráficas se muestra las tablas con el nivel de iluminación y horas de encendido de la sección 1 (ver en la figura 45). También se muestra las tablas con el nivel de iluminación y horas de encendido de la sección 2 (ver en la figura 46). 



<!-- Start of picture text -->
Seccién1 Horas de encendido<br>Nivel de iluminacion<br>ESS SSS ES SIor: sae - ES- Ee” =eee=<br>EHS<br>SSS aS |<br><!-- End of picture text -->

_Figura 45._ **Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la sección 1** 



<!-- Start of picture text -->
—<br>Nivel de iluminacion Horas de encendido<br>BSS SSS SSa—3 SSeS9 = 5 aS- 5Ea.<br>SS<br><!-- End of picture text -->

_Figura 46._ **Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la sección 2** 

63 

Si seleccionamos la opción “Presencia”, se mostrará una gráfica con el número de horas que hubo presencia durante el día, de lunes a viernes; y una tabla donde se muestra con más detalles que horas del día se detectó más presencia, de 7 am a 7 pm (ver la figura 47) 



_Figura 47._ **Registro del histórico - Presencia** 

Para poner en funcionamiento el servidor, se abren tres terminales en Visual Studio Code: 

- En la primera terminal inicializamos el worker como un proceso de fondo con el comando: “celery -A Server worker --loglevel=INFO”. 

- En la segunda terminal el servicio celery beat inicia con el comando: “celery -A Server beat”. 

- En la tercera terminal ejecutar el servidor con el comando: “Python manage.py runserver”. 

Se validó el funcionamiento del sistema, realizando una serie de pruebas al prototipo, para comprobar que cumpliera con los requerimientos definidos: 

- Conocer las condiciones y estados de operación de los elementos del laboratorio, tales como: Luces, seguro de la puerta y aire acondicionados. 

Se colocaron las fotorresistencias de la maqueta del prototipo cerca de los bombillos de las luces del laboratorio, de modo que la plataforma web pudiese dar a conocer el nivel de luminosidad de las secciones 1 y 2, y el estado de las luces del laboratorio en tiempo real. 

En la página “Laboratorios – Laboratorio de prototipos” los botones de encendido/apagado y los niveles de luminosidad se actualizan automáticamente, cuando el usuario ingresa al panel de control. Si el usuario ya está en la página, el estado de los botones y los niveles de luminosidad se 

64 

actualizará en el minuto siguiente. Si el valor leído por la fotorresistencia es mayor o igual a 0, y menor o igual a 30, el botón se actualizará al estado: Encendido. Si el valor leído por la fotorresistencia es mayor que 30, y menor o igual a 255, el botón se actualizará al estado: Apagado. 

En la maqueta física del prototipo se usaron unos leds azules para simular el control de los aires acondicionados. Si alguno de los leds azules fue previamente encendido, en la página el botón correspondiente al AC se actualizará en el estado: Encendido. O, por el contrario, si el led azul está apagado, el estado del botón correspondiente al AC se actualizará como: Apagado. 

Para simular el seguro de la puerta del laboratorio se usó un DIP switch en la maqueta física del prototipo. Al cambiar a la posición ON, la página mostrará que el seguro de la puerta está activo: Bloqueado. O, por el contrario, si se cambia a la posición OFF, la página mostrará que el seguro de la puerta esta desactivado: Desbloqueado. 

- Conocer a tiempo real las condiciones ambientales del laboratorio: Temperatura, humedad relativa, humedad del piso, luminosidad y presencia. 

A medida que se iban realizando las pruebas de campo, se fueron realizando ajustes en la programación del Arduino MEGA 2560 R3 que lee los sensores, y en el servidor web. 

El dispositivo IoT no era capaz de enviar la información completa del sensor DHT22 al Raspberry Pi, por lo que se solucionó realizando un redondeo del valor decimal leído, para colocar el resultado como un valor de tipo entero, junto con las otras lecturas dentro de un arreglo dato[8] de tipo byte, que se enviaría a través del bus de comunicación I2C. 

En el servidor se codifico la función read_module() para que el Raspberry Pi recibiría un arreglo de datos Modulo[15] con la función read_i2c_block_data que pertenece a la librería Smbus2, leyendo el arreglo recibido desde el elemento 7, Modulo[7], hasta el elemento 14, Modulo[14], ya que los primeros elementos del arreglo de datos contienen la trama de dirección, conformada por la condición de inicio y la dirección del dispositivo IoT. 

Una vez que se comprobó que el Raspberry Pi recibía los datos de manera adecuada y ordenada, se crearon las funciones correspondientes para el desarrollo del proyecto. Como 

65 

resultado, en la página “Laboratorios – Laboratorio de prototipos” se visualiza en tiempo real la temperatura, humedad relativa, nivel de luminosidad de la sección 1 y la sección 2, y presencia del laboratorio, actualizándose al siguiente minuto. 

Los niveles de luminosidad varían dependiendo de la cantidad de luz que detecten las fotorresistencias en el laboratorio, mostrando en la página un gauge que indique si la luz es: Muy fuerte, fuerte, media, débil o nula; con el valor numérico de luminosidad en paréntesis. 

Se colocaron los sensores PIR en lugares donde pudiera detectar con mayor facilidad la presencia: Uno cerca de la puerta, a la misma altura del interruptor de luces; y otro sobre el monitor del equipo que se utilizó para ver el servidor web, con el fin de detectar el momento que una persona entrara al laboratorio, y continuara detectando presencia mientras la persona estaba dentro. 

El ajuste de sensibilidad de los sensores PIR se mantuvo por default, mientras que el ajuste de retraso se tuvo que calibrar de forma manual para que el tiempo de mediciones fuera mayor que el tiempo de actualización del servidor, ya que existía un tiempo de retardo en que la lectura del sensor no se sincronizaba con lo que se mostraba en la página a tiempo real, lo que afectaba el cálculo de promedio en una hora. Después de realizar varias pruebas y ajustes a los sensores PIR, en la página del servidor web ahora se indica cuando se detecta presencia y cuándo no. 

Se utilizó un sensor DHT11 para leer la temperatura y humedad relativa exterior, colocándolo al otro lado de una ventana. Y se utilizó un sensor DTH22 para leer la temperatura y humedad relativa del interior del laboratorio. Las lecturas de estos sensores se guardan en la base de datos del servidor web, para después mostrarse lado a lado en la página “Laboratorios – Laboratorio de prototipos” para que sea más sencilla su comparación. 

- Desarrollar una base de datos donde se guarde el registro de la temperatura, humedad relativa, luminosidad y horas de presencia dentro del laboratorio. 

Para validar el funcionamiento de la base de datos, se creó un usuario administrador, o superusuario, para el servidor web desde la terminal de Visual Studio Code, ingresando el comando: “python manage.py createsuperuser”. También se creó un usuario llamado Rozas, utilizando la página de Registro de usuario del servidor. 

66 

Cuando el Raspberry Pi logró comunicarse con los dispositivos IoT se crearon las tablas/modelos del módulo “iot”, cuyo funcionamiento se comprobó desde la página de Área Administrativa de Django, a medida que el servidor iba gestionando la información recibida. 

- Elaborar un registro de históricos semanal de las diferentes variables del laboratorio. 

Luego de validar el funcionamiento de los sensores y actuadores, se mantuvo energizados los equipos y dispositivos IoT del prototipo, y el servidor ejecutándose 24/7, para guardar la lectura de los sensores y los promedios en la base de datos. Para garantizar la operatividad del sistema, se registraron datos desde el jueves 09/02/2023 11:00 am hasta el viernes 11/08/2023 7:00 pm. 

Con la información guardada en las tablas Promedio_temperatura, Promedio_humedad, Promedio_luminosidad, y Promedio_presencia, se generaron las gráficas y tablas que se mostraran en la página de Registros del servidor web. Y se realizaron los ajustes necesarios para que en la tabla se muestre el elemento: “-” si no existe un registro en esa fecha y hora. 

- Desarrollar un sistema que permita controlar de forma local el encendido/apagado de las luces y aire acondicionados. 

Desde la página “Laboratorios – Laboratorio de prototipos” del servidor web se controla el encendido/apagado de los leds de la maqueta física, utilizando los botones de la interfaz. Donde los leds amarillos representan las luces, de la sección 1 y la sección 2, y los leds azules representan los aires acondicionados del laboratorio. De Lunes a Viernes, a las 6:50 am, se encienden los leds que representan los aires acondicionados. 

De acuerdo a las pruebas realizadas, se determinó que el prototipo desarrollado para este trabajo de grado es funcional y logró alcanzar los requerimientos que fueron establecidos al inicio del proyecto. Dando así por culminada la realización y el cumplimiento de los objetivos para el desarrollo de un servidor para la interconexión de dispositivos IoT de los laboratorios de las Escuelas de Ingeniería Informática y Civil de la UCAB Guayana. 

Se elaboró una documentación formal del sistema, acorde a los requerimientos definidos: El manual de usuario y el manual técnico (ver el Apéndice C y el Apéndice D). 

67 

### **Capítulo V. Conclusiones y Recomendaciones** 

El servidor web desarrollado en este trabajo de grado permite la interconexión de dispositivos IoT del laboratorio de Desarrollo de Aplicaciones Móviles y Multimedia, Labam, de la Escuela de Ingeniería Informática, y el laboratorio de Ingeniería Sanitaria, Labis, de la Escuela de Ingeniería Civil, de la UCAB Guayana. 

El sistema cumple con los requerimientos caracterizados de Labam y Labis, los cuales son: Conocer en tiempo real el estado de las diferentes variables que se manejan el laboratorio, las cuales se registran y almacenan en una base de datos local. 

Mediante una matriz de evaluación tecnológica se seleccionó el Raspberry Pi 4 Modelo B, que cumple la función de servidor IoT en este proyecto, también se seleccionaron los instrumentos sensores y actuadores los cuales están conectados en una topología red de tipo estrella con los dispositivos IoT: Arduino UNO R3, ESP8266 NodeMCU y Arduino MEGA 2560 R3. Se diseñaron los casos de uso del servidor web, y la base de datos para la gestión de información. 

Se programó el servidor web mediante el sistema de desarrollo web Django, utilizando los protocolos de comunicación I2C, y MQTT, manteniendo una conexión persistente entre el navegador del usuario y el servidor utilizando websockets. 

Se validó el funcionamiento del sistema a través del prototipo, tomando registros de las diferentes variables durante un período de 3 meses, obteniendo resultados positivos. 

Se elaboró la documentación formal del sistema, el cual consiste en el manual de usuario y el manual técnico. 

Las recomendaciones del presente trabajo son: Crear un backup que contenga la información de los usuarios registrados, en caso de que se pierda la información; desarrollar una función que envíe un mensaje de alarma por correo a los administradores, en caso de que se detecte presencia fuera de horario de clases; adquirir un dominio que permita implementar un servidor que pueda guardar información en la nube, y acceder de manera remota; y alimentar el sistema mediante un sistema de alimentación ininterrumpida, UPS, en el momento de la implementación. 

68 

### **Referencias Bibliográficas** 

Amazon Web Services, INC o sus filiales. (2023). _Amazon Web Services_ . Obtenido de https://aws.amazon.com/es/what-is/ide/ 

Anonimo. (s.f.). _DescubreArduino_ . Obtenido de https://descubrearduino.com/mqtt-quees-como-se-puede-usar-y-como-funciona/ 

Arduino. (s.f). _Arduino.cc_ . Obtenido de https://docs.arduino.cc/tutorials/4-relays-shield/4relay-shield-basics 

Arimetrics. (2022). _Arimetrics_ . Obtenido de https://www.arimetrics.com/glosariodigital/framework 

Ávila Gallegos, L. E. (2020). _Automatización de los sitemas de acceso, iluminación y monitoreo del laboratorio de electrónica de la Universidad Católica de Cuenca sede Azogues usando tecnología IoT._ Azogues. 

Cambridge University Engineering Department. (1999). _AT&T; Laboratories Cambridge_ . Obtenido de 

https://web.archive.org/web/20081016112835/http://www.hep.phy.cam.ac.uk/vnc_docs/index.ht ml 

Carletti, E. (2007). Comunicación - Bus I2C Descripción y funcionamiento. Robots Argentina. 

Carrizo, L. (2004). _desarrolloweb.com_ . Obtenido de 

https://desarrolloweb.com/articulos/1617.php 

Challenger-Pérez, I., Díaz-Ricardo, Y., & Becerra-García, R. A. (2014). El lenguaje de programación Python. _Ciencias Holguín_ , 1-13. 

Comer, D. (1996). _Redes globales de información con internet y TCP/IP_ (3era edición ed.). Naucalpan de Juárez, México: Prentice-Hall Hispanoamérica, S.A. 

Corso, D. (2020). _Responsive Gauge (CSS-Only) - HTML, CSS & JavaScript Tutorial_ . Obtenido de https://www.youtube.com/watch?v=FnUkVcQ_3CQ 

Creatividad Ahora. (2020). _Instalando el sistema operativo Raspberry Pi OS en la Pi 4_ . Obtenido de https://www.youtube.com/watch?v=5BsoZg1aDIY 

Desarrollo Web. (s.f.). _Desarrollo Web_ . Obtenido de 

https://desarrolloweb.com/home/html 

Díaz, J. (2019). _Curso Django_ . Obtenido de 

https://www.youtube.com/playlist?list=PLU8oAlHdN5BmfvwxFO7HdPciOCmmYneAB 

Esteban Nieto, N. T. (2018). _Tipos de investigación._ Jicamarca: Universidad Santo Domingo de Guzmán. 

Fonseca, F. (Dirección). (2023). _Edif. Inteligentes Tec-Ucab Coil_ [Película]. Github. (2023). _Raspberry Pi_ . Obtenido de 

https://www.raspberrypi.com/documentation/computers/raspberry-pi.html 

69 

Guatume, J. (2019). _Diseño de un servidor IoT que permita interconectar dispositivos mediante el protocolo websockets._ Trabajo de Grado, Universidad Nacional Experimental Politécnica “Antonio José de Sucre”, Ingeniería Electrónica, Puerto Ordaz. 

Guerra, J. (2022). _Utilizando Celery para configurar una cola de tareas_ . Obtenido de https://www.youtube.com/watch?v=f35EoGYL7A4 

Hernández, L. d. (s.f.). _Programar facil_ . Obtenido de 

https://programarfacil.com/esp8266/mqtt-esp8266-raspberry-pi/ 

Huidobro Moya, J. M. (2004). La domótica en nuestras casas. _Manual formativo de ACTA_ , 89-94. 

Ingeniería MCI Ltda. (s.f). _ARDUINO.cl_ . Obtenido de https://arduino.cl/que-es-un-shield/ ISOTools Excellence. (2022). _ISOTools Excellence_ . Obtenido de 

https://www.isotools.org/normas/calidad/iso-9001/ 

ISOTools Excellence. (2022). _ISOTools Excellence_ . Obtenido de 

https://www.isotools.org/normas/calidad/iso-iec-17025/ 

Ivy, D. (2022). _Django Channels & WebSockets Oversimplified_ . Obtenido de https://www.youtube.com/watch?v=cw8-KFVXpTE 

Kalyani, V. L., Dudy, M. K., & Pareek, S. (2015). _Journal Of Management Engineering And Information Technology._ India: Online ISSN. 

Khan, A. (2022). _How to Install Redis on Raspberry Pi_ . Obtenido de https://linuxhint.com/install-redis-raspberry-pi/ 

Llamas, L. (2016). _Medir temperatura y humedad con Arduino y sensor DHT11-DHT22_ . Obtenido de https://www.luisllamas.es/arduino-dht11-dht22/ 

Llamas, L. (2018). _Configurar IP estática en Raspberry Pi_ . Obtenido de https://www.luisllamas.es/raspberry-pi-ip-estatica/ 

OK diario. (2019). Conoce el método de observación directa. _OK diario_ , págs. https://okdiario.com/curiosidades/conoce-metodo-observacion-directa-3628568. Obtenido de https://okdiario.com/curiosidades/conoce-metodo-observacion-directa-3628568 

paguayano. (2019). _MCI Capacitación_ . Obtenido de 

https://cursos.mcielectronics.cl/2019/06/21/configuracion-de-pines-gpio-en-raspberry-pi/ 

Peláez, A., Rodríguez, J., Ramírez, S., Pérez, L., Vázquez, A., & González, L. (2013). _La entrevista._ Universidad autónoma de México. 

Peña, C. (2020). _Arduino IDE: Domina la programación y controla la placa._ Buenos Aires: RedUsers. 

Perdomo, V., Caizabuano, J., & Altamirano, F. (2018). Arquitectura de redes de Información. Principios y conceptos. _Dominio de las Ciencias_ , 103-122. 

Punto Flotante S.A. (2017). _HC-SR501 PIR Sensor infrarrojo de movimiento._ 

Python Software Foundation. (2023). _sqlite3 — DB-API 2.0 interfaz para bases de datos SQLite_ . Obtenido de https://docs.python.org/es/3.8/library/sqlite3.html 

70 

RamiGlez. (2015). _SCRUM: para equipos extra pequeños de 1 a 3 personas_ . Obtenido de http://elcatalejoderami.blogspot.com/2015/02/scrum-para-equipos-extra-pequenos.html 

Ramírez, L. G., Jiménez, G. S., & Carreño, J. M. (2014). _Sensores y Actuadores_ (Primera ed.). Azcapotzalco, México: Grupo editorial Patria. 

Ramos-Galarza, C. (2021). Diseños de investigación experimental. _CienciAmérica_ , 1-7. RaspberryPi. (2023). _raspberrypi.com_ . Obtenido de 

https://www.raspberrypi.com/documentation/computers/os.html 

Red Eyed Coder Club. (2020). _Django Channels tutorials, Django Real-time apps with WebSockets_ . Obtenido de 

https://www.youtube.com/playlist?list=PLe4mIUXfbIqYEOgfh4X_Yz767IntYUSvg 

Rose, K., Eldridge, S., & Chapin, L. (2015). _La Internet de las Cosas-Una breve reseña para entender mejor los problemas y desafíos de un mundo más conectado._ Internet Society (ISOC). 

_SafetyCulture_ . (2023). Obtenido de safetyculture.com: 

https://safetyculture.com/es/temas/iso-9001/ 

Schafer, C. (2018). _Django Tutorials_ . Obtenido de 

https://www.youtube.com/playlist?list=PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p 

Schafer, C. (2018). _Python Django Tutorial_ . Obtenido de 

https://www.youtube.com/playlist?list=PL-osiE80TeTtoQCKZ03TU5fNfx2UY6U4p 

Serna Ruiz, A., Ros García, F. A., & Rico Noguera, J. C. (2010). _Guía Práctica de Sensores._ España: Creaciones copyright, S.L. Obtenido de 

https://books.google.es/books?hl=es&lr=&id=CuoXCd6ZZqwC&oi=fnd&pg=PR9&dq=Sensore s+definicion&ots=BwiS90-Al-&sig=lqF- 

VmCJ28o6eRGTwVEr6wZrB0w#v=onepage&q&f=false 

Serrano, J. (2019). _M2M: el intercambio de información entre máquinas [Artículo de blog]_ . Obtenido de https://sixphere.com/blog/m2m-intercambio-de-informacion-entre-maquinas/ 

Vera Borges, E. J. (2019). _Propuesta para Universidad Católica Andrés Bello Extensión Guayana de un Sistema gestor de edificaciones enfocados a los laboratorios._ Trabajo de Grado, Universidad Católica Andrés Bello, extensión Guayana, Ingeniería Informática, Puerto Ordaz. 

Very Academy. (2020). _Learn Django - Build an Asynchronous Chatroom with Django and Channels_ . Obtenido de https://youtu.be/F4nwRQPXD8w?si=N59opA1UpnQTHfJx 

Zepeda, E. (2021). _Coffee bytes - Artículos sobre desarrollo web y Linux_ . Obtenido de https://coffeebytes.dev/django-channels-consumers-scope-y-eventos/ 

71 

### **Apéndices y/o Anexos** 

### **Anexo A** 



<!-- Start of picture text -->
3V3 power o eo © 5V power<br>e = e GPIO 2 (SDA) © OG © 5V power<br>: on GPIO<br>[ia 8 Bl a GPIO4 (GPCLKO)3 (SCL) o© O®Oe) ©© GPIOGround14 (TXD)<br>Bg GPIO.17 © oe © GPIO 18 (PCM_CLK)<br>— ae GPIO 27 © ®® © Ground<br>im] 4ny GPIOGround22 © ooC)C5) ©© GPIO15(RXD)GPIO23<br>as 3V3 power o oo © GPIO24<br>= GPIO<br>10 (MOS!) © ©® © Ground<br>sstneseen Pg GPIO<br>, 3 GPIO 11 (SCLK) @® © GPIO8 (CEO)<br>Bb a] 9 (MISO) © oe © GPIO25<br>e ~ --@os GPI0Ground © ee © GPIO7 (CEI)<br>— 0 (1_SD) @® © GPIO1 (IDSC)<br>GPIOS o CIC} © Ground<br>GPIO6 © C02) © GPIO12 (PWMO)<br>GPIO13 (PWM1) © eo © Ground<br>GPIO<br>V V V V 19 (PCM_FS)GPIO 26 © ooCIC) © GPI OO16 20 (PCM_DIN)<br>Ground © @o © GPIO 21 (PCM_DOUT)<br><!-- End of picture text -->

_Figura 48._ **Raspberry Pi 4 Modelo B y asignación de pines** Adaptado de _Raspberry Pi hardware – GPIO and the 40-pin Header,_ por Rapberry Pi Foundation, s.f, _raspberrypi.com (https://www.raspberrypi.com/documentation/computers/raspberry-pi.html)._ 

72 

### **Anexo B** 



<!-- Start of picture text -->
| | solo disparo| Sisparos repetitivos<br>Sensor PIR m-je bBEEP delControlador sensorde<br>Lente de Fresnel ajuste de CER |<br>sensitividad Lon OMT TTTTTT,<br>— ® alZi ss salida<br>(de 3.7 mts) gam *| ay OND<br>> 213. ae S — 0a3.3v<br>ajusteretrasode 2919|4 a“apcals eeeSiS<br>4 (de 3 segundos Padeviz 4 aadry<br>a $ minutos) Ae<br>) Sensor PIR ° 7]<br>HC-SRS501<br><!-- End of picture text -->

_Figura 49._ **Módulo HC-SR501 y sus partes** _Adaptado de HC-SR501 PIR Sensor infrarrojo de movimiento, por Punto Flotante S.A, 2017, puntoflotante.net (https://www.puntoflotante.net/MANUAL-DEL-USUARIO-SENSOR-DE-MOVIMIENTO-PIR-HC-SR501.pdf)_ 

73 

**Anexo C** 



<!-- Start of picture text -->
12Cc D3 (cPico) AO @oc_ex)<br>©y KeesGND v3. shou ono i pee= il ee)<br>|>ee] TLte £2 Te 1 GB —elesisabiBl<br>jattery interface weal beh) watt<br>_= (aocwg (em) [el=_gosme SecXY Sage<br>aL: eas -<br>Micro USB port = MSE jcaiged GD® Fi<br>FLASH im = a me<br>GQ) ==<br>i ae| Pi sonal TO)<br>UART D2 crt0) D1 (cris)<br><!-- End of picture text -->

_Figura 50._ **Crowtail ESP8266 NodeMCU y sus partes** 

Adaptado de _Elecrow-Placa de desarrollo de reinicio automático_ , https://es.aliexpress.com/item/32664247632.html, derechos reservados por aliexpress.com 

74 

### **Apéndice A** 

Los componentes que se utilizaron en el primer esquema eléctrico son los siguientes: 

- 1 ESP8266 NodeMCU v2.0, marca Crowtail. 

- 1 sensor de temperatura y humedad (DHT11), marca Crowtail. 

- 1 sensor de agua, marca Crowtail. 

- 2 cables de 4 pines, marca Crowtail. 

Los componentes que se utilizaron en el segundo esquema eléctrico son los siguientes: 

- 1 Arduino MEGA 2560. 

- 2 fotorresistencias (LDR) no lineales. 

- 3 resistencias de 10K ohmios, 1 resistencia de 120 ohmios. 

- 2 sensores PIR de movimiento. 

- 1 dip switch de 4 módulos. 

- 1 sensor de temperatura y humedad relativa DHT22. 

- Cables para las conexiones. 

Los componentes que se utilizaron en el tercer esquema eléctrico son los siguientes: 

- 1 Arduino UNO. 

- 1 módulo de relé de 4 canales. 

- 2 LEDs amarillos y 2 LEDs azules. 

- 4 resistencias de 10K ohmios, 4 resistencias de 330 ohmios, y 2 resistencias de 220 ohmios. 

- Cables para las conexiones. 

Los componentes que se utilizaron en el cuarto esquema eléctrico son los siguientes: 

- 1 Arduino MEGA 2560 R3. 

- 1 Arduino UNO R3. 

- 1 Raspberry Pi 4 Modelo B. 

- 2 resistencias de 4.7K ohmios. 

- 3 cables macho-hembra de 30 cm, para conectar los pines GPIO del Raspberry Pi al protoboard. 

- Cables para el resto de las conexiones. 

75 

### **Apéndice B** 



<!-- Start of picture text -->
— | Fl a) CS,<br>a a she<br>je oman0 6m 5 O=F} omaxes 5000 2<br>oe 6 = 6<br>es sae eS<br>=e oe =e<br>=e =<<br>Pe fae<br>Bei ie 3 be eeeGets eeiE |<br>i tes tee ae<br>Bee: = ee fs<br>SSS[oem oremiow a & exes0 lw at<br>—<br>== ea<br>— | el Ud el<br>oe ee a<br>9 3 oe oe — eee<br>SeSSeS le. eS— ls<br>=e4 a53S=e = eeSS ie<br>a = een & 2<br>= fee ee ee ee<br>===eeeSet eSB-2 ao =e o e<br>Ba 3 oe |<br>N e ret somna0e3 1600e660s Apa i3)‘lomaas 180k MadsSe Apap<br>ie 2S SS SS<br>‘on cum 0 om om Ape a<br>eea aee ioe‘lomaaes 2000 20seeApa<br>ohne Ss ee<br>Pe Ss eee eee<br>a= ee ee<br>22 =<br>23-1 S34 SSS |<br>—c So<br>—— fom sere}<br>PE ot aoe lee eles<br>b a ig<br>SB Se 6<br>oo ee i]<br>9-43<br>z —s<br><!-- End of picture text -->

_Figura 51._ **Registro del laboratorio de prototipos exportado en Excel (.xls)** 

76 

### **Apéndice C** 



**UNIVERSIDAD CATÓLICA ANDRÉS BELLO FACULTAD DE INGENIERÍA ESCUELA DE INGENIERÍA INFORMÁTICA** 

# **Servidor IoT - Manual de Usuario** 

Realizado por Rozas Bolívar, Gabriela Carolina Tutor industrial Bolívar Sánchez, María Victoria Tutor académico Fonseca Droy, Francisco José Fecha Septiembre, 2023 

### **Índice de Contenido** 

|**Instalación del Servidor**|**5**|
|---|---|
|Instalación de VNC Viewer en el equipo que controlará el servidor|5|
|Configuración del Raspberry Pi 4 Modelo B para el desarrollo y uso del servidor|5|
|Configuración del bróker MQTT Eclipse Mosquitto|8|
|Configuración de I2C|9|
|Configuración del bróker Redis|10|
|Configuración necesaria antes de programar y ejecutar el servidor en Visual Studio Code|10|
|Ejecutar el servidor y todas sus funciones.|13|
|**Partes principales del Servidor web**|**14**|
|Pantalla principal - Inicio|14|
|Cabecera|14|
|Acerca de|15|
|**Registrarse e Inicio de sesión**|**17**|
|**Editar perfil**|**20**|
|**Usuario registrado**|**21**|
|Laboratorios – Laboratorio de prototipos|21|
|Registros|26|
|**Administrador registrado**|**30**|
|Backup|30|
|**Área Administrativa**|**32**|
|Iniciar sesión y usar el sitio|32|
|Agregar, editar y eliminar usuarios del servidor|35|



2 

### **Índice de figuras** 

|Figura 1. Izquierda: VNC Connect en el Raspberry Pi - Derecha: VNC Viewer en el equipo|
|---|
|que controla el Raspberry Pi ........................................................................................................... 5|
|Figura 2. Dirección IP que utilizó el VNC Viewer para controlar el Raspberry Pi ............ 6|
|Figura 3. Agregando una dirección estática wlan0 al Raspberry Pi ................................... 7|
|Figura 4. wlan0 del Raspberry Pi ........................................................................................ 7|
|Figura 5. Configuración del broker Mosquitto ................................................................... 8|
|Figura 6. Usuarios con acceso al broker ............................................................................. 9|
|Figura 7. Explorador de Visual Studio Code .................................................................... 11|
|Figura 8. Interprete utilizado para el entorno virtual del proyecto (venv) ........................ 12|
|Figura 9. MQTT_CONFIG en Server/Server/Settings.py ................................................ 12|
|Figura 10. Página de Inicio ............................................................................................... 14|
|Figura 11. Cabecera - Para todos los usuarios no registrados........................................... 15|
|Figura 12. Cabecera - Usuarios registrados ...................................................................... 15|
|Figura 13. Cabecera - Administradores registrados .......................................................... 15|
|Figura 14. Página de Acerca de ........................................................................................ 16|
|Figura 15. Cabecera - Conectarse y Registro .................................................................... 17|
|Figura 16. Iniciar sesión, o Log in .................................................................................... 17|
|Figura 17. Registro de usuario .......................................................................................... 18|
|Figura 18. Cabecera - Editar perfil ................................................................................... 20|
|Figura 19. Editar perfil ...................................................................................................... 20|
|Figura 20. Cabecera - Laboratorios - Laboratorio de prototipos ...................................... 21|



2 

|3<br>Figura 21. Mapa del laboratorio de prototipos.................................................................. 22|
|---|
|Figura 22. Temperatura y humedad relativa del laboratorio de prototipos y niveles ....... 23|
|Figura 23. Control de las luces del laboratorio de prototipos y niveles de iluminación ... 24|
|Figura 24. Control de los AC y detección de presencia, seguridad y fugas de agua ........ 25|
|Figura 25. Cabecera - Registros - Laboratorio de prototipos ............................................ 26|
|Figura 26. Registro del histórico - Barra de selección ...................................................... 26|
|Figura 27. Registro del histórico - Temperatura ............................................................... 27|
|Figura 28. Registro del histórico - Humedad .................................................................... 27|
|Figura 29. Registro del histórico - Gráficas de nivel de luminosidad y horas de encendido|
|....................................................................................................................................................... 28|
|Figura 30. Registro del histórico - Tablas de nivel de iluminación y horas de encendido de|
|la sección 1 .................................................................................................................................... 28|
|Figura 31. Registro del histórico - Tablas de nivel de iluminación y horas de encendido de|
|la sección 2 .................................................................................................................................... 29|
|Figura 32. Registro del histórico - Presencia .................................................................... 29|
|Figura 33. Backup ............................................................................................................. 30|
|Figura 34. Registro del laboratorio de prototipos exportado en Excel (.xls) .................... 31|
|Figura 35. Login del Área Administrativa ........................................................................ 32|
|Figura 36. Area administrativa de la aplicación web ........................................................ 33|
|Figura 37. Área Administrativa - Cabecera ...................................................................... 33|
|Figura 38. Modelos por cada aplicación instalada en el servidor ..................................... 34|
|Figura 39. Área administrativa - Actividades recientes .................................................... 35|
|Figura 40. Área Administrativa – Usuarios ...................................................................... 36|



3 

|4<br>Figura 41. Área Administrativa - Modificar usuario ........................................................ 37|
|---|
|Figura 42. Modificar usuario - Usuario y contraseña ....................................................... 38|
|Figura 43. Modificar usuario - Último inicio de sesión .................................................... 38|
|Figura 44. Modificar usuario - Estado de superusuario .................................................... 38|
|Figura 45. Modificar usuario - Grupos ............................................................................. 38|
|Figura 46. Modificar usuario - Permisos de usuario ......................................................... 39|
|Figura 47. Modificar usuario - Información personal ....................................................... 39|
|Figura 48. Modificar usuario - Es staff ............................................................................. 39|
|Figura 49. Modificar usuario - Activo .............................................................................. 39|
|Figura 50. Modificar usuario - Fecha de registro ............................................................. 40|
|Figura 51. Modificar usuario - Eliminar, Guardar y añadir otro, Guardar y seguir editando,|
|Guardar ......................................................................................................................................... 40|



4 

5 

### **Instalación del Servidor** 

### **Instalación de VNC Viewer en el equipo que controlará el servidor** 

Con el fin de controlar el Raspberry Pi desde otra computadora/laptop se instala el software RealVNC en ambos equipos. 

Primero, desde el sitio oficial de RealVNC se descarga e instala la aplicación VNC Viewer en el equipo que se desea que sea cliente del ordenador servidor. 

Después, se descarga e instala VNC Connect en el ordenador servidor, que en este caso sería el Raspberry Pi 4 modelo B. VNC Connect consta de una aplicación VNC Server y otros programas de apoyo. Para más información, revise la sección de Configuración del Raspberry Pi 4 modelo B para el desarrollo y uso del servidor, que se muestra a continuación. 

### **Configuración del Raspberry Pi 4 Modelo B para el desarrollo y uso del servidor** 

La instalación del sistema operativo Raspbian en el Raspberry Pi 4 modelo B se realiza siguiendo la guía del tutorial de instalación de Creatividad Ahora, donde se configura la red WiFi a la que se conectará el dispositivo, y el Secure Shell, SSH, para permitir el acceso remoto al dispositivo, con el fin de controlar el Raspberry Pi desde otra computadora/laptop se instala el software RealVNC en ambos equipos (ver la figura 1). 



<!-- Start of picture text -->
BOM Doren reese inion RAII® 2 2 1 [Bice ox<br>cones es<br>I voccomecr. CESSES AE)<br>~ coed secty ert tent Sete<br><!-- End of picture text -->

_Figura 52._ **Izquierda: VNC Connect en el Raspberry Pi - Derecha: VNC Viewer en otro equipo** Adaptado de _RealVNC_ 

Desde la página de configuración del router, que en este caso sería la dirección IP 192.168.100.1, se identifica que la dirección IP asignada por el router Rozas al Raspberry Pi es la 

5 

6 

192.168.100.18, la cual es agregada en las propiedades de la conexión que se crea en VNC Viewer (ver figura 2). 



<!-- Start of picture text -->
VNC Server: [ERRTRIUED)<br>Name: Raspberry pi<br><!-- End of picture text -->

_Figura 53._ **Dirección IP que utilizó el VNC Viewer para controlar el Raspberry Pi** Adaptado de _VNC Viewer_ 

Una vez establecida la conexión con el equipo, solo es necesario iniciar sesión como el usuario “pi” (que viene predefinido en la instalación del SO), bajo la clave de “raspberrypi” para acceder al equipo. En cualquier momento, este usuario y clave se pueden cambiar. 

Una vez que se tiene acceso al equipo y se cambia la clave de acceso del Raspberry Pi por una diferente, se actualizan los paquetes del sistema operativo. Seguidamente, se procede a configurar una dirección IP estática para la interface WiFi (wlan0) en el Raspberry Pi. 

Siguiendo el tutorial de Luis Llamas, para configurar una IP estática en Raspbian, debemos editar el fichero /etc/dhcpcd.conf desde la terminal, con el comando: 

```
$ sudo nano /etc/dhcpcd.conf
```

En el fichero encontraremos unas líneas comentadas (que empiezan con “#”) que tienen un ejemplo de configuración de IP estática. Para crear nuestra propia dirección estática para el wlan0 modificamos el archivo agregando el texto que se muestra en la figura 3, donde: 

interface = Nombre de la interface que queremos configurar. 

static ip_address = Dirección fija que queremos, dejando el /24 al final. 

static routers = Dirección del gateway del router. 

static domain_name_servers = Dirección del servidor DNS, que normalmente sería la del router o unas externas como las de Google 8.8.8.8. 

6 

7 



<!-- Start of picture text -->
GNU nano 5.4 7etc/dheped. cont<br>lid Ia | I ‘ =<br><!-- End of picture text -->

_Figura 54._ **Agregando una dirección estática wlan0 al Raspberry Pi** Adaptado de _/etc/dhcpcd.conf_ 

A continuación, se guardan los cambios y se reinicia el Raspberry Pi desde la terminal, con el comando: 

```
$ sudo reboot
```

Finalmente, comprobamos que tenemos la dirección IP configurada ejecutando el comando: 

```
$ ifconfig wlan0
```

Que da como resultado lo que se muestra en la figura 4. 



<!-- Start of picture text -->
wlan0: flags=4163<UP, BROADCAST, RUNNING, MULTICAST> mtu 15<br>et6 fe80::Safa:713e:8ele:7608 prefixlen 64 scope x2) ak:<br>ether de:aé 5:3b xqueuele: Ethernet)<br>RX<br>RX errorpackets1 droppedbytes 1525977overruns(1.4 MiB)frame<br>TX packets 1349 bytes 162104 (158.3 KiB)<br>TX error dropped 0 overruns 0 carrier collisions<br><!-- End of picture text -->

_Figura 55._ **wlan0 del Raspberry Pi** 

Posteriormente, se procede a instalar el editor de código fuente Visual Studio Code para comenzar a programar el servidor web. 

7 

8 

### **Configuración del bróker MQTT Eclipse Mosquitto** 

Luego de descargar e instalar Eclipse Mosquitto en el Raspberry Pi, se configura el servicio para que se ejecute cada vez que el sistema del equipo inicie, escribiendo el siguiente comando en la terminal: 

```
$ sudo systemctl enable mosquitto.service
```

Tal y como se ve en la figura 5, se edita el fichero /etc/mosquitto/mosquitto.conf para que los usuarios que quieran utilizar el bróker MQTT solo puedan hacerlo si ingresan los usuarios y claves incluidos en el fichero passwd. 



<!-- Start of picture text -->
mosquitto.conf x<br>Z| # Place your local configuration in /etc/mosquitto/conf.d/<br>2<br>3<br>4  # # A/usr/share/doc/mosquitto/examples/mosquitto.conf.examplefull description of the configuration file is at<br>5<br>6 per_listener_settings true<br>7 pid_file /run/mosquitto/mosquitto.pid<br>8<br>9 persistence true<br>10 _ persistence_location /var/lib/mosquitto/<br>11<br>12 log _dest file /var/log/mosquitto/mosquitto.<br>13 log<br>14 include_dir /etc/mosquitto/conf.d<br>15 allow_anonymous false<br>16 listener 1883<br>17 __— password_file /etc/mosquitto/passwd<br>18<br><!-- End of picture text -->

_Figura 56._ **Configuración del broker Mosquitto** Adaptado de _/etc/mosquitto/mosquitto.conf_ 

Para generar el fichero passwd se ingresa el siguiente comando por consola: 

```
$ sudo mosquito_passwd -c /etc/mosquito/passwd Rozas
```

Y se agrega un segundo usuario y clave al fichero con el siguiente comando: 

```
$ sudo mosquito_passwd -b /etc/mosquito/passwd rasp-broker
```

Dando como resultado el fichero /etc/mosquito/passwd que se muestra en la figura 6, cuya 

clave de cada usuario está encriptada. 

8 

9 



<!-- Start of picture text -->
passwd X<br>123 Rozas :$7$101$sOrCLz/86uLuQtcfS$iktAr5Hy+MZB1LBkO5+frasp-broker :$7$101$sZH9U2mJ3X22xP98$EmVqroPn 172 Lr 1rxA9+400BhsmhttgmalBm8yXZmE1xtgd6nQTO4ucUOrUx/oxoQGt QNkuIWT3U0x3v6xVj 153!<br><!-- End of picture text -->

_Figura 57._ **Usuarios con acceso al broker** Adaptado de _/etc/mosquito/passwd_ 

### **Configuración de I2C** 

Para que los Arduinos conectados de manera cableada al Raspberry Pi puedan comunicarse entre sí, es necesario configurar el para que permita el uso del protocolo I2C, comenzando por ingresar por consola el siguiente comando: 

```
sudo raspi-config
```

Una vez que aparece la pantalla que se muestra en la figura 7, se habilitó el módulo kernel I2C en las opciones de interfaz. 



<!-- Start of picture text -->
FSS [eS<br>lees | secs are es repens<br>Ape ere  emeee daycare, par asia /asuds esos comeestteafcente eee ore<br>BORRLeg§ ncectacLocalisation e  opcionseoOptions = ConfiguresConfigure  comectionslanguage andtoregionalperipherals]settings ioenable/disable1ise rscwe Enable/disableamet agtnisfoctcenttegraphicalautomatic renotedeedsloadingaccessrentof arccescearicoes12¢usingkemel RealVnodule }<br>tpasce pps ents een cafes tncaee eaten Pi ivsize sable/aisanle oneavive investace<br>8Briere GerriHes peatAis maaeree [oaDeSien Sarpene ears<br><!-- End of picture text -->

_Figura 58._ **_Interfaz de configuración del Raspberry Pi. Izquierda: Menú principal - Derecha: Opciones de Interfaz_** 

Adaptado de _Menú de configuración del Raspberry Pi 4 Modelo B_ 

Luego de reiniciar el Raspberry Pi, se comprueba que los dispositivos IoT correspondientes están conectados al equipo con ayuda del comando: 

```
$ i2cdetect –y 1
```

Dando como resultado lo que se muestra en la figura 8, donde se pueden ver la dirección del Arduino MEGA 2560 (#0x0b uo 11) y el Arduino UNO (#0x0c uo 12). 

9 

10 



<!-- Start of picture text -->
ef<br><!-- End of picture text -->

_Figura 59._ **Detectando los dispositivos conectados al bus I2C con el comando i2cdetect** Adaptado de _Terminal del Raspberry Pi_ 

### **Configuración del bróker Redis** 

Para instalar Redis en el Raspberry Pi, se siguen los pasos del tutorial de Awais Khan, donde se usó el siguiente comando en la terminal: 

```
$ sudo apt install redis-server -y
```

Después de terminar la instalación, para que Redis se ejecute de manera automática en cada reinicio del Raspberry Pi se utiliza el siguiente comando: 

```
$ sudo systemctl enable redis
```

### **Configuración necesaria antes de programar y ejecutar el servidor en Visual Studio Code** 

- Abrir el proyecto 

Para abrir el proyecto, nos dirigimos a Archivo > Abrir carpeta… Y seleccionamos la carpeta “Server”, donde se encuentra guardados todos los ficheros y módulos que conforman el proyecto. Luego de abrir el proyecto, se mostrará una lista de todas las carpetas y archivos que contiene en el Explorador, tal y como se muestra en la figura 9. 

10 

11 



<!-- Start of picture text -->
} Archivo Editar Seleccién Ver<br>Oo EXPLORADOR vee<br>V SERVER RRoe<br>> iot<br>> media<br>> matt<br>> Server<br>>? users<br>> web_plataform<br>= celerybeat-schedule.db<br>= dbsqlite3<br>manage.py<br>= requirements.txt<br><!-- End of picture text -->

_Figura 60._ **Explorador de Visual Studio Code** Adaptado de _Visual Studio Code_ 

- Crear un entorno virtual (venv) 

Para programar el servidor que permitiera comunicar el Raspberry Pi con los dispositivos IoT, se creó un proyecto llamado “Server” en el editor Visual Studio Code. En dicho proyecto se creó un entorno virtual con la librería estándar virtualenv de Python, donde se instalarían todas las librerías necesarias para el funcionamiento del servidor. 

Para acceder a la terminal que ofrece Visual Studio Code, nos dirigimos a Terminal > Nueva Terminal, y abriendo una terminal. 

Después, para instalar la librería se utilizó el siguiente comando en la terminal: 

~~eC~~ <mark>`$ pip install virtualenv`</mark> 

Una vez instalada, para crear el entorno virtual del proyecto se creó la ruta venv utilizando 

el siguiente comando: 

~~ee~~ <mark>`$ python –m virtualenv venv`</mark> 

Por defecto, la extensión de Python de Visual Studio Code busca y usa el primer intérprete que se encuentra en la ruta del sistema. Aunque, es posible indicar un intérprete específico con las 

11 

12 

teclas Ctrl + Shift + P, y seleccionando el intérprete en la paleta de comandos, tal y como se muestra en la figura 10. 



_Figura 61._ **Interprete utilizado para el entorno virtual del proyecto (venv)** 

- Instalar el paquete de librerías del proyecto 

Una vez que está activo el entorno virtual del servidor, utilizamos el siguiente comando para instalar el paquete de librerías del proyecto, que se encuentra en el archivo de configuración requirements.txt 

```
$ pip install –r requirements.txt
```

- Editar settings.py (opcional). 

Específicamente, cambiar el valor ‘192.168.100.18’ del elmento mqtt_broker en la variable MQTT_CONFIG que se muestra en la figura 11, por la dirección del Raspberry Pi asignada. 



_Figura 62._ **MQTT_CONFIG en Server/Server/Settings.py** 

- Restablecer la base de datos y crear un superuser. 

Cuando tenemos que restablecer toda la base de datos SQLite3 predeterminada de Django, debemos eliminar el archivo de base de datos db.sqlite3 que se encuentra en la carpeta del proyecto, luego, eliminar todas las carpetas de migrations dentro de todas las aplicaciones, que en este caso serían las carpetas: iot, mqtt, users y web_plataform. 

Después de eliminar las carpetas migrations, podemos rehacer las migraciones y migrarlas con dos comandos; a saber: 

12 

13 

```
$ python manage.py makemigrations
```

```
$ python manage.py migrate
```

Seguidamente creamos un superusuario. Para crear un superusuario que sea administrador y programador del servidor, escribimos el siguiente comando: 

```
$ python manage.py createsuperuser
```

**Ejecutar el servidor y todas sus funciones.** 

De último, para poner en funcionamiento el servidor y todas las funciones, se abren tres terminales en Visual Studio Code. 

En la primera terminal se inicializa el worker como un proceso de fondo con el siguiente comando: 

```
$ celery –A Server worker -–loglevel=INFO
```

En la segunda terminal se inicializa el servicio celery beat con el siguiente comando: 

```
$ celery –A Server beat
```

En la tercera terminal inicializamos el servidor con el siguiente comando: 

```
$ python manage.py runserver
```

Para acceder a la aplicación web del servidor desde el Raspberry Pi mientras se está ejecutando, escribimos en el navegador la dirección IP 127.0.0.1:8000. 

13 

14 

### **Partes principales del Servidor web** 

### **Pantalla principal - Inicio** 

Tal y como se muestra en la figura 12, “Inicio” es la página designada para ser el principal punto de entrada del servidor web, apareciendo cuando un usuario inicia sesión. También se encuentra en el director raíz del sitio. 



<!-- Start of picture text -->
Te damos la bienvenida a este servidor.<br>De el siguiente paso, para tener accesoa los siguientes servicios loT del servidor:<br>© Ofrecemos visibilidad a nuestros usuarios registrados sobre los sensores y actuadores conectados al servidor.<br>e Permitimos a nuestros usuarios registrados el control sobre los actuadores conectados al servidor.<br><!-- End of picture text -->

#### _Figura 63._ **Página de Inicio** 

La página contiene información sobre los servicios que ofrece el servidor. 

### **Cabecera** 

La cabecera o header de servidor web es la parte superior de la página que aparece al entrar al sitio y en cada una de las páginas. En ella aparece información básica e identidad de la aplicación, tal y como se muestra en la figura 13. 

La cabecera está compuesta por el logo “Servidor IOT”, el menú con las opciones “Inicio” y “Acerca de”, y una sección en la esquina superior derecha para conectarse o registrarse como usuario en el servidor web. 

14 

15 



<!-- Start of picture text -->
Servidor IOT inicio Acerca de eyreees (sep<br><!-- End of picture text -->

_Figura 64._ **Cabecera - Para todos los usuarios no registrados** 

El logo “Servidor IOT” y la opción “Inicio” del menú dirigirá al usuario a la página Inicio, o pantalla principal de la aplicación web. 

La opción “Acerca de” del menú dirigirá al usuario a la página “Acerca de” de la aplicación web, donde verá información de la aplicación web. 

En la esquina superior derecha podrá iniciar sesión como usuario o administrador; o registrarse en la aplicación web como usuario. 

Como se muestra en la figura 14, en caso de haber iniciado sesión como Usuario, la cabecera mostrará las opciones Laboratorios y Registros; en la esquina superior derecha mostrará el nombre del usuario que inició sesión, donde puede editar el perfil, y la opción de cerrar sesión. 



_Figura 65._ **Cabecera - Usuarios registrados** 

Tal y como se muestra en la figura 15, en caso de haber iniciado sesión como Administrador, la cabecera mostrará en el menú las opciones Laboratorios, Backup y Registros; y en la esquina superior derecha mostrará el nombre del usuario donde puede editar el perfil, y la opción de cerrar sesión. 



<!-- Start of picture text -->
Servidor<br>IOT inicio Laboratorios Registros Backup Acerca de @ amin desconectars<br><!-- End of picture text -->

_Figura 66._ **Cabecera - Administradores registrados** 

### **Acerca de** 

Como se puede ver en la figura 16, en esta sección se puede ver información de acerca de la aplicación web. Si es un usuario registrado puede acceder al manual de usuario. Si es un administrador registrado también puede acceder al manual técnico. 

15 

16 



<!-- Start of picture text -->
SS<br>Acerca de Manual de administracion<br>“” an<br>taboratonos. SeridertOT_Manuaecnice pt © 6<br>Manual de usuario<br>7 ae<br>Ww SS<br>=| a<br>Servidor loT - Manual<br>5 técnico<br>Servidor loT - Manual 2 : .<br><!-- End of picture text -->

_Figura 67._ **Página de Acerca de** 

16 

17 

### **Registrarse e Inicio de sesión** 

Si se encuentra navegando en la aplicación web, sin haber iniciado sesión, en la cabecera que se muestra en la figura 17 puede darle a la opción “Conectarse” y “Registro” en la parte superior derecha. 



<!-- Start of picture text -->
ServidorOT inicio Acercade Conectarse Registro<br><!-- End of picture text -->

#### _Figura 68._ **Cabecera - Conectarse y Registro** 

Para iniciar sesión debe tener una cuenta ya creada en la aplicación web. Tal y como se muetras en la figura 18, una vez que le da a la opción “Conectarse” solo corresponde ingresar su nombre de usuario y contraseña. Si no tiene una cuenta, puede crearla registrándose, ya sea en la opción “Registre una cuenta” o en la opción “Registro” que hay en la cabecera. 



<!-- Start of picture text -->
Servidor IOT inicio<br>Acercade Conectarse Regist<br>Login<br>Nombre de usuario*<br>Gontrasenia®<br>[triciar sesion |]<br><!-- End of picture text -->

_Figura 69._ **Iniciar sesión, o Log in** 

La página de Registro se muestra en la figura 19. 

17 

18 



<!-- Start of picture text -->
Servidor OT inicio Acerca de onectarse Reg<br>Registro<br>Nombre de usuario"<br>Requerido, 150 caracteres como maximo. Unicamente letras, digitosy @/./+-/_<br>Emait<br>Contrasenia®<br>Contrasefia (confitmacion)*<br>Para veriicar, inroduzca la misma contrasefia anterior.<br><!-- End of picture text -->

_Figura 70._ **Registro de usuario** 

Para crearse una cuenta en la aplicación web debe ingresar varios datos personales: Un nombre de usuario que lo identificará dentro de la aplicación, su correo electrónico, y una contraseña. 

El nombre de usuario que ingrese no debe superar los 150 caracteres, y únicamente debe contener letras, dígitos o símbolos como: arroba (@), punto (.), mas (+), menos (-) y barra baja (_). 

La contraseña que ingrese debe tener al menos 8 caracteres, no puede asemejarse a la información personal que se ha escrito y tampoco ser una contraseña común, como podría ser: Contraseña, su propio nombre de usuario o 12345678; también deberá escribirla dos veces para ser confirmada. 

18 

19 

Luego de ingresar los datos, presione el botón “Crear cuenta” para que su cuenta sea creada. Seguidamente, será dirigido a la página de Log in para que pueda iniciar sesión con su cuenta registrada. 

En caso de tener una cuenta ya registrada, puede dirigirse a la opción “Iniciar sesión” o a la opción “Conectarse” que se encuentra en la cabecera. 

19 

20 

### **Editar perfil** 

Si un usuario o administrador registrado han iniciado sesión, puede editar su perfil dándole 

al nombre de usuario de la cabecera, como se muestra en la figura 20. 



<!-- Start of picture text -->
Servidor<br>IOT inicio Laboratorios Registras Backup Acerca de @ acini —<br><!-- End of picture text -->

#### _Figura 71._ **Cabecera - Editar perfil** 

La página de Editar perfil se ve como en la figura 21. 



<!-- Start of picture text -->
Snir Olena tee ( ee<br>Editar perfil<br>———<br>jeoquertn| Sad eyaen epee eeine! Utena irons epony mil<br>Emait<br>ne<br>AhrMedtcar: [choosepan: le pessoa |No le chosen<br><!-- End of picture text -->

_Figura 72._ **Editar perfil** 

El usuario registrado puede actualizar su nombre de usuario, correo electrónico y avatar de su perfil. 

Para actualizar el avatar, presione el botón “Choose file” y seleccione la imagen que desea cargar y utilizar como avatar. 

Luego de terminar de editar los datos, presione el botón “Actualizar”. 

20 

21 

### **Usuario registrado** 

Los usuarios registrados tienen acceso a las opciones “Laboratorios” y “Registros” en el menú de la cabecera. 

### **Laboratorios – Laboratorio de prototipos** 

La opción “Laboratorios” contiene una lista de los laboratorios que se pueden ver en tiempo real. Como se puede ver en la figura 22, en esa lista se encuentra el “Laboratorio de prototipos”. 



_Figura 73._ **Cabecera - Laboratorios - Laboratorio de prototipos** 

Al seleccionar “Laboratorio de prototipos”, se cargará un panel de control que se divide en dos partes: 

- A la izquierda, se visualiza la lectura de los sensores y los botones que controlan las luces y aires acondicionados. 

- Y a la derecha, se visualiza una imagen del mapa del laboratorio donde se muestra la ubicación de los sensores y las secciones en la que está dividido (ver en la figura 23). 

21 

22 



<!-- Start of picture text -->
%<br>Sensor<br>Temperatura/humedad<br>Z AK<br>D=~ @ oa<br>Sensorde<br>Detector 1 N humedad de piso<br>ee «<br>72<br>oO<br>rs)<br>vt Ss<br>H $<br>°, r<br>Sensor \ | / e<br>Temperatura/humedad t ) C) e<br>Detector2<br><!-- End of picture text -->

_Figura 74._ **Mapa del laboratorio de prototipos** 

El lado izquierdo de la interfaz se divide en cuatro secciones: Temperatura y humedad relativa, luces, aire acondicionado y seguridad. 

### **_Temperatura y Humedad relativa_** 

Como se muestra en la figura 24, en esta sección se muestra los grados Celsius de la temperatura, el porcentaje de humedad relativa, interior y exterior del laboratorio de prototipos y, la fecha y hora en que se realizó la última actualización. En el nivel de temperatura interior, se muestra un indicador que señala si el nivel de temperatura es: 

- Muy bajo: Si la temperatura es menor a 5 °C 

- Bajo: Si la temperatura es mayor o igual a 5 °C, pero menor a 21°C 

- Normal: Si la temperatura es igual a 21 °C 

22 

23 

- Alto: Si la temperatura es mayor a 21 °C, pero menor o igual a 25 °C 

- Muy alto: Si la temperatura es mayor a 25 °C 

En el nivel de humedad relativa interior, se muestra un indicador que señala si el nivel de humedad relativa es: 

- Normal: Si la humedad relativa es menor de 85% 

- Alto: Si la humedad relativa es igual o mayor del 85% 



<!-- Start of picture text -->
a<br>:<br>Temperatura y Humedad relativa { —_°Taronigiioadd<br>Interior Exterior 2 aS<br>8 14°C g 18°C mune CN | Mindat po<br>Ox” OQ2% ss<br>$s3 @|<br>a 5<br>Nivel de Nivel de 3 @|g<br>temperatura humedad % @<br>(Interior) (Interior) q Ss mumat le Vy 4<br>Detector?<br><!-- End of picture text -->

_Figura 75._ **Temperatura y humedad relativa del laboratorio de prototipos y niveles** 

### **_Luces_** 

Como se puede ver en la figura 25, esta sección es donde se puede controlar las luces de la sección 1 y sección 2 del laboratorio de prototipos. Donde el estado de los botones de la sección 1 y sección 2 cambia de manera automática dependiendo de la luminosidad: 

- Encendido: La luminosidad de la sección es mayor o igual a 0, y menor o igual a 30. 

- Apagado: La luminosidad de la sección es mayor que 30, y menor o igual a 255. 

23 

24 

El nivel de lumninosidad de la sección 1 y sección 2 se muestra con un indicador, que 

señala si el nivel de luz es: 

- Muy fuerte: Si el valor de la luminosidad en la sección es mayor o igual a 0, y menor o igual a 30. 

- Fuerte: Si el valor de la luminosidad en la sección es mayor que 30, y menor o igual a 102. 

- Media: Si el valor de la luminosidad en la sección es mayor que 102, y menor o igual a 153. 

- Debil: Si el valor de la luminosidad en la sección es mayor que 153, y menor o igual a 204. 

- Nula: Si el valor de la luminosidad en la sección es mayor que 204, y menor o igual a 255. 



<!-- Start of picture text -->
aa |<br>Luces g%Tnpeua/nuned<br>Secci6n 1 Seccion 2 D< aS<br>Apagado Encendido Dhceciord < CL | mds ep<br>©$<br>g)<br>|<br>Lad e<br>lluminacion Bo} ry<br>(Seccion 1) (Secci6nlluminacion2) i i8 e@<br>race 98 vay) i=a Owey 8<br>Detector?<br>Aire acondicionado<br>rs aa| .<br><!-- End of picture text -->

_Figura 76._ **Control de las luces del laboratorio de prototipos y niveles de iluminación** 

### **_Aire acondicionado_** 

Como se puede ver en la figura 26, esta sección es donde se puede controlar los aires acondicionados de la sección 1 y sección 2 del laboratorio de prototipo. Donde el estado de los botones de la sección 1 y sección 2 cambia de manera automática, dependiendo de si alguno de los equipos fue encendido o apagado. 

24 

25 

### **_Seguridad_** 

Como se puede ver en la figura 26, esta sección es donde se muestra si hay presencia en el laboratorio de prototipos, si el seguro de la puerta esta colocado, y si existe una fuga de agua. Donde el estado de las variables cambia de acuerdo a los siguientes aspectos: 

- Verde: Hay presencia, el seguro de la puerta esta pasado, el piso esta seco. 

- Rojo: No hay presencia, el seguro de la puerta esta desbloqueado, el piso esta mojado. 



<!-- Start of picture text -->
os<br>Aire acondicionado<br>q,<br>AAL AlA2<br>Apagado Apagado De ES<br>.<br>S<br>Seguridad | 3 va<br>a 3|e<br>Sensor NA<br>hH_OWwt<br>ia -<br><!-- End of picture text -->

_Figura 77._ **Control de los AC y detección de presencia, seguridad y fugas de agua** 

25 

26 

### **Registros** 

La opción “Registros” contiene una lista de los laboratorios que se pueden ver en tiempo real. Como se puede ver en la figura 27, en esa lista se encuentra el “Laboratorio de prototipos”. 



<!-- Start of picture text -->
— oo servidor<br>~<a te Paso con los servicios loT del servidor:<br>ces Vsida a ruesvos usuros sore bs sensory cinres caret l sender,<br>!nuesros usuarios regrados econo sate acne soncoses wae<br><!-- End of picture text -->

#### _Figura 78._ **Cabecera - Registros - Laboratorio de prototipos** 

Al seleccionar “Laboratorio de prototipos”, se cargará una interfaz como la que se muestra en la figura 28, que se compone de una barra de selección que muestra una lista con las siguientes opciones: Temperatura, Humedad, Luminosidad/Horas de encendido y Presencia. 



<!-- Start of picture text -->
Registro del historico Registro del historico<br>Se<br><!-- End of picture text -->

#### _Figura 79._ **Registro del histórico - Barra de selección** 

Tras seleccionar una opción, se presiona el botón “Mostrar datos registrados” para confirmar. Seguidamente, se generará una gráfica y una tabla con el historial de datos leídos en la semana, de lunes a viernes, de 7 am a 7 pm. 

### **_Temperatura_** 

Si seleccionamos la opción “Temperatura”, se mostrará una gráfica lineal donde se ve el promedio total de la temperatura en la semana actual, de lunes a viernes, y una línea negra que 26 

27 

indica si la temperatura en el día superó los 25 °C. Debajo de la gráfica se muestra una tabla donde se ve con más detalle las temperaturas que hubo en el día, de 7 am a 7 pm (ver en la figura 29). 



<!-- Start of picture text -->
Historico dela semana 2208/2023 al 271052023 coe weeps<br><!-- End of picture text -->

_Figura 80._ **Registro del histórico - Temperatura** 

### **_Humedad_** 

Si seleccionamos la opción “Humedad”, se mostrará una gráfica lineal donde se ve el promedio total de la humedad relativa en la semana actual, de lunes a viernes, y una línea negra que indica si la humedad relativa es igual o mayor a 85%. Debajo de la gráfica se muestra una tabla donde se muestra en detalle la humedad que hubo entre las 7 am a 7 pm (ver en la figura 30). 



<!-- Start of picture text -->
Historica de la semana 22/08/2023 al 27708/2023 _oaeapepaeed<br><!-- End of picture text -->

_Figura 81._ **Registro del histórico - Humedad** 

### **_Luminosidad/Horas de encendido_** 

Si seleccionamos la opción luminosidad/horas de encendido en la barra de selección, se mostrará un grupo de gráficas y tablas que contienen la lectura semanal de la sección 1 y 2. 

27 

28 

Primero se mostrará unas gráficas en barras del promedio del nivel de luminosidad y la sumatoria las horas de encendido en ambas secciones, de 7 am a 7pm, de lunes a viernes, donde la sección 1 se representa en color azul y la sección 2 en color rojo (ver en la figura 31). 



<!-- Start of picture text -->
stonce dela semana 2208/2023 al 27052023<br>ol ee a a a<br><!-- End of picture text -->

_Figura 82._ **Registro del histórico - Gráficas de nivel de luminosidad y horas de encendido** 

Debajo de las gráficas se muestra las tablas con detalle el nivel de iluminación y horas de encendido de la sección 1. Donde se muestra en la tabla de horas de encendido qué horas del día estuvo las luces encendidas (ver en la figura 32). 



<!-- Start of picture text -->
Secci6n1<br>Nivel de ;iluminacion. Horas de encendido<br>a | aS (ac SN EEoe. ” SES~ ~ ESS~ ”<br>eS eel |<br><!-- End of picture text -->

_Figura 83._ **Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la sección 1** 

Debajo de las gráficas se muestra las tablas con detalle el nivel de iluminación y horas de encendido de la sección 2 (ver en la figura 33). Donde se muestra en la tabla de horas de encendido qué horas del día estuvo las luces encendidas. 

28 

29 



<!-- Start of picture text -->
—a<br>Nivel de iluminacion Horas de encendido<br>LS Es Ee eee a C5eeSy = = zy<br>(oes pa<br><!-- End of picture text -->

_Figura 84._ **Registro del histórico - Tablas de nivel de iluminación y horas de encendido de la sección 2** 

### **_Presencia_** 

Si seleccionamos la opción “Presencia” en la barra de selección, se mostrará una gráfica con el número de horas que hubo presencia durante el día, de lunes a viernes; y una tabla donde se muestra con más detalles que horas del día se detectó más presencia, de 7 am a 7 pm (ver en la figura 34). 



<!-- Start of picture text -->
esses<br><!-- End of picture text -->

_Figura 85._ **Registro del histórico - Presencia** 

29 

30 

### **Administrador registrado** 

Los administradores registrados tienen acceso a las opciones “Laboratorios”, “Registros” 

y “Backup” en el menú de la cabecera. 

### **Backup** 

Como se puede ver en la figura 35, en esta página se puede descargar una copia de los datos guardados en la base de datos del laboratorio de prototipos en un archivo Excel (.xls), que incluye: La temperatura, humedad relativa, luminosidad y horas de encendidos de las secciones 1 y 2, y presencia. Desde esta página también se puede acceder al Área Administrativa. 



<!-- Start of picture text -->
Area Administrativa<br>Pagina donde puede acceder al Area administrativa del servidor, donde podra gestionar los usuarios<br>registrados, y la informacion registrada en la base de datos.<br>My Backups<br>Pagina donde se puede descargar un archivo de la base de datos que contenga la informacion de la<br>temperatura, humedad, luminosidad y presencia leido hasta ahora en los laboratorios.<br>Laboratorio de prototipos<br><!-- End of picture text -->

_Figura 86._ **Backup** 

Cualquier usuario registrado, que no sea administrador, que intente acceder a la página o desee realizar una descarga será dirigido a la página de Inicio. 

Si se presiona al botón “Exportar en Excel (.xls)” se descargará un archivo excel, compatible con la versión 97 en adelante, el cual estará bajo el nombre de “registro_lab_prototipos_<<fecha actual en formato día/mes/año>>”, donde se muestra un histórico de la temperatura, humedad relativa, luminosidad en la sección 1 y sección 2, y presencia 

30 

31 

que se ha guardado en la base de datos durante el tiempo que el servidor ha estado en ejecución (ver en la figura 36). 



<!-- Start of picture text -->
[a _ —_— le<br>ae : ] oS ae ==<br>os oa ee 6<br>eee ex Seve oe<br>jc itesoe eS er Sem Ss $8 S<br>foe pes Geente 8s |<br>ies — force ee ee ts ges<br>es ase pas bere oo — ee<br>: ee<br>eee ee a<br>ae ois us 2<br>——m rx —s<br>—, _____——————— TT f | I<br>S. — oe = ee ee les<br>——-22oeead2 = oS ie =oeodSe i<br>eo ed pes — Sent oe ee<br>i ace i Se . =Sada2 2S = s<br>eSa See eee Sed eefee ee<br>SS eetco ee<br>=e e  oe heeee eeeoe — ce<br>ed S e Sae |<br>hem iswas us Sm foe oom i a a |<br>poeVertatpoeBeeeet=  —— eeseNeeioowass te xoteee sesi100aeisoseo —f eeissons e eeiss _ —kee ieueMastaie ee  _ _SeSeoe aioroSaefoxom omcomsafee:leas a8seo — oomoS55endheuer — usendporSeeee— hee—soapap<br>ee cee ee foe =e<br><i < ——S<br>_— a<br>a =<br>=e eg<br>Ee ee<br>=o<br>=e ——<br>ee |<br>a eet ee<br>a<br>a a<br>eee ee<br>= Ge Gt<br>=<br><!-- End of picture text -->

_Figura 87._ **Registro del laboratorio de prototipos exportado en Excel (.xls)** 

31 

32 

### **Área Administrativa** 

En el Área Administrativa de la aplicación web se puede añadir, modificar y eliminar información de la base de datos; como, por ejemplo, cambiar el rol de los usuarios para que sean administradores, editar contraseñas o borrar usuarios registrados. 

### **Iniciar sesión y usar el sitio** 

Se puede ingresar al Área Administrativa desde el botón correspondiente en la página Backup de la aplicación web o desde la URL: /admin (ejemplo: http://127.0.0.1:8000/admin). 

En el caso de no haber iniciado sesión, será dirigido a la página login que se muestra en la figura 37, donde deberá ingresar el nombre de usuario y contraseña de un Administrador. 



<!-- Start of picture text -->
Servidor loT - Area Administrativa<br>Nombre de usuario:<br>Contrasefa:<br><!-- End of picture text -->

_Figura 88._ **Login del Área Administrativa** 

Al ingresar al Área administrativa como Administrador, se visualiza una interfaz como se ve en la figura 38. 

32 

33 



<!-- Start of picture text -->
Laboratorio<br>Acciones recientes<br>|:<br>Hitarco detaemperatra ated 9 Mestir nes eines 900A<br>Historico de presencia + Afedir 4 Modificar iRaestie<br>Interior——— dl aboratorio =dirs+ Atede #alcn Modifcar # oJu e ves -06/07/2023ee - 07:00 -08.00<br>i<br>Perfiles registrados + Afedir 4 Modificar bbnsisad<br><!-- End of picture text -->

#### _Figura 89._ **Área administrativa de la aplicación web** 

En la cabecera que se muestra en la figura 39, se visualiza el nombre de la página en la esquina superior izquierda. Mientras que en la esquina superior derecha se visualiza el nombre de usuario del Administrador conectado, una opción “Ver el sitio” que permitirá volver a la página Inicio de la aplicación web, una opción “Cambiar contraseña” con la que se puede cambiar la clave, y una opción “Cerrar sesión” para desconectarse. 



_Figura 90._ **Área Administrativa - Cabecera** 

En el lado izquierdo de la interfaz (ver en la figura 40), se muestra todos las tablas/modelos de la base de datos, agrupados por cada aplicación instalada en el servidor. 

33 

34 



<!-- Start of picture text -->
Laboratorio<br>Grupos + Afedit 7 Modificar<br>Usuarios + Anedir 4 Modificar<br>Historico de la humedad + Afedir 4 Modificar<br>Historica dela luminosidad + Aled 4 Modificar<br>Historico de la temperatura + Anedir 4 Modifcar<br>Historica de presencia, + Afedir 4 Modificar<br>Humedad det suelo + Afedir 7 Modificar<br>Humedad exterior + Anedir 4 Modificar<br>Interiorde laboratorio + Aiadir 4 Modificar<br>‘Temperatura exterior + Aedir 4 Modificar<br>Perfles registrados + Afedir 7 Modificar<br><!-- End of picture text -->

_Figura 91._ **Modelos por cada aplicación instalada en el servidor** 

Al hacer clic al nombre un modelo, será dirigido a una pantalla que contiene una lista de todos los registros asociados. Además de visualizar los registros existentes, se pueden añadir registros nuevos o modificar registros existentes. 

Las aplicaciones que existen en el servidor son las siguientes: 

- Autenticación y Autorización: Contiene los usuarios/administradores y grupos de usuarios registrados en la aplicación web. 

- Iot: Contiene información registrada del laboratorio de prototipos. 

- Users: Contiene los avatares de los usuarios y administradores registrados. 

En el lado derecho de la interfaz (ver la figura 41), se muestra las acciones más recientes que han realizado los administradores en el Área administrativa, como: Crear, editar o borrar registros de la base de datos. 

34 

35 



<!-- Start of picture text -->
Acciones recientes<br>Mis acciones<br># Jueves 06/07/2023 -11:00-12:00<br>Ss<br># Suevessi - 06/07/2023- 10:00-11:00<br># dueves-06/07/2023 -09:00- 10:00<br># Juevessi - 06/07/2023 -08:00- 09:00<br>7 Jueves -06/07/2023 -07:00-08:00<br>si<br>% Rozes<br>% Rozes<br>1 Rozas<br>x Rozes<br><!-- End of picture text -->

_Figura 92._ **Área administrativa - Actividades recientes** 

### **Agregar, editar y eliminar usuarios del servidor** 

Si hacemos clic a “Usuarios” en la sección de Autenticación y Autorización de la pantalla principal del Área Administrativa, podemos acceder al registro de usuarios del servidor que se muestra en la figura 42. 

35 

36 



<!-- Start of picture text -->
ae, 7 ‘Accion: |—— ‘w| Ir | seleccionados0 de 2<br>PE<br>Historico de la humedad + Afodie UB oe<br>———<br>ee I<br>=a<br>Pe<br><!-- End of picture text -->

_Figura 93._ **Área Administrativa – Usuarios** 

Para crear un nuevo usuario, debemos hacer clic al botón “Añadir Usuario +” e ingresar la información correspondiente para añadir un nuevo usuario a la lista de usuarios registrados. 

Para eliminar un usuario existente, debemos hacer clic a la casilla de verificación, o checkbox que se encuentra a la izquierda de los nombres de la lista, luego dirigirnos a la barra de selección “Acción” para seleccionar la opción “Eliminar” y presionar el botón “Ir” de la derecha para confirmar. 

Para editar un usuario existente, debemos hacer clic al nombre del usuario que queremos modificar como, por ejemplo: Gabriela. Una vez hecho esto, seremos dirigidos a la página “Modificar usuario”, como se ve en la figura 43, donde podremos editar información del usuario seleccionado. 

36 

37 



<!-- Start of picture text -->
Grupos + Adscir GabrMod i ficarela usuario ep<br>Usuarios + Aacie Contrasetia: pkat’2_she2S6$3900008.)9)2b63y1K290NQ<br>mn<br>CT a ee<br>vee<br>‘Historico de la temperatura + Aner Polonaise spa cum<br>— sa;<br>ee<br>:<br>oe ae<br>oa<br>SS (redenado ost Conard enon Ma: prs ecient mt :<br>admin | entrads de regsstro | Can change log entry<br>Sorecef e eyctocence<br>Sa<br>Seer<br>Seamer<br>SSS ,<br>ectoee<br>——«<br>pom<br>Apetdos:<br>S proms babagead ‘serozasggmaicom<br>a<br>Fecha de atta: Fecha: | 20/04/2023 |yf<br>= SS ae<br><!-- End of picture text -->

_Figura 94._ **Área Administrativa - Modificar usuario** 

Como se puede ver en la figura 44, en la primera sección de la página se muestra el nombre del usuario seleccionado y la contraseña encriptada, la cual podemos modificar. 

37 

38 



<!-- Start of picture text -->
Gabriela<br>Contraseta pkat2_sha256 pao KE<br><!-- End of picture text -->

_Figura 95._ **Modificar usuario - Usuario y contraseña** 

Como se puede ver en la figura 45, en la segunda sección de la página se puede visualizar la fecha y hora en la que el usuario se conectó por última vez en la aplicación web. 



_Figura 96. Modificar usuario - Último inicio de sesión_ 

Como se puede ver en la figura 46, en la tercera sección de la página se puede asignar al usuario existente el rol de “superusuario”. Los superusuarios pueden realizar las mismas tareas que un usuario Administrador, también crear, editar y borrar cualquier elemento de los modelos/tablas de la base de datos. 



_Figura 97._ **Modificar usuario - Estado de superusuario** 

Como se puede ver en la figura 47, en la cuarta sección de la página se puede visualizar el grupo al que el usuario pertenecer o agregar al usuario a un grupo existente en el modelo Grupos. 



_Figura 98._ **Modificar usuario - Grupos** 

Como se puede ver en la figura 48, en la quinta sección de la página se puede visualizar los permisos que posee el usuario y agregar de manera manual nuevos permisos. 

38 

39 



<!-- Start of picture text -->
Permitos de usuario ‘ci | entrada de registro | Can 2g entry =<br>sci | etre de regia | Can changelog ety I<br>sxsmin | entra de registro | Cen delete log etry<br>xsi | entra de registro | Can view og entry<br>21h | grupo | Canad group<br>‘28h | grupo | Can change group<br>‘au | grupo | Can delete group<br>{88 grupo | Can ew group .<br>amenmgwctecs para ee wa Maeno evans Contot 0 Comand enuns Mac par slecoona mut 3a<br><!-- End of picture text -->

_Figura 99._ **Modificar usuario - Permisos de usuario** 

Como se puede ver en la figura 49, en la sexta sección de la página se puede visualizar y editar la información personal del usuario como, por ejemplo: Su nombre de usuario, nombre y apellido, y dirección del correo electrónico. 



<!-- Start of picture text -->
Nombee de usuario: Gabriela<br>Reqs 130 carte come muro Uncmerewras,S98 01.<br>Nombre:<br>poetic<br>[acereectonicogeat se rozasegmacom<br><!-- End of picture text -->

#### _Figura 100._ **Modificar usuario - Información personal** 

Como se puede ver en la figura 50, en la séptima sección de la página se puede indicar si el usuario es parte de la Administración. Los Administradores pueden entrar al Área Administrativa de la aplicación web y visualizar la opción Backup para poder descargar un respaldo de la base de datos. 



<!-- Start of picture text -->
neaOtssuttvate pn ear ne sto Se rinse an<br><!-- End of picture text -->

_Figura 101._ **Modificar usuario - Es staff** 

Como se puede ver en la figura 51, en la octava sección de la página se puede indicar que si el usuario debe ser tratado como activo. Si el usuario no es activo, se puede desmarcar esta opción en lugar de borrar la cuenta. 



<!-- Start of picture text -->
Brctivo<br>tna uso debe ve tatado come acto Desmarais opcn en ga debra crea<br><!-- End of picture text -->

_Figura 102._ **Modificar usuario - Activo** 

Como se puede ver en la figura 52, en la novena sección de la página se puede visualizar la fecha y hora en que se registró el usuario en la aplicación web. 

39 

40 



<!-- Start of picture text -->
Fecha de alta: Fecha: | 20/04/2023 |Hoy<br><!-- End of picture text -->

_Figura 103._ **Modificar usuario - Fecha de registro** 

Como se puede ver en la figura 53, al final de la página se puede visualizar cuatro botones: 

- Eliminar: Sirve para borrar el usuario de la base de datos. 

- Guardar y añadir otro: Sirve para guardar los cambios realizados en la información del usuario, para después rellenar un formulario con lo que se podrá registrar un nuevo usuario. 

- Guardar y continuar editando: Sirve para guardar los cambios realizados en la información del usuario, para permanecer en la misma página para seguir editando. 

- Guardar: Sirve para guardar los cambios realizados en la información del usuario, para luego ser dirigido a la sección de Autenticación y Autorización que contiene la lista de usuarios registrados. 



<!-- Start of picture text -->
ca a<br><!-- End of picture text -->

_Figura 104._ **Modificar usuario - Eliminar, Guardar y añadir otro, Guardar y seguir editando, Guardar** 

40 

41 

### **Apéndice D** 



**UNIVERSIDAD CATÓLICA ANDRÉS BELLO FACULTAD DE INGENIERÍA ESCUELA DE INGENIERÍA INFORMÁTICA** 

# **Servidor IoT - Manual técnico** 

Realizado por Rozas Bolívar, Gabriela Carolina Tutor industrial Bolívar Sánchez, María Victoria Tutor académico Fonseca Droy, Francisco José Fecha Septiembre, 2023 

41 

### **Índice de Contenido** 

|**Requerimientos de desarrollo**|**9**|
|---|---|
|Softwares y entornos de desarrollo utilizados para el trabajo de grado|9|
|Lenguajes de programación utilizados y conocimientos necesarios|9|
|Configuración necesaria antes de programar en Arduino IDE.|9|
|**Instalación del Servidor**|**12**|
|Instalación de VNC Viewer en el equipo que controlará el servidor|12|
|Configuración del Raspberry Pi 4 Modelo B para el desarrollo y uso del servidor|12|
|Configuración del broker MQTT Eclipse Mosquitto|15|
|Configuración del bróker Redis|16|
|Configuración necesaria antes de programar y ejecutar el servidor en Visual Studio Code|16|
|Ejecutar el servidor y todas sus funciones.|19|
|**Ficheros de Arduino**|**20**|
|Modulo_ESP8266_NodeMCU|20|
|Librerías utilizadas|20|
|Constantes|20|
|Variables globales|22|
|Funciones|22|
|Modulo_ArduinoMEGA2560|29|
|Librerías utilzadas|29|
|Constantes|29|
|Variables globales|30|
|Funciones|31|
|Modulo_ArduinoUNO|36|
|Librerías utilizadas|36|
|Constantes|36|
|Funciones|37|
|**Librerías utilizadas para la programación del servidor**|**40**|
|**Ficheros importantes del proyecto**|**42**|



||||2|
|---|---|---|---|
|Manage.p|y||42|
|Requirem|e|nts.txt|42|
|Celerybea|t|-schedule|42|
|Db.sqlite3|||43|
|Media|||43|
|**Aplicacio**|**n**|**es del servidor**|**44**|
|Server|||44|
|||__pycache__|44|
|||static|44|
|||__init__.py|46|
|||asgi.py|46|
|||celery.py|48|
|||settings.py|49|
|||urls.py|50|
|||wsgi.py|51|
|Iot|||52|
|||__pycache__|52|
|||config/i2c.py|52|
|||Management/commands|53|
|||Migrations|56|
|||Templates|57|
|||__init__.py|57|
|||admin.py|57|
|||apps.py|58|
|||consumers.py|59|
|||custom_datetime.py|63|



|||3|
|---|---|---|
||models.py|63|
||routing.py|65|
||tasks.py|66|
||tests.py|68|
||Urls.py|68|
||Views.py|68|
|Mqtt||69|
||__pycache__|69|
||Migrations|69|
||__init__.py|69|
||Admin.py|70|
||Apps.py|70|
||Models.py|71|
||Tests.py|71|
||Views.py|71|
|Users||71|
||__pycache__|71|
||Migrations|72|
||Templates|72|
||__init__.py|72|
||Admin.py|72|
||Apps.py|73|
||Forms.py|73|
||Models.py|74|
||Signals.py|75|



|Tests.py|4<br>75|
|---|---|
|Views.py|75|
|Web_plataform|76|
|__pycache__|76|
|Migrations|76|
|Templates|76|
|__init__.py|77|
|Admin.py|77|
|Apps.py|77|
|Models.py|77|
|Tests.py|78|
|Urls.py|78|
|Views.py|78|



5 

### **Índice de figuras** 

|Figura 105.**Arduino IDE – Preferencias**....................................................................... 10|
|---|
|Figura 106.**Arduino IDE - Board Manager**.................................................................. 10|
|Figura 107.**Izquierda: VNC Connect en el Raspberry Pi - Derecha: VNC Viewer en**|
|**el equipo que controla el Raspberry Pi**..................................................................................... 13|
|Figura 108.**Dirección IP que utilizó el VNC Viewer para controlar el Raspberry Pi**|
|....................................................................................................................................................... 13|
|Figura 109.**Agregando una dirección estática wlan0 al Raspberry Pi**....................... 14|
|Figura 110.**wlan0 del Raspberry Pi**............................................................................... 15|
|Figura 111.**Configuración del broker Mosquitto**......................................................... 15|
|Figura 112.**Usuarios con acceso al broker**.................................................................... 16|
|Figura 113.**Explorador de Visual Studio Code**............................................................ 17|
|Figura 114.**Interprete utilizado para el entorno virtual del proyecto (venv)**............ 18|
|Figura 115.**MQTT_CONFIG en Server/Server/Settings.py**....................................... 18|
|Figura 116.**Modulo_ESP8266_NodeMCU - connectToWifi**....................................... 23|
|Figura 117.**Modulo_ESP8266_NodeMCU - onWifiConnect**....................................... 23|
|Figura 118.**Modulo_ESP8266_NodeMCU - onWifiDisconnect**.................................. 23|
|Figura 119.**Modulo_ESP8266_NodeMCU - connectToMqtt**...................................... 24|
|Figura 120.**Modulo_ESP8266_NodeMCU - onMqttConnect**...................................... 24|
|Figura 121.**Modulo_ESP8266_NodeMCU - onDisconnect**.......................................... 24|
|Figura 122.**Modulo_ESP8266_NodeMCU - onMqttPublish**....................................... 25|
|Figura 123.**Modulo_ESP8266_NodeMCU – PublishTemp**......................................... 25|
|Figura 124.**Modulo_ESP8266_NodeMCU - PublishHum**........................................... 26|



|6|
|---|
|Figura 125.**Modulo_ESP8266_NodeMCU - PublishWater**......................................... 27|
|Figura 126.**Modulo_ESP8266_NodeMCU - setup**........................................................ 28|
|Figura 127.**Modulo_ESP8266_NodeMCU - loop**......................................................... 29|
|Figura 128.**Modulo_ArduinoMEGA2560 - setup**........................................................ 31|
|Figura 129.**Modulo_ArduinoMEGA256 - request_Event**........................................... 32|
|Figura 130.**Modulo_ArduinoMEGA256 - temperature_readings**.............................. 33|
|Figura 131.**Modulo_ArduinoMEGA256 - humidity_readings**................................... 33|
|Figura 132.**Modulo_ArduinoMEGA256 - pir_readings**.............................................. 34|
|Figura 133.**Modulo_ArduinoMEGA256 - ldr_readings**.............................................. 35|
|Figura 134.**Modulo_ArduinoMEGA256 - boolean_readings**...................................... 35|
|Figura 135.**Modulo_ArduinoUNO - receiveEvent**....................................................... 37|
|Figura 136.**Modulo_ArduinoUNO - setup**.................................................................... 39|
|Figura 137.**Modulo_ArduinoUNO - loop**...................................................................... 39|
|Figura 138.**manage.py**..................................................................................................... 42|
|Figura 139.**Server - __init__.py**..................................................................................... 46|
|Figura 140.**Server - asgi.py**............................................................................................. 47|
|Figura 141.**Configuración de Celery.py**........................................................................ 48|
|Figura 142.**Configuración del cronograma de tareas, en Celery.py del módulo Server**|
|....................................................................................................................................................... 49|
|Figura 143.**Lista de urls creados en el módulo Server**................................................ 51|
|Figura 144.**Server - wsgi.py**............................................................................................ 51|
|Figura 145.**iot - config/i2c.py**.......................................................................................... 52|



|7<br>Figura 146.**Clase Command de i2creader.py**............................................................... 53|
|---|
|Figura 147.**Clase Command de i2Cwriter.py**............................................................... 54|
|Figura 148.**iot - Funciones cls y write_module de i2cwriter.py**.................................. 55|
|Figura 149.**Clase Command de mqtt_connect.py**........................................................ 56|
|Figura 150.**iot - admin.py**............................................................................................... 58|
|Figura 151.**iot - apps.py**.................................................................................................. 58|
|Figura 152.**Acceso a la tabla Temperatura_exterior de la base de datos con Channels**|
|....................................................................................................................................................... 60|
|Figura 153.**Código de la función get_previousweek_data() para obtener la**|
|**temperatura de lunes a viernes, de 7am a 7pm**........................................................................ 62|
|Figura 154.**Mensaje enviado por el URL ws/lab-two/**................................................. 63|
|Figura 155.**iot - routing.py**............................................................................................. 66|
|Figura 156.**Función event_post_add() del archivo task.py del módulo iot**................ 67|
|Figura 157.**iot - urls.py**................................................................................................... 68|
|Figura 158.**iot - views.py**................................................................................................. 69|
|Figura 159.**users - admin.py**........................................................................................... 73|
|Figura 160.**users - apps.py**.............................................................................................. 73|
|Figura 161.**users - forms.py**............................................................................................ 74|
|Figura 162.**users - models.py**.......................................................................................... 74|
|Figura 163.**users - signals.py**.......................................................................................... 75|
|Figura 164.**web_plataform - urls.py**.............................................................................. 78|



8 

|**Índice de tablas**|
|---|
|Tabla 4. Librerías utilizadas para programar el ESP8266 NodeMCU, autores y sus|
|funciones ....................................................................................................................................... 20|
|Tabla 5. Librerías utilizadas para programar el Arduino MEGA 2560 R3, autores y sus|
|funciones ....................................................................................................................................... 29|
|Tabla 6. Librerías utilizadas para programar el Arduino UNO R3, autores y sus funciones|
|....................................................................................................................................................... 36|
|Tabla 7. Eventos que lleva a cabo el Arduino UNO R3 según el valor de x .................... 38|
|Tabla 8. Librerías utilizadas para programar el servidor en Python, autores y sus funciones<br>....................................................................................................................................................... 40|
|Tabla 9. Tipos de mensajes que pueden enviarse por el Channel_layer lab_events ......... 61|
|Tabla 10. Tópicos y modelo de la base de datos asociada ................................................ 71|



9 

### **Requerimientos de desarrollo** 

### **Softwares y entornos de desarrollo utilizados para el trabajo de grado** 

- Sistema operativo Raspbian. 

- Arduino IDE, versión 1.8.19 o superior. 

- Visual Studio Code. 

- Eclipse Mosquitto. 

- Redis. 

- VNC Viewer y VNC Connect. 

### **Lenguajes de programación utilizados y conocimientos necesarios** 

- Conocimiento nivel medio utilizando Python 3.9.2 o superior. 

- Conocimiento nivel medio utilizando el framework de desarrollo Django 4.1.4. 

- Conocimiento nivel medio utilizando Arduino, que está basado en el lenguaje C. 

- Conocimiento medio en el desarrollo web, utilizando los lenguajes: HTML, CSS y Javascript. 

- Conocimientos nivel medio utilizando el SO Raspbian, que está basado en Debian. 

### **Configuración necesaria antes de programar en Arduino IDE.** 

- Instalar el Plugin del ESP8266 para Arduino. 

Para que el Arduino IDE reconozca el ESP8266 NodeMCU como una tarjeta es necesario instalar el Plugin del ESP8266. Para ello, en el fichero Modulo_ESP8266_NodeMCU nos ubicamos en File > Preferences, tal y como se muestra en la figura 1, y en la casilla “Additional Boards Manager URLs:” agregamos el link: http://arduino.esp8266.com/stable/package_esp8266com_index.json 

10 



<!-- Start of picture text -->
Preferences x<br>Settings Network<br>Sketchbook location:<br>(C\Users\gcroz\OneDrive\Documentos\Arduino Browse<br>Fedor language: ‘system Defaut \)_ (requires restart of Arduino)<br>Edtor font size: a<br>Interface scale: Grutomatic | 100 5% (requires restart of Arduino)<br>Theme: Default theme | (requires restart of Arduino)<br>Show verbose output during: @ compilation (upload<br>‘Compiler warnings: None ©<br>display tine numbers Conable code Folding<br>verify code after upload (Dluse external editor<br>Gi check for updates on startup @ save when verfying or uploading<br>Cuse accessibility features<br>‘Addtonal Boards Manager URLS: [hitp//arduino.esp8266,com/stable/package_e=p8266com_index.json o<br>‘C:\Users\gcroz\OneDrive\Documentos\ArduinoDatalpreferences.bt<br>edt only when Arduino is not running)<br>0K Cancel<br><!-- End of picture text -->

#### _Figura 105._ **Arduino IDE – Preferencias** Adaptado de _Arduino IDE_ 

Seguidamente, nos ubicamos en Tools > Board > Boards Manager…, y buscamos en la lista “esp8266” by ESP8266 Community (ver en la figura 2). 



<!-- Start of picture text -->
© Boards Manager x<br>Type [a © [espa266<br>e5p8266<br>by ESP8266 Community version 3.0.2 INSTALLED<br>Boards included in this package:<br>| Generic ESP8266 Module, Generic ESP8285 Module, Lifely Agrumino Lemon v4, ESPDuino (ESP-13 Module), Adafruit Feather HUZZAH ESP8266,<br>WiFi Kit 8, Invent One, XinaBox CWO1, ESPresso Lite 1.0, ESPresso Lite 2.0, Phoenix 1.0, Phoenix 2.0, NodeMCU 0.9 (ESP-12 Module), NodeMCU<br>1.0 (ESP-12E Module), Olimex MOD-WIFI-ESP8266(-DEV), SparkFun ESP8266 Thing, SparkFun ESP8266 Thing Dev, SparkFun Blynk Board,<br>‘SweetPea ESP-210, LOLIN(WEMOS) D1 R2 & mini, LOLIN(WEMOS) D1 ESP-WROOM-02, LOLIN(WEMOS) D1 mini (clone), LOLIN(WEMOS) D1 mini<br>Pro, LOLIN(WEMOS) D1 mini Lite, LOLIN(WeMos) D1 R1, ESPino (ESP-12 Module), ThaiEasyElec’s ESPino, Wiflnfo, Arduino, 4D Systems gen4 IoD<br>Range, Digistump Oak, WiFiduino, Amperka WiFi Slot, Seed Wio Link, ESPectro Core, Schirmilabs Eduino WiFi, ITEAD Sonoff, DOIT ESP-Mx Devkit<br>Online(EsP8285).More InfoHelp<br>Select version v| Install Update Remove<br>Close<br><!-- End of picture text -->

_Figura 106._ **Arduino IDE - Board Manager** 

11 

Una vez instalado, podemos utilizar esta placa para programar el ESP8266 NodeMCU en el Arduino IDE. 

- Instalar el driver CH340 (opcional). 

En caso de utilizar Arduinos genericos que no sean de la marca original y el Arduino IDE no lo reconozca al conectar el dispositivo, se recomienda instalar el driver CH340. 

12 

### **Instalación del Servidor** 

### **Instalación de VNC Viewer en el equipo que controlará el servidor** 

Con el fin de controlar el Raspberry Pi desde otra computadora/laptop se instala el software RealVNC en ambos equipos. 

Primero, desde el sitio oficial de RealVNC se descarga e instala la aplicación VNC Viewer en el equipo que desea acceder al ordenador servidor. 

Después, se descarga e instala VNC Connect en el ordenador servidor, que en este caso sería el Raspberry Pi 4 modelo B. VNC Connect consta de una aplicación VNC Server y otros programas de apoyo. Para más información, revise la sección de Configuración del Raspberry Pi 4 modelo B para el desarrollo y uso del servidor, que se muestra a continuación. 

### **Configuración del Raspberry Pi 4 Modelo B para el desarrollo y uso del servidor** 

La instalación del sistema operativo Raspbian en el Raspberry Pi 4 modelo B se realizó con la guía del tutorial de instalación de Creatividad Ahora en youtube, donde se configuró la red WiFi a la que se conectaría el dispositivo y el Secure Shell, SSH, para permitir el acceso remoto al equipo, ya sea conectándose a él con un cable Ethernet o a través de Internet, y resolver la necesidad de poder contar con un puerto HDMI para ver la interfaz del Raspberry Pi en un monitor. 

Con el fin de controlar el Raspberry Pi desde otra computadora/laptop se instaló el software RealVNC en ambos equipos (ver en la figura 3). 

13 



<!-- Start of picture text -->
B OM Dien. Qveiiro. finds [NII ® 4 $= 4) 10 ‘cree z =e x<br>7 Soe Simm ©<br>IRE vic comecr: aT @ AE! .<br>Senos —_ factors taste Rtteet taping<br>ese tye a<br><!-- End of picture text -->

_Figura 107._ **Izquierda: VNC Connect en el Raspberry Pi - Derecha: VNC Viewer en el equipo que controla el Raspberry Pi** Adaptado de _RealVNC_ 

Desde la página de configuración del router, que en este caso fue la dirección IP 192.168.100.1, se identificó que la dirección IP asignada por el router Rozas al Raspberry Pi era la 192.168.100.18, la cual fue agregada en las propiedades de la conexión que se creó en VNC Viewer (ver en la figura 4). 



<!-- Start of picture text -->
VNC Server: [EZAIESAIORE!<br>Name: Raspberry pi<br><!-- End of picture text -->

_Figura 108._ **Dirección IP que utilizó el VNC Viewer para controlar el Raspberry Pi** Adaptado de _VNC Viewer_ 

Una vez establecida la conexión con el equipo, solo fue necesario iniciar sesión como el usuario “pi” (que viene predefinido en la instalación del SO), bajo la clave de “raspberrypi” para acceder al equipo. 

Una vez que se tuvo acceso al equipo se cambió la clave de acceso del Raspberry Pi por una diferente, y se actualizaron los paquetes del sistema operativo. Seguidamente, se procedió a configurar una dirección IP estática para la interface WiFi (wlan0) en el Raspberry Pi. 

Siguiendo el tutorial de Luis Llamas, para configurar una IP estática en Raspbian debemos editar el fichero /etc/dhcpcd.conf desde la terminal, con el comando: 

```
$ sudo nano /etc/dhcpcd.conf
```

14 

En el fichero encontraremos unas líneas comentadas (que empiezan con “#”) que tienen un ejemplo de configuración de IP estática. Para crear nuestra propia dirección estática para el wlan0 modificamos el archivo agregando el texto que se muestra en la figura, donde: 

interface = Nombre de la interface que queremos configurar. 

static ip_address = Dirección fija que queremos, dejando el /24 al final. 

static routers = Dirección del gateway del router. 

static domain_name_servers = Dirección del servidor DNS, que normalmente sería la del 

router o unas externas como las de Google 8.8.8.8. 

Que mostró el resultado que se muestra en la figura 5. 



<!-- Start of picture text -->
GNU nano 5.4 Jetc/dheped. cont |<br>|<br><!-- End of picture text -->

_Figura 109._ **Agregando una dirección estática wlan0 al Raspberry Pi** Adaptado de _/etc/dhcpcd.conf_ 

A continuación, se guardaron los cambios y se reinició el Raspberry Pi desde la terminal, 

con el comando: 

```
$ sudo reboot
```

Finalmente, comprobamos que teníamos la dirección IP configurada ejecutando el comando: 

```
$ ifconfig wlan0
```

Que mostró el resultado que se muestra en la figura 6. 

15 



<!-- Start of picture text -->
ether de:aé 5:3k xqueuele! ethernet)<br><!-- End of picture text -->

_Figura 110._ **wlan0 del Raspberry Pi** 

Posterior a eso, se procedió a instalar el editor de código fuente Visual Studio Code para comenzar a programar la aplicación web del servidor. 

### **Configuración del broker MQTT Eclipse Mosquitto** 

Luego de descargar e instalar Eclipse Mosquitto en el Raspberry Pi, se configuró el servicio para que se ejecutara cada vez que el sistema del equipo iniciara, ejecutando el siguiente comando en la terminal: 

#### <mark>`$ sudo systemctl enable mosquitto.service`</mark> 

Además, tal y como se ver en la figura 7, se editó el fichero /etc/mosquitto/mosquitto.conf 

para que los usuarios que quisieran utilizar el broker MQTT solo pudieran hacerlo si ingresaban los usuarios y claves incluidos en el fichero passwd. 



<!-- Start of picture text -->
mosquitto.conf »<br>DT # Place your local configuration in /etc/mosquitto/conf.d/<br>= 2<br>3<br>4  ## A/usr/share/doc/mosquitto/examples/mosquitto.conf.examplefull description of the configuration file is at<br>5<br>6 per_listener_settings true<br>7 pid_file /run/mosquitto/mosquitto.pid<br>8<br>9 persistence true<br>18  persistence_location /var/lib/mosquitto/<br>11<br>12 log_dest<br>13 file /var/log/mosquitto/mosquitto.log<br>14° include_dir /etc/mosquitto/conf.d<br>15 allow_anonymous false<br>16 listener 1883<br>17__—password_file /etc/mosquitto/passwd<br>18<br><!-- End of picture text -->

_Figura 111._ **Configuración del broker Mosquitto** Adaptado de _/etc/mosquitto/mosquitto.conf_ 

Para generar el fichero passwd se ingresó el siguiente comando por consola: 

16 

```
$ sudo mosquito_passwd -c /etc/mosquito/passwd Rozas
```

Y se agregó un segundo usuario y clave al fichero con el siguiente comando: 

```
$ sudo mosquito_passwd -b /etc/mosquito/passwd rasp-broker
```

Dando como resultado el fichero /etc/mosquito/passwd que se muestra en la figura 8, cuya clave de cada usuario está encriptada. 



<!-- Start of picture text -->
passwd X<br>T2 _ rasp-broker:$7$161$sZH9U2mJ3X22xP98SEmVqroPnRozas:$7$101$s0rClz/s6uLuQtcfSiktAr5Hy+MZB1Bk05+f1rxA9+400Bhsmhtgd6nQTo4ucUOrUx/ox0QG!<br>3 172 Lr t gma1Bm8yXZmE1xt QNkUIWT3UOx3V6xVj 153<br><!-- End of picture text -->

_Figura 112._ **Usuarios con acceso al broker** Adaptado de _/etc/mosquito/passwd_ 

### **Configuración del bróker Redis** 

Para instalar Redis en el Raspberry Pi, se siguieron los pasos del tutorial de Awais Khan, donde se usó el siguiente comando en la terminal: 

```
$ sudo apt install redis-server -y
```

Después de terminar la instalación, para que Redis se ejecute de manera automática en cada reinicio del Raspberry Pi se usó el siguiente comando: 

```
$ sudo systemctl enable redis
```

### **Configuración necesaria antes de programar y ejecutar el servidor en Visual Studio Code** 

- Abrir el proyecto 

Para abrir el proyecto, nos dirigimos a Archivo > Abrir carpeta… Y seleccionamos la carpeta “Server”, donde se encuentra guardados todos los ficheros y módulos que conforman el proyecto. Luego de abrir el proyecto, se mostrará una lista de todas las carpetas y archivos que contiene en el Explorador, tal y como se muestra en la figura 9. 

17 



<!-- Start of picture text -->
} Archivo Editar Seleccién Ver<br>V SERVER RRoea<br>> iot<br>> media<br>> matt<br>> Server<br>> users<br>> web_plataform<br>= celerybeat-schedule.db<br>= dbsqlite3<br>manage.py<br>= requirements.txt<br><!-- End of picture text -->

_Figura 113._ **Explorador de Visual Studio Code** Adaptado de _Visual Studio Code_ 

- Crear un entorno virtual (venv) 

Para programar el servidor que permitiera comunicar el Raspberry Pi con los dispositivos IoT, se creó un proyecto llamado “Server” en el editor Visual Studio Code. En dicho proyecto se creó un entorno virtual con la librería estándar virtualenv de Python, donde se instalarían todas las librerías necesarias para el funcionamiento del servidor. A diferencia del paquete venv, virtualenv es una librería que ofrece más funcionalidades. 

Para acceder a la terminal que ofrece Visual Studio Code, nos dirigimos a Terminal > Nueva Terminal, y abriendo una terminal. 

Después, para instalar la librería se utilizó el siguiente comando en la terminal: 

~~ee~~ <mark>`$ pip install virtualenv`</mark> 

Una vez instalada, para crear el entorno virtual del proyecto se creó la ruta venv utilizando el siguiente comando: 

~~ee~~ <mark>`$ python –m virtualenv venv`</mark> 

18 

Por defecto, la extensión de Python de Visual Studio Code busca y usa el primer intérprete que se encuentra en la ruta del sistema. Aunque, es posible indicar un intérprete específico con las teclas Ctrl + Shift + P, y seleccionando el intérprete en la paleta de comandos, tal y como se muestra en la figura 10. 



_Figura 114._ **Interprete utilizado para el entorno virtual del proyecto (venv)** Adaptado de _Visual Studio Code_ 

- Instalar el paquete de librerías del proyecto 

Una vez que esté activo el entorno virtual del servidor, utilizamos el siguiente comando para instalar el paquete de librerías del proyecto, que se encuentra en el archivo de configuración requirements.txt 

```
$ pip install –r requirements.txt
```

- Editar settings.py (opcional). 

Específicamente, cambiar el valor ‘192.168.100.18’ del elemento mqtt_broker en la variable MQTT_CONFIG que se muestra en la figura 11, por la dirección del Raspberry Pi asignada. 



_Figura 115._ **MQTT_CONFIG en Server/Server/Settings.py** 

- Restablecer la base de datos y crear un superuser. 

Cuando tenemos que restablecer toda la base de datos SQLite3 predeterminada de Django, debemos eliminar el archivo de base de datos db.sqlite3 que se encuentra en la carpeta del proyecto, 

19 

luego, eliminar todas las carpetas de migrations dentro de todas las aplicaciones, que en este caso serían las carpetas: iot, mqtt, users y web_plataform. 

Después de eliminar las carpetas migrations, podemos rehacer las migraciones y migrarlas con dos comandos; a saber: 

```
$ python manage.py makemigrations
```

```
$ python manage.py migrate
```

Seguidamente creamos un superusuario. Para crear un superusuario que sea administrador y programador del servidor, escribimos el siguiente comando: 

```
$ python manage.py createsuperuser
```

**Ejecutar el servidor y todas sus funciones.** 

De último, para poner en funcionamiento el servidor y todas las funciones, se abren tres terminales en Visual Studio Code. 

En la primera terminal se inicializa el worker como un proceso de fondo con el siguiente comando: 

```
$ celery –A Server worker -–loglevel=INFO
```

En la segunda terminal se inicializa el servicio celery beat con el siguiente comando: 

```
$ celery –A Server beat
```

En la tercera terminal inicializamos el servidor con el siguiente comando: 

```
$ python manage.py runserver
```

Para acceder a la aplicación web del servidor desde el Raspberry Pi mientras se está ejecutando, escribimos en el navegador la dirección IP 127.0.0.1:8000. 

20 

### **Ficheros de Arduino** 

### **Modulo_ESP8266_NodeMCU** 

Fichero que incluye el código que se desarrolló para que el ESP8266 MCU leyera información de los sensores conectados al dispositivo y envíe la información recibida al Raspberry Pi 4 Modelo B, utilizando el protocolo de comunicación MQTT. 

### **Librerías utilizadas** 

<u>Tabla 4.</u> _<u>Librerías utilizadas para programar el ESP8266 NodeMCU, autores y sus funciones</u>_ 

|**Librería**|**Autor**|**Función**|
|---|---|---|
|DHT.h|Adafruit|Librería desarrollada para sensores de temperatura/humedad como DHT11,<br>DHT22, entre otros.|
|ESP8266WiFi.h|A-Vision<br>Software|Librería WiFi para ESP8266 desarrollada basándose en el SDK de ESP8266,<br>usando nombres convencionales y la filosofía de funcionalidades generales de<br>la librería WiFi de Arduino.|
|Ticker.h|Stefan<br>Staub|Librería desarrollada para llamar una función a un intervalo de tiempo<br>determinado, con ayuda de las funciones micros() / millis()|
|AsyncMqttClient.h|Marvin<br>Roger|Librería desarrollada para implementar un cliente MQTT asíncrono en<br>ESP8266 y ESP31|



### **Constantes** 

**WIFI_SSID:** Define el identificador de red SSID, que en este caso sería la red de area local inalámbrica “Rozas”. 

**WIFI_PASSWORD:** Define la contraseña para acceder a la red definida en la variable WIFI_SSID que, en este caso, fue “Bolivar23” 

**MQTT_HOST IPAddress (192,168,100,18):** Es la IP del equipo donde se encuentra instalado el broker MQTT que, en este caso, sería la misma IP que utiliza el Raspberry Pi para conectarse a la red definida en WIFI_SSID: 192.168.100.18 

**MQTT_HOST:** Variable comentada, utilizada para pruebas, en lugar de una dirección IP. Contiene el link “https://test.mosquitto.org/” para que el dispositivo se conecte al server/broker MQTT que ofrece Eclipse Mosquitto de manera gratuita. 

21 

**MQTT_PORT:** Contiene el número de puerto al que se conectara el dispositivo, que en este caso sería 1883. 

**MQTT_QOS:** Define la calidad de los mensajes que enviará el dispositivo, que en este caso, sería 1. Donde los mensajes se enviarán el publicador (ESP8266 NodeMCU) hasta que se garantiza la entrega. En caso de fallo, el suscriptor (Raspberry Pi) puede recibir algún mensaje duplicado. 

**MQTT_PUB_TEMP:** Contiene el nombre del tópico donde el ESP8266 Node MCU publicará los mensajes de temperatura, que en este caso es: “esp8266/temperature” 

**MQTT_PUB_HUM:** Contiene el nombre del tópico donde ESP8266 Node MCU publicará los mensajes de humedad relativa, que en este caso es: “esp8266/humidity” 

**MQTT_PUB_WATER:** Contiene el nombre del tópico donde ESP8266 Node MCU publicará los mensajes de humedad del piso, que en este caso es: “esp8266/water” 

**Int WATERPIN:** Pin donde se encuentra conectado el sensor de agua, que en este caso sería el pin 5. 

**DHTPIN:** Pin donde se encuentra conectado el sensor DHT11 de temperatura y humedad relativa, que en este caso sería el pin 4. 

**DHTType:** Define el tipo de sensor de temperatura y humedad, o DHT, que estará conectado al dispositivo, que en este caso es un DHT11. 

**Unsingned long interval_dht:** Determina el intervalo de tiempo, en milisegundos, que se leerá el sensor DHT11 y se publicará el mensaje correspondiente, que en este caso sería 60000 (equivalente a 1 minuto). 

**Unsingned long interval_water:** Determina el intervalo de tiempo, en milisegundos, que se leerá el sensor de agua y se publicará el mensaje correspondiente, que en este caso seria 300000 (equivalente a 5 minutos). 

22 

### **Variables globales** 

**DHT dht(DHTPin, DHTType)** : En la variable dht definimos el pin al que está conectado el sensor DHT y tipo de sensor DHT utilizado. 

**AsyncMqttClient mqttClient:** La variable mqttClient sirve para instanciar un cliente MQTT que se conectará de manera asincrónica. 

**Ticker mqttReconnectTimer:** La variable mqttReconnectTimer sirve para instanciar un temporizador que permitirá al dispositivo reconectarse al MQTT bróker. 

**WiFiEventHandler wifiConnectHandler:** Define a la variable como de clase genérica WiFiEventHandler para manejar los eventos relacionados a: Conectarse a la red WiFi. 

**WiFiEventHandler wifiDisconnectHandler:** Define a la variable como de clase genérica WiFiEventHandler para manejar los eventos relacionados a: Desconectarse de la red WiFi. 

**Ticker wifiReconnectTimer:** La variable wifiReconnectTimer sirve para instanciar un temporizador que permitirá al dispositivo reconectarse a la red WiFi. 

**Unsigned long event_dht:** Definida inicialmente en 0, esta variable la utilizamos como condición de parada 

**Unsigned long event_water:** Definida inicialmente en 0, esta variable la utilizamos como condición de parada 

### **Funciones** 

### **Void connectToWifi()** 

Como se puede ver en la figura 12, esta función es utilizada para conectarse a la red WiFi definida en la variable WIFI_SSID con la contraseña definida en la variable WIFI_PASSWORD. Se imprimirá en el Serial de Arduino el mensaje: “Conectandose a la red WiFi…”. 

23 



<!-- Start of picture text -->
void connectToWifi() {<br>Serial.printin("Conectadose a la red WiFi...");<br>WiFi.begin(WIFI_SSID, WIFI_PASSWORD);<br>}<br><!-- End of picture text -->

#### _Figura 116._ **Modulo_ESP8266_NodeMCU - connectToWifi** 

### **Void onWifiConnect(const WiFiEventStationModeGotIP& event)** 

Como se puede ver en la figura 13, esta función es utilizada para imprimir en el Serial de Arduino mensajes que contiene la red WiFi a la que se está conectando el ESP8266 Node MCU, y la dirección IP que le asignó el router. Seguidamente, si la conexión fue exitosa, llamará a la función connectToMqtt() para conectarse al broker. 



<!-- Start of picture text -->
void onWifiConnect (const WiFiEventStationModeGotIPs event) {<br>Serial.printin("");<br>Serial.print ("Conectado a la red ");<br>Serial.print1n(WIFI_SSID);<br>Serial.print<br>("IP address: ");<br>Serial.printin (WiFi.localIP());<br>connectToMatt ()<br>?<br><!-- End of picture text -->

#### _Figura 117._ **Modulo_ESP8266_NodeMCU - onWifiConnect** 

### **Void onWifiDisconnect(const WiFiEventStationModeDisconnected& event)** 

Como se puede ver en la figura 14, esta función es utilizada para imprimir en el Serial de Arduino que se desconectó de la red WiFi, en caso de que se haya caído la conexión. Debido a esto, llamará al método detach() del objeto mqttReconnectTimer para evitar reintentar conectarse al bróker. Seguidamente, intentará reconectarse a la red WiFi con la función wifiReconnectTimer. 



<!-- Start of picture text -->
void onWifiDisconnect<br>(const WiFiEventStationModeDisconnectedé event) {<br>Serial.printin("Desconectado de 1a red WiFi.");<br>mgttReconnectTimer.detach(); // Nos aseguramos que no intente conectarse a MOTT mientras intentamos reconectarnos al WiFi<br>wifiReconnectTimer.once(2, connectToWifi);<br>><br><!-- End of picture text -->

#### _Figura 118._ **Modulo_ESP8266_NodeMCU - onWifiDisconnect** 

### **Void connectToMqtt()** 

Como se puede ver en la figura 15, esta función es utilizada para conectarse al broker MQTT, imprimiendo en el Serial de Arduino el mensaje “Conectandose al broker MQTT…” y llamando al método connect() del objeto mqttClient. 

24 



<!-- Start of picture text -->
void connectToMgqtt() {<br>Serial.printin("Conectadose al broker MQTT...");<br>mqttClient.connect ();<br>}<br><!-- End of picture text -->

#### _Figura 119._ **Modulo_ESP8266_NodeMCU - connectToMqtt** 

### **Void onMqttConnect(bool sessionPresent)** 

Como se puede ver en la figura 16, esta función inicia una sesión una vez el ESP8266 NodeMCU ha podido conectarse al broker MQTT exitosamente. Imprimiendo en el Serial de Arduino el mensaje “Conectado al broker MQTT.”, y la sesión presente que fue pasado por parámetro. 



<!-- Start of picture text -->
void onMqttConnect (bool sessionPresent) {<br>Serial.printin("Conectado al broker MOTT.");<br>Serial.print("Session: ");<br>Serial.printin(sessionPresent) ;<br>}<br><!-- End of picture text -->

#### _Figura 120._ **Modulo_ESP8266_NodeMCU - onMqttConnect** 

### **Void onMqttDisconnect(AsyncMqttClientDisconnectReason reason)** 

Como se puede ver en la figura 17, esta función que avisa que el ESP8266 NodeMCU se ha desconectado del bróker, escribiendo en el Serial de Arduino el mensaje “Desconectado del bróker MQTT.”. Seguidamente, si el dispositivo aún está conectado a la red WiFi, intentará reconectarse al broker. 



<!-- Start of picture text -->
void onMqttDisconnect (AsyncMgttClientDisconnectReason reason) {<br>Serial.printin("Desconectado del broker MQTT.");<br>if (WiFi.isConnected()) {<br>mattReconnectTimer.once(2, connectToMgtt) ;<br>}<br>}<br><!-- End of picture text -->

#### _Figura 121._ **Modulo_ESP8266_NodeMCU - onDisconnect** 

### **Void onMqttPublish(uint16_t packetId)** 

Como se puede ver en la figura 18, esta función escribirá un mensaje en el serial de Arduino cada vez que el ESP8266 NodeMCU publique un mensaje en el bróker MQTT. 

25 



<!-- Start of picture text -->
void onMgqttPublish(uintlé_t packetId) {<br>Serial.print("Se publico un mensaje.");<br>Serial.print(" packetId: ");<br>Serial.println(packetId);<br>}<br><!-- End of picture text -->

#### _Figura 122._ **Modulo_ESP8266_NodeMCU - onMqttPublish** 

### **Void PublishTemp()** 

Como ve en la figura 19, esta función lee la temperatura del sensor DHT11 en grados Celsius. El resultado es un número decimal, que es redondeado y convertido en una variable entera guardada en “temp”. Si la variable resultante no es un número, en caso de que haya ocurrido un error durante la lectura, el payload será igual a “error”. Por lo tanto, en el Serial de Arduino se imprimirá el mensaje: “Mensaje: error.”. 

En el caso contrario, si la variable resultando es un número, el payload será igual al número, transformado en una variable String, y se imprimirá en el Serial de Arduino el mensaje que será publicado a continuación. 

Seguidamente, se enviará el mensaje (payload) al tópico asignado en la variable MQTT_PUB_TEMP, y la calidad del mensaje será la misma que fue definida en la variable MQTT_QOS. En paralelo, se creará un paquete de 2 bytes llamado packetIdPub, el cual contiene los datos del envío, que será impreso en el Serial de Arduino. 



<!-- Start of picture text -->
void PublishTemp(){<br>String payload;<br>int temp = int (round(dht.readTemperature())); // Lee la temperatura en Celsius (default)<br>// Lee la temperatura en Fahrenheit (isFahrenheit = true)<br>//float temp = dht.readTemperature<br>(true) ;<br>if (isnan(temp)) {<br>payload = "error";<br>Serial.println("Mensaje: error.");<br>} elset<br>payload = String (temp);<br>Serial.printf("Mensaje: $i \n", temp);<br>}<br>// Publica un mensaje MOTT al topico esp8266/temperature<br>uintlé_t packetIdPubl = mgttClient.publish (MQTT_PUB_TEMP, MOTT_QOS, true, payload.c_str())?<br>Serial.print£("Publicando al topico %s en QoS 1, packetId: i \n", MOTT_PUB_TEMP, packetIdPubl);<br>,<br><!-- End of picture text -->

#### _Figura 123._ **Modulo_ESP8266_NodeMCU – PublishTemp** 

26 

### **Void PublishHum()** 

Como se puede ver en la figura 20, en esta función se lee la humedad relativa del sensor DHT11. El resultado es un número decimal que es redondeado y convertido en una variable entera guardada en “hum”. 

Si la variable resultante no es un número, en caso de que haya ocurrido un error durante la lectura, el payload será igual a “error”. Por lo tanto, en el Serial de Arduino se imprimirá el mensaje: “Mensaje: error.”. 

En el caso contrario, si la variable resultando es un número, el payload será igual al número, transformado en una variable String, y se imprimirá en el Serial de Arduino el mensaje que será publicado a continuación. 

Seguidamente, se enviará el mensaje (payload) al tópico asignado en la variable MQTT_PUB_HUM, y la calidad del mensaje será la misma que fue definida en la variable MQTT_QOS. En paralelo, se creará un paquete de 2 bytes llamado packetIdPub2, el cual contiene los datos del envío, que será impreso en el Serial de Arduino. 



<!-- Start of picture text -->
void PublishHum(){<br>String payload;<br>int hum = int (round(dht.readHumidity())); // Lee la humedad relativa<br>if (isnan(hum)) {<br>payload = "error";<br>Serial.printin("Mensaje: error.");<br>} elset<br>payload = String(hum);<br>Serial.printf("Mensaje: $i \n", hum);<br>,<br>// Publica un mensaje MOTT al topico esp8266/humidity<br>uintlé_t packetIdPub2 = mgttClient.publish (MOTT_PUB_HUM, MOTT_QOS, true, payload.c_str())?<br>Serial.print£("Publicando al topico %s en QoS 1, packetId: $i \n", MOTT_PUB_HUM, packetIdPub2);<br>}<br><!-- End of picture text -->

#### _Figura 124._ **Modulo_ESP8266_NodeMCU - PublishHum** 

### **Void PublishWater()** 

Como se puede ver en la figura 21, en esta función se lee la humedad del piso del sensor. El resultado varía entre dos estados: “1” si el sensor está mojado, y “0” si el sensor está seco; el resultado será guardado en una variable payload. 

27 

Se imprimirá en el Serial de Arduino el mensaje que será publicado a continuación. 

Seguidamente, se enviará el mensaje (payload) al tópico asignado en la variable MQTT_PUB_WATER, y la calidad del mensaje será la misma que fue definida en la variable MQTT_QOS. En paralelo, se creará un paquete de 2 bytes llamado packetIdPub3, el cual contiene los datos del envío, que será impreso en el Serial de Arduino. 



<!-- Start of picture text -->
void PublishWater(){<br>String payload;<br>if (! digitalRead(WATERPIN)<br>) {<br>payload = "1"; //Hay humedad (el sensor esta mojado)<br>} else {<br>payload = "0"; //No hay humedad (el sensor esta seco)<br>}<br>Serial.printf("Mensaje: %s \n",payload);<br>uintlé_t packetIdPub3 = mattClient.publish (MOTT_PUB_WATER, MOTT_QOS, true, payload.c_stz())<br>Serial.printf("Publicando al topico %s en QoS 1, packetId #i: \n", MQTT_PUB_WATER, packetIdPub3);<br>,<br><!-- End of picture text -->

#### _Figura 125._ **Modulo_ESP8266_NodeMCU - PublishWater** 

### **Void setup()** 

Como se puede ver en la figura 22, esta función es llamada cuando se ejecuta el sketch en el Arduino. Primero, abre el Puerto Serial y especifica la velocidad de transmisión. La velocidad típica para comunicación con el ordenador es de 9600. 

Después, inicializa la variable dht para la lectura de temperatura y humedad relativa; luego, inicializa las variables que manejaran los eventos de conexión/desconexión al WiFi, seguidamente, inicializa el MQTT client para conectarse al bróker y enviar mensajes. 

Para utilizar el bróker MQTT que se encuentra en el Raspberry Pi, se realiza una autenticación con el método setCredentials, pasando por parámetros el usuario “rasp-broker” y la contraseña “ucab*ucab”. 

Una vez terminado las configuraciones pertinentes, se llama a la función connectToWifi() para inicializar todos los procesos. 

La función setup() solo se ejecutará una sola vez, luego de que el Arduino recibe alimentación, o después de que es reseteado. 

28 



<!-- Start of picture text -->
oid setup()t<br>Serial begin (9600);<br>pinMode (WATERPIN, INPUT);<br>dnt .begin ();<br>wifiConnectHandler = WiFi .onStationModeGotIP (onWifiConnect) :<br>wifiDisconnectHandler = WiFi .onStationModeDisconnected (onWifiDisconnect);<br>mgttClient<br>mgttClient.onConnect.onDisconnect(onMgttConnect)(onMqttDisconnect): ;<br>mgttClient .onPublish (onMgttPublish) :<br>mgttClient .setServer (MQTT_HOST, MOTT_PORT) ;<br>// $i el broker requiere autenticacion (usuario y contrasena), y posee una credencial, se configura con la siguiente funcion<br>mgttClient.setCredentials("rasp-broker", “ucabtucab"):<br>connect ToWifi ()<br>)<br><!-- End of picture text -->

#### _Figura 126._ **Modulo_ESP8266_NodeMCU - setup** 

### **Void loop()** 

Como se puede ver en la figura 23, esta función es el núcleo del programa en Arduino y se usa para el control activo de la placa. Se ejecutará continuamente, justo después de la función setup(). 

En esta función se hizo uso de la función millis, para calcular cuando segundos han pasado y ejecutar la función correspondiente: 

- Cada 60000 milisegundos (1 minuto) se ejecutan las funciones PublishTemp() y PublishHum(), donde el ESP8266 NodeMCU procede a leer la temperatura y la humedad relativa del sensor DHT11, para luego enviar un mensaje a los tópicos “esp8266/temperature” y “esp8266/humidity” con los datos (en formato entero). 

- Cada 300000 milisegundos (5 minutos) se ejecuta la función PublishWater(), donde el ESP8266 NodeMCU procede a leer el sensor de agua, para luego enviar un mensaje al tópico “esp8266/water” con el dato (“1” si el sensor estaba mojado, “0” si el sensor estaba seco). 

29 



<!-- Start of picture text -->
void loop(){<br>unsigned long currentMillis = millis();<br>if (currentMillis - event_dht >= interval_dht) {<br>PublishTemp(); //Publica la temperatura<br>PublishHum(); //Publica la humedad<br>event_dht = currentMillis; // Guarda el tiempo en que una nueva lectura fue publicada<br>,<br>if (currentMillis - event_water >= interval_water) {<br>PublishWater(); //Publica si hay o no humedad en el sensor de agua<br>event_water = currentMillis; // Guarda el tiempo en que una nueva lectura fue publicada<br>}<br>}<br><!-- End of picture text -->

#### _Figura 127._ **Modulo_ESP8266_NodeMCU - loop** 

### **Modulo_ArduinoMEGA2560** 

Fichero que incluye el código que se desarrolló para que el Arduino MEGA 2560 R3 (Esclavo) leyera información de los sensores conectados al dispositivo y envíe la información recibida al Raspberry Pi 4 Modelo B (Maestro), utilizando el protocolo de comunicación I2C, cuando sea solicitada. 

### **Librerías utilizadas** 

<u>Tabla 5.</u> _<u>Librerías utilizadas para programar el Arduino MEGA 2560 R3, autores y sus funciones</u>_ 

|**Librería**|**Autor**|**Función**|
|---|---|---|
|Wire.h|Librería<br>estándar de<br>Arduino|Librería que le permite a Arduino implementar la comunicación I2C, ya sea como<br>maestro a otros dispositivos o como esclavo recibiendo peticiones y respondiendo<br>datos.|
|DHT.h|Adafruit|Librería desarrollada para sensores de temperatura/humedad como DHT11,<br>DHT22, entre otros.|



### **Constantes** 

**SLAVE_ADDRESS:** Define una dirección I2C para que el Arduino MEGA 2560 (Esclavo) pueda comunicarse con el Raspberry Pi 4 Modelo B (Maestro), en este caso su dirección sería 11. 

**DHTPin:** Pin de entrada para el sensor de temperatura y humedad, que en este caso sería el pin digital 7. 

30 

**Int LDRPin_A:** Pin de entrada para el sensor de luz A, que en este caso sería el pin analógico A0. 

**Int LDRPin_B:** Pin de entrada para el sensor de luz B, que en este caso sería el pin analógico A1. 

**Int PIR_Pin_A:** Pin de entrada para el sensor PIR de movimiento A, que en este caso sería el pin digital 2. 

**Int PIR_Pin_B:** Pin de entrada para el sensor PIR de movimiento B, que en este caso sería el pin digital 8. 

**Int DOORPin:** Pin de entrada para la cerradura de la puerta, que en este caso sería el pin digital 3 

**Int ACPin_A:** Pin de entrada para leer el estado del aire acondicionado A, que en este caso sería el pin digital 10. 

**Int ACPin_B:** Pin de entrada para leer el estado del aire acondicionado B, que en este caso sería el pin digital 11. 

**DHTType:** Define el tipo de sensor de temperatura y humedad, o DHT, que estará conectado al dispositivo, que en este caso es un DHT22. 

### **Variables globales** 

**DHT dht(DHTPin, DHTType)** : En la variable dht definimos el pin al que esta conectado el sensor DHT y tipo de sensor DHT utilizado. 

31 

### **Funciones** 

### **Void setup()** 

Como se puede ver en la figura 24, esta función es llamada cuando se ejecuta el sketch en el Arduino. Primero, configura al Arduino para que se una al bus I2C con la dirección definida en la variable SLAVE_ADDRESS, seguidamente, configura los pines para que sean entradas, inicializa la variable dht para la lectura de temperatura y humedad relativa, de último, pone en espera al Arduino (Esclavo) para ejecutar la función request_Event cuando reciba una request del Raspberry Pi (Maestro). La función setup() solo se ejecutará una sola vez, luego de que el Arduino recibe alimentación, o después de que es reseteado. 



<!-- Start of picture text -->
void setup() {<br>Wire.begin(SLAVE_ADDRESS); //Inicializa 1a comunicacion 12C con el Maestro<br>pinMode (PIRPin A, INPUT); //Pin digital de entrada conectado al sensor PIR A<br>pinMode(PIRPinB, INPUT); //Pin digital de entrada conectado al sensor PIR B<br>pinMode(ACPin_A, INPUT); //Pin digital de entrada conectado a la salida de relay asociada al aire acondicionado A<br>pinMode(ACPin<br>pinMode (DOORPin,B, INPUT); //Pin digital de entrada conectado 1aal s alidaensor de puertarelay asociada al aire acondicionado A<br>pinMode(LDRPinA, INPUT); //Pin analogico de entrada conectado al sensor de luz A<br>pinMode(LDRPinB, INPUT); //Pin analogico de entrada conectado al sensor de luz B<br>dht.begin(); //Inicializa el sensor de temperatura y humedad<br>Wire-onRequest (request_Event); //Cuando el maestro solicite informacion al esclavo, se activara esta funcion<br>»<br><!-- End of picture text -->

#### _Figura 128._ **Modulo_ArduinoMEGA2560 - setup** 

### **Void request_Event()** 

Como se puede ver en la figura 25, esta función se ejecuta cada vez que el Arduino recibe una Request del Raspberry Pi (Maestro). Define una variable array dato[8] de tipo byte para guardar la información que reciba de los sensores: la temperatura, la humedad relativa, la presencia, la luminosidad de las secciones A y B, el estado de la puerta, y los estados de los aires acondiciones A y B; para después enviar el array al Raspberry Pi con la función Wire.write(). 

32 



<!-- Start of picture text -->
//Eventos solicitades<br>void request_Event(){<br>int 4 = 0;<br>byte dato[@]; // Esta dato en bytes que se envia al raspberry pi<br>while (i<8) {<br>switch (4) {<br>case 0:<br>dato[i] = temperature_readings(); //Leemos la temperatura<br>break:<br>case 1:<br>dato[i] = humidity readings(); //Leemos la humedad<br>break:<br>case 2:<br>dato[i] = pir_readings(); //Leemos si hay o no movimiento<br>break;<br>case 3:<br>dato[i] = 1ldr_readings(LDRPin_A); //Leemos 1a luminosidad del ambiente<br>break:<br>case 4:<br>dato[i] = ldr_readings(LDRPin_B); //Leemos 1a luminosidad del ambiente<br>break:<br>case 5:<br>dato[i] = boolean_readings(DOORPin); //Leemos si la puerta esta abierta o cerrada<br>//HIGH: Puerta cerrada. El circuito esta cerrado<br>//LOW: Puerta abierta. El circuito esta abierto<br>break:<br>case 6:<br>dato[i] = boolean_readings(ACPin A); //Leemos si el aire acondicionado A esta encendido o apagado<br>break;<br>case 7:<br>dato[i] = boolean_readings(ACPin B); //Leemos si el aire acondicionado B esta encendido o apagado<br>break;<br>y<br>att:<br>»<br>Wire.write(dato,8); //Envia los datos leidos al maestro<br>,<br><!-- End of picture text -->

_Figura 129._ **Modulo_ArduinoMEGA256 - request_Event** 

### **Byte temperature_readings()** 

Como se puede ver en la figura 26, esta función se encarga de leer la temperatura, en entero, desde el sensor DHT22 conectado al Arduino, para después retornar 0 si la lectura recibida no es un número, o retornar el valor de la variable transformado en bytes. 

33 



<!-- Start of picture text -->
byte temperature readings () {<br>int temp = dht.readTemperature(); //leyendo la temperatura por el pin conectado al sensor dht22<br>byte temp_bytes;<br>if (isnan(temp)){<br>return 0;<br>} else {<br>temp_bytes=(byte) temp;<br>return temp bytes;<br>}<br>,<br><!-- End of picture text -->

#### _Figura 130._ **Modulo_ArduinoMEGA256 - temperature_readings** 

### **Byte humidity_readings()** 

Como se puede ver en la figura 27, esta función que se encarga de leer la humedad relativa, en entero, desde el sensor DHT22 conectado al Arduino, para después retornar 0 si la lectura recibida no es un número, o retornar el valor de la variable transformado en bytes. 



<!-- Start of picture text -->
byte humidity _readings(){<br>int hum = dht.readHumidity(); //leyendo la humedad por el pin conectado al sensor dht22<br>byte hum_bytes;<br>if (isnan(hum)){<br>return 0;<br>} else {<br>hum_bytes= (byte) hum;<br>return hum bytes;<br>}<br>?<br><!-- End of picture text -->

#### _Figura 131._ **Modulo_ArduinoMEGA256 - humidity_readings** 

### **Byte Pir_readings()** 

Como se puede ver en la figura 28, esta función se encarga de leer los sensores PIR de movimiento conectados al Arduino, para después realizar una operación lógica OR entre la variable pir_valueA y la variable pir_valueB para devolver un valor entero 1 (TRUE) u 0 (FALSE). 

Si alguno de los dos sensores detectó movimiento, el valor de la variable pir_total será 1. Si ninguno de los dos sensores detectó movimiento, el valor de la variable pir_total será 0. El resultado será convertido en un valor en byte para ser devuelto por la función. 

34 



<!-- Start of picture text -->
byte pir_readings(){<br>int pir_valueA = digitalRead(PIRPinA);<br>int pir_valueB = digitalRead(PIRPin_B);<br>int pir_total = (pir_valueA or pir_valueB);<br>byte pir_bytes = (byte)pir_total:<br>return pir_bytes:<br>}<br><!-- End of picture text -->

#### _Figura 132._ **Modulo_ArduinoMEGA256 - pir_readings** 

### **Byte ldr_readings(const int pin_value)** 

Como se puede ver en la figura 29, esta función se encarga de leer una resistencia ldr desde el pin análogo pin_value que se pase por referencia. 

El valor que recibiremos de la variable entera analogValue será un número entre 0 y 1023, equivalente de 0 a 5 analógicos. 

En la maqueta física se conectaron las resistencias LDR en pull-up por lo que el valor de la variable analogValue sería el siguiente, dependiendo de la cantidad de luz que reciba la resistencia: 

- analogValue < 10: Brillante 

- analogValue < 200: Muy iluminado 

- analogValue < 500: Iluminado 

- analogValue < 800: Poco iluminado 

- analogValue >= 800: Oscuro 

Para poder transformar la variable en byte se utilizó la función map() para sacar el equivalente a 8 bits, que sería un número que se encuentra entre 0 y 255, guardado en la variable entera analogValue. 

Finalmente, variable analogValue será transformada en una variable byte y retornada por la función. 

35 



<!-- Start of picture text -->
byte 1dr_readings(const int pin_value){<br>int analogValue = analogRead(pin_value); // Leyendo €1 sensor de luz por €1 pin analogo AO<br>//Mapea un valor analogo a 8 bits (0 a 255)<br>analogValue = map(analogValue, 0, 1023, 0, 255);<br>byte byte_value = (byte) analogValue;<br>return byte_value;<br>}<br><!-- End of picture text -->

_Figura 133._ **Modulo_ArduinoMEGA256 - ldr_readings** 

### **Byte Boolean_readings(cons int pin_value)** 

Como se puede ver en la figura 30, esta función se encarga de leer una entrada digital y retornar el valor en byte, pasando por referencia la variable pin_value que contiene el número del pin a leer. En este caso, se utiliza la función tres veces durante la ejecución del programa, para leer el estado del pin conectado a la cerradura de la puerta, y el estado de los dos pines conectados a los aires acondicionados. 



<!-- Start of picture text -->
byte boolean_readings(const int pin_value){<br>int sensor_value = digitalRead(pin_value); //lectura digital de pin conectado al sensor<br>byte sensor_byte=(byte) sensor_value;<br>return sensor_byte;<br>}<br><!-- End of picture text -->

_Figura 134._ **Modulo_ArduinoMEGA256 - boolean_readings** 

### **Void loop()** 

Esta función es el núcleo de todos los programas de Arduino y se usa para el control activo de la placa. Se ejecutará continuamente, justo después de la función setup(). Esta función se dejó vacía, ya que cualquier proceso que se ejecutaba en esta función interfería con la comunicación bus I2C, por tanto, se colocaron en la función setup(). 

36 

### **Modulo_ArduinoUNO** 

Fichero que incluye el código que se desarrolló para que el Arduino UNO R3 (Esclavo) enviara información de los actuadores conectados al dispositivo y estos realizaran una acción, de acuerdo a la información recibida al Raspberry Pi 4 Modelo B (Maestro), utilizando el protocolo de comunicación I2C. 

### **Librerías utilizadas** 

<u>Tabla 6</u> _<u>. Librerías utilizadas para programar el Arduino UNO R3, autores y sus funciones</u>_ 

|**Librería**|**Autor**|**Función**|
|---|---|---|
|Wire.h|Librería estándar<br>de Arduino|Librería que le permite a Arduino implementar la comunicación I2C, ya sea como<br>maestro a otros dispositivos o como esclavo recibiendo peticiones y respondiendo<br>datos.|



### **Constantes** 

**SLAVE_ADDRESS:** Define una dirección I2C para que el Arduino UNO (Esclavo) pueda comunicarse con el Raspberry Pi 4 Modelo B (Maestro), en este caso su dirección sería 12. 

**Int ledPin_A:** Pin del Arduino que se comunica con el conector de entrada del Módulo de 4 relés (o relays) para encender/apagar uno de los LEDs azules. En este caso sería el pin 6. 

**Int ledPin_B:** Pin del Arduino que se comunica con el conector de entrada del Módulo de 4 relés (o relays) para encender/apagar uno de los LEDs azules. En este caso sería el pin 5. 

**Int ledPin_C:** Pin del Arduino que se comunica con el conector de entrada del Módulo de 4 relés (o relays) para encender/apagar uno de los LEDs amarillos. En este caso sería el pin 4. 

**Int ledPin_D:** Pin del Arduino que se comunica con el conector de entrada del Módulo de 4 relés (o relays) para encender/apagar uno de los LEDs amarillos. En este caso sería el pin 3. 

37 

### **Funciones** 

### **Void receiveEvent(int howMany)** 

Como se puede ver en la figura 32, esta función se ejecuta cuando el Arduino UNO 

(Esclavo) recibe un mensaje del Raspberry Pi (Maestro) a través del bus I2C. 



<!-- Start of picture text -->
void receiveEvent<br>(int howMany){<br>while (Wire.available()){<br>int x = Wire.read(); //Recibe el byte como un entero<br>switch (x){<br>case 10:<br>digitalWrite(ledPin_D, HIGH);<br>break;<br>case 11:<br>digitalWrite(ledPin_D, LOW);<br>break;<br>case 20:<br>digitalWrite(ledPin_C, HIGH):<br>break;<br>case 21:<br>digitalWrite(ledPin_C, LOW);<br>break;<br>case 30:<br>digitalWrite(ledPin_B, HIGH);<br>break;<br>case 31:<br>digitalWrite(ledPin_B, LOW);<br>break;<br>case 40:<br>digitalWrite(ledPin_A, HIGH);<br>break;<br>case 41:<br>digitalWrite(ledPin_A, LOW);<br>break;<br>?<br>}<br>}<br><!-- End of picture text -->

_Figura 135._ **Modulo_ArduinoUNO - receiveEvent** 

Mientras el esclavo permanezca conectado al bus, realizará una acción dependiendo del mensaje recibido, el mensaje será guardado en una variable de tipo entero “x” (ver en la tabla 4). 

38 

<u>Tabla 7.</u> _<u>Eventos que lleva a cabo el Arduino UNO R3 según el valor de x</u>_ 

|**Valor de x**|**Evento**|
|---|---|
|10|Apagar luces de la sección 1|
|11|Encender luces de la sección 1|
|20|Apagar luces de la sección 2|
|21|Encender luces de la sección 1|
|30|Apagar AC 1|
|31|Encender AC 1|
|40|Apagar AC 2|
|41|Encender AC 2|



### **void setup()** 

Como se puede ver en la figura 33, esta función es llamada cuando se ejecuta el sketch en el Arduino. Primero, configura los pines definidos para que sean salidas. Seguidamente, envía una señal de HIGH a los pines definidos, con el fin de inicializar los relés y apagar los LEDs. De último, configura el Arduino para que se una al bus I2C con la dirección definida en la variable SLAVE_ADDRESS y pone en espera al Arduino (Esclavo) para ejecutar la función receive_Event cuando reciba un mensaje del Raspberry Pi (Maestro). La función setup() solo se ejecutará una sola vez, luego de que el Arduino recibe alimentación, o después de que es reseteado. 

39 



<!-- Start of picture text -->
void setup() {<br>//Configura los pines como salidas<br>pinMode(ledPin_A, OUTPUT);<br>pinMode(ledPin_B, OUTPUT);<br>pinMode(ledPin_C, OUTPUT);<br>pinMode(ledPin_D, OUTPUT);<br>digitalWrite(ledPinA, HIGH);<br>digitalWrite(ledPinB, HIGH);<br>digitalWrite(ledPinC, HIGH);<br>digitalWrite(ledPin_D, HIGH);<br>Wire.begin(SLAVE_ADDRESS); //Se une al bus I2C como un esclavo con la direccion correspondiente<br>//Llama a la funcion receiveEvent cuando recibe la data<br>Wire. onReceive (receiveEvent) ;<br>?<br><!-- End of picture text -->

#### _Figura 136._ **Modulo_ArduinoUNO - setup** 

### **loop()** 

Esta función es el núcleo de todos los programas de Arduino y se usa para el control activo de la placa. Se ejecutará continuamente, justo después de la función setup(). Como se puede ver en la figura 34, esta función se dejó vacía, ya que cualquier proceso que se ejecutaba en esta función interfería con la comunicación bus I2C, por tanto, se colocaron en la función setup(). 



<!-- Start of picture text -->
void loop() {<br>// put your main code here, to run repeatedly:<br>}<br><!-- End of picture text -->

_Figura 137._ **Modulo_ArduinoUNO - loop** 

40 

### **Librerías utilizadas para la programación del servidor** 

<u>Tabla 8.</u> _<u>Librerías utilizadas para programar el servidor en Python, autores y sus funciones</u>_ 

|**Librería**|**Versión**|**Autor**|**Función**|
|---|---|---|---|
|asgiref|3.6.0|Django<br>Software<br>Foundation|También llamado ASGI, provee funciones y clases que permite la<br>comunicación asincrónica en aplicaciones web y servidores, siendo<br>sucesor de WSGI|
|Django|4.1.4|Django<br>Software<br>Foundation|Utilizado para desarrollar aplicaciones web de forma rápida y<br>eficiente.|
|Channels|4.0.0|Django<br>Software<br>Foundation|Le otorga a Django la capacidad de manejar protocolos que requieren<br>una conexión persistente como, por ejemplo, websockets.|
|Channels-<br>redis|4.0.0|Django<br>Software<br>Foundation|Provee a Django Channels de channel layers que utilicen Redis como<br>almacén de respaldo|
|Daphne|4.0.0|Django<br>Software<br>Foundation|Dar soporte a Django Channels, implementando los protocolos<br>HTTP, HTTP2 y WebSocket a ASGI y ASGI-HTTP en el servidor|
|Smbus2|0.4.2|Karl-Petter<br>Lindegaard|Diseñado para ser el reemplazo de la librería smbus, conservando la<br>misma sintaxis. Utiliza las estructuras y uniones de I2C en mayor<br>medida que otras implementaciones puras de Python como lo hace<br>pysmbus.|
|Paho-mqtt|1.6.1|Roger Light|Provee una clase cliente que permite a las aplicaciones conectarse al<br>MQTT bróker, ya sea para publicar mensajes, o suscribirse a tópicos<br>para recibir mensajes publicados.|
|Django-<br>crispy-forms|1.14.0|Miguel Araujo|Estiliza los formularios de Django con la ayuda de paquetes de<br>plantillas incorporadas.|
|Django-<br>celery-beat|2.4.0|Asif<br>Saif<br>Uddin,<br>Ask<br>Solem|Extensión que permite almacenar cronogramas de tareas periódicas<br>en una base de datos. Las tareas periódicas pueden ser manejadas<br>desde la interfaz de Django Admin, donde se pueden crear, editar,<br>borrar y ejecutar.|
|Django-<br>redis|5.2.0|Andrei<br>Antoukh|Provee a Django de funciones que le permitan implementar un<br>sistema de caché con Redis|
|Celery|5.2.7|Ask Solem|En combinación con Django sirve para resolver la falta de asincronía<br>de la aplicación web y mejorar su rendimiento, permitiendo la<br>creación de tareas periódicas|



41 

|pytz|2023.3|Stuart Bishop|Permite cálculos precisos y multiplataformas de zonas horarias,<br>resolviendo el problema de los horarios ambiguos al final del horario<br>de verano|
|---|---|---|---|
|xlwt|1.3.0|John Machin|Generar hojas de cálculo compatibles con Microsoft Excel, versiones<br>95 y 2003.|
|Pillow|9.3.0|Jeffrey A. Clark|Pillow es una bifurcación de PIL que provee soporte al formato de<br>ficheros, permitiendo agregar y procesar imágenes desde el intérprete<br>de Python|
|Flower|1.2.0|Mher<br>Movsisyan|Provee información sobre el estatus de los workers y tareas de Celery|
|time|-|Estándar<br>de<br>Python|Proporcionar funciones relacionadas con el tiempo|
|datetime|-|Estándar<br>de<br>Python|Proporcionar clases para manipular fechas y horas|
|os|-|Estándar<br>de<br>Python|Provee una manera versátil de usar funcionalidades dependientes del<br>sistema operativo|
|json|-|Estándar<br>de<br>Python|Codificar y decodificar formato JSON|
|theading|-|Estándar<br>de<br>Python|Construir interfaces de hilado de alto nivel sobre el módulo de más<br>bajo nivel _thread.|
|logging|-|Estándar<br>de<br>Python|Provee funciones y clases para rastrear los eventos que ocurren<br>cuando se ejecuta el sistema|



42 

### **Ficheros importantes del proyecto** 

### **Manage.py** 

Como se puede ver en la figura 35, el script manage.py ayuda con la administración del sitio. Con él se inicializa el servidor desde la terminal de comandos, sin necesidad de instalar otras herramientas o softwares. 



<!-- Start of picture text -->
: 1D nts Ges ‘ ‘<br>import os<br>import sys<br>main():<br>a strative tas<br>9s environ. setdefault( [ ET G ULE’, 'S 5")<br>try:<br>from django.core.management import execute from_command_line<br>cept ImportError as exc:<br>‘aise ImportError(<br>1 r F A 1<br>) from exc<br>execute from_command_line(sys.argv)<br>if _name_ == i 3<br>main()<br><!-- End of picture text -->

_Figura 138._ **manage.py** 

### **Requirements.txt** 

Contiene las librerías y paquetes requeridos por el proyecto, facilitando su instalación. 

### **Celerybeat-schedule** 

Es la base de datos generada por la librería celery-beat, el cual guarda la lista de tareas que el worker de Celery ejecutará en ciertos intervalos de tiempo. 

43 

### **Db.sqlite3** 

Es la base de datos generada por Django, el cual guardará de manera local la información del servidor. 

### **Media** 

Esta carpeta contiene el siguiente archivo y subcarpeta: 

- default.png: Es la imagen predeterminada que se le coloca como avatar a los usuarios recién registrados en la aplicación web del servidor. 

- Profile_pics: Es una subcarpeta que contiene todas las imágenes utilizadas como avatar por los usuarios registrados en la aplicación web del servidor. 

44 

### **Aplicaciones del servidor** 

### **Server** 

Es el núcleo del servidor, un módulo creado por defecto al momento de crear el proyecto Django Server. En el momento de su creación el módulo “Server” trajo consigo una serie de archivos que fueron modificados durante el desarrollo del proyecto. 

### **__pycache__** 

Es una carpeta que contiene bytecode. Cuando se ejecuta un programa en Python, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Como programador, esta carpeta se ignora, ya que su única función en el sistema es hacer que el software se ejecute más rápido. 

### **static** 

Esta carpeta contiene los archivos estáticos, como: imágenes, archivos CSS y Javascript; los cuales serán cargados por diferentes aplicaciones del servidor para evitar cargar muchas cosas a la vez, estos archivos estáticos serán manejados por la función que ofrece Django: django.contrib.staticfiles. 

Entre los archivos estáticos que contiene esta carpeta se encuentran los siguientes: 

### **_Css_** 

- Backup.css: Define la apariencia visual del botón de “Exportar en Excel (.xls)” en backup.html, como el tamaño del botón, el tamaño y color de la letra, entre otros. También contiene las funciones necesarias para que cambie de color cuando el usuario pase el puntero del mouse por encima. 

- Dashboard.css: Define la apariencia visual de la tabla de control en lab_one_dashboard.html, como el tamaño de la letra, la separación entre las secciones, y la ubicación de cada sección e imagen en la plantilla. 

45 

- Gauge.css: Define la apariencia de los indicadores de nivel de temperatura, de humedad relativa y luminosidad en lab_one_dashboard.html; también, define la alineación del texto que se muestra debajo del indicador. 

- Historical.css: Define la apariencia visual de la página, como el tamaño y posición de las gráficas, de la caja de selección, la separación entre las secciones, y la ubicación de las mismas en la plantilla. 

- List.css: Define la apariencia visual de las listas y viñetas. Este archivo es utilizado por home.html y about.html 

- Main.css: Define la apariencia de algunos elementos que pertenecen a base.html. 

- Readings.css: Define la apariencia de las secciones en la tabla de control en lab_one_dashboard.html, así como el tamaño de la letra y posición del texto en cada sección. 

- Switch.css: Define la apariencia de los botones que controlan las luces y aires acondicionados en lab_one_dashboard.html, es decir, cómo se verán cuando se enciende o apagan. 

- Tables.css: Define la apariencia de las tablas en lab_two_dashboard.html, donde se muestra el registro histórico semanal. 

### **_Images_** 

- Favicon.ico: Es un ícono que la aplicación web mostrará en cada página del servidor. La imagen que se utilizó pertenece a la Open Automation Software. 

- Hum.png: Es una imagen del ícono de humedad relativa, utilizado por lab_one_dashboard.html. 

- Lab_map.png: Es una imagen que muestra el mapa del laboratorio de prototipos, utilizado por lab_one_dashboard.html. 

- Temp.png: Es una imagen del ícono de la temperatura, utilizado por lab_one_dashboard.html. 

46 

### **_Js_** 

- Historical.js: Añade las características interactivas de lab_two_dashboard.html para que funcione con websockets, y muestre el histórico de la semana de la temperatura, humedad relativa, luminosidad y presencia, junto a sus respectivas las gráficas. 

- Realtime.js: Añade las características interactivas de lab_one_dashboard.html para que funcione como un panel de control del laboratorio, usando el canal websockets para recibir la información desde consumers.py a tiempo real. 

### **_Pdf_** 

- SevidorIOT_ManualDeUsuario.pdf: Es un archivo PDF que contiene el manual de usuario, el cual es usado por about.html para mostrárselo a los usuarios registrados y administradores del servidor. 

- ServidorIOT_ManualTecnico.pdf: Es un archivo PDF que contiene el manual de usuario, el cual es usado por about.html para mostrárselo a los administradores del servidor. 

### **__init__.py** 

Es un método especial, reservado entre las clases de Python, que se llama cada vez que se instancia una clase. Se modificó para cargar la app Celery.py cada vez que Django se ejecute, tal y como se muestra en la figura 36. 



<!-- Start of picture text -->
from Server.celery import app as celery app<br>—all_- [ ]<br><!-- End of picture text -->

_Figura 139._ **Server - __init__.py** 

### **asgi.py** 

Como se puede ver en la figura 37, este archivo fue modificado específicamente para integrar las librerías Channels y Daphne a la aplicación, de modo que el servidor pueda trabajar con los protocolos de comunicación HTTP y Websockets. 

47 



<!-- Start of picture text -->
npor<br>m channels.routing import ProtocolTypeRouter, URLRouter<br>m channels.auth import AuthMiddlewarestack<br>m django.core.asgi import get_asgi_application<br>m iot.r mport ws_urlpatterns<br>-environ. setdefault ,<br>application = ProtocoltypeRouter<br>: get_asgi_application(),<br>:AuthMiddlewarestack{<br>URLRouter(ws_urlpatterns),<br><!-- End of picture text -->

_Figura 140._ **Server - asgi.py** 

48 

### **celery.py** 

Este archivo fue creado para ejecutar funciones de las librerías Celery y django-celerybeats. Contiene un cronograma de las tareas que se ejecutarán en el servidor y el tiempo en que serán ejecutadas. 

Siguiendo el tutorial del Red Eyed Coder Club en YouTube, se adaptó la configuración para definir la instancia Celery en el proyecto, tal y como se muestra en la figura 38. 



<!-- Start of picture text -->
mpor<br>from celery im ry<br>from celery.schedules import crontab<br>os environ. setdefault( TIN , )<br>app = Celery(‘Server")<br>app.config_from_object ( if , namespace: )<br>app-autodiscover_tasks()<br><!-- End of picture text -->

_Figura 141._ **Configuración de Celery.py** 

Siguiendo la guía oficial de Celery, posteriormente se instaló la librería Django-celery-beat para ejecutar una lista de tareas, o tasks, definidas en el archivo tasks.py a ciertos intervalos de tiempos, agregando la configuración que se muestra en la figura 39, en el archivo Celery.py. 

49 



<!-- Start of picture text -->
; se ced 2 ole ;<br>11 sec x 1, a<br>om one - 7 -<br>11 seri i hour=6, day_of_week= 1 vu, fr<br><!-- End of picture text -->

_Figura 142._ **Configuración del cronograma de tareas, en Celery.py del módulo Server** 

Donde los tasks que ejecutara el worker, definidos en tasks.py del módulo iot son los siguientes: 

- I2creader: Que se ejecutará cada 1 minuto. 

- Average_data: Que se ejecutará cada 1 hora, en el minuto 1. 

- Turn_on_AC: Que se ejecutará a las 6:50 am, de Lunes a Viernes. 

### **settings.py** 

Este archivo representa el núcleo del proyecto, contiene los ajustes del servidor y el registro de todas las aplicaciones/módulos que se crearon, así como la localización de los ficheros estáticos, los detalles de configuración de la base de datos, entre otros. A lo largo del desarrollo del servidor se fue modificando el código que viene por default en el fichero, agregando lo siguiente: 

- Se modificó LANGUAGE_CODE a “es-CL” para que el formato de las vistas del servidor se muestre en español. 

- En TIME_ZONE se modificó a “América/Santiago” para que tomara de internet la hora de Santiago de Chile cada vez que se ejecutara el servidor. 

- En INSTALLED_APPS se agregaron los módulos que se definieron en el diseño y que conforman el proyecto, también se agregó el nombre de las librerias instaladas. 

50 

- Se agregó las variables globales ASGI_APPLICATION y CHANNEL_LAYERS como parte de la implementación de las funciones de la librería Channels. 

- Se agregó las opciones de configuración de Celery: CELERY_TIMEZONE, CELERY_TASK_TRACK_STARTED, CELERY_TASK_TIME_LIMIT y CELERY_BROKER_URL. 

- Se agregó las rutas “/static” y “/media” para que el servidor pueda ubicar los ficheros correspondientes que se encuentran en estas rutas en cada ejecución. 

- Se agregaron variables globales que servirían para la configuración del servidor como cliente MQTT. 

### **urls.py** 

Contiene el esquema de URLs de la aplicación web que se muestra en la figura 40, diseñado para dar acceso al usuario a algunas páginas del servidor cuando se esté ejecutando, incluyendo la configuración necesaria para que Django pueda localizar la carpeta static, donde se encuentra los archivos estáticos y los avatares usados por los usuarios. 

51 



<!-- Start of picture text -->
from django.contrib import<br>from django.ur mport path, include<br>from django.contrib.auth import view auth _vien<br>rom django.conf import settings<br>from django.conf.urls.static import static<br>from usé mpor ews as user_view:<br>rom iot import views as iot_views<br>from iot.admin import server_site<br>urlpatterns =<br>path(‘admin/', server_site.urls),<br>path ,user_views.register,name= g a)<br>path( 'profile/',user_views.profile,name="server-profile'),<br>path(‘lab-one/',iot_views.lab_one, name="server-lab-one'),<br>path(‘lab-two/',iot_views.lab_two, name="server-lab-two"),<br>path("login/",auth_views.LoginView.as_view(template_name="login.| »name=" ser gin’),<br>path(‘logout/*,auth_views.LogoutView.as_view(template_name="logout.html'),name="server-logout"),<br>path('", include(‘web_platafc s‘)),<br>] + static(settings.STATIC_URL,document_root=settings.STATIC_ROOT)<br>if settings DEBUG:<br>urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)<br><!-- End of picture text -->

_Figura 143._ **Lista de urls creados en el módulo Server** 

Al buscar acceder a alguna de las URLs de la lista, se llama a la función correspondiente 

que se encuentra en views.py, que realiza el proceso correspondiente. 

### **wsgi.py** 

Django trabaja con un Web Server Gateway Interface, WSGI, el cual es un estándar que permite escribir programas que puedan comunicarse a través del protocolo HTTP, por lo tanto, existe para todos los servidores y aplicaciones web. 

El archivo estaba configurado como se muestra en la figura 41. 



<!-- Start of picture text -->
mport os<br>from django.core.wsgi import get_wsgi application<br>os.environ.setdefault( ANC SETTING ULE", )<br>application = get_wsgi_application()<br><!-- End of picture text -->

_Figura 144._ **Server - wsgi.py** 

52 

### **Iot** 

Este módulo contiene todos los archivos y funciones que fueron desarrollados para la implementación del Internet de la Cosas en el prototipo, a saber: La página /lab-one para mostrar las lecturas los sensores y el estado de los actuadores en tiempo real, la página /lab-two para mostrar el registro histórico de la temperatura, humedad relativa, luminosidad/horas de encendido y presencia semanal en el laboratorio de prototipo. Así como también, las funciones necesarias para la implementación del protocolo de comunicación I2C, y la implementación de la librería Channels para la comunicación websockets entre Cliente-Servidor. 

### **__pycache__** 

Es una carpeta que contiene bytecode. Cuando se ejecuta un programa en Python, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Como programador, esta carpeta se ignora, ya que su única función en el sistema es hacer que el software se ejecute más rápido. 

### **config/i2c.py** 

Config es una carpeta que contiene variables globales que sirven para la configuración de funciones que realizara el módulo iot, los cuales no fueron incluidas en settings.py 

En esta carpeta se encuentra el archivo i2c.py que, como se muestra en la figura 42, contiene las direcciones de los dispositivos (esclavos) que contiene el bus I2C y con los que el Raspberry Pi se comunicará, como Maestro. 



<!-- Start of picture text -->
12C_SLAVE1_ADDRESS = 11<br>12C_SLAVE2_ADDRESS = 12<br>12C_SLAVE3_ADDRESS = 13<br><!-- End of picture text -->

_Figura 145._ **iot - config/i2c.py** 

53 

### **Management/commands** 

Esta subcarpeta se creó para los comandos de Django i2cwriter, i2creader, mqtt_connect que sirvieron como base para desarrollar el servidor utilizando los protocolos de comunicación I2C y MQTT para enviar/recibir información de los dispositivos IoT del laboratorio de prototipos. 

**___pycache___** 

Es una carpeta que contiene bytecode. Cuando se ejecuta el programa, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Esta carpeta se ignora, ya que su función en el sistema es hacer que el software se ejecute más rápido. 

### **_I2creader.py_** 

Permite la comunicación entre el Raspberry Pi y el Arduino MEGA 2560 R3 que se encuentra conectado a los sensores, usando el protocolo de comunicación I2C; donde el Raspberry Pi es el Maestro y el Arduino es el Esclavo. Como se muestra en la figura 43, dentro del archivo se creó la clase Command, a la que se le añadió el método handle() que ejecutará un bucle donde: Limpiará la terminal con la función cls(), y ejecutará la función read_module() cada 10 segundos. A la función read_module() se pasa como referencia el valor de la variable global I2C_SLAVE1_ADDRESS, la cual contiene la dirección del Arduino: 11. 



<!-- Start of picture text -->
Command (BaseCommand) :<br>+ »)<br>lef handle(self, *args, **kwargs):<br>ry:<br>print( t )<br>hile True:<br>cls()<br>| = read_module(I2C_SLAVE1_ADDRESS)<br>time.sleep(60)<br>except KeyboardInterrupt:<br>print ( J i)<br><!-- End of picture text -->

_Figura 146._ **Clase Command de i2creader.py** 

54 

La función read_module() permite al Raspberry Pi conectarse al esclavo 11 y recibir la lectura de los sensores conectados a ese módulo en un bloque de datos en byte, para luego imprimir en pantalla la información de manera ordenada. Para ejecutar el comando i2creader, se escribe en la terminal de Visual Studio Code lo siguiente: 

~~ee~~ <mark>`python manage.py i2creader`</mark> 

### **_I2cwriter.py_** 

Permite la comunicación entre el Raspberry Pi y el Arduino UNO que se encuentra conectado a los actuadores usando el protocolo I2C, siendo el Raspberry Pi el maestro y el Arduino el esclavo. Como se muestra en la figura 44, dentro de i2cwriter.py se creó la clase Command, a la que se le añadió el método handle() que ejecutará un bucle donde: Limpiará la pantalla con la función cls() y permitirá al usuario ingresar el número asociado al evento que se desea llevar a cabo, para que de último se ejecuté la función write_module() y haya que esperar 10 segundos. A la función write_module() se pasa como referencia el valor de la variable global o I2C_SLAVE2_ADDRESS que contienen la dirección: 12. 



<!-- Start of picture text -->
1 Command (BaseCommand):<br>f handle(self, *args, ** ):<br>ry:<br>hile :<br>cls()<br>flag = Truc<br>while (flag):<br>print(” 3)<br>print("Ac (3-4)")<br>relaySelect = int(input("opcion ))<br>f ((relayselect > 0) relaySelect < 5)):<br>status = int(input("E r "))<br>if ((status == 1) or (status==0)):<br>message = (relaySelect * 10) + status<br>write_module(I2C_SLAVE2_ADDRESS, message)<br>flag = F<br>time.sleep(10)<br>except KeyboardInterrupt:<br>print("La comunicacion se detuvo")<br><!-- End of picture text -->

_Figura 147._ **Clase Command de i2Cwriter.py** 

55 

Como se muestra en la figura 45, la función write_module() permite al Raspberry Pi conectarse al esclavo 12 con la librería smbus2, y enviar un valor entero en bytes al Arduino correspondiente. 



<!-- Start of picture text -->
import os<br>import smbus2 as smbu<br>import time<br>from django.core.management.base import BaseCommani<br>DEVICE_BUS = 1<br>I12C_SLAVE2_ADDRESS = 12<br>12Cbus = smbus.SMBus(1)<br>def cls():<br>os.system(‘cls* if os.name=="nt' else ‘clear’)<br>ief write_module(slave_addressmessage) :<br>ith smbus.SMBus(1) as I2Cbus:<br>try:<br>I2Cbus.write_byte_data(slave_address, @, message)<br>except Exception as e:<br>print("Error remoto i/o")<br>print(e)<br><!-- End of picture text -->

_Figura 148._ **iot - Funciones cls y write_module de i2cwriter.py** 

Para ejecutar i2cwriter.py, se escribe en la terminal de Visual Studio Code lo siguiente: 

```
python manage.py i2cwriter
```

### **_mqtt_connect.py_** 

Permite la comunicación entre el Raspberry Pi y el ESP8266 NodeMCU conectado a los sensores, a través del protocolo MQTT. Como se muestra en la figura 46, dentro del archivo se creó la clase Command, donde se añadió el método handle() que ejecutará un bucle donde: Se crea una instancia client, se intenta conectar al bróker MQTT con la función connect_mqtt(), luego se 

56 

llama a la función loop_start() para crear un hilo, que llama un método loop, o bucle, cada cierto tiempo sin ser bloqueado por los otros procesos que se ejecuten en paralelo en Django. En el loop se limpiará la pantalla, se imprimirá el número de lectura realizado para comprobar que no se repiten mensajes, y se ejecutará la función subscribe() que permite suscribirse a unos tópicos definidos e imprime los mensajes recibidos por el bróker MQTT. De último, el loop se detendrá por 10 segundos antes de volver a ejecutarse. 



<!-- Start of picture text -->
ass Command (BaseCommand):<br>help= (‘Muestra la lecturas de los sensores<br>1 a)<br>+ handle(self, *args, ** ):<br>cont = 1<br>ry:<br>client = connect_mqtt()<br>client.loop_start()<br>print(“Conect we")<br>hile es)<br>cls()<br>print("Lect + str(cont) + ":")<br>subscribe(client)<br>cont= cont + 1<br>sleep(10)<br>except KeyboardInterrupt:<br>print(" ¢ e )<br><!-- End of picture text -->

_Figura 149._ **Clase Command de mqtt_connect.py** 

Para ejecutar mqtt_connect.py, se escribe en la terminal de Visual Studio Code lo siguiente: 

~~eC~~ <mark>`python manage.py mqtt_connect.py`</mark> 

### **Migrations** 

Esta carpeta sirve para que Django procese los cambios que se han realizado a los Modelos que se encuentran en el esquema de la base de datos del proyecto, como agregar campos, borrar modelos, entre otros. Esta carpeta se crea de manera automática luego de que se ejecuta el comando makemigrations, y crea nuevos archivos con el mismo comando. Las migraciones de esta carpeta se aplican en el proyecto con el comando migrate. 

57 

### **Templates** 

Esta carpeta se crea para que Django pueda generar Vistas de manera dinámica. Por lo tanto, esta carpeta contiene las plantillas HTML del módulo iot, a saber: 

- Lab_one_dashboard.html: Archivo que sirve para generar la vista que muestra un panel de control del laboratorio de prototipos, que permitirá visualizar la temperatura interior y exterior, la humedad relativa interior y exterior, los niveles de temperatura y humedad relativa, los niveles de luminosidad, el estado del seguro de la puerta, las luces y aire acondicionados; detectar presencia y fugas; y encender/apagar las luces y aire acondicionados. 

- Lab_two_dashboard.html: Archivo que sirve para generar la vista que mostrará los registros históricos de la temperatura, humedad relativa, luminosidad/horas de encendido y presencia semanal en el laboratorio de protipos. 

### **__init__.py** 

Es un archivo usado para indicar que el directorio presente es un paquete de Python, volviendo posible la importación de módulos a sub-paquetes del directorio en el que se encuentra. También puede usarse para definir código de inicialización o variables que se ejecuten cuando el paquete sea importado. 

### **admin.py** 

Este archivo usa los modelos que se codificaron en models.py del módulo iot para construir automáticamente dentro del Área Administrativa un sitio que se pueda usar para crear, consultar, actualizar y borrar registros. Todo esto con la finalidad de ahorrar tiempo de desarrollo y poder probar los modelos para verificar que los datos son correctos. 

En este archivo también se personalizó el Área Administrativa para que en la cabecera mostrara el nombre “Servidor IoT – Area Administrativa” y mostrará una lista de modelos específicos en el sitio (ver en la figura 47). 

58 



<!-- Start of picture text -->
from django.contrib import admin<br>from django.contrib.auth import<br>rom .models import Interior, Promedio_temperatura, Prome uminosidad, Promedio presencia, Promedio_humedad<br>ass<br>ServerAdminArea(admin.AdminSite):<br>site_header = I r 2<br>site title = d<br>index title = oratori<br>server_site = ServerAdminArea(name="ServerAdmin’)<br>server_site.register(Temperatura_exterior)<br>server_site.register(Humedad_exterior)<br>server_site.register(Humedad_piso)<br>server_site.register(Interior)<br>server_site.register(User)<br>server_site.register (Group)<br>server_site.register(Promedio temperatura)<br>server_site.register(Promedio_humedad)<br>server_site.register(Promedio_luminosidad)<br>server_site.register(Promedio presencia)<br><!-- End of picture text -->

_Figura 150._ **iot - admin.py** 

### **apps.py** 

Como se puede ver en la figura 48, este archivo sirve para realizar configuraciones en la aplicación “iot”, a saber: Incluir los modelos creados en models.py dentro de la base de datos, que pueden ser accedidos desde el Área Administrativa en la sección “iot” e implementar las configuraciones realizadas en admin.py en el sitio. 



<!-- Start of picture text -->
from django.apps import AppConfig<br>from django.contrib.admin.apps import AdminConfig<br>ServerAdminConfig(AdminConfig):<br>default_site = ‘iot.admin.Ser i<br>IotConfig(AppConfig):<br>default_auto_field = ee) -B utoF<br>name = '<br><!-- End of picture text -->

_Figura 151._ **iot - apps.py** 

59 

### **consumers.py** 

Haciendo uso de la librería Channels, en este archivo se encuentran los Consumers que manejaran los canales websocket del servidor. Un consumer es una abstracción de un canal o channel en forma de clase, esta clase implementa métodos que se encargarán de manejar los eventos de los usuarios. 

Para el desarrollo del proyecto se crearon dos consumidores: 

- Lab2Consumer: Es un consumidor, que hereda la clase AsyncWebsocketConsumer, la cual funciona igual que una clase WebsocketConsumer pero de manera asíncrona. Está enlazado con lab_one_dashboard.html. A diferencia de un WebsocketConsumer, sus métodos: connect(), disconnect() y receive() estan definidos de manera asíncrona, con la sintáxis def async; para llamar funciones síncronas desde esta clase se usa la función await. Entre métodos asíncronos que conforman el consumidor podemos encontrar: 

Connect(): Evento que se ejecutará cuando un usuario se conecte al canal websockets. Con la función self.accept() acepta la conexión, solo si se da la condición de que el usuario haya iniciado sesión previamente en la aplicación web. Luego de conectarse exitosamente,  el usuario es agregado a un channel_layer definido como “lab_event”. Seguidamente, se llevan a cabo los siguientes procesos para que al momento de conectarse al URL “lab-one/”, la vista no se encuentre vacía: 

- Intentar llamar al método get_lab_data() definido en la clase, con el fin de obtener el último elemento registrado en la tabla “Interior” en la base de datos, con el cual crea un objeto en formato JSON para poder enviarlo como mensaje por el canal websockets con el método send(). 

- Intentar llamar al método get_temp_ext_data() definido en la clase, con el fin de obtener el último elemento registrado en la tabla Temperatura_exterior en la base de datos, con el cual crea un objeto en formato JSON para poder enviarlo como mensaje por el canal websockets con el método send(). 

60 

- Intentar llamar al método get_hum_ext_data() definido en la clase, con el fin de obtener el último elemento registrado en la tabla Humedad_exterior en la base de datos, con el cual crea un objeto en formato JSON para poder enviarlo como mensaje por el canal websockets con el método send(). 

- Y de último, intentar llamar al método get_hum_floor_data() definido en la clase, con el fin de obtener el último elemento registrado en la tabla Humedad_piso en la base de datos, con el cual crea un objeto en formato JSON para poder enviarlo como mensaje por el canal websockets con el método send(). 

Disconnect(): Desconecta al usuario del channel_layer “lab_event”. 

Receive(): Se ejecuta cuando un websocket envía información. Los mensajes recibidos estarán dentro de un objeto JSON, por lo que se utilizara el método json.loads() de la librería Json para convertir la cadena en un diccionario/registro de Python, guardando la información en una variable llamada text_data_json. El registro text_data_json estará formado por los siguientes elementos: message y type; los cuales seran guardados en unas variables individuales llamadas message y type_message respectivamente. Si la variable type_message es igual a “action_event” se llamará a la función write_module del archivo i2cwriter.py que definimos anteriormente, pasando por referencia la dirección 12 (que pertenece al Arduino UNO R3) y message (que será la acción o evento que llevará a cabo el Arduino UNO R3) 

El mapeo objeto-relacional, ORM, de Django es una pieza de código síncrona, por lo que para aceder a la base de datos desde el consumidor Lab2Consumer fue necesario crear un grupo de métodos que usaran la función database_sync_to_async decorator, tal y como se muetra de ejemplo en la figura 49, donde la función síncrona get_temp_ext_data() devuelve el contenido más reciente registrado en la tabla Temperatura_exterior. 



<!-- Start of picture text -->
@database_sync_to_async<br>get_temp_ext_data(self):<br>myData mperatu terior. objects.order_by/( I 3"). last()<br>eturn myData<br><!-- End of picture text -->

_Figura 152._ **Acceso a la tabla Temperatura_exterior de la base de datos con Channels** 

61 

Lo mismo se aplicó a los métodos síncronos: get_lab_data(), get_hum_ext_data() y get_hum_floor_data(); los cuales manejan diferentes tablas de la base de datos y devuelven el último valor registrado. 

Entre los diferentes métodos que puede ejecutar cada consumer que se conecte al Channel_layer, donde enviará un tipo de mensaje a través del canal websockets, tenemos los que se definen en la tabla 6. 

<u>Tabla 9.</u> _<u>Tipos de mensajes que pueden enviarse por el Channel_layer lab_events</u>_ 

|**Tipos de mensaje**|**Mensaje**|
|---|---|
|Update_lab_data()|Contiene la última información agregada a la tabla Interior de la base de datos, enviada<br>desde el consumidor en formato JSON|
|Update_temp_ext()|Contiene la última información agregada a la Temperatura_exterior de la base de datos,<br>enviada desde el consumidor en formato JSON|
|Update_hum_ext()|Contiene la última información agregada a la Humedad_exterior de la base de datos enviada<br>desde consumidor en formato JSON|
|Update_hum_floor()|Contiene la última información agregada a la Humedad_piso de la base de datos enviada<br>desde consumidor en formato JSON|
|Action_event()|Contiene el mensaje enviado desde historical.js, por un usuario que se haya conectado al<br>grupo lab_event|



- RecordConsumer: Es un consumidor que hereda la clase WebsocketConsumer. Esta enlazado 

con lab-two-dashboard.html. Funciona de manera síncrona y sus métodos principales son: 

Connect(): Evento que se ejecutará cuando un usuario se conecte al canal websockets. Con la función self.accept() acepta la conexión, solo si se da la condición de que el usuario haya iniciado sesión previamente en la aplicación web. 

Disconnect(): Desconecta al usuario del websocket. 

Receive(): Recibe los mensajes del websocket, donde message es objeto JSON que al ser decifrado contiene un número entre 0 y 3; la cual pasa por parámetro como la variable option junto con el número 0 como la variable week, que representa la semana actual, para ejecutar una función llamada get_previousweek_data(). 

62 

Get_previous_week_data(): Dependiendo del valor de la variable “option”, extrae información de un campo en específico de la tabla Interior, que fue registrada en la semana entre las 7 am y 7 pm en la base de datos. Si la opción es 0, devuelve la temperatura; si la opción es 1, devuelve la humedad relativa; si la opción es 2, devuelve la luminosidad; y si la opción es 3, devuelve la presencia. 

Tal y como se muestra de ejemplo en la figura 50, se escribió el siguiente código para obtener la temperatura del laboratorio registrada en la semana, calculando el rango de fechas entre lunes y viernes con la ayuda de funciones de la librería datetime; y usar la función filter() de Django para extraer de la tabla las lecturas que fueron tomadas entre las 7 am y 7 pm. Para guardar el resultado en un arreglo vacío definido como myData[]. 



<!-- Start of picture text -->
get_previousweek data(self, option, week):<br>current_date = datetime. today()<br>current_weekday = current_date.weekday()<br>past_days = current_weekday + week<br>previous week = current_date - timedelta(days=past_days)<br>end_of_week = previous week + tin days=5)<br>date_begin = previous_week.date()<br>date_end = end_of_week.date()<br>mybata = []<br>(option==0;<br>readings = Pr mperatura.objects.filter(dia_inicio_range=[date_begin,date_end<br>(readings)<br>reading_info in readings:<br>((reading_info.dia_inicio.hour >= reading info.dia_inicio.hour < 19)):<br>datainfo =<br>: str(reading_info.temp),<br>: readinginfo.diainicio. strftime ,<br>: str(reading_info.dia_inicio.weekday()),<br>reading_info.dia_inicio.strftime ,<br>: reading info.dia_fin.strftime<br>myData append (dataInfo<br><!-- End of picture text -->

_Figura 153._ **Código de la función get_previousweek_data() para obtener la temperatura de lunes a viernes, de 7am a 7pm** 

Seguidamente, tal y como se ve en la figura 64, el arreglo myData sería guardado en un objeto JSON que sería enviado por el canal de websockets. 

63 



<!-- Start of picture text -->
self .send(text_data=json .dumps<br>r : option,<br>: week // 7,<br>t n': date_begin. strftime('%d/%m/%Y"),<br>t : date_end.strftime( ")s<br>age’: myData}))<br><!-- End of picture text -->

_Figura 154._ **Mensaje enviado por el URL ws/lab-two/** 

### **custom_datetime.py** 

Este archivo se creó para comprobar el funcionamiento de la librería datetime y realizar pruebas, específicamente sus funciones date, timedelta y datetime. Codificando funciones con para imprimir en la terminal la fecha de hoy, de ayer, de hace una semana, el tiempo de hace una hora, el dia de la semana en el calendario, entre otros. 

La sentencia if __name__ == "__main__": nos permite manejar el código, ejecutándolo individualmente desde la terminal, sin la necesidad de ejecutar el servidor. 

### **models.py** 

En este archivo están definidos los modelos de la base de datos, utilizados por la aplicación “iot”, a saber: 

- Temperatura_exterior: Se encargará de guardar valor de la temperatura exterior que recibe del ESP8266 NodeMCU en caracteres, con la fecha-hora en la que se guardó la lectura. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leída – Hora: minutos leída – Temperatura - C 

- Humedad_exterior: Se encargará de guardar el valor de la humedad exterior que recibe del ESP8266 NodeMCU en caracteres, con la fecha-hora en la que se guardó la lectura. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leida – Hora: minutos leída – Humedad relativa - % 

64 

- Humedad_piso: Se encargará de guardar cada 5 minutos el valor de la humedad de piso que recibe del ESP8266 NodeMCU en caracteres, donde los valores variaran entre “0” y “1”, donde “0” representa el estado “seco” y 1 representa el estado “mojado”, con la fecha-hora en la que se guardó la lectura. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leída – Hora: minutos leída – Humedad de piso (“Seco” si es “0” o “Mojado” si es “1”, “Error” si no es ninguno de los dos anteriores) 

- Interior: Se encargara de guardar las variables que recibe del Arduino MEGA 2560, tales como: temperatura, humedad relativa, presencia (que varía entre 1 y 0, donde 1 significa que hubo presencia y 0 que no hubo presencia), luminosidad de la sección 1 y de la sección 2 donde valores entre 0 y 255, donde entre mayor sea el valor menos luminosidad hay), estado del seguro de la puerta (que varía entre 1 y 0, donde 1 significa que está bloqueado y 0 desbloqueado), estado del aire acondicionado 1 y el aire acondicionado 2 (que varía entre 1 y 0, donde 1 significa encendido y 0 significa apagado) y la fecha-hora que el Raspberry Pi recibió la información. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leída – Hora: minutos leída – Temperatura – C - Humedad relativa - % - Presencia 

- Promedio_temperatura: Se encarga de guardar el resultado del promedio de temperatura de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. Por ejemplo: 18 °C, de 8:00 am a 9:00 am. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leida – Hora: minutos inicio – Hora: minutos fin - Temperatura - C 

- Promedio_humedad: Se encarga de guardar el resultado del promedio de temperatura de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. Por ejemplo: 68%, de 8:00 am a 9:00 am. Cuando se ingrese al sitio Área administrativa, se mostrará los registros 

65 

ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leida – Hora:minutos inicio – Hora:minutos fin – Humedad relativa - % 

- Promedio_presencia: Se encarga de guardar el resultado del promedio de presencia de un grupo de muestras; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. Por ejemplo: 1 (Hay presencia), de 8:00 am a 9:00 am. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el más reciente hasta el más viejo, mostrando el día de la semana – Fecha leída – Hora: minutos inicio – Hora: minutos fin – Presencia (“Si” si el valor es “1”, “No” si el valor es “0”, “Error” si no es ninguno de los dos anteriores). 

• Promedio_luminosidad: Se encarga de guardar el resultado del promedio de luminosidad de un grupo de muestras y el objeto/lugar de donde se tomaron; donde dia_inicio representa la fecha-hora que se inició a tomar las lecturas y el dia_fin representa fecha-hora que se terminó de tomar las lecturas. Por ejemplo: Sección 1, 143, de 8:00 am a 9:00 am. Cuando se ingrese al sitio Área administrativa, se mostrará los registros ordenados desde el mas reciente hasta el más viejo, mostrando el día de la semana – Fecha leida – Sección - Hora: minutos inicio – Hora: minutos fin – valor de la luminosidad 

También se hace uso de la función que ofrece Django: timezone; para registrar y mostrar en la zona administrativa la fecha-hora registrada según la zona horaria. 

### **routing.py** 

En este archivo se enlaza los consumers creados en consumers.py con los websockets, tal y como se muestra en la figura 65. Donde todas las conexiones a la url ws://127.0.0.1:8000/ws/labone/ creararán una instancia de Lab2Consumer; y donde todas las conexiones a la url ws:// 127.0.0.1:8000/ws/lab-two/ crearán una instancia de RecordConsumer. 

Tal y como podemos ver en la figura 52, es importante que mientras se enruta los consumidores, se llama al método as_asgi(), ya que esto retornará un ASGI wrapper application que instanciara un nuevo consumidor por cada conexión; que seria similar al método de Django as_view(), el cual juega un rol similar para las instancias pre-request o las vistas basadas en clases. 

66 



<!-- Start of picture text -->
rom django.urls import re_path<br>from .consumers import Lab2Consumer, RecordConsume:<br>ws_urlpatterns = [<br>re_path( ,Lab2Consumer.as_asgi ,<br>re_path( aR dconsumer.as_asgi()),<br>]<br><!-- End of picture text -->

_Figura 155._ **iot - routing.py** 

### **tasks.py** 

Este archivo contiene las tareas, o tasks, que realizará el worker de Celery. Los tasks que ejecutara el worker, definidos en tasks.py del módulo iot son los siguientes: 

- I2creader: Intenta comunicarse con esclavo 11, el Arduino MEGA2560 R3, para recibir la lectura de los sensores y guardarla en la base de datos; con una función definida dentro de tasks.py llamada save(), a la que se pasa la información como un objeto JSON. La función i2creader() se ejecuta cada 1 minuto. 

• Average_data: Calcula el promedio de la temperatura, humedad relativa, luminosidad y presencia para guardarla en las tablas Promedio_temperatura, Promedio_humedad, Promedio_luminosidad y Promedio_presencia. Para ello, se extrae la información que fue guardada en la tabla Interior entre la hora anterior actual, en el minuto 0, y la hora actual en el minuto 0, 59 segundos y 59 milisegundos. Como por ejemplo: 14:00:00:00 – 15:00:59:59. Si se encontraron resultados, se separa los resultados en 4 arreglos: temperature, humidity, lum1, lum2 y mov; para entonces calcula los promedios de manera separada, guardarlas en su respectiva tabla y de último borrar la información de la tabla Interior, cuyo campo dia_hora_leida sea menor a la hora actual. La función average_data() se ejecuta cada 1 hora, en el minuto 1. 

- Turn_on_AC: Utiliza la función write_module() declarada en i2cwriter.py para enviar dos mensajes a la dirección del esclavo 12, el Arduino UNO, para indicarle que debe encender los aires acondicionados. La función turn_on_AC() se ejecuta a las 6:50 am, de Lunes a Viernes. 

Dentro del archivo task.py se declararon unos decorator: receiver(post_save, sender), que permite a algunas funciones ejecutarse en el momento que una tabla dentro de la base de datos 

67 

recibe información nueva. También se declaró una variable global llamada channel_layer, que recibe la función get_channel_layer() de la librería Channels, permitiendo enviar mensajes a una channel_layer fuera del consumer. Entre las funciones que fueron declaradas con el decorator mencionado se encuentran: 

- Event_post_add: Cuando ingresa nueva información a la tabla Interior (Lab) de la base de datos, extrae el último dato registrado para enviarla en un objeto JSON al channel layer lab_events, como se muestra en la figura 53. 



<!-- Start of picture text -->
@receiver(post_save, sender=Lab)<br>lef event_post_add( ; » created, **kwargs):<br>f created:<br>print ("D: 5)<br>db_data = Lab.objects.order_by(‘di leida’).last()<br>some_datetime = db_data.dia_hora_leida<br>iso_datetime = some_datetime.isoformat()<br>dict_data = {<br>pe’: ate_lab_data’,<br>: db_data.temp,<br>: db_data-hum,<br>: db_data.presencia,<br>: db_data.lum1,<br>: db_data.lum 2,<br>: db_data.seg_puerta,<br>1‘: db_data.ac_1,<br>: db data.ac_2,<br>: iso_datetime<br>async_to_sync(channel_layer.group_send) ( ,dict_data)<br><!-- End of picture text -->

_Figura 156._ **Función event_post_add() del archivo task.py del módulo iot** 

- Event_post_temp_ext: Cuando ingresa nueva información a la tabla Temperatura_exterior de la base de datos, extrae el último dato registrado para enviarla en un objeto JSON al channel layer lab_events. 

- Event_post_hum_ext: Cuando ingresa nueva información a la tabla Humedad_exterior de la base de datos, extrae el último dato registrado para enviarla en un objeto JSON al channel layer lab_events. 

68 

- Event_post_hum_floor: Cuando ingresa nueva información a la tabla Humedad_piso de la base de datos, extrae el último dato registrado para enviarla en un objeto JSON al channel layer lab_events. 

### **tests.py** 

Es un archivo creado automáticamente por Django después de crear la aplicación, que sirve para realizar pruebas adicionales automatizadas. 

### **Urls.py** 

Contiene el esquema de URLs de la aplicación “iot”, que se muestra en la figura 54, diseñado para dar acceso al usuario a las páginas que se encuentran en la carpeta templates: lab_one_dashboard.html y lab_two_dashboard.html, cuando el servidor se esté ejecutando. 



<!-- Start of picture text -->
from django.urls import path<br>from. import views<br>urlpatterns = [<br>path(‘lab-one/',views.lab one, name='server-lab-one"),<br>path( »Views.lab_two, name= r yo"),<br>]<br><!-- End of picture text -->

_Figura 157._ **iot - urls.py** 

### **Views.py** 

Este archivo contiene funciones que se encargan de recibir la web request del usuario y retornar una web response en forma de contenido HTML. Tal y como se ve en la figura 55, entre las funciones que podemos encontrar en este archivo se encuentra: 

lab_one: Posee un decorador @login_required que pasa por argumento una señal (signal) que contiene la url al que el usuario accederá si no ha iniciado sesión con su cuenta: “login/”. Si el usuario ha iniciado sesión, tendrá acceso a la página lab_one_dashboard.html. 

lab_two: Posee un decorador @login_required que pasa por argumento una señal (signal) que contiene la url al que el usuario accederá si no ha iniciado sesión con su cuenta: “login/”. Si el usuario ha iniciado sesión, tendrá acceso a la página lab_two_dashboard.html. 

69 



<!-- Start of picture text -->
from django.shortcuts import render<br>from django.contrib.auth.decorators import login required<br>@login_required(login_url='/login/")<br>ef lab_one(request) :<br>return render(request, ‘lab_one_dashboard.html*,{*title’: ‘Laboratorio o'})<br>@loginrequired(login url='/login/")<br>ef lab_two(request):<br>return render(request, ‘lab_two_dashi "5 3 i })<br><!-- End of picture text -->

_Figura 158._ **iot - views.py** 

### **Mqtt** 

Este módulo contiene todos los archivos y funciones que fueron desarrollados para la implementación del protocolo de comunicación MQTT en el prototipo. 

**__pycache__** 

Es una carpeta que contiene bytecode. Cuando se ejecuta un programa en Python, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Como programador, esta carpeta se ignora, ya que su única función en el sistema es hacer que el software se ejecute más rápido. 

### **Migrations** 

Esta carpeta sirve para que Django procese los cambios que se han realizado a los Modelos que se encuentran en el esquema de la base de datos del proyecto, como agregar campos, borrar modelos, entre otros. Esta carpeta se crea de manera automática luego de que se ejecuta el comando makemigrations, y crea nuevos archivos con el mismo comando. Las migraciones de esta carpeta se aplican en el proyecto con el comando migrate. 

**__init__.py** 

Es un archivo usado para indicar que el directorio presente es un paquete de Python, volviendo posible la importación de módulos a sub-paquetes del directorio en el que se encuentra. También puede usarse para definir código de inicialización o variables que se ejecuten cuando el paquete sea importado. 

70 

### **Admin.py** 

Este archivo usa los modelos que sean codificados en models.py del módulo “mqtt” para construir automáticamente dentro del Área Administrativa un sitio que se pueda usar para crear, consultar, actualizar y borrar registros. Todo esto con la finalidad de ahorrar tiempo de desarrollo y poder probar los modelos para verificar que los datos son correctos. 

### **Apps.py** 

Este archivo contiene las funciones necesarias para implementar el protocolo MQTT como un background thread, cada vez que se ejecuta el servidor. 

Primero, existe una clase llamada MqttClient(), que inicia un background thread cuando el servidor está en ejecución. A esta clase se le pasa por parámetros la IP del broker 192.168.100.18, el puerto 1883 y un arreglo que contiene los tópicos a los que se suscribirá el servidor: “esp8266/temperature”, “esp8266/humidity”, “esp8266/water”. Para que la clase conservara sus atributos más importantes a lo largo de la ejecución del servidor se utilizó la función super de Python. 

Al iniciar el hilo de la clase MqttClient() se ejecuta el método connect_to_broker(), que configura la instancia cliente para conectarse al bróker de manera asíncrona, teniendo acceso a este con el usuario “rasp-broker” y la clave “ucab*ucab”, seguidamente, cuando ya esté conectado, se subscriba a los tópicos definidos. 

De esta forma, mientras el servidor estuviese en ejecución, la aplicación web también estaría conectándose al bróker de manera asíncrona. Este proceso se realiza como un background thread en Django, con el fin de que el servidor pueda ejecutar sus otras funciones sin esperar a que las tareas asociadas a MQTT terminen. 

Cada vez que el servidor recibiera un mensaje de los tópicos, la información sería guardada en la base de datos en el modelo correspondiente, junto con la fecha y hora en la que se recibió el mensaje, tal y como se muestra en la tabla 7. 

71 

<u>Tabla 10.</u> _<u>Tópicos y modelo de la base de datos asociada</u>_ 

|**Tópico**|**Modelo de la base de datos asociada**|
|---|---|
|esp8266/temperature|Temperatura_exterior|
|esp8266/humidity|Humedad_exterior|
|esp8266/water|Humedad_piso|



Tras guardar el mensaje recibido desde el bróker en la base de datos, el mensaje anterior a este es borrado de la base de datos; pues solo se necesita conocer el estado más reciente de la temperatura y la humedad relativa exterior cada vez, y si en el momento el piso este húmedo o no. 

### **Models.py** 

En este archivo se definen los modelos de la base de datos, utilizados por la aplicación “mqtt”. 

### **Tests.py** 

Es un archivo creado automáticamente por Django después de crear la aplicación, que sirve para realizar pruebas adicionales automatizadas. 

### **Views.py** 

Es un archivo que contiene funciones que se encargan de recibir la web request del usuario y retornar una web response en forma de contenido HTML. 

### **Users** 

En este onde se encuentra en código Python las funciones necesarias para generar el formulario que permite el registro de usuarios en el servidor. 

### **__pycache__** 

Es una carpeta que contiene bytecode. Cuando se ejecuta un programa en Python, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Como programador, esta carpeta se ignora, ya que su única función en el sistema es hacer que el software se ejecute más rápido. 

72 

### **Migrations** 

Esta carpeta sirve para que Django procese los cambios que se han realizado a los Modelos que se encuentran en el esquema de la base de datos del proyecto, como agregar campos, borrar modelos, entre otros. Esta carpeta se crea de manera automática luego de que se ejecuta el comando makemigrations, y crea nuevos archivos con el mismo comando. Las migraciones de esta carpeta se aplican en el proyecto con el comando migrate. 

### **Templates** 

Esta carpeta se crea para que Django pueda generar Vistas de manera dinámica. Por lo tanto, esta carpeta contiene las plantillas HTML del módulo users, a saber: 

- Login.html: Archivo que genera la vista con el formulario que permitirá al usuario iniciar sesión en la aplicación web. 

- Logout.html: Archivo que genera una vista cuando el usuario registrado ha cerrado sesión en la aplicación web. 

- Profile.html: Archivo que genera la vista con el formulario que contiene los datos del usuario que ha iniciado sesión. 

- Register.html: Archivo que genera la vista con el formulario que permitirá el registro de usuario en la aplicación web. 

### **__init__.py** 

Es un archivo usado para indicar que el directorio presente es un paquete de Python, volviendo posible la importación de módulos a sub-paquetes del directorio en el que se encuentra. También puede usarse para definir código de inicialización o variables que se ejecuten cuando el paquete sea importado. 

### **Admin.py** 

Como se muestra en la figura 56, este archivo usa el modelo que se codificó en models.py del módulo users para construir automáticamente dentro del Área Administrativa un sitio que se 

73 

pueda usar para crear, consultar, actualizar y borrar registros. Todo esto con la finalidad de ahorrar tiempo de desarrollo y poder probar los modelos para verificar que los datos son correctos. 



<!-- Start of picture text -->
from django.contrib import<br>from .models import Perfil<br>from iot.admin import server_site<br>server_site.register(Perfil)<br><!-- End of picture text -->

_Figura 159._ **users - admin.py** 

### **Apps.py** 

Como se puede ver en la figura 57, este archivo sirve para realizar configuraciones en la aplicación “users”, a saber: Incluir los modelos creados en models.py dentro de la base de datos, que pueden ser accedidos desde el Área Administrativa en la sección “users” e implementar las configuraciones realizadas en admin.py en el sitio. Además, cuando se cargue la aplicación cargará las funciones creadas en signals.py. 



<!-- Start of picture text -->
rom django.apps import AppConfig<br>default_auto_field = ‘dj bem gAt<br>name =<br>£ ready(self):<br>nport<br><!-- End of picture text -->

_Figura 160._ **users - apps.py** 

### **Forms.py** 

Como se muestra en la figura 58, ste archivo contiene las clases UserRegisterForm y UserUpdateForm, que representan la lógica de los formularios de “Registrar” y “Editar perfil” que llena el usuario para dichos procesos, que incluye datos como: username, email, password1, password2, y avatar. Para facilitar el proceso de creación de usuario y validación de los campos, se importó el formulario de creación de usuario que viene en Django: UserCreationForm; también se importó la clase Form de Django para la creación del formulario, que contiene atributos con predefinidos, tales como: email. 

74 



<!-- Start of picture text -->
rom django import forms<br>rom -contrib.auth.models importu:<br>rom django.contrib.auth. impor rCreationForm<br>rom .models impor<br>email rRegisterForm(UserCreationForm)= forms. tmailField() :<br>model = user<br>fields = [ B 5 ><br>rupdateForm(forms Model Form):<br>email = forms.£mailField()<br>model = User<br>fields = [ > ]<br>rof dateForm(forms.ModelForm):<br>model = Perfil<br>fields = [<br><!-- End of picture text -->

_Figura 161._ **users - forms.py** 

### **Models.py** 

En este archivo define el modelo Perfil en la base de datos. Ubicado en la aplicación users, para guardar los avatares de usuario haciendo uso de la librería Pillow, o PIL, (ver la figura 59). 



<!-- Start of picture text -->
user = J (User, on_delete-models .CASCADE)<br>avatar = (default= » upload_to= )<br>verbose name = (<br>verbose<br>orderingname plural = ( )<br>str_(self):<br>rm self.user.username<br>save(self, *args, **kwargs):<br>img = Image-open(self.avatar.path<br>img.height > 300 or img.width > 300<br>output_size = (300,300<br>img. thumbnail (output_size)<br>ing. save(self.avatar.path<br><!-- End of picture text -->

_Figura 162._ **users - models.py** 

75 

### **Signals.py** 

Como se muestra en la figura 60, este archivo contiene funciones que se activan por medio 

de signals, o señales, cuando se presentan ciertos eventos, tales como: 

- Create_profile(): Crea un Perfil en la base de datos cuando se crea un nuevo usuario. 

- Save_profile(): Se actualiza el Perfil luego de que se actualiza los datos asociados a User. 



<!-- Start of picture text -->
rom django.db.models.signals import post_save<br>from django.contrib.auth.models import User<br>from django.dispatch import receiver<br>from .models import Perfil<br>@receiver(post_save, sender=User<br>lef create profile(sender, instance, created, **kwargs):<br>if created:<br>Perfil.objects.create(user=instance)<br>@receiver(post_save, sender=Use<br>lef save_profile , instance, created, **kwargs):<br>instance.perfil.save()<br><!-- End of picture text -->

_Figura 163._ **users - signals.py** 

### **Tests.py** 

Es un archivo creado automáticamente por Django después de crear la aplicación, que sirve para realizar pruebas adicionales automatizadas. 

### **Views.py** 

Este archivo se encarga de recibir la web request del usuario y retornar una web response en forma de contenido HTML. Entre las funciones que podemos encontrar en este archivo se encuentra: 

- Register(): Permite el registro de usuario en la aplicación web, dirigiendo al usuario a la vista register.hml. Para facilitar este proceso, se importó a esta función la clase UserRegisterForm que construimos en forms.py para las casillas del formulario. Luego de llenar formulario en register.html, que contiene el token CSRF como una etiqueta escondida, el usuario realiza una petición POST. Si se ha llenado el formulario correctamente, se envía la información a la base de datos para crear un usuario nuevo, si no, debe corregir la casilla correspondiente. 

76 

- Profile(): Permite al usuario editar su perfil, dirigiendo al usuario a la vista profile.html. Si el usuario ha iniciado sesión en la aplicación web, puede realizar una petición POST para actualizar su username, email o avatar. En profile.html también agregamos la etiqueta oculta del token CSRF. Una vez que se valida la información, se actuliza la información del usuario en la base de datos. 

### **Web_plataform** 

### **__pycache__** 

Es una carpeta que contiene bytecode. Cuando se ejecuta un programa en Python, lo primero que el intérprete hace es compilarlo en bytecode para simplificar y guardar en esta carpeta. Como programador, esta carpeta se ignora, ya que su única función en el sistema es hacer que el software se ejecute más rápido. 

### **Migrations** 

Esta carpeta sirve para que Django procese los cambios que se han realizado a los Modelos que se encuentran en el esquema de la base de datos del proyecto, como agregar campos, borrar modelos, entre otros. Esta carpeta se crea de manera automática luego de que se ejecuta el comando makemigrations, y crea nuevos archivos con el mismo comando. Las migraciones de esta carpeta se aplican en el proyecto con el comando migrate. 

### **Templates** 

Esta carpeta se crea para que Django pueda generar Vistas de manera dinámica. Por lo tanto, esta carpeta contiene las plantillas HTML del módulo users, a saber: 

- About.html: En esta Vista se muestra los PDFs guardados en el directorio Server/static/PDF/, que contiene el manual de usuario y técnico de la aplicación web. Si el usuario no ha iniciado sesión no se mostrarán los manuales, mientras que el manual de usuario se mostrará a los usuarios registrados, y el manual de usuario y técnico se mostrará a los superusuarios. 

77 

- Backup.html: En esta vista se muestra un botón que da acceso al Área Administrativa, y un botón que permite descargar un backup en formato excel (.xls) del histórico del laboratorio de prototipos, que se encuentra almacenado en la base de datos. 

- Base.html: Es la plantilla base para todas las Vistas que son utilizadas por el servidor, la cual genera la cabecera con las opciones correspondientes dependiendo que tipo usuario que se encuentra conectado. 

- Home.html: Genera la vista que ve el usuario al entrar en la aplicación web desde el navegador. 

### **__init__.py** 

Es un archivo usado para indicar que el directorio presente es un paquete de Python, volviendo posible la importación de módulos a sub-paquetes del directorio en el que se encuentra. También puede usarse para definir código de inicialización o variables que se ejecuten cuando el paquete sea importado. 

### **Admin.py** 

Este archivo usa los modelos que se codifican en models.py del módulo web_plataform para construir automáticamente dentro del Área Administrativa un sitio que se pueda usar para crear, consultar, actualizar y borrar registros. Todo esto con la finalidad de ahorrar tiempo de desarrollo y poder probar los modelos para verificar que los datos son correctos. 

### **Apps.py** 

Como se puede ver en la figura, este archivo sirve para realizar configuraciones en la aplicación “web_plataform”, a saber: Incluir los modelos creados en models.py dentro de la base de datos, que pueden ser accedidos desde el Área Administrativa en la sección “web_plataform” e implementar las configuraciones realizadas en admin.py en el sitio. 

### **Models.py** 

En este archivo se definen los modelos de la base de datos, utilizados por la aplicación “web_plataform”. 

78 

### **Tests.py** 

Es un archivo creado automáticamente por Django después de crear la aplicación, que sirve 

para realizar pruebas adicionales automatizadas. 

### **Urls.py** 

Este archivo especifica la relación que existe entre una Vista concreta del proyecto y la URL en la que aparece esa vista. Como se muestra en la figura 61, el fichero contiene una configuración de paths en una lista de urlpatterns. 



<!-- Start of picture text -->
from django.urls import path<br>from . import ews<br>urlpatterns = [<br>path »Views.home, name=' ser ome"),<br>path ,Views.about, name= ‘ Vy<br>path(‘backup/*,views.backup, name='server-ba ;<br>path ,views.export_excel,<br>name="export-excel'),<br>]<br><!-- End of picture text -->

_Figura 164._ **web_plataform - urls.py** 

Al buscar acceder a alguna de las URLs de la lista, se llama a la función correspondiente que se encuentra en views.py, que realiza el proceso correspondiente. 

### **Views.py** 

Se encarga de recibir la web request del usuario y retornar una web response en forma de contenido HTML. Entre las funciones que podemos encontrar en este archivo se encuentra: 

- Home(): Es una función que recibe por parámetros una web request de cualquier usuario que quiere acceder al url ‘ ’,  dando acceso a la vista Inicio o home.html que se encuentra en la carpeta templates del módulo. 

- Backup(): Posee un decorador @login_required que pasa por argumento una señal (signal) que contiene la url al que el usuario accederá si no ha iniciado sesión con su cuenta: “login/”. En la función, si el usuario que quiere acceder al URL “backup/” no es un administrador 

79 

(superusuario), se le redirigirá a la página home.html, pero si cumple con las condiciones se dirigirá a la página backup.html que se encuentra en la carpeta templates del módulo, donde se le da la opción al superusuario de entrar al Área Administrativa, creada por Django al momento de crear el proyecto, y de descargar un backup en formato Excel (.xls) del histórico del laboratorio de prototipos, que se encuentra almacenado en la base de datos. También se declaró la URL que dirigirá al usuario administrador a la página del Área Administrativa que provee Django. En el Área Administrativa añadir, modificar y eliminar información de la base de datos; como, por ejemplo, cambiar el rol de los usuarios para que sean administradores, o borrar usuarios registrados. 

• Export_excel(): Función que se ejecuta cuando se presiona el botón “Exportar en Excel (.xls). Posee un decorador @login_required que pasa por argumento una señal (signal) que contiene la URL al que el usuario accederá si no ha iniciado sesión con su cuenta: “login/”. En la función, si el usuario desea exportar la información de la base de datos y no es un administrador (superusuario), se le redirigirá a la página home.html, pero si cumple con las condiciones se creará un archivo Excel de nombre “registro_lab_prototipos_<<fecha actual en formato día/mes/año>>”, donde se muestra un histórico de la temperatura, humedad relativa, luminosidad en la sección 1 y sección 2, y presencia que se ha guardado en la base de datos durante el tiempo que el servidor ha estado en ejecución. 

