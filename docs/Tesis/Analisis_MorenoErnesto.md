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

