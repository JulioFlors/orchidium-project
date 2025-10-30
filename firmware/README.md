# ORCHIDIUM PROJECT: Sistema de Gestión de Invernaderos Inteligente

Este markdown contiene el código y la documentación para el firmware de los nodos IoT del proyecto ORCHIDIUM, desarrollado en MicroPython para microcontroladores ESP32.

El objetivo de este firmware es monitorear variables ambientales (temperatura, humedad, luz) y controlar actuadores (sistema de riego) en un invernadero de orquídeas, comunicándose a través del protocolo MQTT.

## 📋 Índice

1. [Entorno de Desarrollo](#️-entorno-de-desarrollo)
2. [Configuración del ESP32](#-configuración-del-esp32)
3. [DOC mpremote & mprun](#-doc-mpremote--mprun)
4. [Configuración del Broker MQTT](#-configuración-del-broker-mqtt)
5. [Pruebas con MQTT Explorer](#-pruebas-con-mqtt-explorer)
6. [Componentes Electrónicos](#-componentes-electrónicos)
   * [Sensor de Temperatura y Humedad (DHT22)](#sensor-de-temperatura-y-humedad-dht22)
   * [Sensor de Luz Ambiental (BH1750)](#sensor-de-luz-ambiental-bh1750)
   * [Módulo Relé de 4 Canales](#módulo-relé-de-4-canales)
   * [Sensor de Lluvia (MH-RD)](#-sensor-de-lluvia-mh-rd)
   * [Transductor de Presión de Agua (150 PSI)](#transductor-de-presión-de-agua-150-psi)
7. [Arquitectura IoT: Procesamiento en el Borde y Lógica Centralizada](#-arquitectura-iot-procesamiento-en-el-borde-y-lógica-centralizada)

---

## 🖥️ Entorno de Desarrollo

### Requisitos Previos

Antes de empezar, asegúrate de tener instalado el siguiente software:

* **Python 3.x:** [Descargar Python](https://www.python.org/downloads/).
* **Herramientas de Python:** Instala `esptool` y `mpremote` globalmente desde tu terminal.

    ```bash
    pip install esptool
    pip install mpremote
    ```

* **Firmware de MicroPython:** Descarga el archivo `.bin` estable más reciente para ESP32.
  * [Descargar Firmware](https://micropython.org/download/esp32/)

* **Docker Desktop:** Necesario para ejecutar el broker MQTT de forma aislada.
  * [Descargar Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 🔧 Configuración del ESP32

Este proceso se realiza una sola vez por cada ESP32 nuevo o cuando se desea actualizar el firmware.

### Flashear el Firmware de MicroPython

Esto borrará completamente la memoria del ESP32 e instalará el sistema operativo MicroPython.

**Borrar la memoria flash:**

```bash
esptool erase-flash
```

**Escribir el nuevo firmware:**

```bash
# Reemplaza la ruta con la ubicación de tu archivo .bin
esptool write-flash 0x1000 C:\Dev\pristinoplant\firmware\ESP32_2025-08-09_v1.26.0.bin
```

### 📚 Instalar Librerías Necesarias

Usamos la herramienta **`mpremote`** para instalar las librerías que nuestro código necesita en los dispositivos MicroPython.

> **Importante:** La instalación de librerías debe hacerse solo en el dispositivo que las necesite.
>
> * **Actuator Controller Firmware** (Relay Modules): **MQTT**.
> * **Environmental Monitoring Firmware** (Sensors): **MQTT** y **BH1750**.

### Librería ASÍNCRONA para MQTT (`umqtt.simple2`)

Esta librería es **requerida** tanto para el **Actuator Controller** como para el **Environmental Monitoring** para la comunicación **MQTT**.

#### Opción 1: Clonar y Copiar la Librería Oficial (Recomendada si necesitas la última versión)

1. **Clona el Repositorio de la Librería `umqtt.simple2`:**

    ```bash
    git clone https://github.com/fizista/micropython-umqtt-simple2.git
    ```

2. **Navega al Directorio de la Versión Minificada (Recomendado para ahorrar espacio):**

    ```bash
    cd .\micropython-umqtt-simple2\src_minimized
    ```

3. **Crea el Directorio `/lib` en el Dispositivo (si no existe):**

    ```bash
    mpremote mkdir :lib
    ```

4. **Carga todos los archivos del directorio a `/lib/umqtt` dentro del Dispositivo:**

    ```bash
    mpremote cp -r . :lib/umqtt
    ```

#### Opción 2: Usar los Archivos Proporcionados con el Proyecto (Recomendada para la compatibilidad con el proyecto)

Los archivos de la librería **ya están incluidos** en la ruta local `firmware\lib` del proyecto.

1. **Navega al directorio de la librería umqtt:**

    ```bash
    cd .\firmware\lib\umqtt\
    ```

2. **Crea el Directorio `/lib` en el Dispositivo (si no existe):**

    ```bash
    mpremote mkdir :lib
    ```

3. **Carga la Carpeta `umqtt` dentro del Directorio `/lib` del Dispositivo:**

    ```bash
    mpremote cp -r umqtt :lib/
    ```

### 💡 Librería del Sensor de Luz (`BH1750`)

Esta librería es **exclusiva** para el **Environmental Monitoring Firmware**.

La librería es proporcionada con el proyecto en la ruta: `firmware\lib\bh1750`

El código fuente se obtuvo de este repositorio: [https://github.com/PinkInk/upylib/blob/master/bh1750/bh1750/**init**.py](https://github.com/PinkInk/upylib/blob/master/bh1750/bh1750/__init__.py)

**Instalación:**

1. **Navega al directorio de la librería bh1750:**

    ```bash
    cd .\firmware\lib\bh1750\
    ```

2. **Crea el Directorio `/lib` en el Dispositivo (si no existe):**

    ```bash
    mpremote mkdir :lib
    ```

3. **Carga la Carpeta `bh1750` dentro del Directorio `/lib` del Dispositivo:**

    ```bash
    mpremote cp -r bh1750 :lib/bh1750
    ```

---

## 🚀 DOC `mpremote` & `mprun`

`mpremote` es la herramienta principal para interactuar con el ESP32.

### Inspección del Sistema de Archivos

Se hace uso de `mpremote` para inspeccionar el contenido de un directorio dentro del ESP32:

```bash
# Lista el contenido del directorio raíz
mpremote ls

# Del subdirectorio `lib` o mas profundo lib/<path>
mpremote ls lib
```

### Eliminación de Archivos y Directorios

Se utiliza el comando fs rm para eliminar.

```bash
# Eliminar un archivo específico del directorio raíz
mpremote fs rm :main.py

# Eliminar un archivo dentro de un subdirectorio (ej. el módulo simple.py)
mpremote fs rm :lib/umqtt/simple.py

# Eliminar un directorio y todo su contenido (REQUIERE 
-r de forma recursiva)
mpremote fs rm -r :lib/umqtt

# Eliminar un directorio vacío
mpremote fs rmdir :mis_archivos_temporales
```

### Comandos principales

* **Copiar un archivo al ESP32:**
  Copia tu `main.py` local al directorio raíz (`:/`) del dispositivo.

  ```bash
  mpremote fs cp main.py :/
  ```

* **Reiniciar el ESP32:**
  Al reiniciar, se ejecutará automáticamente `main.py`.

  ```bash
  mpremote reset
  ```

* **Conectar y abrir la consola interactiva (REPL):**

  ```bash
  mpremote repl
  ```

### Crear Comando Personalizado `mprun`

Si bien se puede concatenar varias acciones para un ciclo de desarrollo rápido: **copia, reinicia y muestra la salida.**

```bash
mpremote fs cp main.py :/ ; mpremote reset ; mpremote repl
```

Se puede crear un Comando Personalizado `mprun` para simplificar este proceso:

#### 1. Encuentra o crea tu archivo de perfil

```bash
# Primero, comprueba si el archivo existe
Test-Path $PROFILE

# Si la respuesta es 'False', crea el archivo con este comando
New-Item -Path $PROFILE -ItemType File -Force
```

#### 2. Edita el archivo de perfil

```bash
code $PROFILE
```

#### 3. Añade la función `mprun`

```bash
# Función para flashear, reiniciar y conectar al REPL de un ESP32 con mpremote
function mprun {
    param(
        # El archivo a subir. Por defecto es 'main.py' si no se especifica ninguno.
        [string]$file = "main.py"
    )

    Write-Host "Subiendo archivo: $file" -ForegroundColor Green
    mpremote connect auto fs cp $file :/

    Write-Host "Reiniciando dispositivo" -ForegroundColor Yellow
    mpremote connect auto reset

    Write-Host "Conectando REPL | Ctrl+C para detener | Ctrl+X para salir |" -ForegroundColor DarkBlue
    mpremote connect auto repl
}
```

### 🎨 Paleta de Colores para la terminal de Python

```python
class Colors:
    """Clase para almacenar códigos de color ANSI para la terminal."""
    # Atributos de Estilo
    RESET = '\x1b[0m'
    BOLD = '\x1b[1m'
    UNDERLINE = '\x1b[4m'

    # Colores de Texto (Brillantes / Intensos)
    BLACK = '\x1b[90m'
    RED = '\x1b[91m'
    GREEN = '\x1b[92m'
    YELLOW = '\x1b[93m'
    BLUE = '\x1b[94m'
    MAGENTA = '\x1b[95m'
    CYAN = '\x1b[96m'
    WHITE = '\x1b[97m'

# Ejemplo de uso
print(f"{Colors.YELLOW}.{Colors.RESET}")
```

---

## 📡 Configuración del Broker MQTT

Implementaremos en `Docker` una Imagen de Eclipse Mosquitto™ un broker MQTT de código abierto.

### Crear Archivo de Configuración

Las versiones recientes de Mosquitto (v2.0+) requieren un archivo de configuración para permitir conexiones desde otros dispositivos en la red.

1. En la raíz del proyecto, crea la siguiente estructura de carpetas: `mosquitto/config/`
2. Dentro de `config`, crea `mosquitto.conf`
3. Pega el siguiente contenido:

    ```conf
    # Permite que cualquier dispositivo en la red se conecte
    listener 1883

    # Permite conexiones sin usuario/contraseña (ideal para desarrollo)
    allow_anonymous true
    ```

### Levantar el Contenedor de Docker

Este comando inicia el broker MQTT y enlaza nuestro archivo de configuración para que sea utilizado por el contenedor.

```bash
# Reemplaza `<PATH>` por la ruta absoluta de tu carpeta de trabajo.
docker run -p 1883:1883 -p 9001:9001 -v <PATH>\mosquitto\config:/mosquitto/config --name broker-mqtt eclipse-mosquitto

# Ejemplo
docker run -p 1883:1883 -p 9001:9001 -v C:\Dev\IOT\PristinoPlant\mosquitto\config:/mosquitto/config --name broker-mqtt eclipse-mosquitto
```

> **Decoradores alternativos:**
>
> * `-it`: Abre la terminal del contenedor.
> * `-d`: Ejecuta el contenedor en segundo plano.

---

## 🧪 Pruebas con MQTT Explorer

[MQTT Explorer](http://mqtt-explorer.com/) es una herramienta gráfica indispensable para depurar y interactuar con sistemas IoT. Permite visualizar todos los mensajes del broker en tiempo real y enviar comandos para probar la reacción de los dispositivos.

### 1. Conexión al Broker

* Abre MQTT Explorer.
* Crea una nueva conexión con los siguientes datos:
  * **Host:** `192.168.1.5` (la IP de tu broker MQTT).
  * **Port:** `1883`.
* Haz clic en **Connect**.

### 2. Verificar el Estado de los Actuadores (Rol de Receptor)

Una vez conectado y con el ESP32 de actuadores en funcionamiento, verás aparecer automáticamente la estructura de tópicos en el panel izquierdo. Esto te permite monitorear el estado de cada componente en tiempo real.

▼ PristinoPlant
▼ Actuator_Controller
▶ status: online
▼ irrigation
▼ state
▼ valve
▶ main_water: OFF
▶ agrochemical: OFF
▶ fogger: OFF
▶ ... (etc.)
▶ pump: OFF

* Puedes hacer clic en cualquier tópico de estado (ej. `pump`) para ver su valor actual (`ON`/`OFF`).

### 3. Enviar Comandos de Control (Rol de Transmisor)

Para controlar los relés, usaremos la función de publicación de MQTT Explorer para enviar mensajes **JSON** al tópico de comandos.

1. **Localiza la sección `Publish`** en la esquina superior derecha.
2. Asegúrate de que el formato del `payload` esté configurado como **`JSON`**.
3. Escribe el **`JSON`**.
4. Haz clic en el botón azul **`Publish`** (o `Ctrl + Enter`).

#### Comandos Disponibles

**Tópico de Comando (siempre el mismo):**
`PristinoPlant/Actuator_Controller/irrigation/command`

**a) Encender/Apagar un Actuador Individual:**

* **Payload (mensaje):** Usa un objeto JSON con las claves `actuator` y `state`.
* `actuator`: Puede ser el **número de ID** (ej. `3`) o el **nombre** del actuador en `string` (ej. `"pump"`).
* `state`: Debe ser `"ON"` o `"OFF"` (no es sensible a mayúsculas/minúsculas).

  **Ejemplo para encender la bomba (actuador 3):**

  ```json
  {
    "actuator": "pump",
    "state": "on"
  }
  ```

**b) Iniciar un Riego Temporizado:**

* **Payload (mensaje):** Añade la clave `duration` con el tiempo en segundos.

  **Ejemplo para encender la válvula de aspersión (actuador 6) por 10 minutos (600 segundos):**

  ```json
  {
    "actuator": 1,
    "state": "on",
    "duration": 60
  }
  ```

  *El firmware se encargará de apagar automáticamente este actuador después del tiempo especificado.*

#### Resultados Esperados

* **Físico:** El relé correspondiente hará "clic" y se activará/desactivará.
* **REPL del ESP32:** Verás los logs de "Mensaje Recibido" y la acción ejecutada (ej. "Actuador 3: ENCENDIDO").
* **MQTT Explorer:** Verás cómo el tópico de estado del actuador específico (ej. `.../irrigation/state/pump`) se actualiza instantáneamente al nuevo estado (`ON` u `OFF`).

Este proceso te permite verificar el ciclo completo de control: envías un comando, el ESP32 lo recibe y actúa, y luego reporta su nuevo estado de vuelta al broker.

---

## 🧩 Componentes Electrónicos

A continuación se detalla cómo conectar cada uno de los sensores y actuadores al microcontrolador ESP32.

### Sensor de Temperatura y Humedad (DHT22)

Este sensor digital mide la temperatura ambiente y la humedad relativa.

#### 📚 Librería (dht)

La librería para este sensor se puede instalar directamente con `mpremote`.

```bash
mpremote mip install dht
```

#### 🔌 Conexión (dht)

| Pin del DHT22 | Conectar a | Pin del ESP32 | Código |
| :------------------ | :------------- | :-------------------- | :----------------- |
| **`+` / `VCC`**       | Alimentación 3.3V | **`3V3`**             | -                  |
| **`-` / `GND`**       | Tierra         | **`GND`**             | -                  |
| **`OUT` / `DATA`**    | Datos Digitales | **`GPIO 4`**          | `Pin(4)`           |

---

### Sensor de Luz Ambiental (BH1750)

Este sensor digital mide la intensidad lumínica en Lux utilizando el protocolo de comunicación I2C.

#### 📚 Librería (BH1750)

MicroPython no tiene un driver nativo para el BH1750, así que se requiere descargar una librería externa.

1. **Descarga el archivo:** [`bh1750.py`](https://github.com/PinkInk/upylib/blob/master/bh1750/bh1750/__init__.py)

2. **Sube la librería al ESP32** a la carpeta `/lib`.

    ```bash
    mpremote fs cp bh1750.py :/lib/
    ```

#### 🔌 Conexión (BH1750)

| Pin del BH1750 | Conectar a | Pin del ESP32 | Propósito                                       |
| :------------------ | :------------ | :--------------------- | :---------------------------------------------- |
| **`VCC`**           | Alimentación  | **`3V3`**            | Provee el voltaje de 3.3V que necesita el sensor. |
| **`GND`**           | Tierra        | **`GND`**            | Establece la referencia de tierra común.        |
| **`SCL`**           | Reloj I2C     | **`GPIO 22`** | Pin I2C SCL por defecto del ESP32.              |
| **`SDA`**           | Datos I2C     | **`GPIO 21`** | Pin I2C SDA por defecto del ESP32.              |

---

### Módulo Relé de 4 Canales

Este módulo actúa como un conjunto de interruptores controlados electrónicamente, permitiendo que el ESP32 (con señales de bajo voltaje) controle dispositivos de alto voltaje como las electroválvulas de 24V AC.

#### 🔌 Conexión (Módulo Relé)

| Pin del Relé | Conectar a | Pin del ESP32 | Código |
| :------------------ | :-------------- | :-------------------- | :----------------- |
| **`D-` / `GND`**    | Tierra          | **`GND`**           | -                |
| **`D+` / `VCC`**    | Alimentación 5V | **`VIN`**           | -                |
| **`IN1`**         | Señal Canal 1   | **`GPIO 5`**        | `Pin(5)`           |

> **⚠️ ¡Importante sobre la Alimentación!**
> Se debe usar el pin **`VIN`** del ESP32 para alimentar el relé. Este pin proporciona los ~5V directos del USB, necesarios para activar la bobina del relé de forma fiable. Usar `3V3` puede causar inestabilidad y reinicios.

#### ⚙️ Configuración del Jumper

* El Módulo Relé tiene un jumper para seleccionar la lógica de activación:

  * **Jumper en `L` (Low Trigger):** El relé se activa con una señal `LOW` (0). `Pin.value(0)` lo enciende.

  * **Jumper en `H` (High Trigger):** El relé se activa con una señal `HIGH` (1). `Pin.value(1)` lo enciende.

* El firmware actual está configurado para **High Trigger**. Asegúrate de que el jumper esté en la posición **`H`**.

---

### ☔ Sensor de Lluvia (MH-RD)

Este sensor detecta la presencia de gotas de agua. Utilizaremos su salida digital para una detección clara de "inicio" y "fin" de un evento de lluvia, permitiendo calcular su duración.

#### 🔌 Conexión (Sensor de Lluvia)

| Pin del Módulo | Conectar a | Pin del ESP32 | Código |
| :-------------------- | :--------------- | :-------------------- | :----------------- |
| **`VCC`**               | Alimentación 3.3V | **`3V3`**             | -                  |
| **`GND`**               | Tierra           | **`GND`**             | -                  |
| **`D0`**                | Salida Digital   | **`GPIO 32`**         | `Pin(32)`          |

#### 🔧 Calibración

* El módulo tiene un potenciómetro (tornillo azul) para ajustar la sensibilidad. Gíralo hasta que el LED de estado (`PWR`) en el módulo se encienda justo cuando las primeras gotas de agua toquen la placa sensora.

---

### Transductor de Presión de Agua (150 PSI)

Este transductor analógico mide la presión en la línea de riego, útil para detectar si hay flujo de agua o posibles fugas.

#### 🔌 Conexión con Divisor de Voltaje

> **⚠️ ¡Advertencia!**
> Este sensor opera a 5V y su señal de salida puede alcanzar hasta 4.5V. Conectar esta señal directamente a un pin del ESP32 **lo dañará permanentemente**, ya que sus pines solo toleran 3.3V. Es **obligatorio** usar un divisor de voltaje.

**Componentes Adicionales:**

* Resistencia 1 (R1): **12kΩ**
* Resistencia 2 (R2): **22kΩ**

| Cable del Sensor | Conectar a | Pin del ESP32 | Código |
| :--------------- | :------------------------------ | :------------------------- | :----------------- |
| **Rojo (`+5V`)** | Alimentación 5V                 | **`VIN`**                | -                |
| **Negro (`GND`)** | Tierra                          | **`GND`**                | -                |
| **Verde (`Signal`)**| Resistencia R1 (12kΩ)           | -                        | -                |
| -              | Unión de R1 y R2                | **`GPIO 34`**            | `ADC(Pin(34))`     |
| -              | Otro extremo de R2 (22kΩ)       | **`GND`**                | -                |

---

## 🧠 Arquitectura IoT: Procesamiento en el Borde y Lógica Centralizada

---

Para crear un sistema de riego verdaderamente inteligente, la lógica de negocio no reside en un solo lugar, sino que se distribuye estratégicamente entre los dispositivo de campo (ESP32) y el servidor (Backend).

Esta sección detalla el flujo de trabajo y las responsabilidades de cada componente para transformar los datos crudos de los sensores en decisiones informadas.

### Principio de Diseño: Responsabilidades Claras

#### ESP32 (Edge Computing)

Actúa como un **reportero de campo en tiempo real**. Su responsabilidad es interactuar directamente con el hardware, detectar eventos físicos y convertir las lecturas de los sensores en métricas claras y discretas. Es reactivo, inmediato y se enfoca en el **"qué está pasando ahora"**.

#### Backend (Servidor)

Actúa como el **centro de inteligencia y memoria a largo plazo**. Su responsabilidad es recibir las métricas, almacenarlas con un registro de tiempo, analizar tendencias y aplicar reglas de negocio complejas para tomar decisiones estratégicas. Se enfoca en el **"qué significa esto a lo largo del tiempo"**.

---

### Flujo de Trabajo y Responsabilidades por Componente

#### 🌡️ Sensor de Temperatura y Humedad (DHT22)

**Edge (ESP32):**

* **Adquisición:** Lee los datos del sensor a intervalos regulares (definido en el código por `PUBLISH_INTERVAL`).

* **Procesamiento:** Valida la integridad de la lectura.

* **Publicación:** Transmite los valores de temperatura (°C) y humedad (%) a sus tópicos MQTT correspondientes.

**Backend (Servidor):**

* **Almacenamiento:** Persiste cada lectura de temperatura y humedad con su timestamp en una base de datos.

* **Lógica de Decisión y Análisis:**

  * **Generación de Alertas por Umbrales:** El sistema monitorea continuamente los datos recibidos. Si los valores de temperatura o humedad exceden umbrales de seguridad predefinidos (ej. temperatura > 35°C por más de 15 minutos), el backend genera y envía notificaciones de alerta al usuario.

  * **Análisis Histórico y Visualización:** Proporciona endpoints de API para construir gráficos que muestran la evolución de las condiciones ambientales. Esto permite al usuario final identificar patrones diurnos y estacionales, fundamentales para el cuidado de las orquídeas.

  * **Modulación Dinámica del Riego:** El motor de reglas puede ajustar los parámetros de los ciclos de riego programados. Por ejemplo, ante un período sostenido de alta temperatura y baja humedad, el sistema podría aumentar automáticamente la frecuencia del riego en un porcentaje configurable.

#### ☀️ Sensor de Luz Ambiental (BH1750)

**Edge (ESP32):**

* **Adquisición:** Se comunica con el sensor a través del bus I2C.

* **Procesamiento:** Convierte la lectura cruda en una unidad estandarizada (Lux).

* **Publicación:** Transmite el valor de luminancia en el tópico MQTT correspondiente.

**Lógica en el Backend:**

* **Almacenamiento:** Registra el historial de luminancia.

* **Lógica de Decisión y Análisis:**

  * **Cálculo de la Integral de Luz Diaria (DLI):** El backend integra numéricamente las lecturas de Lux a lo largo de un fotoperiodo de 24 horas. El DLI resultante (expresado en mol/m²/día) es una métrica agronómica esencial que cuantifica la energía lumínica total disponible para la fotosíntesis.

  * **Optimización del Fotoperiodo:** Basándose en los valores históricos de DLI, el sistema puede recomendar ajustes en las mallas de sombreo o iluminación suplementaria para alcanzar el DLI óptimo para géneros de orquídeas particulares.

#### ☔ Sensor de Lluvia

**Edge (ESP32):**

* **Adquisición:** Monitorea el estado de la salida digital (`D0`)

* **Procesamiento:** Implementa una **máquina de estados** para filtrar ruido y detectar transiciones sostenidas, identificando eventos de "inicio de lluvia" y "fin de lluvia". Calcula la duración del evento.

* **Publicación:** Emite mensajes atómicos que notifican el tipo de evento (`INICIO`/`FIN`) y la duración calculada.

**Backend (Servidor):**

* **Almacenamiento:** Registra cada evento de lluvia con su tipo y duración.

* **Lógica de Decisión y Análisis:**

* **Agregación de Datos de Precipitación:** El backend calcula métricas agregadas como la frecuencia de lluvia (eventos por día/semana) y la duración acumulada en un período determinado.

* **Motor de Reglas para Riego Inteligente:** El núcleo de la lógica de control reside en un motor de reglas que se ejecuta en el servidor. Este motor evalúa las métricas de precipitación acumulada contra umbrales configurables. Una regla central podría ser: *“Si la duración acumulada de lluvia en las últimas 24 horas supera los 30 minutos, entonces, el sistema cancelará o pospondrá automáticamente los próximos ciclos de riego programados”*

#### 💧 Transductor de Presión de Agua (150 PSI)

**Edge (ESP32):**

* **Adquisición:** Lee el voltaje de salida del transductor a través de un conversor analógico-digital (ADC).

* **Procesamiento:** Aplica la función de transferencia para convertir el valor del ADC en una unidad de presión (PSI), compensando el efecto del divisor de voltaje.

* **Publicación:** Transmite el valor de presión calculado en el tópico MQTT correspondiente.

**Backend (Servidor):**

* **Almacenamiento:** Persiste el historial de presión del sistema.

* **Lógica de Decisión y Análisis:**

  * **Validación del Ciclo de Riego:** El sistema correlaciona el estado del riego con la presión del agua. Cuando se envía un comando `ON`, el backend espera un aumento de presión hasta un valor nominal (ej. 45 PSI) en un corto período de tiempo. Si la presión no aumenta, o si cae inesperadamente mientras el sistema está activo, se infiere una falla operativa (ej. bomba de agua inoperativa, obstrucción mayor) y se genera una alerta de mantenimiento.

  * **Detección de Fugas:** Durante los periodos en que el sistema de riego está inactivo (`OFF`), el backend monitorea el valor de presión, que debería mantenerse estable. Si el sistema detecta una caída de presión sostenida a lo largo del tiempo, infiere la presencia de una fuga en la tubería. Al identificar este patrón anómalo, se notifica al usuario para prevenir el desperdicio de agua y posibles daños.

#### 🎮 Módulo Relé (Electroválvulas)

**Edge (ESP32):**

* **Suscripción:** Se suscribe al tópico MQTT de control de riego.

* **Actuación:** Implementa una función `callback` para una respuesta inmediata a los comandos (`ON`/`OFF`), modificando el estado del pin GPIO correspondiente.

* **Publicación de Estado:** Tras ejecutar un comando, publica el nuevo estado del actuador en un tópico de estado (`.../riego/estado`) para cerrar el bucle de control.

**Backend (Servidor):**

* **Capa de Orquestación:** Origina los comandos de control (`ON`/`OFF`) basándose en el calendario de riego, las decisiones del motor de reglas (ej. cancelación por lluvia) o las acciones manuales del usuario a través de la interfaz gráfica.

* **Verificación:** Monitorea el tópico de estado para confirmar que los comandos han sido ejecutados por el nodo en el borde, validando la integridad del ciclo de control.

---

## ☔ Flujo de Datos de Lluvia

### Etapa 1: Detección y Procesamiento en el Borde (ESP32)

El firmware del ESP32 implementa una **máquina de estados** para monitorear el sensor de lluvia.

**Objetivos del ESP32:**

1. **Detectar Cambios de Estado:**
    * Utiliza la salida digital (`D0`) del sensor para una detección binaria (seco/mojado).
    * Detecta la transición de `SECO` a `LLOVIENDO` y la registra como el **inicio de un evento de lluvia**.
    * Detecta la transición de `LLOVIENDO` a `SECO` y la registra como el **fin del evento**.

2. **Calcular Métricas del Evento:**
    * Al detectar el fin de la lluvia, calcula la **duración total** del evento en segundos.

3. **Publicar Datos Atómicos vía MQTT:**
    * El ESP32 **NO** almacena historial. Inmediatamente después de un evento, publica los datos relevantes en tópicos específicos.
    * **Tópico:** `.../lluvia_estado`
        * **Mensaje:** `LLOVIENDO` (publicado al inicio del evento).
        * **Mensaje:** `SECO` (publicado al final del evento).
    * **Tópico:** `.../lluvia_duracion_seg`
        * **Mensaje:** `1250` (publicado al final del evento, con la duración total en segundos).

**El ESP32 no sabe "cuántas veces llovió hoy" ni toma decisiones sobre el riego. Solo informa fielmente lo que acaba de suceder.**

---

### Etapa 2: Almacenamiento y Lógica de Negocio (Backend * Next.js/PostgreSQL)

El backend se suscribe a los tópicos MQTT relevantes y actúa como el cerebro del sistema.

**Objetivos del Backend:**

1. **Escuchar y Almacenar:**
    * Un servicio en el backend (ej. un cliente MQTT en Node.js) escucha los mensajes de los tópicos `.../lluvia_estado` y `.../lluvia_duracion_seg`.
    * Cada mensaje recibido se almacena en una tabla de la base de datos PostgreSQL con una **marca de tiempo (timestamp)**.
        * *Ejemplo de tabla `eventos_lluvia`: `id`, `tipo_evento` ('inicio', 'fin'), `duracion_segundos`, `timestamp`.*

2. **Agregar y Analizar Datos:**
    * El backend proporciona endpoints de API para responder a preguntas complejas consultando la base de datos.
    * **"¿Cuántas veces llovió hoy?"** -> `SELECT COUNT(*) FROM eventos_lluvia WHERE tipo_evento = 'inicio' AND timestamp >= 'hoy'`.
    * **"¿Cuál fue la duración total de la lluvia hoy?"** -> `SELECT SUM(duracion_segundos) FROM eventos_lluvia WHERE timestamp >= 'hoy'`.

3. **Aplicar Reglas de Decisión (Inteligencia):**
    * Esta es la lógica de negocio central. Puede ser un trabajo programado (cron job) que se ejecuta diariamente o una lógica que se dispara por eventos.
    * **Ejemplo de Regla:**
        > "Cada día a las 5:00 AM, ejecutar una función que:
        > 1. Consulte la duración total de la lluvia de las últimas 24 horas.
        > 2. Si la duración total > 1800 segundos (30 minutos), entonces:
        >     a.  Acceda a la tabla de `tareas_riego` y cancele (o posponga) las tareas programadas para hoy.
        >     b.  Publique un mensaje en el tópico `.../riego/control` con el payload `OFF` para asegurar que el sistema esté desactivado.
        >     c.  Genere una notificación para el usuario en el frontend."

**Al separar las responsabilidades de esta manera, creamos un sistema robusto, flexible y escalable.**

---

## 💡 Recomendaciones a Futuro

Esta sección documenta mejoras y nuevas funcionalidades que pueden ser implementadas para aumentar la robustez y utilidad del firmware.

### Sistema de Logs Remotos vía MQTT

#### Problema Actual

Actualmente, todos los logs del sistema (estado de la conexión, errores, eventos, etc.) se imprimen únicamente en la consola serie (REPL). Este método es útil para la depuración en fase de desarrollo, pero se vuelve completamente inmanejable una vez que el dispositivo está desplegado en el campo, ya que requiere acceso físico y una conexión por cable para saber qué está ocurriendo.

Sin un sistema de logs remotos, es imposible:

* Monitorear la salud del dispositivo en tiempo real.
* Depurar problemas que ocurren esporádicamente.
* Realizar análisis post-mortem de fallos.
* Entender el comportamiento del dispositivo en su entorno real.

#### Solución Propuesta

Implementar una estrategia de logging dual (local y remoto) para enviar los eventos críticos a un tópico MQTT dedicado.

1. **Crear un Tópico MQTT para Logs:**
    * Definir un nuevo tópico específico para este fin, separado de los datos de sensores y comandos.
    * Ejemplo: `PristinoPlant/Actuator_Controller/logs`

2. **Implementar una Función `log_and_publish()`:**
    * Crear una función de ayuda en el firmware que centralice la lógica de logging.
    * Esta función primero imprimirá el mensaje en la consola local (usando la función `log()` existente) para mantener la depuración local.
    * Inmediatamente después, publicará el mismo mensaje en el tópico de logs.
    * **Lógica de Publicación Inteligente:**
        * La función solo debe intentar publicar si el cliente MQTT está conectado (`if client:`).
        * Debe usar **QoS 0** (entregar como máximo una vez) para los mensajes de log. Esto asegura que el firmware no se bloquee o ralentice intentando garantizar la entrega de un log, que es información no crítica.
        * Debe capturar silenciosamente cualquier excepción que ocurra durante la publicación del log para evitar que un fallo en el logging cause un fallo en el sistema principal.

    ```python
    # Ejemplo de la función propuesta
    
    MQTT_TOPIC_LOGS = BASE_TOPIC + b"/logs"

    def log_and_publish(msg, topic=MQTT_TOPIC_LOGS):
        """Imprime el mensaje localmente y lo publica en un tópico MQTT."""
        
        # 1. Imprimir en la consola local para depuración en vivo
        log(msg)
        
        # 2. Publicar en MQTT si el cliente está conectado
        if client:
            try:
                # Publicamos con QoS 0 para no bloquear ni esperar confirmación.
                client.publish(topic, msg.encode('utf-8'), qos=0)
            except Exception as e:
                # Si falla la publicación del log, lo imprimimos localmente pero no hacemos nada más.
                log(f"{Colors.RED}> Fallo al publicar log: {e}{Colors.RESET}")
    ```

3. **Refactorizar el Código:**
    * Reemplazar estratégicamente las llamadas a `log()` existentes por `log_and_publish()` para los eventos más importantes:
        * Cambios de estado de la conexión WiFi (desconexión, reconexión y duración).
        * Cambios de estado de la conexión MQTT.
        * Errores críticos capturados en los bloques `try-except`.
        * Recepción de comandos en `sub_callback` para auditoría.

#### Beneficios

* **Monitorización Remota:** Permite suscribirse al tópico de logs desde cualquier lugar para ver la "salud" del dispositivo en tiempo real.
* **Almacenamiento y Análisis:** Al conectar el tópico a una base de datos (Ej. InfluxDB, PostgreSQL), se puede construir un historial completo del comportamiento del dispositivo, facilitando la creación de dashboards y la detección de patrones de fallo.
* **Mantenibilidad a Largo Plazo:** Transforma el firmware de un prototipo de "caja negra" a un sistema transparente y de grado productivo.
