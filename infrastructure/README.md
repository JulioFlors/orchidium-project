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

## 📊 Monitoreo, QoS y Ajuste de Logs

Para diagnosticar problemas de conexión o verificar la calidad de servicio (QoS) de los mensajes publicados por tus nodos IoT:

### 1. Cambiar los Niveles de Log

Edita `config/mosquitto.conf` y configura la directiva `log_type` según tus necesidades:

* **Depuración (`debug`):** Registra el tráfico detallado de red y paquetes MQTT.

    ```conf
    log_type debug
    ```

* **Producción (`error` / `none`):** Minimiza el uso de disco registrando únicamente errores críticos o nada en absoluto.

    ```conf
    log_type error
    ```

*Recuerda reiniciar el broker tras cualquier cambio:*

```bash
docker compose restart mosquitto
```

### 2. Monitorear en Tiempo Real

Puedes ver la salida en tiempo real usando Docker desde el directorio del proyecto en el VPS:

```bash
# Ver todas las transacciones de red (requiere log_type debug)
docker logs -f mosquitto

# Filtrar solo publicaciones de mensajes (para validar QoS)
docker logs -f mosquitto | grep -i "PUBLISH"
```

**Interpretación de la salida:**
`Received PUBLISH from NODO_Actuador (d0, q1, r0, m3, 'PristinoPlant/status')`

* `q1`: Mensaje enviado con **QoS = 1** (requiere confirmación).
* `q0`: Mensaje enviado con **QoS = 0** (fuego y olvido).

### 3. Limpieza de Logs

Si el archivo de logs físicos crece demasiado, puedes vaciarlo a 0 bytes sin detener el servicio ejecutando en la raíz de la infraestructura:

```bash
sudo truncate -s 0 ./log/mosquitto.log
```
