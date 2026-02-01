# ORCHIDIUM PROJECT: Sistema de Gestión de Invernaderos Inteligentes

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
8. [Mantenimiento y Actualizaciones (OTA)](#-mantenimiento-y-actualizaciones-ota)

---

## 🖥️ Entorno de Desarrollo

### Requisitos Previos

Antes de empezar, asegúrate de tener instalado el siguiente software:

* **Python 3.x:** [Descargar Python](https://www.python.org/downloads/).
* **Herramientas de Python:** Instala `esptool` y `mpremote` globalmente desde la terminal.

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

Este proceso se realiza una sola vez por cada ESP32 nuevo o cuando se desea actualizar el firmware base.

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

Usamos la herramienta **`mpremote`** para instalar las librerías que nuestro código necesita en los ESP32

> **Importante:** La instalación de librerías debe hacerse según el rol del dispositivo.
>
> * **Actuator Controller Firmware** (Relay Modules): Requiere `umqtt.simple2`, `ota` y `secrets`.
> * **Environmental Monitoring Firmware** (Sensors): Requiere `umqtt.simple2`, `ota`, `secrets` y `bh1750`.

#### ⚠️ Paso Preliminar OBLIGATORIO: Crear Directorio `/lib`

Antes de instalar cualquier librería, es **fundamental** asegurarse de que el directorio `/lib` existe en el sistema de archivos del ESP32. Sin este paso, las copias recursivas fallarán.

Ejecuta este comando una sola vez:

```bash
mpremote mkdir :lib
```

#### 1. Librería ASÍNCRONA para MQTT `umqtt.simple2`

**Fuente:** [https://github.com/fizista/micropython-umqtt.simple2](https://github.com/fizista/micropython-umqtt.simple2)

Esta librería es **requerida para AMBOS firmwares**.
Los archivos de la librería ya están incluidos en la ruta local `firmware\lib` del proyecto.

**Instalación:**
*(Ejecuta este comando desde la carpeta del firmware correspondiente)*

```bash
mpremote cp -r ../lib/umqtt :lib/
```

#### 2\. Librería `OTA`

Esta librería es **requerida para AMBOS firmwares** para permitir actualizaciones remotas.
Se encuentra en `firmware\lib\ota`.

**Instalación:**
*(Ejecuta este comando desde la carpeta del firmware correspondiente)*

```bash
mpremote cp -r ../lib/ota :lib/
```

#### 3\. Archivos de Configuración `secrets`

Esta librería contiene las credenciales WiFi y es **requerida para AMBOS firmwares**.
Se encuentra en `firmware\lib\secrets`.

**Instalación:**
*(Ejecuta este comando desde la carpeta del firmware correspondiente)*

```bash
mpremote cp -r ../lib/secrets :lib/
```

> **Limpieza:** El archivo template no es necesario en el dispositivo.
>
> ```bash
> mpremote rm :lib/secrets/template.py
> ```
>
> **Nota de Seguridad:** El archivo `secrets/__init__.py` está en `.gitignore`. Debes crearlo localmente con tus credenciales reales antes de subirlo.

#### 4\. Librería del Sensor de Luz `BH1750`

Esta librería es **exclusiva** para el **Environmental Monitoring Firmware**.
Se encuentra en `firmware\lib\bh1750`.

**Fuente:** [https://github.com/PinkInk/upylib/tree/master/bh1750/bh1750](https://github.com/PinkInk/upylib/blob/master/bh1750/bh1750/__init__.py)

**Instalación:**
*(Ejecuta este comando desde la carpeta `firmware/sensors/`)*

```bash
mpremote cp -r ../lib/bh1750 :lib/
```

---

### 🚀 Despliegue del Código Principal (`main.py`)

Una vez instaladas las librerías, debes subir el código principal del firmware y su manifiesto de versión.

Estos archivos (`main.py` y `manifest.json`) deben residir en la **raíz** (`:/`) del sistema de archivos del ESP32, no dentro de `/lib`.

**Archivos requeridos:**

* **`main.py`**: El punto de entrada y lógica del firmware.
* **`manifest.json`**: Archivo de control para el sistema OTA.
* **`boot.py`**: Script de arranque.

**Instalación:**
Ejecuta estos comandos desde la carpeta específica del firmware que estás configurando (ej. `firmware/sensors/` o `firmware/relay_modules/`).

```bash
mpremote cp -r . :
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
mpremote rm :main.py

# Eliminar un archivo dentro de un subdirectorio (ej. el módulo simple.py)
mpremote rm :lib/umqtt/simple.py

# Eliminar un directorio y todo su contenido (REQUIERE 
# -r de forma recursiva
mpremote rm -r :lib/umqtt

# Eliminar un directorio vacío
mpremote rmdir :mis_archivos_temporales
```

### Comandos principales

* **Copiar un archivo al ESP32:**
  Copia tu `main.py` local al directorio raíz (`:/`) del dispositivo.

  ```bash
  mpremote cp main.py :/
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
mpremote cp -r . :/ ; mpremote reset ; mpremote repl
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
        # La ruta del directorio que contiene el firmware. 
        # Por defecto es '.' (directorio actual).
        [string]$Path = ".",

        # El puerto a usar. Por defecto es 'auto'.
        [string]$Port = "auto"
    )

    # Validamos que la ruta exista
    if (-not (Test-Path $Path)) {
        Write-Host "❌  Error: La ruta '$Path' no existe" -ForegroundColor Red
        return
    }

    # Guardamos la ubicación actual y nos movemos hacia la carpeta del firmware
    Push-Location $Path

    try {
        Write-Host "`n"
        Write-Host "$(Get-Location)" -ForegroundColor DarkBlue
        Write-Host "Subiendo contenido" -ForegroundColor DarkGreen
        Write-Host ""
        
        # Copia recursiva de TODO lo que hay en la carpeta actual (.) a la raíz del ESP32 (:)
        mpremote connect $Port fs cp -r . :
        
        Write-Host ""
        Write-Host "Reiniciando dispositivo" -ForegroundColor Yellow
        mpremote connect $Port reset

        Write-Host "Conectando REPL | Ctrl+C para detener | Ctrl+X para salir |" -ForegroundColor DarkBlue
        mpremote connect $Port repl

    }
    catch {
        Write-Host "Error durante la ejecución: $_" -ForegroundColor Red
    } finally {
        # Regresar siempre al directorio original, pase lo que pase
        Pop-Location
    }
}
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

### 1\. Conexión al Broker

* Abre MQTT Explorer.
* Crea una nueva conexión con los siguientes datos:
  * **Host:** `192.168.1.5` (la IP de tu broker MQTT).
  * **Port:** `1883`.
* Haz clic en **Connect**.

### 2\. Verificar el Estado (Rol de Receptor)

Una vez conectado, verás aparecer la estructura de tópicos en el panel izquierdo. Esto te permite monitorear el sistema en tiempo real.

▼ PristinoPlant
  ▼ Actuator_Controller
    status = online
    ▼ irrigation
      ▼ state
        ▼ valve
          main_water: OFF
          agrochemical: OFF
          fogger: OFF
          ...
        pump: OFF

* **Estados:** Haz clic en cualquier tópico dentro de `state` para ver si es `ON` u `OFF`.
* **Auditoría:** Observa el tópico `.../cmd/received` para confirmar qué instrucciones ha procesado el ESP32.

### 3\. Enviar Comandos de Control (Rol de Transmisor)

Para controlar el dispositivo, usaremos el panel de **Publish** (derecha). Dependiendo de lo que quieras hacer, usarás un tópico y un formato diferente.

---

#### A. Comandos de Riego (Irrigation)

**Tópico:** `PristinoPlant/Actuator_Controller/irrigation/cmd`
**Formato:** Seleccionar **JSON**.

**Opción 1: Encendido/Apagado Inmediato (Manual)**
Control directo del relé.

* **Payload:**

    ```json
    {
      "actuator": "pump",
      "state": "ON"
    }
    ```

    *(Nota: `actuator` puede ser el nombre como string o el ID numérico).*

**Opción 2: Riego Temporizado (Auto-Apagado)**
Enciende el actuador y lo apaga automáticamente tras X segundos.

* **Payload (Ej: Encender Válvula 1 por 5 minutos):**

    ```json
    {
      "actuator": 1,
      "state": "ON",
      "duration": 300
    }
    ```

**Opción 3: Inicio Diferido (Programación)**
Programa el actuador para encenderse en el futuro y luego apagarse (opcional).
*Ideal para secuenciar válvulas o esperar a que se llenen tuberías.*

* **Payload (Ej: Encender la Bomba dentro de 1 minuto, por 10 minutos):**

    ```json
    {
      "actuator": "pump",
      "state": "ON",
      "start_delay": 60,
      "duration": 600
    }
    ```

    *Si envías un comando "OFF" o un nuevo comando "ON" al mismo actuador durante la espera, la tarea diferida se cancelará (Override).*

---

#### B. Comandos de Sistema (Admin)

**Tópico:** `PristinoPlant/Actuator_Controller/cmd`
**Formato:** Seleccionar **Raw / Plain Text** (Texto plano).

**Opción 1: Reinicio Remoto (Reboot)**
Fuerza un reinicio por software del ESP32. Útil tras actualizaciones OTA o comportamientos extraños.

* **Payload:**

    ```text
    reset
    ```

---

#### Resultados Esperados

1. **Físico:** Escucharás el "clic" de los relés según la lógica (inmediata o diferida).
2. **REPL del ESP32:**
      * Verás los logs estilizados: `Recibido`, `Tópico`, `JSON` y la `Acción` resultante.
      * Si es diferido, verás: `⏳ Inicio Diferido: Esperando X s...`.
3. **MQTT Explorer:**
      * El tópico de estado (`.../state/pump`) cambiará a `ON` o `OFF`.
      * El tópico `.../cmd/received` mostrará una copia del comando que enviaste (confirmación de recepción).
      * Si enviaste `reset`, el status cambiará brevemente a `rebooting` y luego a `online`.

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
    mpremote cp bh1750.py :/lib/
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

### ☔ Detalle del Flujo: Eventos de Lluvia

Este es un caso especial que demuestra la potencia de la arquitectura distribuida. El sensor de lluvia no envía datos constantes, sino que gestiona **Estados** y **Eventos**.

#### Etapa 1: Detección y Procesamiento en el Borde (ESP32)

El firmware implementa una **máquina de estados** con histéresis.

1. **Detección de Estado:**
    * Al detectar agua, cambia el estado a `Raining` y publica en `.../rain/state` (con `retain=True`).
    * Al secarse, cambia el estado a `Dry`.

2. **Cálculo del Evento (Al finalizar la lluvia):**
    * El ESP32 calcula internamente la **duración total** y la **intensidad promedio**.
    * Genera un paquete JSON: `{"duration_seconds": 1200, "average_intensity_percent": 45}`.
    * Publica este paquete en el tópico de evento: `.../rain/event`.

**El ESP32 no sabe "cuántas veces llovió hoy" ni toma decisiones sobre el riego. Solo informa fielmente lo que acaba de suceder.**

---

#### Etapa 2: Almacenamiento y Lógica de Negocio (Backend)

El servicio de ingesta recibe el paquete JSON.

1. **Escuchar y Almacenar:**
    * Detecta el tópico `/rain/event`.
    * Desglosa el JSON y guarda un registro en la tabla `ZoneEventLog` con el tipo `Rain_Stop_Event`.

2. **Inteligencia (Motor de Reglas):**
    * El backend consulta: *"¿Cuál fue la duración acumulada de lluvia en las últimas 24 horas?"*.
    * **Regla de Negocio:** Si la lluvia acumulada > 30 minutos, el sistema cancela automáticamente los riegos programados para hoy y notifica al usuario.

---

## 🔄 Mantenimiento y Actualizaciones (OTA)

El firmware del Proyecto Orchidium incluye un módulo de actualización Over-The-Air (OTA) que permite actualizar el código de los dispositivos sin necesidad de conectarlos por USB.

### Requisitos para OTA

1. **Librería `ota`:** Debe estar instalada en el dispositivo (`/lib/ota`).
2. **Archivo `manifest.json`:** Este archivo local en el ESP32 es crítico; le indica al dispositivo cuál es su versión actual y qué archivos debe gestionar.

### Archivo de Control: `manifest.json`

Cada dispositivo debe tener un archivo `manifest.json` en su raíz. Este archivo actúa como el registro de versión local.

**Ejemplo de `manifest.json` (Sensors):**

```json
{
  "name": "Sensors",
  "description": "Environmental Monitoring Firmware",
  "notes_release": "Implementación de Detección Zombie, Publicación JSON Atómica, Actualización de Firmware con OTA, Apagado Controlado v2 y Actualización de Credenciales",
  "version": "0.3.3",
  "date": "02-12-2025",
  "files": [
    "main.py"
  ]
}
```

* **`version`**: El dispositivo compara este número con el `manifest.json` remoto en GitHub. Si la versión remota es mayor, inicia la actualización.
* **`files`**: Lista de archivos que el sistema OTA debe descargar y sobrescribir si hay una actualización.

**Subir el manifiesto inicial al dispositivo:**

```bash
mpremote cp manifest.json :/
```

---

### Flujo de Trabajo Seguro para Credenciales `secrets`

Este proyecto implementa una estrategia de "Secretos Ignorados", donde las credenciales WiFi (`lib/secrets/__init__.py`) nunca se suben al repositorio. Para actualizar estas credenciales remotamente sin perder la conexión, se utiliza un **script de migración temporal**.

> **⚠️ Advertencia de Seguridad:** Este proceso implica subir temporalmente un archivo con tus nuevas claves a un repositorio. **Debes borrar el archivo del repositorio inmediatamente después de que los dispositivos se actualicen.**

#### 1\. Preparar el Script de Migración

Crea un archivo local llamado `update_creds.py` con el siguiente contenido, reemplazando los valores con tu nueva configuración de red.

```python
# -----------------------------------------------------------------------------
# Script de Actualización de Credenciales via OTA
# -----------------------------------------------------------------------------
import os

# ---- CONFIGURACIÓN GLOBAL ----
DEBUG = True

class Colors:
    RESET = '\x1b[0m'; RED = '\x1b[91m'; GREEN = '\x1b[92m'; YELLOW = '\x1b[93m'; BLUE = '\x1b[94m'; CYAN = '\x1b[96m'; WHITE = '\x1b[97m'

def log(*args, **kwargs):
    if DEBUG: print(*args, **kwargs)

# ---- Nuevas Credenciales ----
NEW_SSID = "Nueva_Red"
NEW_PASS = "Nueva_Contraseña"
TARGET_PATH = "lib/secrets/__init__.py"

def apply_update():
    """
    Esta función es llamada por main.py.
    Sobrescribe lib/secrets/__init__.py con la nueva configuración.
    """
    log(f"\n{Colors.BLUE}> [UPDATE] {Colors.RESET}{Colors.WHITE}Iniciando migración de credenciales WiFi...{Colors.RESET}")
    
    new_secrets_content = f"""# Credenciales actualizadas via OTA
# NO SUBIR ESTE ARCHIVO A GITHUB
WIFI_CONFIG = {{
    "SSID": "{NEW_SSID}",
    "PASSWORD": "{NEW_PASS}"
}}
"""
    try:
        # Asegurar directorio
        try: os.stat("lib/secrets")
        except OSError: 
            try: os.mkdir("lib/secrets")
            except: pass

        with open(TARGET_PATH, 'w') as f:
            f.write(new_secrets_content)
        
        log(f"{Colors.GREEN}> [UPDATE] {Colors.CYAN}{TARGET_PATH}{Colors.GREEN} actualizado correctamente.{Colors.RESET}")
        return True
    except Exception as e:
        log(f"\n{Colors.RED}> [UPDATE] ERROR CRÍTICO: {e}{Colors.RESET}")
        return False
```

#### 2\. Desplegar el Script (GitHub)

1. Sube el archivo `update_creds.py` a la carpeta `firmware/shared/` de tu repositorio.
2. Obtén la URL "Raw" del archivo (ej. `https://raw.githubusercontent.com/.../firmware/shared/update_creds.py`).

#### 3\. Actualizar el Manifiesto de los Dispositivos

Edita el archivo `manifest.json` del dispositivo que deseas migrar (ej. `firmware/sensors/manifest.json`).

1. Incrementa la versión (ej. de `1.1.0` a `1.1.1`).
2. Añade la URL del script compartido a la lista de `files`.

    ```json
    {
      "name": "Sensors",
      "description": "Environmental Monitoring Firmware",
      "notes_release": "Detección Zombie, Publicación JSON Atómica y Actualización de Firmware con OTA",
      "version": "0.10.1",
      "date": "24-11-2025",
      "files": [
        "main.py",
        "https://raw.githubusercontent.com/TU_USUARIO/ORCHIDIUM/main/firmware/shared/update_creds.py"
      ]
    }
    ```

3. Haz `git push` de los cambios.

#### 4\. Ejecución Automática en el Dispositivo

El ESP32 detectará la nueva versión en su próximo ciclo de chequeo (o al reiniciar):

1. Descargará `main.py` y `update_creds.py`.
2. Se reiniciará.
3. Al inicio (`boot`), detectará la presencia de `update_creds.py`.
4. Ejecutará la función `apply_update()`, sobrescribiendo su `lib/secrets/__init__.py` local.
5. Borrará automáticamente `update_creds.py` de su memoria.
6. Se reiniciará nuevamente para conectar a la **NUEVA** red WiFi.

#### 5\. Limpieza Obligatoria

Una vez confirmada la migración:

1. **Elimina** `update_creds.py` de tu repositorio GitHub.
2. Actualiza el `manifest.json` para eliminar la referencia al archivo y sube una nueva versión menor para "limpiar" el estado del manifiesto.
