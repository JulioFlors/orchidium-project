son los recursos utilizados por dichos procedimientos. 

Las técnicas de recolección de datos que se implementaron en el presente trabajo corresponden a la revisión documental y la entrevista, bajo la clasificación hecha por Hurtado (2010, p.771). Como se indicó en el diseño de la investigación del presente informe, gran parte de la información requerida por el trabajo de investigación se encontraba disponible de manera documental, por lo que la revisión de dicha literatura consistió en la principal fuente de información. Para complementar dicha información, se realizaron entrevistas con el personal de LCC Opentech, C.A., con el fin de obtener aquellos datos que no se encontraron o que no eran suficientes durante la revisión documental. 

Los instrumentos utilizados para la revisión documental comprendieron principalmente computadores y manuales de usuario de otros sistemas, mientras que para las entrevistas se utilizó cualquier material que permitiese la escritura de información. 

# **Metodología de desarrollo** 

Un proyecto de software, como cualquier otro proyecto de ingeniería, debe seguir una planificación o metodología que guíe el desarrollo del mismo. Como modelo de desarrollo se implementó el modelo de la cascada. Dicho modelo sugiere un enfoque sistemático y secuencial, que comienza con la definición de requerimientos y termina con el despliegue del sistema desarrollado (Pressman, 2010, p.34), como se ilustra en la figura 8: 



<!-- Start of picture text -->
—| Comunicacién A 7<br>iniciorecabardellosproyectorequerimientos laneaciénestimacién Modelado =<br>programacién candlisis Construccién 7<br>seguimiento disefio cédigo Despliegue<br>pruebas entregaasistencia<br>retroalimentacién<br><!-- End of picture text -->

Figura 8: Modelo de la cascada. Tomado de _Ingeniería del Software. Un enfoque práctico_ , (p.34), por Pressman, R (2010). 

40 

Según Pressman (2010, p.33), la aplicación de este modelo es razonable en situaciones donde el trabajo fluye de manera lineal, y estas situaciones se dan, por ejemplo, cuando deben hacerse adaptaciones a sistemas ya existentes o cuando los requerimientos están bien definidos y se prevé cierta estabilidad de los mismos. Dada la definición anterior se consideró que dicho modelo era idóneo para el presente trabajo ya que los objetivos específicos planteados se asemejan a las fases del modelo en cuestión, a su vez que no se previeron cambios ni modificaciones en los mismos ni en los requerimientos funcionales y no funcionales del sistema una vez definidos, garantizando la estabilidad. 

Las fases de comunicación y planificación del modelo se correspondieron con la elaboración de la propuesta del trabajo de investigación, así como con el primer y segundo objetivo específico del mismo. La fase de modelado se corresponde con el tercer objetivo específico, mientras que la fase de construcción se corresponde con el cuarto y quinto objetivo específico. La última fase del modelo de la cascada no tiene correspondencia con ningún objetivo específico del proyecto, ya que como se mencionó en la sección de alcance del presente informe, no se prevé la implementación del sistema desarrollado. 

# **Procedimiento metodológico** 

Para el cumplimiento del objetivo general, los objetivos específicos fueron abordados siguiendo el modelo de la cascada: de manera secuencial y sin solapamientos, donde cada producto de una fase era la entrada de la fase subsecuente. Dadas las semejanzas entre los objetivos específicos y las fases del modelo de la cascada, la implementación del modelo de desarrollo en el procedimiento metodológico no representó ningún contratiempo. El procedimiento metodológico del presente trabajo se llevó a cabo en el siguiente orden: 

# **Estudiar la situación actual del proyecto LIMS de LCC OpenTech, C.A.** 

41 

Aplicando la técnica de revisión documental se indagó de manera sistemática en gran parte de los documentos de la compañía concernientes al proyecto LIMS. La documentación revisada se comprendió de los siguientes elementos: 

1. Manuales de uso de otros LIMS: muchos de los conceptos primordiales del proyecto LIMS de LCC Opentech, C.A. surgieron estudiando el sistema HCLab de HCSoft. El manual de usuario de dicho sistema supuso una fuente constante de referencias al momento de modelar las entidades del sistema, así como el diseño de las pantallas del producto final, entre otras características relevantes. 

2. Informes de pasantía: previamente en la compañía, trabajos de pasantía fueron realizados respecto al proyecto LIMS, creando versiones básicas del sistema y recolectando conceptos básicos referentes al tema. 

3. Manuales de marca: o manuales de identidad corporativa, son guías que definen cómo deben utilizarse el logotipo, los colores y tipografía de un producto o empresa. Al momento de comenzar el presente trabajo, LCC Opentech, C.A. contaba con un prototipo de manual de marca para el proyecto LIMS. 

4. Diseños de pantalla: también conocidos como maquetas o mockups, son imágenes creadas con el objetivo de ilustrar como debería verse el producto final de una aplicación informática desde la perspectiva del usuario final. Sirven como guía de diseño para los desarrolladores del sistema. En LCC Opentech, C.A. se habían creado algunas de estas imágenes para el proyecto LIMS. 

5. Propuestas de proyecto: se revisó un prototipo de propuesta de proyecto de una posible versión comercial del proyecto LIMS, en el cual se detallaban las características del mismo. Dichas características fueron de utilidad al momento de definir los requerimientos funcionales del sistema desarrollado en el presente trabajo. 

42 

6. Diseños de bases de datos: así como LCC Opentech, C.A. contaba con el manual de uso del sistema HCLab, también contaba con los diseños físicos de las bases de datos utilizadas por el sistema. Dichos diseños fueron de utilidad al momento de modelar las entidades y diseñar la base de datos del sistema desarrollado en el presente trabajo. 

Terminada esta fase inicial de revisión documental, la entrevista no estructurada fue la técnica de recolección de datos más utilizada. En adelante se mantuvieron encuentros con el director de LCC Opentech, C.A., el ingeniero Manuel Rodríguez, con el objetivo de discutir los datos y la información obtenida, así como tomar decisiones respecto a todos los aspectos relevantes del presente trabajo. 

# **Definir los requerimientos funcionales y no funcionales del sistema basándose en el estudio realizado.** 

Una vez revisada buena parte del material documental del proyecto LIMS, se procedió a realizar un estudio de la información previamente recolectada para definir los requerimientos funcionales y no funcionales que el sistema a desarrollar debía cumplir. En consenso con el ingeniero Manuel Rodríguez, se definieron los requerimientos en función de las características ya establecidas para el sistema en un prototipo de propuesta de proyecto. A partir de la lista de características anteriormente mencionada, se extrajeron sólo aquellas funcionalidades que se consideraron eran claves para un sistema modelo, de tal manera que el sistema a desarrollar no excediera el alcance del trabajo de investigación. 

# **Diseñar el sistema en función de los requerimientos definidos implementando una arquitectura de microservicios.** 

Una vez definidas las funcionalidades con las que debía contar el sistema a través de los requerimientos obtenidos en la fase anterior, se procedió a avanzar en 

43 

la tercera fase del modelo de la cascada, la cual consiste en el diseño y modelado del sistema. Para conseguir dicho objetivo, se recurrieron a herramientas propias de la ingeniería de software. Dichas herramientas fueron, en orden de utilización, las siguientes: 

1. Casos de uso, para definir de manera gráfica los requerimientos con los que debía cumplir el sistema a desarrollar. 

2. Diagramas de arquitectura, para definir los diferentes componentes del sistema y cómo interactuarían entre ellos. 

3. Diagramas entidad/relación, para definir las entidades y modelos del sistema, así como la manera en que estos se relacionarían unos con otros. 

4. Diseños lógicos de bases de datos, para definir las propiedades de las entidades y modelos del sistema, así como el tipo de datos del que harían uso estas propiedades. 

5. Diseño de API, para definir las interfaces de comunicación de cada microservicio, identificando así qué datos serían enviados desde y hacia cada microservicio. 

6. Diagramas de flujo, para definir el comportamiento de la aplicación web que serviría como interfaz entre el usuario y el sistema. 

7. Diseño de pantallas, para definir la interfaz gráfica de la aplicación web que serviría como interfaz entre el usuario y el sistema. 

# **Construir el sistema en función del diseño elaborado.** 

Una vez obtenidos todos los productos de la fase de modelado, se avanzó en la cuarta fase del modelo en cascada, la cual consiste en el desarrollo del producto final. El material obtenido de la fase anterior sirvió de guía para obtener los siguientes productos en esta fase de desarrollo: 

44 

1. Los diagramas de arquitectura fueron utilizados como guía al momento de llevar a cabo la modularización el sistema, garantizando que cada componente fue abstraído correctamente en unidades funcionales e independientes. 

2. Los diagramas de entidad/relación y los diseños de bases de datos fueron utilizados para crear las entidades del sistema así como las entidades relacionales o tablas pivote. 

3. Los diagramas de casos de uso y de flujo fueron utilizados como guía al momento de desarrollar la aplicación web, para validar que los requerimientos del sistema se cumpliesen a cabalidad. 

4. Los diseños de pantallas fueron utilizados para guiar el desarrollo de la aplicación web, garantizando que ninguna pantalla careciera de alguna función requerida. 

El primer paso consistió en desarrollar todos los microservicios que componen el sistema. Cada microservicio es a su vez, una aplicación de servidor con su propia base de datos. Seguidamente se unificaron todos los microservicios bajo un API Gateway, y finalmente se desarrollo la aplicación web, la cual se comunicaba únicamente con el API Gateway, y este último era el encargado de comunicarse con los microservicios correspondientes. 

# **Validar el sistema construido usando un caso de estudio.** 

En base a los requerimientos funcionales se construyó un caso de estudio, el cual consistió en un plan de pruebas a ejecutar con el fin de cerciorar que el sistema cumpliese con los requerimientos establecidos. Este plan de pruebas a su vez se dividió en dos conjuntos de pruebas: el primero para validar la creación, consulta, modificación y borrado de datos, y el segundo conjunto de pruebas consistió en la validación de que el sistema cumpliese con las características de una arquitectura de 

45 

microservicios, ejecutando pruebas como el apagado de uno o varios microservicios mientras el sistema se encontraba en funcionamiento, esperando que este respondiera de manera adecuada. 

46 

