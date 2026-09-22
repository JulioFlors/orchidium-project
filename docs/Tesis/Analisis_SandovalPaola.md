38 

# **Capítulo IV** 

# **Desarrollo y Resultados** 

En este capítulo se presenta el proceso de desarrollo del prototipo del robot educativo, desde el análisis inicial hasta la implementación final del sistema. Se describen los requerimientos, el diseño conceptual y detallado, así como la construcción e integración de los distintos módulos mediante incrementos sucesivos. Asimismo, se exponen los resultados obtenidos, incluyendo la validación del funcionamiento del sistema y la documentación generada. 

# **Análisis y Estudio Inicial** 

En el marco del desarrollo del robot educativo, se llevó a cabo un análisis documental centrado en los pilares del trabajo: el pensamiento computacional, la robótica educativa y la programación concurrente. Esta revisión bibliográfica, desarrollada en las bases teóricas del presente trabajo, permitió consolidar una base conceptual sólida que orientó la definición de las características y requerimientos del robot propuesto. 

En primer lugar, se abordó el pensamiento computacional como una competencia que trasciende la programación, entendiéndose como una forma de pensamiento aplicable a diversos contextos y una nueva alfabetización digital. Según Wing (2006), este proceso implica el uso de niveles de abstracción para estructurar problemas y diseñar soluciones que puedan ser ejecutadas por un procesador de información. En la misma línea, Zapata-Ros (2015) señala que su desarrollo es gradual y se fortalece a partir de la activación de conocimientos previos. 

A partir de este análisis, se consideraron las competencias asociadas al pensamiento computacional descritas por Sánchez-Vera (2019), quien, retomando a Papert (1980) y Wing (2010), plantea la programación como una forma de expresión y una habilidad aplicable a cualquier disciplina. Asimismo, Sánchez-Vera (2021) destaca el papel de la robótica educativa como una herramienta apropiada para desarrollar habilidades como la secuenciación, la descomposición de tareas, el reconocimiento de patrones, la abstracción y el razonamiento lógico. Estas habilidades constituyen componentes fundamentales del pensamiento computacional y pueden ser fortalecidas mediante experiencias de aprendizaje prácticas. En este contexto, la robótica educativa se sustenta en el enfoque construccionista de Papert (1980), donde el robot 

39 

funciona como un recurso interactivo que permite materializar conceptos abstractos en elementos tangibles y manipulables. 

De igual manera, se analizó el Modelo Octogonal Integrador del Desarrollo Infantil (MOIDI) propuesto por León (2018), con el fin de comprender las características del desarrollo en niños de 6 a 8 años. A partir de una entrevista a la autora, realizada por Morán (2023), se identificaron las áreas del desarrollo que pueden ser favorecidas mediante el uso de un robot educativo, destacando las áreas motoras, cognitivas y sociales. 

Con base en las secuencias de desarrollo de León (2018), se tiene que, en relación con el desarrollo cognitivo, los niños en este rango de edad son capaces de clasificar elementos en categorías y subcategorías, así como establecer relaciones basadas en atributos complejos. En el ámbito social, el juego adquiere una estructura más organizada, con reglas definidas que promueven la interacción, la colaboración y la resolución de conflictos. Estos hallazgos permitieron establecer que el robot educativo debe incorporar elementos que favorezcan la categorización, el ordenamiento lógico y el trabajo colaborativo, aprovechando que los niños en esta etapa consolidan su pensamiento lógico-concreto. 

Asimismo, se analizaron los conceptos en torno a la programación concurrente, entendiéndose como la capacidad de un sistema para ejecutar tareas independientes que cooperan entre sí. El estudio de autores como Tanenbaum (2009) y Stallings (2012) permitió identificar el pseudoparalelismo como un modelo más cercano a la realidad. En sistemas basados en microcontroladores, esto se da a través de las rápidas transiciones entre procesos que generan una percepción de simultaneidad. 

Gracias al trabajo de Espejo (2022), se determinó que a través de paradigmas concurrentes se favorece la capacidad de abstracción del estudiante al permitirle modelar sistemas más cercanos a la realidad. Este planteamiento resulta especialmente relevante para el presente proyecto, ya que orienta el diseño del robot hacia la ejecución de múltiples acciones simultáneas. Para ello, se contemplan mecanismos de sincronización que aseguren la coordinación entre procesos y permitan alcanzar estados comunes antes de avanzar en la ejecución. 

Del mismo modo, se realizó una revisión de prototipos desarrollados en la Universidad Católica Andrés Bello, extensión Guayana, entre los que destacan los trabajos de Morán (2023) y 

40 

Urdaneta (2024). Ambos estudios demostraron la viabilidad de las interfaces tangibles como estrategia para reducir la barrera de la lectoescritura en niños. En particular, Morán (2023) resalta la importancia sistemas modulares mediante el uso de elementos físicos concretos que facilitan la comprensión de conceptos abstractos, mientras que Urdaneta (2024) demuestra que la incorporación de pantallas como medio de retroalimentación visual enriquece la experiencia de aprendizaje y favorece una introducción progresiva a dispositivos digitales. 

De forma complementaria, se llevó a cabo una revisión de diversas tecnologías disponibles en el mercado basadas en robótica educativa con enfoque STEAM. En este sentido, se examinaron los dispositivos Bee-Bot, Blue-Bot, Cubetto y Botley 2.0, los cuales se describen en las bases teóricas del presente trabajo. A partir de esto, se elaboró la tabla 1, un cuadro comparativo que permite identificar similitudes, diferencias y limitaciones entre estos robots. 

Tabla 1 

_Comparativa entre robots comerciales_ 

|**Robot**|**Edad**<br>**recomendada**|**Forma de programarse**|**Conceptos enseñados**|**Limitaciones**|
|---|---|---|---|---|
|**Bee-Bot**|3 a 7 años|Botones físicos en el<br>cuerpo del robot|Orientación espacial,<br>direcciones, secuenciación,<br>lógica básica|Operaciones<br>secuenciales simples|
|**Blue‑Bot**|3 a 8 años|Botones físicos en el<br>cuerpo del robot +<br>Aplicación móvil|Secuenciación, lógica,<br>transición a programación<br>digital|Secuencias y<br>movimientos simples|
|**Cubetto**|3 a 6 años|Bloques físicos de<br>madera en un tablero|Pensamiento lógico-<br>espacial, secuenciación,<br>uso de funciones|Movimientos limitados<br>y pocas acciones|
|**Botley 2.0**|5 a 10 años|Control remoto físico|Lógica de comandos,<br>direcciones, secuenciación|Enfoque secuencial|



Estos juguetes emplean la programación física como medio de interacción humano–robot, permitiendo que niños entre 3 y 10 años construyan instrucciones de manera tangible. Este tipo de interacción facilita la comprensión de conceptos abstractos mediante la manipulación directa de los elementos y la observación inmediata de los resultados. De esta forma, se promueve el desarrollo de habilidades como la observación, el ensayo y error y el ajuste iterativo, las cuales constituyen componentes fundamentales del pensamiento computacional. En consecuencia, el 

41 

diseño propuesto adopta la programación física como principal mecanismo de interacción entre el niño y el sistema. 

No obstante, aunque estos dispositivos son pioneros en la robótica educativa, todos ellos se centran principalmente en la secuenciación como estrategia para la resolución de problemas. A partir del análisis realizado, se determinó que, si bien la secuenciación constituye una habilidad fundamental para la construcción de algoritmos, su enfoque exclusivo puede limitar la forma en que se abordan problemas más complejos. 

En este sentido, y en continuidad con la línea investigativa de los prototipos analizados, se plantea un diseño que incorpora, además de la secuenciación, principios de programación concurrente. Esto permite que los usuarios puedan modelar situaciones de manera más cercana a la realidad, desarrollando soluciones más flexibles y eficientes que aquellas basadas únicamente en un flujo de ejecución lineal. 

En función de la información recopilada, el análisis realizado y teniendo en consideración que el público objetivo son niños de 6 a 8 años de edad, se definieron los requerimientos del robot educativo, los cuales orientan las fases de diseño y construcción. 

# **Requerimientos funcionales.** 

1. Permitir la construcción de secuencias de acciones organizadas en pasos ordenados, facilitando la planificación y la secuenciación de tareas. 

2. Ser capaz de ejecutar múltiples acciones de manera simultánea, incorporando conceptos básicos de concurrencia. 

3. Permitir la ejecución de estructuras de control simples (bucles) mediante mecanismos accesibles para niños. 

4. Proporcionar retroalimentación interactiva. 

5. Contemplar la programación tangible como medio de interacción humano-robot, combinando manipulación física y elementos digitales, de modo que el niño pueda programar sin lenguaje textual. 

# **Requerimientos no funcionales.** 

1. El diseño del robot debe cumplir con los lineamientos generales de seguridad establecidos por la Norma Venezolana de Seguridad de Juguetes. 

