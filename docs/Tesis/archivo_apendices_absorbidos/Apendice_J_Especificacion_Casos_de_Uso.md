# Apéndice J: Especificación Formal de Casos de Uso del Sistema

El presente apéndice expone la especificación exhaustiva de los casos de uso que gobiernan el comportamiento funcional de la plataforma de agricultura inteligente PristinoPlant. En el marco de la metodología de desarrollo orientada por pruebas para sistemas IoT (TDDM4IoTS, Guerrero-Ulloa et al., 2020) y los estándares de ingeniería de requerimientos de software (IEEE 830 / ISO/IEC/IEEE 29148 y Cockburn, 2001), los casos de uso representan el puente formal entre la extracción de necesidades del orquideario (SRS del Apéndice A) y el diseño conceptual y lógico del sistema.

Asimismo, dentro de la disciplina de desarrollo guiado por pruebas (TDD), la formulación paso a paso de los flujos de interacción normal y los cursos alternativos proporciona la base para la derivación de la lista inicial de pruebas (Fase 3 de TDDM4IoTS) y la posterior codificación de pruebas unitarias y de integración en la fase de construcción (TDD Red / Green / Refactor).

---

## 1. Caracterización de los Actores del Sistema

El ecosistema operativo de PristinoPlant articula la participación coordinada de cuatro (4) actores principales, diferenciados por su naturaleza (humana o computacional), su ámbito de acción y sus niveles de privilegio en el sistema:

1. **Cultivador / Administrador:** Actor humano primario responsable de la gestión técnica y operativa del orquideario. Posee credenciales de acceso privilegiadas que le permiten supervisar series climáticas en tiempo real, accionar de forma manual y directa el circuito hidráulico y el tablero de potencia, auditar y balancear mezclas químicas en el laboratorio agronómico, coordinar programas rotativos, administrar el inventario de especímenes unívocos (`SeedPlant`), y conciliar los pagos comerciales y despachos de plantas.
2. **Cliente:** Actor humano externo que interactúa con la plataforma a través de la tienda botánica digital pública. Tiene la facultad de explorar el catálogo de orquídeas mediante filtros taxonómicos por género, examinar fotografías de floración y parámetros de cultivo, gestionar su carrito de compras en función del stock vivo disponible en las mesas de cultivo, y formalizar solicitudes de pedido multimoneda mediante la canalización asistida hacia mensajería instantánea.
3. **Sistema Autónomo:** Actor computacional continuo conformado por los microservicios en segundo plano (`services/ingest` y `services/scheduler`) y los motores de inferencia algorítmica. Actúa de manera desatendida 24/7 para muestrear telemetría ambiental, calcular magnitudes psicrométricas compuestas (Déficit de Presión de Vapor - VPD), clasificar eventos de precipitación pluvial sin sensores mecánicos, evaluar matrices heurísticas de veto preventivo frente a condiciones adversas y orquestar el encendido seguro de las líneas de riego.
4. **Servicio de Notificaciones:** Actor computacional auxiliar encargado de canalizar de forma asíncrona alertas operativas, avisos de contingencia microclimática (estrés térmico o lluvias intensas) y resúmenes de órdenes comerciales hacia el cultivador a través de interfaces reactivas y la API de WhatsApp, garantizando trazabilidad y comunicación expedita.

---

## 2. Matriz General de Trazabilidad de Casos de Uso

En la Tabla Ap-J1 se presenta la correspondencia integral entre los siete (7) casos de uso del sistema, los módulos funcionales derivados de la SRS, los requerimientos funcionales (RF) cubiertos, los actores interactuantes, los flujos operativos de secuencia formalizados en el Apéndice F y los incrementos de ingeniería del Apéndice B.

#### Tabla Ap-J1. *Matriz de trazabilidad y mapeo de casos de uso frente a requerimientos y actores*

| Código | Denominación del Caso de Uso | Actores Participantes | Módulo SRS | Requerimientos Asociados | Flujo Ap. F | Incremento |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: |
| **CU01** | Autenticación, gestión de sesiones seguras y control de acceso basado en roles. | Cultivador / Administrador, Cliente | Módulo I: Seguridad y Acceso | RF01, RNF02, RNF08 | Interfaces generales | Inc. 1 y 2 |
| **CU02** | Exploración del catálogo botánico, selección de especímenes y formalización de pedidos multimoneda. | Cliente (Primario), Cultivador, Servicio de Notificaciones | Módulo II: Comercio Electrónico y Gestión de Ventas | RF02, RF03, RF04, RF05, RF06, RNF06 | Flujo 5 (Apéndice F) | Inc. 1 y 6 |
| **CU03** | Administración taxonómica, registro de plantas individuales (`SeedPlant`) y trazabilidad fenológica. | Cultivador (Primario) | Módulo III: Inventario Físico y Gemelos Digitales | RF07, RF08, RF09, RNF03 | Flujo 3 (Apéndice F) | Inc. 1 y 6 |
| **CU04** | Formulación química de recetas compuestas y programación de ciclos agronómicos rotativos. | Cultivador (Primario) | Módulo IV: Dosificación de Agroquímicos | RF10, RF11, RF12, RNF03 | Flujo 2 (Apéndice F) | Inc. 5 |
| **CU05** | Adquisición telemétrica continua, cálculo psicrométrico y detección algorítmica de lluvia. | Sistema Autónomo (Primario), Cultivador | Módulo V: Telemetría e Inteligencia Ambiental | RF13, RF14, RF15, RNF03, RNF06, RNF07, RNF09 | Flujo 4 (Apéndice F) | Inc. 3 y 4 |
| **CU06** | Comando manual directo de actuadores hidráulicos con guarda fail-safe local. | Cultivador (Primario), Tablero de Potencia / ESP32 | Módulo VI: Operaciones Hidráulicas y Riego Autónomo | RF16, RF18, RNF01, RNF04 | Flujo 1 (Apéndice F) | Inc. 2 |
| **CU07** | Planificación y ejecución de riego autónomo con veto deliberativo y auditoría inmutable. | Sistema Autónomo (Primario), Cultivador, Servicio de Notificaciones | Módulo VI y VII: Operaciones Hidráulicas / Notificaciones | RF17, RF18, RF19, RNF01, RNF03 | Flujos 1 y 4 (Apéndice F) | Inc. 2 y 4 |

*Nota.* Fuente: Elaboración propia a partir de la especificación de requerimientos de PristinoPlant.

---

## 3. Especificación Detallada de Casos de Uso en Tablas Independientes

A continuación se presentan las especificaciones formales de los casos de uso (`CU01` a `CU07`), estructuradas en tablas individuales con sus cursos de acción primarios, cursos alternativos, excepciones y contratos de pre y postcondición.

---

### Caso de Uso CU01: Autenticación, Gestión de Sesiones Seguras y Control de Acceso Basado en Roles

#### Tabla Ap-J2. *Caso de uso CU01: Autenticación, gestión de sesiones seguras y control de acceso basado en roles*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU01` - Autenticación, gestión de sesiones seguras y control de acceso basado en roles. |
| **Actores:** | Cultivador / Administrador (Primario), Cliente (Primario). |
| **Propósito:** | Proveer un mecanismo confiable de autenticación de identidad y gobernanza de autorizaciones, delimitando las vistas y operaciones según el rol asignado al usuario. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF01, RNF02, RNF08. |
| **Precondiciones:** | El usuario dispone de credenciales activas registradas en la base de datos PostgreSQL y accede a través de una conexión cifrada HTTPS/TLS. |
| **Postcondición Exitosa:** | El usuario obtiene una sesión criptográficamente firmada mediante JWT/cookies seguras (`httpOnly`), y el sistema le redirige a la vista correspondiente según su rol (panel administrativo o tienda pública). |
| **Postcondición de Fallo:** | La sesión no se genera, se incrementa el contador de intentos fallidos y se mantiene el bloqueo de acceso a recursos protegidos. |
| **Resumen:** | El usuario suministra sus credenciales de acceso (correo electrónico y contraseña). El sistema autentica la identidad mediante comparación de funciones hash seguras (Argon2/Bcrypt) con salting; de resultar válidas, establece una sesión persistente y habilita los módulos acordes al perfil de usuario (ADMIN, GROWER, CLIENT). |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El usuario ingresa a la ruta `/auth/signin` o presiona el botón de acceso en la barra superior. | El sistema renderiza el formulario de inicio de sesión con campos protegidos para correo y contraseña. |
| 2 | El usuario ingresa su correo electrónico y clave secreta, y envía el formulario. | El sistema intercepta la solicitud en el backend, sanea las entradas y consulta el registro de usuario en PostgreSQL vía Prisma. |
| 3 | — | El sistema verifica la correspondencia del hash de la contraseña y valida que la cuenta se encuentre en estado activo. |
| 4 | — | El sistema genera el token de sesión seguro con las declaraciones del usuario y su rol de acceso. |
| 5 | — | El sistema redirige al usuario: si es Cultivador/Administrador, hacia el panel operativo de supervisión (`/monitoring` o `/operations/control`); si es Cliente, a su perfil comercial (`/account`) o al catálogo. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **2.1** | El usuario introduce credenciales no coincidentes o inexistentes. | El sistema rechaza la solicitud, registra el intento fallido en los logs de seguridad y muestra el mensaje interactivo: *"Credenciales inválidas. Por favor verifique su correo y contraseña"*. El caso de uso finaliza en fallo. |
| **2.2** | El usuario supera el umbral máximo de intentos consecutivos fallidos. | El sistema aplica una política de limitación de tasa (*rate limiting*) bloqueando temporalmente la dirección IP o el usuario por 15 minutos, alertando sobre actividad sospechosa. |
| **5.1** | Un usuario autenticado con rol `CLIENT` intenta acceder a una ruta protegida de cultivo (p. ej., `/operations/control` o `/lab/recipes`). | El *middleware* de seguridad de Next.js intercepta la solicitud, deniega el acceso con código HTTP 403 Forbidden y redirige al cliente a la página principal de la tienda con una notificación de privilegios insuficientes. |

**Relaciones:**
* **Incluye:** Verificación de políticas de contraseñas y sanitización de entradas.
* **Extiende:** Cierre de sesión seguro (`/auth/signout`) y recuperación de credenciales.
* **Interfaces Asociadas:** Pantallas de autenticación y perfiles formalizados en la Tabla Ap-H1 del Apéndice H.

---

### Caso de Uso CU02: Exploración del Catálogo Botánico, Selección de Especímenes y Formalización de Pedidos Multimoneda

#### Tabla Ap-J3. *Caso de uso CU02: Exploración de catálogo botánico, selección de especímenes y formalización de pedidos multimoneda*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU02` - Exploración del catálogo botánico, selección de especímenes y formalización de pedidos multimoneda. |
| **Actores:** | Cliente (Primario), Cultivador / Administrador (Secundario), Servicio de Notificaciones (Secundario). |
| **Propósito:** | Facilitar al comprador la consulta botánica estructurada, la selección de ejemplares vivos con stock garantizado en mesa y el checkout multimoneda con canalización directa por WhatsApp. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF02, RF03, RF04, RF05, RF06, RNF06. |
| **Precondiciones:** | Existen variantes comerciales configuradas con especímenes biológicos activos en estado disponible (`AVAILABLE`) en las mesas del orquideario. |
| **Postcondición Exitosa:** | Se genera una orden de compra persistida con estado `PENDING`, se sincroniza el stock comprometido y el comprador transmite el comprobante mediante enlace interactivo a WhatsApp para la conciliación del cultivador. |
| **Postcondición de Fallo:** | La orden no se consolida, el carrito retiene los artículos sin descontar inventario y se notifica al usuario la causa (p. ej., agotamiento imprevisto de ejemplares vivos). |
| **Resumen:** | El cliente navega por la tienda pública, filtra orquídeas por género y atributos florales, selecciona una especie y tamaño de maceta, agrega el producto al carrito de compras, suministra sus datos de facturación y entrega, y formaliza el pedido mediante pago multimoneda, enviando el comprobante de liquidación al cultivador vía mensajería asistida. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El cliente navega a la sección `/category/plants` o ejecuta una búsqueda por género (p. ej., *Cattleya* o *Dendrobium*). | El sistema consulta el catálogo botánico en PostgreSQL y renderiza la cuadrícula de productos con miniaturas, rangos de precio y badges de disponibilidad. |
| 2 | El cliente selecciona una especie de interés ingresando a `/plant/[slug]`. | El sistema despliega la ficha taxonómica completa: fotografías botánicas en alta resolución, descripción morfológica, parámetros recomendados de luz/riego y selector dinámico de tamaño de maceta (`PotSize`). |
| 3 | El cliente elige el tamaño de maceta y pulsa el botón *"Añadir al Carrito"*. | El sistema verifica en tiempo real que existan entidades físicas `SeedPlant` vivas en mesa para esa combinación; de ser positivo, añade el ítem al carrito y actualiza el subtotal. |
| 4 | El cliente accede al carrito (`/cart`) y pulsa *"Proceder al Pago"*. | El sistema redirige a la vista `/checkout`, solicitando nombre, teléfono, dirección de entrega (o retiro en vivero) y método de pago preferido (Pago Móvil, Transferencia bancaria o divisas). |
| 5 | El cliente confirma los datos de compra y formaliza la orden. | El sistema crea un registro `Order` con estado `PENDING` en PostgreSQL, reserva temporalmente los ejemplares físicos y redirige a la página de confirmación `/checkout/order/[id]`. |
| 6 | El cliente presiona el botón interactivo *"Notificar Pago vía WhatsApp"*. | El sistema codifica una URL con el esquema `https://wa.me/...` que precarga un mensaje con el número de orden, monto exacto y desglose de plantas para que el cliente adjunte su comprobante bancario. |
| 7 | El cultivador recibe el mensaje en WhatsApp, ingresa al panel `/orders`, corrobora la acreditación bancaria y actualiza el estado a `PAID`. | El sistema transiciona la orden a pagada, emite confirmación y descuenta de forma definitiva los ejemplares `SeedPlant` de la mesa de cultivo. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **3.1** | No existen especímenes vivos disponibles en mesa para el tamaño de maceta seleccionado (`count(SeedPlant) == 0`). | El sistema deshabilita el botón de compra, exhibe la etiqueta *"Agotado en mesa"* y ofrece un campo interactivo para suscribirse a avisos de reposición. |
| **7.1** | El cliente no remite el comprobante de pago o este no se acredita en las cuentas bancarias tras 48 horas. | El cultivador marca la orden como `CANCELLED` en `/orders`; el sistema anula la reserva y retorna los ejemplares `SeedPlant` al estado general de disponibilidad en mesa. |

**Relaciones:**
* **Incluye:** Cálculo de subtotales, conversión de divisas e inspección reactiva de existencias.
* **Extiende:** Conciliación bancaria manual y registro de ventas directas en mostrador (RF06).
* **Flujo Operativo de Referencia:** Flujo Operativo 5 (Apéndice F, Figuras Ap-F21 a Ap-F24).

---

### Caso de Uso CU03: Administración Taxonómica, Registro de Plantas Individuales (SeedPlant) y Trazabilidad Fenológica

#### Tabla Ap-J4. *Caso de uso CU03: Administración taxonómica, registro de plantas individuales (SeedPlant) y trazabilidad fenológica*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU03` - Administración taxonómica, registro de plantas individuales (`SeedPlant`) y trazabilidad fenológica. |
| **Actores:** | Cultivador / Administrador (Primario). |
| **Propósito:** | Proveer un gemelo digital unívoco para cada espécimen vegetal en maceta física, manteniendo su historia fenológica, estado fitosanitario y ubicación precisa en mesas de cultivo. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF07, RF08, RF09, RNF03. |
| **Precondiciones:** | El cultivador ha iniciado sesión con privilegios administrativos y ha registrado previamente los géneros y especies taxonómicas base. |
| **Postcondición Exitosa:** | La planta física queda individualizada en PostgreSQL con código unívoco, clasificada fenológicamente, ubicada en mesa e integrada al balance de stock comercial. |
| **Postcondición de Fallo:** | La entidad no se crea en la base de datos y se informa al operador el conflicto detectado (p. ej., identificador físico duplicado). |
| **Resumen:** | El cultivador administra el catálogo taxonómico, registra la incorporación de plantas físicas en el orquideario asignando tamaño de contenedor (`PotSize`) y mesa de cultivo, documenta hitos fenológicos (apertura de espata, conteo de botones, días de floración) y califica ejemplares madre o comerciales. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El cultivador ingresa al catálogo botánico (`/inventory/catalog`) y selecciona *"Crear Especie"*. | El sistema despliega el formulario para género, epíteto específico, confort microclimático ($T, HR, Lux$), fotografías y notas agronómicas. |
| 2 | El cultivador guarda la ficha y se traslada a la vista de inventario físico en mesa (`/inventory/stock`). | El sistema persiste la especie botánica y muestra la tabla reactiva con el censo de macetas vivas por mesa y zona de cultivo. |
| 3 | El cultivador pulsa *"Registrar Nueva Planta"* e ingresa los datos del espécimen: especie, tamaño de maceta (#10, #12, #14), estado biológico (`VEGETATIVE`, `SPIKE`, `BLOOMING`), mesa física y fecha de enmacetado. | El sistema valida la integridad de los datos, genera el registro unívoco `SeedPlant` en PostgreSQL y asigna el identificador secuencial. |
| 4 | Durante la evolución del cultivo, el operador accede a `/inventory/stock/[id]` para asentar un hito fenológico. | El sistema presenta la línea de tiempo biológica del espécimen, su historial de floraciones pasadas y el estado actual. |
| 5 | El cultivador introduce la fecha de brote de espata, número de botones florales observados y fecha de apertura de la flor. | El sistema computa los días de longevidad floral acumulados y actualiza el estado de la planta a `BLOOMING`. |
| 6 | El cultivador accede al gestor de variantes comerciales (`/inventory/shop-manager`) y vincula la especie con un precio de venta en USD para ese tamaño de maceta. | El sistema totaliza de forma automática las plantas vivas en estado `AVAILABLE` en las mesas y publica el stock real disponible en la tienda digital. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **3.1** | El operador clasifica una planta como espécimen de reserva genética o planta madre (`MOTHER`). | El sistema marca el registro como no comercializable; el gemelo digital documenta su fenología pero se excluye automáticamente del stock de la tienda pública. |
| **5.1** | Una planta sufre pérdida por plagas o pudrición bacteriana en mesa. | El cultivador transiciona el estado biológico a `DEAD` o `DISCARDED`; el sistema archiva el historial fenológico para analítica de pérdidas y descuenta de inmediato la unidad del inventario vivo. |

**Relaciones:**
* **Incluye:** Validación taxonómica y cálculo de días de vida floral.
* **Extiende:** Sincronización reactiva del stock comercial (CU02).
* **Flujo Operativo de Referencia:** Flujo Operativo 3 (Apéndice F, Figuras Ap-F9 a Ap-F14).

---

### Caso de Uso CU04: Formulación Química de Recetas Compuestas y Programación de Ciclos Agronómicos Rotativos

#### Tabla Ap-J5. *Caso de uso CU04: Formulación química de recetas compuestas y programación de ciclos agronómicos rotativos*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU04` - Formulación química de recetas compuestas y programación de ciclos agronómicos rotativos. |
| **Actores:** | Cultivador / Administrador (Primario). |
| **Propósito:** | Sistematizar la preparación metódica de mezclas nutricionales y fitosanitarias en el laboratorio, garantizando proporciones balanceadas por volumen de tanque y la rotación anti-resistencia de moléculas. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF10, RF11, RF12, RNF03. |
| **Precondiciones:** | El inventario de agroquímicos puros contiene insumos registrados con sus dosis recomendadas y clasificaciones de acción molecular (FRAC / IRAC). |
| **Postcondición Exitosa:** | Se crea la receta balanceada para el volumen objetivo (tanque de 20L), se programa en el calendario del ciclo rotativo y se asienta el historial de aplicaciones realizadas. |
| **Postcondición de Fallo:** | La formulación se rechaza si se detectan incompatibilidades físico-químicas conocidas o diluciones que rebasen los umbrales de fitotoxicidad. |
| **Resumen:** | El cultivador administra los insumos puros concentrados, diseña formulaciones compuestas calculando volúmenes exactos en mililitros o gramos, estructura programas secuenciales rotativos de 4 a 8 pasos para erradicar resistencias en patógenos, y calendariza las aplicaciones en el orquideario. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El cultivador ingresa a `/lab/supplies` para auditar los productos concentrados disponibles (fertilizantes, fungicidas, insecticidas). | El sistema visualiza la tabla de insumos puros con sus ingredientes activos, dosis unitarias ($ml/L$ o $g/L$) y directrices toxicológicas. |
| 2 | El cultivador accede al asistente de mezclas en `/lab/recipes` y pulsa *"Nueva Receta"*. | El sistema despliega el calculador volumétrico interactivo solicitando el nombre de la formulación y el volumen del tanque de aplicación (por defecto 20 litros). |
| 3 | El cultivador agrega insumos a la mezcla seleccionándolos del inventario. | El sistema calcula automáticamente la dosis absoluta proporcional en mililitros o gramos según el volumen de agua fijado y verifica la compatibilidad química. |
| 4 | El cultivador guarda la receta y se traslada a la configuración de programas en `/lab/dosing`. | El sistema persiste la receta en PostgreSQL y presenta el diseñador de secuencias agronómicas rotativas. |
| 5 | El cultivador organiza una secuencia cíclica (p. ej., Paso 1: Fungicida Triazol; Paso 2: Lavado con agua pura; Paso 3: Nutrición foliar equilibrada 20-20-20; Paso 4: Fungicida Estrobirulina). | El sistema valida que exista alternancia en los códigos de grupo de resistencia (FRAC/IRAC) y almacena la estructura secuencial. |
| 6 | En `/lab/dosing-schedules`, el cultivador proyecta la aplicación en días específicos de la semana y asigna las zonas o mesas a tratar. | El sistema asienta las tareas en el calendario proyectado y programa recordatorios visuales e interactivos en el panel central. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **3.1** | El operador selecciona dos insumos con antagonismo químico conocido (p. ej., sales de calcio combinadas con sulfatos concentrados). | El sistema emite una alerta roja bloqueante de incompatibilidad físico-química: *"Riesgo de precipitación de insolubles y fitotoxicidad foliar"*, impidiendo guardar la receta hasta corregir los ingredientes. |
| **6.1** | Sobrevienen condiciones microclimáticas desfavorables el día programado (p. ej., lluvia continua). | El cultivador difiere la aplicación desde el panel; el sistema reajusta la agenda proyectada sin romper el orden correlativo de los pasos del ciclo rotativo. |

**Relaciones:**
* **Incluye:** Cálculo volumétrico estequiométrico y comprobación de tablas de compatibilidad.
* **Extiende:** Activación asistida de la Línea 4 de agroquímicos en el tablero de control (CU06).
* **Flujo Operativo de Referencia:** Flujo Operativo 2 (Apéndice F, Figuras Ap-F6 a Ap-F8).

---

### Caso de Uso CU05: Adquisición Telemétrica Continua, Cálculo Psicrométrico y Detección Algorítmica de Lluvia

#### Tabla Ap-J6. *Caso de uso CU05: Adquisición telemétrica continua, cálculo psicrométrico y detección algorítmica de lluvia*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU05` - Adquisición telemétrica continua, cálculo psicrométrico y detección algorítmica de lluvia. |
| **Actores:** | Sistema Autónomo (Primario), Cultivador / Administrador (Secundario). |
| **Propósito:** | Capturar de forma ininterrumpida las magnitudes ambientales del invernadero, calcular variables ecofisiológicas compuestas e inferir algorítmicamente precipitaciones pluviales en tiempo real. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF13, RF14, RF15, RNF03, RNF06, RNF07, RNF09. |
| **Precondiciones:** | Las estaciones meteorológicas (EMA Exterior y EMA Interior) se encuentran energizadas, enlazadas a la red Wi-Fi local y autenticadas ante el bróker Mosquitto vía MQTTS (puerto 8883). |
| **Postcondición Exitosa:** | Las muestras telemétricas ($T, HR, Lux, VPD$) quedan normalizadas e insertadas en la base de datos temporal InfluxDB, alimentando los buffers del oráculo meteorológico y los dashboards de monitoreo en tiempo real. |
| **Postcondición de Fallo:** | Se reporta la desconexión del nodo en el tópico LWT (*Last Will and Testament*) o se activa la rutina de autorrecuperación física por corte transitorio de alimentación. |
| **Resumen:** | Cada 60 segundos, los nodos embebidos ESP32 adquieren las magnitudes microclimáticas de los sensores digitales (DHT22 y BH1750) y publican tramas estructuradas en el bróker. El servicio `services/ingest` recibe los paquetes, deriva el Déficit de Presión de Vapor ($VPD$), persiste los registros en series de tiempo y abastece al algoritmo pluvial, el cual evalúa gradientes térmicos e higrométricos en ventanas deslizantes para certificar eventos de lluvia. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | Los microcontroladores de EMA Exterior y EMA Interior muestrean sus transductores cada 60 segundos. | El firmware MicroPython estructura las magnitudes escalares ($T, HR, Lux$) y la estampilla temporal en una trama JSON serializada. |
| 2 | Los nodos publican la trama en los tópicos correspondientes: `pristinoplant/telemetria/ema/exterior` e `interior` con QoS 0. | El bróker Mosquitto autentica las credenciales bajo TLS v1.3 y enruta el paquete hacia el servicio consumidor `services/ingest`. |
| 3 | — | El microservicio `services/ingest` valida la estructura del payload, descarta valores espurios o fuera de rango físico y calcula la Presión de Vapor de Saturación ($VP_{\text{sat}}$), la Presión de Vapor Actual ($VP_{\text{act}}$) y el $VPD$ en kilopascales ($kPa$). |
| 4 | — | El servicio persiste la tupla enriquecida en el bucket de series temporales de InfluxDB con retención ilimitada. |
| 5 | — | Los datos se incorporan al buffer deslizante de 30 minutos del Oráculo Meteorológico (`rain-manager.ts`). |
| 6 | — | El algoritmo evalúa las derivadas instantáneas ($-\Delta T_{w}$ y $+\Delta HR_{w}$) frente a los umbrales paramétricos calibrados según la radiación solar; si se superan los criterios de cambio higrométrico, declara formalmente el estado de lluvia inferida. |
| 7 | El cultivador accede a la ruta `/monitoring`. | La interfaz web renderiza los paneles en tiempo real: series temporales interactivas, termohigrómetros psicrométricos y el widget del oráculo pluvial (precipitación actual, acumulada y cese). |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **1.1** | El bus de comunicación I2C o 1-Wire se bloquea por ruido electromagnético o condensación extrema. | El firmware detecta tres lecturas anómalas consecutivas y activa la rutina de autorrecuperación física: conmuta el transistor MOSFET de potencia por 200 ms (*power cycle*), desenergizando los sensores y restableciendo la lectura en frío. |
| **2.1** | Se interrumpe la conectividad Wi-Fi o cae el enlace telemétrico con el bróker. | El bróker Mosquitto despacha el mensaje de testamento (LWT) hacia el tópico de diagnóstico, alertando a la interfaz web sobre la pérdida de señal del nodo. El nodo ESP32 ingresa en ciclo de reintento exponencial aleatorio hasta reconectar. |

**Relaciones:**
* **Incluye:** Cálculo psicrométrico de VPD y validación de rangos biológicos admisibles.
* **Extiende:** Alimentación de datos climáticos al motor de inferencia hídrica (CU07).
* **Flujo Operativo de Referencia:** Flujo Operativo 4 (Apéndice F, Figuras Ap-F15 a Ap-F18).

---

### Caso de Uso CU06: Comando Manual Directo de Actuadores Hidráulicos con Guarda Fail-Safe Local

#### Tabla Ap-J7. *Caso de uso CU06: Comando manual directo de actuadores hidráulicos con guarda fail-safe local*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU06` - Comando manual directo de actuadores hidráulicos con guarda fail-safe local. |
| **Actores:** | Cultivador / Administrador (Primario), Tablero de Potencia / Microcontrolador ESP32 (Secundario). |
| **Propósito:** | Permitir el energizado inmediato y puntual de cualquiera de las cuatro líneas hidráulicas del invernadero bajo directriz humana, garantizando la desconexión física desatendida mediante temporizadores de hardware locales. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF16, RF18, RNF01, RNF04. |
| **Precondiciones:** | El cultivador dispone de sesión autenticada con rol `ADMIN` o `GROWER`, y el nodo actuador del tablero de fuerza se encuentra enlazado al bróker MQTT con estado `ONLINE`. |
| **Postcondición Exitosa:** | La electroválvula del sector seleccionado y el contactor de la bomba de agua de 1 HP se conmutan por el tiempo estipulado, emitiendo acuse de recibo (`ACK`) y registrando la operación en la bitácora histórica. |
| **Postcondición de Fallo:** | La maniobra es rechazada si existe otra tarea hídrica en curso sobre el circuito, o el hardware local desenergiza el contactor preventivamente si expira el tiempo fijado. |
| **Resumen:** | Desde el panel de control manual (`/operations/control`), el cultivador selecciona una línea hidráulica (L1: Nebulización, L2: Aspersión, L3: Humectación de suelo, L4: Dosificación) e indica la duración deseada (por defecto 300 s). El sistema valida la exclusión mutua, despacha la orden vía MQTT con QoS 1 hacia el ESP32, el cual inicializa un temporizador de hardware local y energiza los relés, retornando la confirmación de encendido efectivo. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El cultivador ingresa a `/operations/control` y selecciona la tarjeta de la línea deseada (p. ej., Línea 1 - Nebulización). | El sistema expone el estado de conexión del tablero, la latencia telemétrica y el selector de temporización prefijada. |
| 2 | El cultivador ajusta la duración en segundos (p. ej., 180 s) y pulsa *"Encender Sector"*. | La aplicación web procesa la orden a través de Server Actions y la envía al microservicio `Scheduler`. |
| 3 | — | El `Scheduler` valida que la cola no posea una tarea en estado `RUNNING` que entre en conflicto hidráulico y crea la entrada con estado pendiente en PostgreSQL. |
| 4 | — | El servicio despacha una trama JSON al tópico `pristinoplant/comandos/actuador/linea1` (QoS 1) con la duración explícita. |
| 5 | — | El microcontrolador ESP32 recibe la trama mediante el driver `simple2.py`, inicializa su temporizador de interrupción por hardware (*Hardware Timer*) y conmuta el pin GPIO correspondiente. |
| 6 | — | El módulo de relé energiza la electroválvula de 24VAC y acciona el contactor industrial de 30A acoplado a la bomba de agua de 1 HP. |
| 7 | — | El ESP32 publica inmediatamente una trama de acuse de recibo (`ACK`) en `pristinoplant/estados/actuador/linea1`. |
| 8 | — | El `Scheduler` recibe el `ACK`, transiciona la tarea a `RUNNING` y la propaga por WebSockets/SSE; el panel web despliega una barra de progreso regresiva en tiempo real. |
| 9 | El temporizador local de hardware agota la cuenta regresiva en segundos en el microcontrolador. | El firmware del ESP32 desenergiza los relés de forma autónoma, detiene la impulsión hidráulica, publica el estado `OFF` y el `Scheduler` asienta el cierre exitoso en `TaskLog`. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **1.1** | El cultivador comanda la activación de la Línea 4 (Dosificación Agroquímica). | El sistema interrumpe el despacho directo y abre un modal interactivo de advertencia toxicológica, requiriendo confirmación manual explícita antes de energizar la electroválvula de insumos químicos. |
| **2.1** | Existe una tarea hidráulica activa en ejecución simultánea. | El sistema rechaza el encendido instantáneo para prevenir sobrecarga de presión o caída de caudal en los emisores, notificando: *"Circuito presurizado ocupado. Tarea enviada a la cola diferida"*. |
| **5.1** | Se corta la red Wi-Fi o se pierde el enlace con el servidor en pleno riego. | El temporizador de interrupción por hardware del firmware del ESP32 opera de manera estrictamente local: al alcanzar los segundos ordenados, corta la corriente eléctrica a la bomba y electroválvulas, suprimiendo cualquier riesgo de anegamiento o inundación por desbordamiento. |
| **8.1** | El operador pulsa el botón *"Apagar de Emergencia"* en la interfaz web durante la maniobra. | El sistema despacha una trama prioritaria de corte forzado (`OFF`); el ESP32 conmuta los relés a estado de reposo de forma inmediata y reporta la cancelación. |

**Relaciones:**
* **Incluye:** Verificación de exclusión mutua de líneas y armado de temporizadores *fail-safe*.
* **Extiende:** Cancelación interactiva de maniobras en caliente (RF16) y supervisión en cola (`/operations/queue`).
* **Flujo Operativo de Referencia:** Flujo Operativo 1 (Apéndice F, Figuras Ap-F1 a Ap-F3).

---

### Caso de Uso CU07: Planificación y Ejecución de Riego Autónomo con Veto Deliberativo y Auditoría Inmutable

#### Tabla Ap-J8. *Caso de uso CU07: Planificación y ejecución de riego autónomo con veto deliberativo y auditoría inmutable*

| Campo | Especificación |
| :--- | :--- |
| **Caso de Uso:** | `CU07` - Planificación y ejecución de riego autónomo con veto deliberativo y auditoría inmutable. |
| **Actores:** | Sistema Autónomo (Primario), Cultivador / Administrador (Secundario), Servicio de Notificaciones (Secundario). |
| **Propósito:** | Ejecutar rutinas periódicas de irrigación de manera autónoma, aplicando inteligencia deliberativa para vetar maniobras innecesarias ante lluvia o saturación ambiental, protegiendo las raíces y auditando el balance hídrico. |
| **Tipo:** | Primario / Esencial. |
| **Requerimientos Asociados:** | RF17, RF18, RF19, RNF01, RNF03. |
| **Precondiciones:** | El cultivador ha configurado previamente un cronograma recurrente de riego en `/operations/schedules` con las reglas de guarda ambiental activadas, y el microservicio `Scheduler` opera en ejecución continua 24/7. |
| **Postcondición Exitosa:** | La rutina hídrica es autorizada y ejecutada físicamente si el microclima lo amerita, o es vetada algorítmicamente registrando en la base de datos la causal cuantitativa inmutable y notificando al cultivador. |
| **Postcondición de Fallo:** | Ante inconsistencia telemétrica crítica (ausencia total de datos de sensores en los últimos 60 minutos), el sistema adopta una postura conservadora vetando el riego por precaución agronómica y emitiendo una alerta de diagnóstico. |
| **Resumen:** | Al alcanzarse la ventana temporal de una rutina programada, el motor deliberativo evalúa las condiciones climáticas recientes (lluvia inferida activa, historial pluvial en las últimas 4 horas, humedad relativa interior y días de riego acumulados). Si se constata saturación o lluvia, veta la orden de conmutación y registra el motivo en la bitácora histórica (`TaskLog`). Si el entorno es favorable, autoriza el despacho del comando hacia el nodo actuador y supervisa su ciclo de completitud. |

**Flujo Normal de Eventos:**

| Paso | Acción del Actor | Respuesta del Sistema |
| :---: | :--- | :--- |
| 1 | El microservicio `Scheduler` detecta la coincidencia temporal con una regla cronológica programada (p. ej., Rutina matutina en Línea 2 a las 06:00 AM). | El planificador instancia la tarea y solicita autorización al Motor de Inferencia Hídrica (`water-intelligence.ts`). |
| 2 | — | El motor de inferencia consulta el historial telemétrico reciente en InfluxDB y el estado pluvial del Oráculo Meteorológico. |
| 3 | — | El motor evalúa la matriz paramétrica de veto: verifica si existe lluvia inferida en curso, si se acumuló precipitación en las últimas 4 a 8 horas, o si la humedad relativa interior supera el 85% ($HR_{\text{int}} > 85\%$). |
| 4 | — | Las condiciones ambientales resultan secas y favorables ($HR < 85\%$ y ausencia de precipitación reciente). El motor emite formalmente el estado `AUTHORIZED`. |
| 5 | — | El `Scheduler` despacha la orden de conmutación hacia el actuador del orquideario vía MQTT (QoS 1) indicando la duración prefijada de aspersión. |
| 6 | El tablero físico conmuta la bomba y la electroválvula, emite el `ACK` y desenergiza al completar el ciclo. | El `Scheduler` registra la tarea como `COMPLETED` en la bitácora inmutable (`TaskLog`) de PostgreSQL, indicando volumen estimado y procedencia autónoma. |
| 7 | El Servicio de Notificaciones canaliza un resumen operativo hacia el cultivador informando la finalización exitosa. | El cultivador visualiza en `/operations/history` el registro cronológico del riego ejecutado. |

**Flujos Alternativos y Excepciones:**

| Código | Condición de Desviación | Respuesta / Acción del Sistema |
| :---: | :--- | :--- |
| **4.1** | El motor de inferencia detecta un evento de lluvia inferida activo al momento del ciclo programado. | El motor emite de inmediato un `VETO DELIBERATIVO` por lluvia en curso. El `Scheduler` aborta la maniobra, cancela el despacho del comando MQTT a la electroválvula y asienta la tarea en `/operations/history` con estado `VETOED` y detalle cuantitativo (p. ej., *"Veto pluvial: Lluvia activa detectada por gradiente térmico-higrométrico"*). Se emite alerta al cultivador. |
| **4.2** | No llueve en el instante de evaluación, pero el oráculo certifica lluvia copiosa en las últimas 3 horas ($T_{\text{post-lluvia}} < 4\text{ h}$). | El motor aplica la regla de guarda por remanente hídrico, emitiendo veto deliberativo para prevenir encharcamiento del sustrato de corteza de pino. La orden se registra como `VETOED` (p. ej., *"Veto preventivo: Precipitación reciente registrada hace 2.8 horas"*). |
| **4.3** | La humedad relativa interior bajo malla sombra excede el umbral crítico del 85% ($HR_{\text{int}} > 85\%$). | El motor inhibe la activación de las líneas de nebulización y aspersión para prevenir la proliferación de colonias fungosas (*Cercospora* y *Phytophthora*). Se asienta el veto agronómico en la bitácora. |
| **4.4** | La temperatura supera los 34 °C con humedad moderada ($VPD > 1.8\text{ kPa}$). | El motor autoriza un pulso corto de enfriamiento pasivo sobre la Línea 3 (humectación de piso de piedra picada), refrigerando el entorno por evaporación sin humedecer la masa foliar ni comprometer la sanidad botánica. |

**Relaciones:**
* **Incluye:** Consulta analítica sobre series de tiempo y evaluación de matrices booleanas de decisión.
* **Extiende:** Emisión de advertencias meteorológicas multicanal al operador (RF19).
* **Flujo Operativo de Referencia:** Flujo Operativo 1 y Flujo Operativo 4 (Apéndice F, Figuras Ap-F4, Ap-F5 y Ap-F17).

---

Con la especificación formal de estos siete casos de uso concluye el **Apéndice J**, consolidando el marco de requerimientos operacionales y contratos de interacción que aseguran la trazabilidad, confiabilidad y resiliencia de la plataforma de agricultura inteligente PristinoPlant.
