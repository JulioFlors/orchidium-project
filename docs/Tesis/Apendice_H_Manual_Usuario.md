# Apéndices

## Apéndice H: Manual de Usuario y Operaciones de la Plataforma PristinoPlant

El presente manual de usuario proporciona las directrices operativas, procedimientos paso a paso e instrucciones de interacción requeridas para el uso efectivo de la plataforma PristinoPlant. Su contenido está estructurado para guiar tanto al cultivador botánico en la gestión agronómica, telemétrica e hidráulica del invernadero, como al cliente final en la adquisición de ejemplares a través de la tienda digital.

---

### 1. Perfiles de Usuario y Control de Acceso

La plataforma implementa un esquema de seguridad fundamentado en el control de acceso basado en roles (RBAC) gestionado por la librería Better-Auth. La Tabla Ap-H1 detalla los perfiles configurados, sus responsabilidades operacionales y las vistas autorizadas en el sistema.

#### Tabla Ap-H1. *Matriz de perfiles de usuario, roles y permisos de acceso a la plataforma*

| Perfil de Usuario | Rol del Sistema | Alcance y Responsabilidades | Rutas y Vistas Autorizadas |
| :--- | :--- | :--- | :--- |
| **Cultivador Administrador** | `ADMIN` / `CULTIVATOR` | Gobierno integral del orquideario: comando hidráulico, programación, formulación química, inventario y ventas. | Acceso total a `/operations/*`, `/monitoring`, `/lab/*`, `/inventory/*` y administración. |
| **Operador de Riego** | `OPERATOR` | Supervisión telemétrica, comando manual directo de emergencia y consulta de la cola de riego activa. | Acceso restringido a `/operations/control`, `/operations/queue` y `/monitoring`. |
| **Cliente / Comprador** | `USER` / `PUBLIC` | Exploración del catálogo botánico, selección de ejemplares vivos disponibles y emisión de solicitudes de compra. | Acceso público a `/category/*`, `/product/*`, `/cart` y formalización de órdenes. |

*Nota.* Fuente: Elaboración propia a partir del esquema de autenticación relacional en PostgreSQL.

---

### 2. Autenticación y Navegación Principal

Para acceder a las funciones operativas del sistema, el operador debe autenticarse ingresando su correo electrónico y contraseña en la ruta `/auth/login`. Tras validar las credenciales criptográficas, el sistema redirige al usuario hacia el panel de supervisión correspondiente a su rol.

La barra de navegación superior proporciona acceso directo a los dominios del sistema: **Operaciones** (riego y maniobras), **Monitoreo** (series climáticas en tiempo real), **Laboratorio** (dosificación agronómica) e **Inventario** (gemelos botánicos y catálogo). Asimismo, incorpora indicadores visuales permanentes sobre el estado de conectividad del bróker MQTTS y la presencia de alertas climáticas activas.

---

### 3. Operaciones del Circuito Hidráulico y Riego

El gobierno de la bomba de agua de impulsión de 1 HP (1 pulgada) y las electroválvulas del circuito de cuatro líneas se realiza a través del módulo `/operations`, garantizando maniobras seguras y auditadas en todo momento.

**Centro de Control Manual Directo (`/operations/control`).** Permite activar de forma inmediata cualquiera de las cuatro líneas hidráulicas:
1. Localizar la tarjeta correspondiente a la línea deseada: Línea 1 (Nebulización / *Foggers*), Línea 2 (Aspersión principal de mesas), Línea 3 (Humectación de piso) o Línea 4 (Dosificación fitosanitaria).
2. Seleccionar el tiempo de apertura requerido mediante el menú desplegable (valores preestablecidos de 60, 180, 300 o 600 segundos).
3. Presionar el interruptor interactivo de conmutación. La tarjeta reflejará el cambio de color y mostrará un temporizador con cuenta regresiva. Al enviar el comando, el firmware activa su temporizador *fail-safe* para cortar la energía automáticamente si expira el lapso.
4. *Protocolo especial de seguridad para Línea 4:* Al conmutar la línea de dosificación fitosanitaria, el sistema despliega una ventana modal de advertencia toxicológica que exige al operador confirmar la fórmula química preparada antes de energizar la válvula.

**Supervisión de la Cola de Tareas (`/operations/queue`).** Despliega el listado reactivo de las operaciones hídricas en ejecución inmediata (`RUNNING`) o programadas para las próximas horas (`PENDING`). Si el cultivador detecta una anomalía física en el invernadero (ej. fuga en tubería), puede presionar el botón rojo de *Detención de Emergencia*, abortando la maniobra de forma instantánea tanto en el servidor como en el microcontrolador.

**Programador Cronológico de Riego (`/operations/schedules`).** Permite automatizar rutinas semanales recurrentes:
1. Pulsar el botón *Nueva Rutina de Riego* y asignar una etiqueta descriptiva (ej. "Riego Matutino Mesas A y B").
2. Definir los días de la semana y la hora exacta de ejecución mediante el selector temporal.
3. Especificar la duración en minutos y asociar la línea hidráulica a conmutar.
4. Activar las guardas ambientales requeridas: *Veto por Lluvia* (bloquea el riego si se detecta precipitación reciente) y *Límite Higrométrico* (cancela la nebulización si la humedad relativa supera el 85%).

**Bitácora de Auditoría Histórica (`/operations/history`).** Presenta el registro inmutable de todas las tareas procesadas por el sistema. Cada entrada detalla la fecha y hora, línea hidráulica, duración efectiva, actor de procedencia (manual o planificador autónomo) y el estado final resultante: conmutación exitosa (`COMPLETED`), cancelación de usuario (`CANCELLED`) o bloqueo algorítmico deliberativo (`VETO`).

---

### 4. Laboratorio y Dosificación Agronómica (`/lab`)

El módulo de laboratorio centraliza la gestión científica de fertilizantes e insumos fitosanitarios, erradicando los riesgos de fitotoxicidad y el desarrollo de cepas fúngicas resistentes.

**Gestión de Insumos y Recetas Compuestas.** En la vista de insumos puros, el cultivador administra la ficha técnica de cada producto (nombre comercial, principio activo, concentración recomendada y periodo de carencia). En la vista de recetas compuestas (`/lab/recipes`), es posible formular caldos combinados (ej. fertilizante foliar N-P-K enriquecido con calcio micronizado), donde el sistema valida la compatibilidad química de la mezcla y calcula automáticamente los gramos o mililitros requeridos en función del volumen total de agua a preparar en el tanque presurizado.

**Planificación de Programas Rotativos.** A través del planificador de dosificación (`/lab/schedules`), el usuario programa secuencias rotativas de aplicación fitosanitaria. El sistema proyecta en un calendario interactivo las aplicaciones futuras, alternando sistemáticamente los grupos químicos de acción para evitar la resistencia de plagas y emitiendo recordatorios preventivos en la pantalla de inicio del cultivador.

---

### 5. Monitoreo Telemétrico y Confort Bioclimático (`/monitoring`)

La supervisión del microclima en tiempo real permite al cultivador evaluar las condiciones ecofisiológicas del orquideario y contrastarlas contra el entorno exterior.

**Interpretación de Curvas Ambientales.** El tablero despliega series temporales continuas correspondientes a las últimas 24 horas para cuatro magnitudes físicas:
* *Temperatura ($^\circ\text{C}$):* Trazo diferencial entre la temperatura a la intemperie (EMA Exterior) y la temperatura protegida bajo malla sombra (EMA Interior).
* *Humedad Relativa ($HR\%$):* Indicador del contenido de vapor de agua. Valores sostenidos superiores al 85% indican riesgo de condensación y ataque bacteriano.
* *Iluminancia Solar ($Lux$):* Medición de radiación difusa recibida en las mesas, fundamental para certificar que no se excedan los 25.000 lux en especies sensibles como *Phalaenopsis*.
* *Déficit de Presión de Vapor ($VPD$ en $\text{kPa}$):* Métrica psicrométrica calculada en tiempo real. La franja verde en el gráfico señala la ventana óptima de transpiración ($0.8\text{ a }1.2\text{ kPa}$). Si la curva penetra la zona roja ($VPD > 1.8\text{ kPa}$), el operador debe inducir un pulso de humectación en piso.

**Consulta del Oráculo Meteorológico (`/weather-oracle`).** Pantalla especializada que expone las derivadas climáticas calculadas por el motor pluvial. Muestra el estado meteorológico actual inferido (Despejado, Nublado o Precipitación Activa), la tasa instantánea de enfriamiento ($-\Delta T$) y el historial de eventos de lluvia recientes, permitiendo al operador verificar por qué una rutina programada fue vetada por el sistema.

---

### 6. Inventario de Gemelos Digitales y Trazabilidad Botánica

La administración de los activos biológicos individuales del orquideario se realiza mediante el modelo de gemelos digitales (`SeedPlant`), asociando cada maceta física con su registro computacional en la base de datos.

**Registro y Ubicación de Ejemplares (`/admin/plants`).**
1. Seleccionar la opción *Registrar Nueva Planta* e indicar la especie botánica asociada.
2. Asignar el código unívoco de identificación impreso en la etiqueta de la maceta.
3. Especificar el tamaño del contenedor (`PotSize`: Nro 5, Nro 7, Nro 10 o Nro 14) y definir su estado inicial (`AVAILABLE` para venta o `MOTHER` para preservación de germoplasma).
4. Indicar la localización física tridimensional en el invernadero (Zona A–D y Mesa 1–6), facilitando la rápida ubicación de la planta durante inspecciones de cultivo.

**Bitácora Fenológica de Floración.** Al pulsar sobre un ejemplar en la matriz de inventario, se despliega su ficha de vida biológica. El cultivador puede registrar hitos fenológicos: emergencia de vara floral, apertura de la primera flor, conteo de botones viables y fecha de marchitamiento. Esta bitácora calcula de forma automática la longevidad floral media del espécimen, información clave para valorar comercialmente la planta.

**Gestión Comercial y Sincronización de Stock (`/inventory/shop-manager`).** En esta interfaz el cultivador define qué tamaños de maceta se encuentran a la venta para cada especie y fija su precio en dólares estadounidenses. El sistema calcula reactivamente el stock disponible para la tienda digital contando únicamente las instancias de `SeedPlant` activas en estado `AVAILABLE` de ese tamaño específico, asegurando que jamás se ofrezca un producto que no exista físicamente en las mesas.

---

### 7. Tienda Digital y Experiencia del Cliente

El portal de comercio electrónico (`/category/plants`) ofrece al público general un canal intuitivo para la adquisición de orquídeas cultivadas bajo agricultura de precisión.

**Navegación y Selección de Especímenes.** El cliente explora el catálogo filtrando por género botánico (*Phalaenopsis*, *Cattleya*, *Dendrobium*, *Vanda*), nivel de dificultad de cultivo o requerimientos lumínicos. Al ingresar a la ficha del producto (`/product/[slug]`), el comprador visualiza fotografías de alta resolución alojadas en Cloudflare R2, la descripción taxonómica, los consejos de cuidado y las variantes de maceta disponibles con sus respectivos precios y stock en tiempo real.

**Carrito y Formalización de Pedidos vía WhatsApp.** El usuario selecciona el tamaño deseado y añade el ejemplar a su cesta de compras (`/cart`). Al avanzar hacia el proceso de pago, introduce sus datos de contacto y selecciona la opción de formalizar compra. La plataforma emite una solicitud estructurada que abre automáticamente una conversación en la API de WhatsApp del orquideario, remitiendo el detalle exacto de las plantas seleccionadas, los identificadores de variante y el monto total calculado, permitiendo al cultivador coordinar la entrega y la recepción del pago de manera directa y personalizada.

---

### 8. Canal de Mensajería Interactiva y Alertas Móviles

Para garantizar una supervisión ágil fuera de la estación de trabajo, el sistema cuenta con un bot de mensajería interactiva enlazado a la infraestructura central. La Tabla Ap-H2 sintetiza las notificaciones automáticas y los comandos de consulta rápida disponibles para el cultivador.

#### Tabla Ap-H2. *Matriz de notificaciones automáticas y comandos disponibles vía mensajería móvil*

| Evento / Comando | Origen del Mensaje | Contenido y Notificación Generada |
| :--- | :--- | :--- |
| **Alerta de Lluvia Detectada** | Motor Pluvial (Scheduler) | Aviso inmediato de lluvia inferida con duración estimada y veto preventivo de riegos. |
| **Confirmación de Riego (`ACK`)** | Nodo Actuador (ESP32) | Reporte de conmutación efectiva indicando línea energizada, caudal y duración cumplida. |
| **Alerta por Estrés Térmico** | Monitor de Telemetría | Advertencia de temperatura $> 34^\circ\text{C}$ con recomendación de humectación de suelo. |
| `/estado` | Comando del Cultivador | Respuesta con telemetría actual ($T, HR, Lux, VPD$) de EMA Exterior e Interior. |
| `/riegos` | Comando del Cultivador | Listado cronológico de las próximas maniobras agendadas en la cola del Scheduler. |
| `/vetos` | Comando del Cultivador | Resumen de los vetos deliberativos aplicados por el sistema durante las últimas 24 horas. |

*Nota.* Fuente: Elaboración propia a partir del servicio de mensajería interactiva del sistema PristinoPlant.
