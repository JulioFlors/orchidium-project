# Infraestructura MQTT (Mosquitto)

Este directorio contiene la configuración para el broker MQTT Mosquitto, utilizado para la comunicación en tiempo real entre los servicios del backend, el frontend y los dispositivos IoT.

## Autenticación

Mosquitto está configurado para requerir autenticación (`allow_anonymous false`). Las credenciales se almacenan en el archivo `config/passwd`, el cual **no se incluye en el control de versiones**.

### Decisión de Arquitectura: ¿Por qué `passwd` y no variables de entorno directas?

A diferencia de bases de datos como PostgreSQL que aceptan `POSTGRES_USER` en docker-compose, Mosquitto no soporta nativamente la creación de usuarios mediante variables de entorno al inicio.
Arquitectónicamente, utilizamos el mapeo de volumen `./config:/mosquitto/config`

### Gestión de Usuarios

La gestión es **manual** y requiere un paso de encriptación dentro del contenedor.

1. **Preparar Archivo:**
    Renombra `passwd.template` como `passwd`
    Configura los usuarios con **contraseñas en texto plano** (formato: `usuario:contraseña`).

2. **Encriptar con Mosquitto:**
    Ejecuta el siguiente comando para que Mosquitto convierta el archivo de texto plano a hashes seguros:

    ```powershell
    docker exec mosquitto mosquitto_passwd -U /mosquitto/config/passwd
    ```

3. **Sincronizar `.env`:**
    Asegúrate de que las contraseñas en tu `.env` sean las versiones **PLANAS** que escribiste originalmente en el paso 1.

4. **Aplicar Cambios:**

    ```bash
    docker-compose restart mosquitto
    ```

## Estructura de Archivos

* `config/mosquitto.conf`: Configuración principal del broker.
* `config/passwd`: Archivo de usuarios y contraseñas (Generado/Ignorado).
* `data/`: Persistencia de mensajes y estado (Ignorado).
* `log/`: Logs del broker.
