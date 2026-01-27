# ---- Colors for logs ----
class Colors:
    RESET = '\x1b[0m'
    RED = '\x1b[91m'
    GREEN = '\x1b[92m'
    YELLOW = '\x1b[93m'
    BLUE = '\x1b[94m'
    MAGENTA = '\x1b[95m'
    WHITE = '\x1b[97m'

class OTAErrors:
# HTTP Status Codes
    HTTP_OK = 200
    HTTP_NOT_FOUND = 404
    
    # MicroPython / MBEDTLS OSError Codes
    ERR_DNS_FAIL = -202
    ERR_SSL_INVALID_KEY = -15104 
    ERR_ENOMEM = 12
    
    # Timeout negativo (común en algunas versiones de SSL)
    ERR_ETIMEDOUT_STD = 110  # Standard POSIX
    ERR_ETIMEDOUT_LWIP = 116 # LwIP (ESP32 nativo)
    ERR_ETIMEDOUT_MBED = -116 # MbedTLS wrapper

class OTAUpdater:
    def __init__(self, repo_url, main_dir='/', debug=True):
        import os #type: ignore
        import ujson #type: ignore

        self.repo_url = repo_url
        self.main_dir = main_dir
        self.debug = debug
        self.manifest_filename = 'manifest.json'
        self.local_manifest_path = self.main_dir + self.manifest_filename

        # Si no existe manifest.json local, creamos uno por defecto v0
        if self.manifest_filename not in os.listdir(self.main_dir):
            default_manifest = {
                "name": "Unknown",
                "version": "0.0.0",
                "files": ["main.py"]
            }
            with open(self.local_manifest_path, 'w') as f:
                ujson.dump(default_manifest, f)

    # ---- Función Auxiliar: Logs de Desarrollo ----
    def log(self, *args, **kwargs):
        """Imprime solo si el modo DEBUG está activado."""
        if self.debug:
            print(*args, **kwargs)

    def _sync_time(self):
        """Intenta sincronizar el reloj con NTP con reintentos."""
        import ntptime #type: ignore
        import utime #type: ignore
        
        self.log(f"\n⌚  Sincronizando ", end="")

        max_retries = 10
        for attempt in range(1, max_retries + 1):
            # Sincronizar hora (Crítico para SSL)
            try: 
                ntptime.settime()
                self.log(f"\n⌚  Hora del sistema {Colors.GREEN}sincronizada{Colors.RESET}")
                return True
            except: 
                self.log(f"{Colors.BLUE}.{Colors.RESET}", end="")
                utime.sleep(1)

        self.log(f"\n\n⚠️  No se pudo sincronizar la Hora del sistema {Colors.YELLOW}(Riesgo SSL){Colors.RESET}") 
        return False

    def _get_version_tuple(self, version_str):
        try:
            clean_ver = version_str.replace('v', '')
            parts = clean_ver.split('.')
            return tuple([int(p) for p in parts])
        except Exception:
            self.log(f"\n❌  Error de formato: {Colors.RED}{version_str}{Colors.RESET}")
            return (0, 0, 0)

    def _http_get(self, url):
        """
        GET HTTPS manual usando sockets crudos para tener control total del timeout.
        Reemplaza a urequests para evitar congelamientos en el handshake SSL.
        """

        import gc #type: ignore
        import ujson #type: ignore

        try:
            import usocket as socket #type: ignore
        except ImportError:
            import socket #type: ignore
            
        try:
            import ssl #type: ignore
        except ImportError:
            import ussl as ssl #type: ignore

        try:
            gc.collect()
            
            # Parsear URL
            proto, dummy, host, path = url.split("/", 3)
            
            # Crear Socket y Resolver DNS
            # getaddrinfo devuelve una lista de tuplas, tomamos la primera direccion
            addr_info = socket.getaddrinfo(host, 443)[0][-1]
            
            s = socket.socket()
            s.settimeout(30.0) 
            
            try:
                # Conectar TCP
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
                
                # Leemos y descartamos headers hasta encontrar la linea vacia
                while True:
                    line = ss.readline()
                    if not line or line == b'\r\n':
                        break
                
                # Leemos el Body
                body = ss.read().decode()
                
                # Cerrar Socket y 
                # Liberar recursos
                ss.close()
                s.close()
                gc.collect()

                # Empaquetar como objeto compatible (Mock Response)
                class MockResponse:
                    def __init__(self, code, content):
                        self.status_code = code
                        self.text = content

                    def json(self):
                        try:
                            return ujson.loads(self.text)
                        except ValueError as e:
                            # Esto te ayudará a entender por qué falla el parseo
                            print(f"❌ Error al parsear JSON. Contenido recibido: '{self.text}'")
                            raise e

                    def close(self):
                        pass
                
                # Validaciones de negocio
                if status_code == 404:
                    return MockResponse(404, "")
                
                if status_code != 200:
                    raise ValueError(f"HTTP Error {status_code}")

                return MockResponse(200, body)

            except Exception as e:
                ss.close()
                s.close()
                raise e

        except OSError as e:
            # Extraemos el código numérico del error
            error_code = e.args[0] if e.args else 0

            # Agrupamos todos los Timeouts conocidos
            is_timeout = error_code in (
                OTAErrors.ERR_ETIMEDOUT_STD, 
                OTAErrors.ERR_ETIMEDOUT_LWIP, 
                OTAErrors.ERR_ETIMEDOUT_MBED
            )
            
            # Timeout (Positivos 110/116 o Negativo -116)
            if is_timeout:
                 self.log(f"\n❌  Timeout de Red ({error_code}): {Colors.RED}El servidor no respondió a tiempo{Colors.RESET}")
            
            # Error DNS (-202)
            elif error_code == OTAErrors.ERR_DNS_FAIL:
                 self.log(f"\n❌  Error DNS ({error_code}): {Colors.RED}No se pudo resolver el dominio{Colors.RESET}")
                 self.log(f"⚠️  Conexión a internet {Colors.YELLOW}Inestable{Colors.RESET}")

            # Error SSL / Fecha (-15104)
            elif error_code == OTAErrors.ERR_SSL_INVALID_KEY:
                 self.log(f"\n❌  Error SSL ({error_code}): {Colors.RED}Certificado inválido{Colors.RESET}")
                 self.log(f"⚠️  Conexión a internet {Colors.YELLOW}Inestable{Colors.RESET}")

            # Error de Memoria (12)
            elif error_code == OTAErrors.ERR_ENOMEM:
                 self.log(f"\n❌  Error de Memoria ({error_code}): {Colors.RED}No hay RAM suficiente para SSL{Colors.RESET}")

            # Otros errores
            else:
                 self.log(f"\n❌  Error Desconocido de Red/SSL ({error_code}): {Colors.RED}{e}{Colors.RESET}")
            
            return None

        except Exception as e:
            self.log(f"\n❌  Error HTTP GET: {Colors.RED}{e}{Colors.RESET}")
            return None

    def check_for_updates(self):
        import machine #type: ignore
        import utime #type: ignore
        import ujson #type: ignore
        #import gc #type: ignore

        # Sincronizar hora para evitar error -15104
        self._sync_time()
        
        current_version_str = "0.0.0"
        try:
            with open(self.local_manifest_path, 'r') as f:
                local_data = ujson.load(f)
                current_version_str = local_data.get('version', "0.0.0")
        except:
            pass

        #self.log(f"📱  RAM libre: {Colors.BLUE}{gc.mem_free()}{Colors.RESET}")

        self.log(f"\n📡  Firmware: {Colors.BLUE}v{current_version_str}{Colors.RESET}")

        manifest_url = self.repo_url + self.manifest_filename

        self.log(f"📡  Buscando actualización: {Colors.BLUE}{manifest_url}{Colors.RESET}")

        # Descargar manifest remoto usando el wrapper seguro
        response = self._http_get(manifest_url)

        # Validamos la respuesta
        if not response:
            self.log(f"\n❌  Error de conexión")
            return
        
        if response.status_code == 404:
            self.log(f"\n⚠️  {Colors.YELLOW}No se encontro{Colors.RESET} el archivo {Colors.YELLOW}{self.manifest_filename}{Colors.RESET} en el repositorio")
            return # no queremos parsear basura

        if response.status_code != 200:
             self.log(f"\n❌ Error HTTP inesperado: {response.status_code}")
             return # Falló la descarga

        # Solo si es 200 OK intentamos parsear
        try:
            remote_data = response.json()
            response.close()
            
            remote_version_str = remote_data.get('version', "0.0.0")

            local_tuple = self._get_version_tuple(current_version_str)
            remote_tuple = self._get_version_tuple(remote_version_str)

            if remote_tuple > local_tuple:
                self.log(f"📡  ---------------------------------------------{Colors.RESET}")
                self.log(f"📡  Firmware: {Colors.GREEN}{remote_data.get('name')}{Colors.RESET}")
                self.log(f"📡  Versión: {Colors.GREEN}v{remote_data.get('version')}{Colors.RESET}")
                self.log(f"📡  Fecha: {Colors.GREEN}{remote_data.get('date')}{Colors.RESET}")
                self.log(f"📡  Notas: {Colors.WHITE}{remote_data.get('notes_release')}{Colors.RESET}")
                self.log(f"📡  ---------------------------------------------{Colors.RESET}")
                
                if self.fetch_latest_code(remote_data):
                    # Solo actualizamos el manifest y reiniciamos si la descarga fue exitosa
                    with open(self.local_manifest_path, 'w') as f:
                        ujson.dump(remote_data, f)
                    
                    self.log(f"\n✅  Actualización {Colors.GREEN}Completada{Colors.RESET}")
                    self.log(f"🔥  Reiniciando Dispositivo")
                    utime.sleep(1)
                    machine.reset()
                else:
                    self.log(f"\n❌  Actualización {Colors.RED}Abortada{Colors.RESET}")

            else:
                self.log(f"\n✅  Firmware {Colors.GREEN}Actualizado{Colors.RESET}")

        except Exception as e:
            self.log(f"\n❌  Error de actualización: {Colors.RED}{e}{Colors.RESET}")
            if 'response' in locals(): response.close()

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
                # Extraemos el nombre real del archivo
                local_filename = filename.split('/')[-1]
            else:
                url = root_url + filename
                local_filename = filename

            self.log(f"📡  Descargando: {Colors.BLUE}{local_filename}{Colors.RESET}", end=" ")
            
            response = self._http_get(url)
            
            if response:
                # Sobreescribimos el contenido del archivo
                with open(self.main_dir + local_filename, 'w') as f:
                    f.write(response.text)
                response.close()
                self.log(f"✅")
                return True
            else:
                self.log(f"❌")
                return False

        except Exception as e:
            self.log(f"\n❌  Error guardando archivo: {Colors.RED}{e}{Colors.RESET}")
            return False