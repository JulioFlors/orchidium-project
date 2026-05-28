# ---- CORUTINA AUXILIAR: Transmisión y Sincronización ----
async def transmit_and_sync():
    """
    Gestiona la conexión por evento, publica telemetrías acumuladas,
    espera comandos del Scheduler (30s) y desconecta la radio WiFi.
    """
    global CONNECTED_ALLOWED, sync_event

    if DEBUG: print(f"\n📡  Activando {Colors.BLUE}radio WiFi{Colors.RESET}")
    CONNECTED_ALLOWED = True

    try:
        # Espera asíncrona limpia mediante evento (Máximo 45 segundos)
        await asyncio.wait_for(mqtt_connected_event.wait(), 45)
        
        # Conexión exitosa: Publicar lotes acumulados
        await flush_telemetry_batches_async()
        
        # Ventana de sincronización reducida a 30s
        sync_event.clear()
        try:
            await asyncio.wait_for(sync_event.wait(), 30)
            if DEBUG: print("\n📬  Sincronización recibida desde el Scheduler")
        except asyncio.TimeoutError:
            if DEBUG: print("\n⚠️  Timeout de sincronización con el Scheduler")
            
    except asyncio.TimeoutError:
        if DEBUG: print("\n⚠️  No se pudo establecer conexión (Timeout 45s)")
    except Exception as e:
        if DEBUG: print(f"\n⚠️ Error en transmisión/sincronización: {e}")
    finally:
        # Apagar radio tras el intento si no hay auditorías activas
        if not any(AUDIT_MODE.values()):
            CONNECTED_ALLOWED = False
            shutdown(status=b"sleep")

# ---- CORUTINA: Muestreo Periódico de Sensores y Ahorro de Energía ----
async def sensor_publish_task():
    """
    Muestreo offline del DHT22 y BH1750 cada 60s.
    Acumula en RingBuffers y gatilla transmisión al completar el lote.
    """
    global CONNECTED_ALLOWED
    dht_read_failures = 0
    lux_read_failures = 0

    # Retardo inicial para estabilidad del regulador de voltaje (LDO)
    await asyncio.sleep(5)

    # === Fase de Arranque Inicial ===
    # Publica reportes pendientes al encenderse
    await transmit_and_sync()

    # === Bucle de Muestreo Periódico ===
    while True:
        await asyncio.sleep(60)

        temp, hum, lux = None, None, None

        # 1. Lectura DHT22 (Clima)
        dht_ok = False
        if dht_sensor is not None:
            try:
                clean_dht_line()
                await asyncio.sleep_ms(1500)
                dht_sensor.measure()
                temp = round(dht_sensor.temperature(), 1)
                hum  = round(dht_sensor.humidity(), 1)
                dht_ok = True
                dht_read_failures = 0
            except: pass

        if not dht_ok:
            dht_read_failures += 1
            if DEBUG: print(f"⚠️  DHT22: Fallo de lectura. Fallos: {dht_read_failures}")

        # 2. Lectura BH1750 (Solo si IS_SAMPLING_LUX es True)
        lux_ok = False
        if IS_SAMPLING_LUX and bh1750_sensor is not None:
            try:
                lux_raw = bh1750_sensor.get_auto_luminance()
                if lux_raw is not None:
                    lux = round(lux_raw, 1)
                    lux_ok = True
                    lux_read_failures = 0
            except: pass
        else:
            lux_ok = True 

        if not lux_ok:
            lux_read_failures += 1
            if DEBUG: print(f"⚠️  BH1750: Fallo de lectura. Fallos: {lux_read_failures}")

        # 2.1 Re-setup si hay fallos repetidos (Reducido a 3 fallos)
        if dht_read_failures >= 3 or lux_read_failures >= 3:
            if DEBUG:
                    print(f"\n⚠️  Se detecto un {Colors.YELLOW}FALLO{Colors.RESET} en los Sensores\n\n")
                    print(f"\n🔄  {Colors.BLUE}Re-inicializando Sensores{Colors.RESET}\n\n")
            await setup_sensors()
            dht_read_failures = 0
            lux_read_failures = 0

        # 3. Acumulación en RingBuffers
        if temp is not None: temperature_Batch.append(temp)
        if hum is not None:  humidity_Batch.append(hum)
        if lux is not None:  illuminance_Batch.append(lux)

        if DEBUG:
            c = max(temperature_Batch.count, illuminance_Batch.count)
            print(f"\n📊 Data ({c}/{BATCH_SIZE}): Temperature: {Colors.MAGENTA}{temp}°C{Colors.RESET}  Humidity: {Colors.BLUE}{hum}%{Colors.RESET}  Illuminance: {Colors.YELLOW}{lux}lux{Colors.RESET}")

        # 4. Transmitir si se completa el lote
        if temperature_Batch.count >= BATCH_SIZE or (IS_SAMPLING_LUX and illuminance_Batch.count >= BATCH_SIZE):
            await transmit_and_sync()
        else:
            # Apagar si la radio quedó encendida por una auditoría que terminó
            if CONNECTED_ALLOWED and not any(AUDIT_MODE.values()):
                CONNECTED_ALLOWED = False
                shutdown(status=b"sleep")