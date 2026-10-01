# Apéndices

## Apéndice H: Manual de Usuario y Procedimientos de Operación

El presente manual de usuario establece las directrices operativas, secuencias de interacción paso a paso y protocolos de seguridad requeridos para el uso efectivo de la plataforma PristinoPlant. Está estructurado para guiar tanto al cultivador botánico en la administración integral del orquideario como al cliente final en la adquisición de plantas a través de la tienda digital.

---

### 1. Perfiles de Usuario y Control de Acceso (RBAC)

La plataforma gobierna las autorizaciones operativas mediante un esquema de control de acceso basado en roles gestionado por Better-Auth.

#### Tabla Ap-H1. *Matriz de perfiles de usuario, roles y permisos de acceso*

| Perfil de Usuario | Rol del Sistema | Alcance y Responsabilidades | Vistas y Rutas Autorizadas |
| :--- | :--- | :--- | :--- |
| **Cultivador Administrador** | `ADMIN` / `GROWER` | Gobierno integral: comando hidráulico, programación, formulación en laboratorio, inventario de mesas y conciliación de ventas. | Acceso completo a `/operations/*`, `/monitoring`, `/lab/*`, `/catalog`, `/stock`, `/orders` y administración. |
| **Operador de Riego** | `OPERATOR` | Supervisión climática en tiempo real, comando manual de emergencia y consulta de la cola activa de tareas hídricas. | Acceso restringido a `/operations/control`, `/operations/queue` y `/monitoring`. |
| **Cliente / Comprador** | `CLIENT` / `PUBLIC` | Exploración de la colección botánica, selección de ejemplares vivos disponibles en mesa y formalización de compras. | Acceso público a `/category/*`, `/plant/*`, `/cart` y formalización de checkout. |

---

### 2. Procedimientos de Operación del Circuito Hidráulico (`/operations`)

#### 2.1 Conmutación Manual Directa de Actuadores (`/operations/control`)
Permite energizar de forma inmediata cualquiera de las 4 líneas hidráulicas del orquideario:
1. Ingrese a la ruta `/operations/control`.
2. Ubique la tarjeta del sector requerido:
   * **Línea 1:** Nebulización (*foggers*) para humedad ambiental.
   * **Línea 2:** Aspersión principal rotativa sobre mesas de cultivo.
   * **Línea 3:** Humectación de piso para enfriamiento pasivo sin mojar hojas.
   * **Línea 4:** Dosificación fitosanitaria aislada.
3. Seleccione la duración deseada en el menú desplegable (60, 180, 300 o 600 segundos).
4. Pulse el botón de encendido. La tarjeta mostrará un indicador luminoso y una barra regresiva en tiempo real. Al recibir la orden, el hardware activa su temporizador fail-safe para garantizar el apagado local ante caídas de red.
5. **Protocolo de Seguridad para Línea 4 (Agroquímicos):** Al intentar activar la Línea 4, el sistema abre automáticamente un modal de advertencia toxicológica. El operador debe confirmar la mezcla química preparada antes de que el sistema energice la electroválvula de 24VAC.

#### 2.2 Gestión de Colas y Parada de Emergencia (`/operations/queue`)
Permite supervisar maniobras activas y abortar operaciones ante imprevistos físicos:
1. Ingrese a `/operations/queue` para visualizar las tareas en ejecución inmediata (`RUNNING`) y en espera (`PENDING`).
2. **Detención de Emergencia:** Si detecta una fuga en tuberías o anomalía en campo, presione el botón rojo de *Detención de Emergencia*. El sistema despacha una orden prioritaria vía MQTT que desenergiza el contactor de la bomba y las electroválvulas en menos de un segundo, cancelando la maniobra.

#### 2.3 Programación de Rutinas Recurrentes con Guardas Ambientales (`/operations/schedules`)
Permite automatizar cronogramas semanales desatendidos:
1. En `/operations/schedules`, pulse *"Nueva Rutina de Riego"*.
2. Asigne un nombre descriptivo (ej. *"Aspersión Matutina Mesas A"*), seleccione los días de la semana y la hora exacta de ejecución.
3. Defina la duración en minutos y la línea hidráulica a energizar.
4. Active las **Guardas Ambientales**:
   * *Veto por Lluvia:* Inhibe el riego si el motor meteorológico detecta lluvia activa o lluvia en las últimas 4 horas.
   * *Alternancia Interdiaria:* Cancela la aspersión si el día previo llovió ($\ge 20\text{ min}$) o se completó un riego.
   * *Límite de Saturación:* Bloquea la rutina si la humedad relativa interior supera el 85%.
5. Guarde la rutina. El servicio `Scheduler` asumirá la deliberación automática 24/7.

#### 2.4 Auditoría de Maniobras y Vetos Deliberativos (`/operations/history`)
Permite certificar la trazabilidad inmutable del invernadero:
1. Ingrese a `/operations/history` para examinar la línea de tiempo interactiva.
2. Cada tarjeta documenta la fecha y hora exacta, la línea hidráulica conmutada, el actor emisor (manual o planificador autónomo) y la duración real.
3. En caso de una tarea inhibida, la tarjeta expone el estado `VETOED` y el motivo cuantitativo emitido por el motor (ej. *"Veto por lluvia activa"* o *"Humedad $\ge 85\%$ en las últimas 4 horas"*).

---

### 3. Procedimientos de Laboratorio y Dosificación Agronómica (`/lab`)

#### 3.1 Formulación y Cálculo Volumétrico de Recetas (`/lab/recipes`)
1. Ingrese a `/lab/recipes` y pulse *"Nueva Receta"*.
2. Asigne un nombre a la formulación (ej. *"Fertilización Balanceada Crecimiento"*) e ingrese el volumen total de agua del tanque presurizado (por defecto 20 litros).
3. Agregue los insumos concentrados requeridos desde el catálogo de insumos puros (`/lab/supplies`).
4. El sistema calcula automáticamente los gramos o mililitros exactos a disolver. Si selecciona componentes con incompatibilidad química conocida (como Nitrato de Calcio junto a Sulfatos), el sistema bloquea el guardado para evitar la precipitación de sales insolubles que colmaten las electroválvulas.

#### 3.2 Programación de Ciclos Rotativos Anti-Resistencia (`/lab/dosing`)
1. Ingrese a `/lab/dosing` para estructurar la secuencia de aplicaciones.
2. Defina los pasos del ciclo rotativo (ej. Paso 1: Fungicida; Paso 2: Lavado con agua pura; Paso 3: Fertilizante; Paso 4: Insecticida). El sistema verifica que se alternen los códigos de resistencia molecular (FRAC / IRAC).
3. En `/lab/dosing-schedules`, proyecte las fechas de aplicación sobre el calendario y asigne las mesas de cultivo a tratar.

---

### 4. Procedimientos de Catálogo Botánico e Inventario Físico

#### 4.1 Alta y Parametrización de Especies (`/catalog`)
1. En la cabecera de `/catalog`, gestione tipos taxonómicos (`PlantType`) y géneros (`PlantGenus`).
2. Abra el modal de alta rápida de especies: seleccione el tipo y género mediante menús en cascada, ingrese el nombre específico y redacte la descripción morfológica. El formulario retiene borradores automáticamente para evitar pérdidas accidentales.
3. Ingrese al detalle de la especie (`/catalog/[slug]`):
   * Utilice el selector cromático inteligente para fijar el color dominante de la flor (`glowColor`).
   * Suba fotografías en alta resolución a la galería en Cloudflare R2, reordénelas mediante arrastre (*drag & drop*) y designe la imagen de portada mediante el botón *Destacar*.

#### 4.2 Registro de Ejemplares en Mesas y Fenología (`/stock`)
1. En `/stock`, pulse *"Registrar Nueva Planta"*.
2. Asigne la especie, el tamaño de contenedor (`PotSize`: Nro 5, Nro 7, Nro 10 o Nro 14), la ubicación física (Zona y Mesa) y el estado biológico inicial (`VEGETATIVE`, `SPIKE`, `BLOOMING`).
3. En la ficha individual de la maceta (`/stock/[id]`), asiente las fechas de brote de vara, apertura de flores y senescencia para alimentar el benchmark histórico de floración de la especie.
4. En `/shop-manager`, vincule el precio en USD a la variante comercial. El stock disponible para la tienda pública se calculará automáticamente sumando las macetas vivas registradas en las mesas.

---

### 5. Procedimientos Comerciales y Atención al Cliente

#### 5.1 Flujo de Compra para Clientes (Tienda Digital Pública)
1. El cliente accede al catálogo público en `/category/plants`, utiliza el buscador por texto y aplica filtros taxonómicos por género (*Cattleya*, *Phalaenopsis*, *Dendrobium*, etc.).
2. En la ficha de producto (`/plant/[slug]`), examina la galería fotográfica y selecciona el tamaño de maceta deseado. Si la variante cuenta con macetas disponibles en mesa, presiona *"Añadir al Carrito"*.
3. Accede al carrito interactivo (`/cart`), verifica los subtotales en dólares y pulsa *"Proceder al Pago"*.
4. En `/checkout`, ingresa sus datos de contacto, selecciona la modalidad de entrega (retiro en orquideario o despacho a domicilio) y elige el método de pago preferente (Pago Móvil, Transferencia bancaria o divisas en efectivo).
5. En la pantalla de confirmación (`/checkout/order/[id]`), presiona el botón interactivo *"Notificar Pago vía WhatsApp"*, el cual precarga un mensaje estructurado con el número de orden y monto exacto para que el comprador envíe su comprobante de pago.

#### 5.2 Conciliación de Pagos y Despacho (`/orders`)
1. El cultivador recibe el mensaje en WhatsApp, ingresa a `/orders` y localiza el pedido por su número de orden.
2. Corrobora la acreditación de los fondos en las cuentas bancarias del vivero y actualiza el estado de la orden a `PAID`.
3. Al entregar las plantas al comprador, transiciona el estado a `DELIVERED`; el sistema descuenta de forma definitiva las macetas físicas correspondientes en la matriz de inventario de mesas.
4. Para clientes presenciales que compren directamente en el vivero, el cultivador utiliza el módulo de venta directa en mostrador (`/orders/sales`).