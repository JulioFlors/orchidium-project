from micropython import const

class OTAErrors:
    # HTTP Status Codes
    HTTP_OK        = const(200)
    HTTP_NOT_FOUND = const(404)
    
    # MicroPython / MBEDTLS OSError Codes
    ERR_DNS_FAIL        = const(-202)
    ERR_SSL_INVALID_KEY = const(-15104)
    ERR_ENOMEM          = const(12)
    
    # Timeout negativo (común en algunas versiones de SSL)
    ERR_ETIMEDOUT_STD  = const(110)  # Standard POSIX
    ERR_ETIMEDOUT_LWIP = const(116) # LwIP (ESP32 nativo)
    ERR_ETIMEDOUT_MBED = const(-116) # MbedTLS wrapper

class OTAUpdater:
    def __init__(self, repo_url, main_dir='/', debug=True):
        import os #type: ignore
        import ujson #type: ignore

        self.repo_url = repo_url
        self.main_dir = main_dir
        self.debug = debug
        self.manifest_filename = 'manifest.json'
        self.local_manifest_path = self.main_dir + self.manifest_filename

        # PROTECCIÓN RAM: Solo creamos la clase de colores si hay debug activo
        if self.debug:
            class Colors:
                RESET   = '\x1b[0m'
                RED     = '\x1b[91m'
                GREEN   = '\x1b[92m'
                YELLOW  = '\x1b[93m'
                BLUE    = '\x1b[94m'
                MAGENTA = '\x1b[95m'
                CYAN    = '\x1b[96m'
                WHITE   = '\x1b[97m'
            self.Colors = Colors

        # Si no existe manifest.json local, creamos uno por defecto v0
        if self.manifest_filename not in os.listdir(self.main_dir):
            default_manifest = {
                "name": "Unknown",
                "version": "0.0.0",
                "files": ["main.py"]
            }
            with open(self.local_manifest_path, 'w') as f:
                ujson.dump(default_manifest, f)

    def _sync_time(self):
        """Intenta sincronizar el reloj con NTP con reintentos."""
        import ntptime #type: ignore
        import utime #type: ignore
        
        if self.debug: print(f"\n🕒  Sincronizando ", end="")

        max_retries = 10
        for attempt in range(1, max_retries + 1):
            # Sincronizar hora (Crítico para SSL)
            try: 
                ntptime.settime()
                if self.debug: print(f"\n🕒  Hora del sistema {self.Colors.GREEN}sincronizada{self.Colors.RESET}")
                return True
            except: 
                if self.debug: print(f"{self.Colors.BLUE}.{self.Colors.RESET}", end="")
                utime.sleep(1)

        if self.debug: print(f"\n\n⚠️  No se pudo sincronizar la Hora del sistema {self.Colors.YELLOW}(Riesgo SSL){self.Colors.RESET}") 
        return False

    def _get_version_tuple(self, version_str):
        try:
            clean_ver = version_str.replace('v', '')
            parts = clean_ver.split('.')
            return tuple([int(p) for p in parts])
        except Exception:
            if self.debug: print(f"\n❌  Error de formato: {self.Colors.RED}{version_str}{self.Colors.RESET}")
            return (0, 0, 0)

    def _http_get(self, url, save_path=None):
        """
        GET HTTPS manual usando sockets crudos.
        Si 'save_path' está definido, descarga el archivo en fragmentos (Chunks).
        Si no, lee el JSON directamente del socket (Stream) para ahorrar RAM.
        """
        import gc # type: ignore
        import ujson # type: ignore

        try:
            import usocket as socket # type: ignore
        except ImportError:
            import socket # type: ignore
            
        try:
            import ssl # type: ignore
        except ImportError:
            import ussl as ssl # type: ignore

        try:
            gc.collect()
            
            # Parsear URL
            proto, dummy, host, path = url.split("/", 3)
            
            # Crear Socket y Resolver DNS
            addr_info = socket.getaddrinfo(host, 443)[0][-1]
            
            s = None
            ss = None
            
            try:
                # Conectar TCP
                s = socket.socket()
                s.settimeout(30.0) 
                s.connect(addr_info)
                
                # Handshake SSL (Wrap)
                ss = ssl.wrap_socket(s, server_hostname=host)
                
                # Enviar Request HTTP
                request = f"GET /{path} HTTP/1.0\r\nHost: {host}\r\nUser-Agent: ESP32\r\nConnection: close\r\n\r\n"
                ss.write(request.encode())
                
                # Leemos la Respuesta (Status Code)
                status_line = ss.readline()
                if not status_line:
                    raise ValueError("Respuesta vacía del servidor")

                # Parsear "HTTP/1.0 200 OK"
                parts = status_line.decode().split(" ")
                status_code = int(parts[1])
                
                # Leemos y descartamos headers hasta encontrar la línea vacía
                while True:
                    line = ss.readline()
                    if not line or line == b'\r\n':
                        break
                
                # Validaciones de negocio sin MockResponse
                if status_code == 404:
                    return False if save_path else {"error": 404}
                
                if status_code != 200:
                    raise ValueError(f"HTTP Error {status_code}")

                # ---- 🧠 OPTIMIZACIÓN: CHUNKING VS STREAM RAM ----
                if save_path:
                    # Modo Archivo: Escribir a Flash en fragmentos de 512 bytes
                    with open(save_path, 'wb') as f:
                        while True:
                            chunk = ss.read(512)
                            if not chunk:
                                break
                            f.write(chunk)
                    return True # Retorna éxito
                
                else:
                    # Modo RAM: El socket apunta exactamente al inicio del JSON
                    # ujson.load(stream) lo parsea byte a byte sin crear un megastring
                    try:
                        parsed_data = ujson.load(ss)
                        return parsed_data
                    except ValueError as e:
                        if self.debug: print(f"❌ Error al parsear JSON remoto.")
                        raise e

            finally:
                if ss:
                    try: ss.close()
                    except: pass
                if s:
                    try: s.close()
                    except: pass
                gc.collect()

        except OSError as e:
            error_code = e.args[0] if e.args else 0
            is_timeout = error_code in (
                OTAErrors.ERR_ETIMEDOUT_STD, 
                OTAErrors.ERR_ETIMEDOUT_LWIP, 
                OTAErrors.ERR_ETIMEDOUT_MBED
            )
            
            if is_timeout:
                 if self.debug: print(f"\n❌  Timeout de Red ({error_code}): {self.Colors.RED}El servidor no respondió a tiempo{self.Colors.RESET}")
            elif error_code == OTAErrors.ERR_DNS_FAIL:
                 if self.debug: print(f"\n❌  Error DNS ({error_code}): {self.Colors.RED}No se pudo resolver el dominio{self.Colors.RESET}")
            elif error_code == OTAErrors.ERR_SSL_INVALID_KEY:
                 if self.debug: print(f"\n❌  Error SSL ({error_code}): {self.Colors.RED}Certificado inválido{self.Colors.RESET}")
            elif error_code == OTAErrors.ERR_ENOMEM:
                 if self.debug: print(f"\n❌  Error de Memoria ({error_code}): {self.Colors.RED}No hay RAM suficiente para SSL{self.Colors.RESET}")
            else:
                 if self.debug: print(f"\n❌  Error Desconocido de Red/SSL ({error_code}): {self.Colors.RED}{e}{self.Colors.RESET}")
            
            return False if save_path else None

        except Exception as e:
            if self.debug: print(f"\n❌  Error HTTP GET: {self.Colors.RED}{e}{self.Colors.RESET}")
            return False if save_path else None

    def check_for_updates(self):
        import machine #type: ignore
        import utime #type: ignore
        import ujson #type: ignore

        # Sincronizar hora para evitar error -15104
        self._sync_time()
        
        current_version_str = "0.0.0"
        try:
            with open(self.local_manifest_path, 'r') as f:
                local_data = ujson.load(f)
                current_version_str = local_data.get('version', "0.0.0")
        except:
            pass

        if self.debug: print(f"\n📡  Firmware: {self.Colors.BLUE}v{current_version_str}{self.Colors.RESET}")

        manifest_url = self.repo_url + self.manifest_filename
        if self.debug: print(f"📡  Buscando actualización: {self.Colors.BLUE}{manifest_url}{self.Colors.RESET}")

        # Descargar manifest remoto (Ahora es un diccionario directamente)
        remote_data = self._http_get(manifest_url)

        if not remote_data:
            if self.debug: print(f"\n❌  Error de conexión")
            return False
        
        # Validación del 404 amigable. Retorna True para evitar el reset infinito
        if remote_data.get("error") == 404:
            if self.debug: print(f"\n⚠️  {self.Colors.YELLOW}No se encontro{self.Colors.RESET} el archivo {self.Colors.YELLOW}{self.manifest_filename}{self.Colors.RESET} en el repositorio")
            return True 

        # Proceso de parseo y validación de versiones
        try:
            remote_version_str = remote_data.get('version', "0.0.0")

            local_tuple = self._get_version_tuple(current_version_str)
            remote_tuple = self._get_version_tuple(remote_version_str)

            if remote_tuple > local_tuple:
                if self.debug:
                    print(f"📡  ---------------------------------------------{self.Colors.RESET}")
                    print(f"📡  Firmware: {self.Colors.GREEN}{remote_data.get('name')}{self.Colors.RESET}")
                    print(f"📡  Versión: {self.Colors.GREEN}v{remote_data.get('version')}{self.Colors.RESET}")
                    print(f"📡  Fecha: {self.Colors.GREEN}{remote_data.get('date')}{self.Colors.RESET}")
                    print(f"📡  Notas: {self.Colors.WHITE}{remote_data.get('notes_release')}{self.Colors.RESET}")
                    print(f"📡  ---------------------------------------------{self.Colors.RESET}")
                
                if self.fetch_latest_code(remote_data):
                    # Solo actualizamos el manifest y reiniciamos si la descarga fue exitosa
                    with open(self.local_manifest_path, 'w') as f:
                        ujson.dump(remote_data, f)
                    
                    if self.debug: print(f"\n✅  Actualización {self.Colors.GREEN}Completada{self.Colors.RESET}")
                    if self.debug: print(f"🔥  Reiniciando Dispositivo")
                    utime.sleep(1)
                    machine.reset()
                else:
                    if self.debug: print(f"\n❌  Actualización {self.Colors.RED}Abortada{self.Colors.RESET}")
                    return False

            else:
                if self.debug: print(f"\n✅  Firmware {self.Colors.GREEN}Actualizado{self.Colors.RESET}")
                return True

        except Exception as e:
            if self.debug: print(f"\n❌  Error de actualización: {self.Colors.RED}{e}{self.Colors.RESET}")
            return False
            
        return True

    def fetch_latest_code(self, remote_data):
        """Descarga todos los archivos. Retorna True si todo salió bien."""

        success = True
        for filename in remote_data.get('files', []):
            if not self.download_and_save_file(self.repo_url, filename):
                success = False
                break # Detener si un archivo falla para no dejar el sistema inconsistente
        return success

    def download_and_save_file(self, root_url, filename):
        try:
            # Soporte para URLs absolutas (Shared resources)
            if filename.startswith("http"):
                url = filename
                local_filename = filename.split('/')[-1]
            else:
                url = root_url + filename
                local_filename = filename

            if self.debug: print(f"📡  Descargando: {self.Colors.BLUE}{local_filename}{self.Colors.RESET}", end=" ")
            
            # Definimos la ruta de destino final
            save_path = self.main_dir + local_filename
            
            # Le pasamos la responsabilidad a _http_get
            success = self._http_get(url, save_path=save_path)
            
            if success:
                if self.debug: print(f"✅")
                return True
            else:
                if self.debug: print(f"❌")
                return False

        except Exception as e:
            if self.debug: print(f"\n❌  Error guardando archivo: {self.Colors.RED}{e}{self.Colors.RESET}")
            return False