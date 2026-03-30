# Análisis de Red y Optimización MQTT para Producción

## Perfil de Red

### Velocidades medidas

| Métrica | Madrugada (ideal) | Día (real) | Peor caso |
|:---|:---|:---|:---|
| **Download** | 3.4 Mbps | ~1.4 Mbps | 175 Kbps |
| **Upload** | 700 Kbps | ~300 Kbps | ~150 Kbps |
| **Latencia (download)** | 37 ms | ~100 ms | ~300 ms |
| **Latencia (upload)** | 519 ms | ~800 ms | ~1500 ms |

### El upload es el cuello de botella crítico

El ESP32 **sube** datos al broker (publica). Toda operación de escritura al socket pasa por el upload.  
Con 300 Kbps de subida realista, el throughput efectivo es:

```
300 Kbps = 37.5 KB/s
```

Pero esto es throughput bruto. Con SSL/TLS overhead (~30-40% extra), el throughput útil cae a:

```
~25 KB/s efectivos sobre SSL
```

### Tiempo real por operación

| Operación | Payload aprox. | Tiempo @ 25 KB/s | Tiempo @ 100 Kbps (peor) |
|:---|:---|:---|:---|
| `ping()` | 2 bytes | ~1ms + 519ms RTT = **~520ms** | ~1.2s |
| `publish("online", qos=0)` | ~55 bytes | ~2ms + 519ms = **~521ms** | ~1.3s |
| `publish(relay_snapshot, qos=0)` | ~450 bytes | ~18ms + 519ms = **~537ms** | ~1.5s |
| `publish(audit_state, qos=1)` | ~120 bytes + PUBACK wait | ~5ms + 1038ms = **~1s** | ~2.5s |
| `publish(rain_event, qos=1)` | ~80 bytes + PUBACK wait | ~3ms + 1038ms = **~1s** | ~2.5s |
| `subscribe(topic, qos=1)` | ~60 bytes + SUBACK wait | ~3ms + 1038ms = **~1s** | ~2.5s |
| SSL Handshake (connect) | ~2-4 KB (varios RTTs) | **~3-6s** | **~10-15s** |
| `check_msg()` (PINGRESP) | 2 bytes read | ~1ms + 37ms = **~38ms** | ~300ms |

> [!IMPORTANT]
> **La latencia de upload (519ms) domina TODO**. Un simple `ping()` de 2 bytes tarda ~520ms porque hay que esperar el RTT de subida. En hora pico, puede ser >1s.

---

## Simulación del Loop Actual: ¿Qué pasa en 30 segundos?

Simulamos un ciclo completo de 30s (= `MQTT_PING_INTERVAL`) en condiciones diurnas:

```
t=0.0s   check_msg() → sin datos → retorna (lock 0-2s)
t=1.0s   check_msg() → sin datos
t=2.0s   check_msg() → sin datos
...
t=15.0s  [rain_monitor publica "Raining" qos=0] → lock ~600ms
t=15.6s  check_msg() bloqueado por lock → wait_for timeout 2s
t=17.6s  check_msg() ejecuta → PINGRESP leído ✅ → last_cpacket actualizado
...
t=30.0s  PING + HEARTBEAT → lock adquirido
         ping() → ~520ms
         publish("online", qos=0) → ~521ms
         TOTAL DENTRO DEL LOCK: ~1.0-1.5s (en hora pico puede ser ~2-3s)
t=31.5s  lock liberado, last_cpacket actualizado
t=32.0s  check_msg() → lee PINGRESP del ping anterior
```

### Análisis de los tiempos críticos

#### 1. El bloque `ping() + publish("online")` retiene el lock ~1-3s

En hora pico, el bloque del ping + heartbeat puede retener el `mqtt_lock` durante **1 a 3 segundos**. Esto es aceptable porque `check_msg()` tiene el `wait_for` de 2s. Si no consigue el lock, salta esa iteración y lo intenta 1s después.

**Veredicto**: ✅ El wait_for de 2s es correcto para este perfil. Pero si la red empeora a >3s de latencia, considerar subir a 3-4s.

#### 2. El `state_publisher_task` retiene el lock MUCHO más tiempo

La publicación del snapshot unificado (línea 1848) incluye:
1. `publish(snapshot_all, qos=0)` ~450 bytes → ~537ms
2. Bucle de publicaciones individuales (legado): 7 relays × (`publish` ~100 bytes + `sleep_ms(50)`) = **7 × (400ms + 50ms) = ~3.15s**

**Total del lock en state_publisher**: **~3.5-4s** en condiciones diurnas.

> [!WARNING]
> Si `state_publisher_task` está publicando el snapshot cuando `mqtt_connector_task` quiere hacer check_msg(), el `wait_for(2)` fallará porque 2s < 3.5s. Se perderá una iteración de `check_msg()`.

#### 3. El `unified_audit_task` publica con qos=0, lock moderado

El audit packet es JSON (150-300 bytes) → lock ~500ms-1s. Menos problemático.

---

## Análisis de Cada Constante

### `MQTT_KEEPALIVE = 60s`

El broker desconecta si no recibe **PINGREQ ni datos** en `1.5 × keepalive = 90s`.

- Con ping cada 30s, el broker recibe algo al menos 3 veces en la ventana de 90s
- Si un ping falla (timeout de socket), el siguiente intento es 30s después
- En el peor caso (2 pings fallidos seguidos), la sesión Zombie se activa a los 90s

**Veredicto**: 60s es correcto. No debería subir más porque el LWT tardaría más en activarse.

### `MQTT_PING_INTERVAL = 30s` (keepalive // 2)

- El firmware publica `ping()` + `"online"` cada 30s
- El frontend espera Zombie a los 70s = (30 × 2) + 10s gracia
- Con 30s, hay 3 oportunidades de ping en la ventana de 90s del broker

**Veredicto**: ✅ 30s es correcto. Bajarla a 20s no aporta porque el cuello de botella es la latencia, no la frecuencia.

### `MQTT_CHECK_INTERVAL = 1s` ⚠️

`check_msg()` se ejecuta **cada 1 segundo**. En una red rápida esto es ideal. En tu red:

- Cada ejecución intenta adquirir el lock (hasta 2s de espera)
- Si el lock está libre, `check_msg()` lee del socket (~38ms en descarga)
- La descarga es rápida (3.4 Mbps), así que leer no es el problema
- **El problema**: 1s de intervalo con wait_for de 2s = posible acumulación de corrutinas esperando

Sin embargo, `check_msg()` es **no-bloqueante** si no hay datos: `sock.read(1)` retorna `None` y sale. Solo bloquea si HAY datos por leer (lo cual es lo que queremos).

**Veredicto**: ✅ 1s está bien. Es la frecuencia de polling del socket. No afecta la red.

### `MQTT_SOCKET_TIMEOUT = 15s` ⚠️

Este es el timeout de `_sock_timeout()` (línea 48-57 de simple2.py): cuánto espera `poll()` a que el socket esté listo para leer/escribir.

En tu red:
- Un `_write()` invoca `poll(POLLOUT)` que espera hasta 15s a que el buffer TCP esté disponible
- Un `_read()` invoca `poll(POLLIN)` que espera hasta 15s a que lleguen datos
- Si la red está saturada, 15s podría no ser suficiente para una escritura SSL

Pero hay un matiz: el `_robust_write` tiene su propio timeout interno que es **también** `socket_timeout` (línea 1378):
```python
if ticks_diff(ticks_ms(), timeout_start) > (self.socket_timeout * 1000):
    raise MQTTException(3)  # Timeout de escritura
```

Si una escritura parcial ocurre (el SO aceptó algunos bytes pero no todos), `_robust_write` resetea el cronómetro (línea 1390). Esto significa que una escritura de 450 bytes que logra enviar 100 bytes a la vez nunca hará timeout, solo si se queda **completamente atascado** 15s sin mover un byte.

**Veredicto**: ⚠️ **Subir a 20s**. Con 519ms de latencia de subida y posibles buffers llenos, 15s puede ser justo para un handshake SSL o una publicación grande durante hora pico. El WDT es 120s, así que tenemos margen.

### `MQTT_MESSAGE_TIMEOUT = 30s`

Cuánto espera el PUBACK/SUBACK de una operación QoS 1. En tu red:
- RTT completo (up + down) = 519ms + 37ms = **~556ms** mínimo
- En hora pico: ~1500ms + 300ms = **~1800ms**
- 30s es **muy generoso** para un solo PUBACK

Sin embargo, el `_message_timeout()` no causa reconexión directa — solo llama `cbstat(pid, 0)` que loguea el timeout. Los PIDs vencidos se limpian pero la conexión sigue.

**Veredicto**: ✅ 30s es correcto. Da mucho margen para QoS 1 en redes lentas.

### `MQTT_KEEPALIVE * 1500` = 90s (Detección Zombie)

La condición actual: `ticks_diff(now_ms, client.last_cpacket) > 90000`

- `last_cpacket` se actualiza cuando: recibimos PINGRESP, PUBACK, SUBACK, o un mensaje entrante vía `check_msg()`
- También se actualiza manualmente tras un `ping()` exitoso
- Tras el fix, el ping actualiza `last_cpacket` cada 30s si tiene éxito

La ventana real es: **si pasan 3 ciclos de ping sin que NINGUNO tenga éxito** (ni el ping, ni check_msg), se declara Zombie.

En tu red, un ciclo de ping falla si:
1. No puede adquirir el lock en 2s (state_publisher lo tiene) → No hay ping → No falla, simplemente no se envía
2. `ping()` tarda más de `socket_timeout` (15s) → Falla con MQTTException → Se reconecta
3. El broker no envía PINGRESP → Solo afecta si NO actualizamos `last_cpacket` tras ping (que ya lo hacemos)

**Veredicto**: ✅ 90s es correcto. Con la actualización de `last_cpacket` tras ping, la Zombie se activa solo si realmente no podemos ENVIAR nada en 90s, lo cual indica red completamente muerta.

### `wait_for(mqtt_lock.acquire(), 2)` — Timeout del lock en check_msg ⚠️

El lock para `check_msg()` espera máximo 2s. Pero `state_publisher_task` retiene el lock ~3.5-4s.

**Veredicto**: ⚠️ **Subir a 5s**. Esto asegura que `check_msg()` pueda sobrevivir a un ciclo completo de `state_publisher_task` sin saltarse. Con 5s de espera y 1s de intervalo, hay margen suficiente.

### `WDT_TIMEOUT_MS = 120000` (120s)

El Watchdog debe ser mayor que la operación más larga. La más larga posible:
- SSL Handshake: ~10-15s (peor caso)
- `state_publisher_task`: ~4s dentro del lock
- `MQTT_SOCKET_TIMEOUT` (propuesto): 20s

**Veredicto**: ✅ 120s es correcto. Si subimos socket_timeout a 20s, `wd_timeout_ms = (20 + 5) * 1000 = 25000ms`, que sigue muy por debajo de los 120s.

### `sleep_ms(150)` en `_robust_write` retry ⚠️

Cuando el buffer TCP está lleno, el retry loop espera 150ms antes de reintentar. En tu red con buffer frecuentemente lleno por la latencia de subida:

- 150ms es bastante agresivo para una red lenta 
- Genera muchos reintentos innecesarios que consumen CPU
- Con 519ms de latencia, el buffer probablemente necesita ~500ms para drenar parcialmente

**Veredicto**: ⚠️ **Subir a 300ms**. Reduce reintentos innecesarios, da más tiempo al stack TCP para drenar el buffer, y ahorra CPU para otras corrutinas.

### `sleep_ms(50)` en state_publisher (publicación individual)

El delay anti-congestión entre publicaciones individuales de relays (línea 1859). Con 7 relays, esto agrega 350ms al lock. Si subimos a 100ms, serían 700ms extra pero con mejor drenado del buffer TCP entre publicaciones.

**Veredicto**: ⚠️ **Subir a 100ms** o, mejor aún, **eliminar las publicaciones individuales legado** si el frontend ya usa el snapshot unificado (`/state/all`). Esto reduciría el lock de ~3.5s a ~600ms.

---

## Resumen de Cambios Propuestos

### [MODIFY] [main.py](file:///c:/Dev/pristinoplant/firmware/relay_modules/main.py)

| Constante / Valor | Actual | Propuesto | Razón |
|:---|:---|:---|:---|
| `MQTT_SOCKET_TIMEOUT` | `15` | `20` | Margen para SSL en hora pico (latencia >1s) |
| `wait_for(lock, ...)` | `2` | `5` | Sobrevivir al lock del state_publisher (~3.5s) |
| `sleep_ms(150)` en `_robust_write` | `150` | `300` | Menos reintentos inútiles en buffer lleno |
| `sleep_ms(50)` en state_publisher | `50` | `100` | Mejor drenado TCP entre publicaciones |

> [!IMPORTANT]  
> **Pregunta para ti**: ¿El frontend ya consume exclusivamente el snapshot unificado (`/state/all`) o aún depende de los tópicos individuales por relay? Si ya usa solo el snapshot, podemos eliminar el bucle de publicaciones individuales (línea 1852-1858) y reducir el lock de ~3.5s a ~600ms, lo cual sería la **mayor optimización posible** para tu red.

### [MODIFY] [simple2.py](file:///c:/Dev/pristinoplant/firmware/lib/umqtt/simple2.py)

No se necesitan cambios en la librería base. Todos los ajustes se hacen via constantes en main.py y los monkey-patches.

### Frontend: `use-device-heartbeat.ts`

Los thresholds actuales asumen heartbeat cada 30s:
- `ZOMBIE_THRESHOLD_MS = 70000` → (30 × 2) + 10s → Si pierde 2 latidos seguidos
- `OFFLINE_THRESHOLD_MS = 100000` → (30 × 3) + 10s → Si pierde 3 latidos seguidos

Con tu red, un heartbeat puede llegar con retraso de hasta ~1.5s (latencia). Esto no afecta los thresholds porque 1.5s << 70s. Los valores actuales son correctos.

**Veredicto**: ✅ Sin cambios necesarios.

## Verificación

- Compilar y flashear con los nuevos valores
- Observar en hora pico (día) que:
  - No se dispare Zombie
  - Los pings se envíen exitosamente
  - `check_msg()` no se salte demasiadas iteraciones seguidas
  - El ControlPanel mantenga el estado "online"
