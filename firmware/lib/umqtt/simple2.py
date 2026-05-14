# =============================================================================
# umqtt.simple2 — Librería MQTT para MicroPython (ESP32)
# =============================================================================
# Fuente Original: micropython-umqtt.simple2 (PyPI)
# Modificado por:  PristinoPlant (Relay Modules Firmware v0.13.0)
#
# ---- Registro de Parches Aplicados ----
#
# [PATCH-1] connect(): Espera TCP + Timeout SSL
#   - poll(POLLOUT) verifica que TCP esté conectado antes de iniciar SSL.
#   - settimeout() limita el handshake TLS al socket_timeout configurado.
#   - Previene cuelgue indefinido de wrap_socket() en redes inestables.
#
# [PATCH-2] disconnect(): Cierre de sock_raw (Anti Memory Leak)
#   - Siempre cierra sock_raw incluso si sock (SSL) nunca se creó.
#   - La librería original solo cierra sock, dejando el socket TCP zombie
#     cuando el handshake SSL falla (-202). Cada zombie consume ~5KB de RAM
#     y un File Descriptor, causando EBUSY y ENOMEM tras pocos reintentos.
#
# [PATCH-3] _write(): Escritura Robusta Anti-Bloqueo
#   - Bucle con cronómetro de seguridad para escrituras parciales.
#   - Protege contra saturación del buffer TCP en redes con >500ms de latencia.
#   - Lanza MQTTException(3) tras socket_timeout sin progreso (evita WDT crash).
#
# [PATCH-4] _read(): Lectura Resiliente Anti-Zombie
#   - Maneja errores transitorios de MicroPython (EAGAIN=11, ETIMEDOUT=110,
#     MbedTLS timeout=116/-116) sin matar la conexión.
#   - Traduce fallos fatales de red (ECONNRESET, etc.) a MQTTException(2).
#
# [PATCH-5] _message_timeout(): Gestión de PIDs sin Fugas de RAM
#   - Itera sobre llaves del diccionario en vez de .items() para evitar
#     crear copias temporales (lista de tuplas) que fragmentan la heap.
#   - Acumula PIDs expirados en lista auxiliar y limpia después del loop.
# =============================================================================

import usocket as socket # type: ignore
import uselect # type: ignore
from utime import ticks_add, ticks_ms, ticks_diff, sleep_ms # type: ignore

class MQTTException(Exception): 0

def pid_gen(pid=0):
	A = pid
	while True:
		A = A + 1 if A < 65535 else 1
		yield A

class MQTTClient:
	def __init__(A, client_id, server, port=0, user=None, password=None, keepalive=0, ssl=False, ssl_params=None, socket_timeout=15, message_timeout=30):
		C = ssl_params
		B = port
		if B == 0: B = 8883 if ssl else 1883
		A.client_id = client_id
		A.sock = None
		A.sock_raw = None  # [PATCH-2] Referencia explícita para limpieza en disconnect()
		A.poller_r = None
		A.poller_w = None
		A.server = server
		A.port = B
		A.ssl = ssl
		A.ssl_params = C if C else {}
		A.newpid = pid_gen()
		if not getattr(A, 'cb', None): A.cb = None
		if not getattr(A, 'cbstat', None): A.cbstat = lambda p, s: None
		A.user = user
		A.pswd = password
		A.keepalive = keepalive
		A.lw_topic = None
		A.lw_msg = None
		A.lw_qos = 0
		A.lw_retain = False
		A.rcv_pids = {}
		A.last_ping = ticks_ms()
		A.last_cpacket = ticks_ms()
		A.socket_timeout = socket_timeout
		A.message_timeout = message_timeout

	# ---- [PATCH-4] Lectura Resiliente Anti-Zombie ----
	def _read(A, n):
		"""Maneja interrupciones de red TCP/SSL limpiamente, evitando bucles infinitos."""
		if n < 0: raise MQTTException(2)

		B = b''
		while len(B) < n:
			try:
				C = A.sock.read(n - len(B))
			except OSError as D:
				E = D.args[0] if D.args else 0
				# 11  = EAGAIN / EWOULDBLOCK (No hay datos aún)
				# 110 = ETIMEDOUT (Timeout estándar)
				# 116 / -116 = Timeout específico de MbedTLS / LwIP en ESP32
				if E in (11, 110, 116, -116):
					C = None
				else:
					# Fallo fatal de red (ej. ECONNRESET)
					raise MQTTException(2)
			except AttributeError:
				raise MQTTException(8)

			if C is None:
				# No hay datos listos, esperamos usando el poller
				A._sock_timeout(A.poller_r, A.socket_timeout)
				continue

			if C == b'':
				raise MQTTException(1)  # Conexión cerrada limpiamente por el host
			else:
				B += C

		return B

	# ---- [PATCH-3] Escritura Robusta Anti-Bloqueo ----
	def _write(A, bytes_wr, length=-1):
		"""Asegura el envío total de datos con protección contra saturación de red."""
		D = bytes_wr if length == -1 else bytes_wr[:length]
		F = 0          # bytes transferidos
		G = ticks_ms() # cronómetro de seguridad

		while F < len(D):
			A._sock_timeout(A.poller_w, A.socket_timeout)
			try:
				C = A.sock.write(D[F:])
			except AttributeError:
				raise MQTTException(8)
			except OSError:
				raise MQTTException(3)  # Red muerta / Fallo de escritura

			if C is None:
				# Buffer TCP lleno: si superamos socket_timeout sin progreso, abortamos
				if ticks_diff(ticks_ms(), G) > (A.socket_timeout * 1000):
					raise MQTTException(3)  # Timeout de escritura (Evita el WDT Crash)
				# 500ms da tiempo al stack TCP para drenar en redes lentas (>500ms latencia)
				sleep_ms(500)
				continue

			if C == 0:
				raise MQTTException(3)  # Conexión cerrada abruptamente

			F += C
			# Reseteamos el cronómetro si logramos empujar datos exitosamente
			G = ticks_ms()

		return F

	def _send_str(A, s):
		assert len(s) < 65536
		A._write(len(s).to_bytes(2, 'big'))
		A._write(s)

	def _recv_len(D):
		A = 0; B = 0
		while 1:
			C = D._read(1)[0]
			A |= (C & 127) << B
			if not C & 128: return A
			B += 7

	def _varlen_encode(C, value, buf, offset=0):
		B = offset; A = value
		assert A < 268435456
		while A > 127:
			buf[B] = A & 127 | 128
			A >>= 7; B += 1
		buf[B] = A
		return B + 1

	def _sock_timeout(B, poller, socket_timeout):
		D = socket_timeout; C = poller
		if B.sock:
			E = C.poll(-1 if D is None else int(D * 1000))
			if E:
				for (F, A) in E:
					if not A & uselect.POLLIN and A & uselect.POLLHUP:
						raise MQTTException(2 if C == B.poller_r else 3)
					if A & uselect.POLLERR:
						raise MQTTException(1)
			else:
				raise MQTTException(30)
		else:
			raise MQTTException(28)

	def set_callback(A, f): A.cb = f
	def set_callback_status(A, f): A.cbstat = f

	def set_last_will(A, topic, msg, retain=False, qos=0):
		B = topic
		assert 0 <= qos <= 2
		assert B
		A.lw_topic = B; A.lw_msg = msg; A.lw_qos = qos; A.lw_retain = retain

	# ---- [PATCH-1] connect(): Resiliencia de Red y SSL ----
	def connect(A, clean_session=True):
		F = clean_session
		A.disconnect()
		try:
			# [PATCH] Protección DNS: Evita cuelgue si el host no resuelve
			D = socket.getaddrinfo(A.server, A.port)[0]
		except OSError:
			raise MQTTException(30) # DNS Timeout/Failure
		A.sock_raw = socket.socket(D[0], D[1], D[2])
		A.sock_raw.setblocking(False)
		try:
			A.sock_raw.connect(D[-1])
		except OSError as H:
			import uerrno as I # type: ignore
			if H.args[0] != I.EINPROGRESS: raise

		# [PATCH-1] Esperar TCP conectado antes de SSL (evita wrap_socket sobre socket no listo)
		G0 = uselect.poll()
		G0.register(A.sock_raw, uselect.POLLOUT | uselect.POLLERR)
		G1 = G0.poll(A.socket_timeout * 1000)
		G0.unregister(A.sock_raw)
		if not G1: raise MQTTException(30)  # TCP connect timeout
		for G2, G3 in G1:
			if G3 & uselect.POLLERR: raise MQTTException(1)  # TCP connect failed

		if A.ssl:
			try:
				import ussl # type: ignore
			except ImportError:
				import ssl as ussl # type: ignore
			# [PATCH] settimeout limita el handshake TLS al socket_timeout (evita bloqueo infinito de ussl)
			A.sock_raw.settimeout(A.socket_timeout)
			try:
				A.sock = ussl.wrap_socket(A.sock_raw, **A.ssl_params)
			except OSError as ssl_err:
				# [PATCH] Limpieza Atómica: Cierra el socket crudo si el handshake falla 
				# Previene "sockets zombies" que causan EBUSY tras varios fallos SSL.
				try: A.sock_raw.close()
				except: pass
				A.sock_raw = None
				A.sock = None
				raise ssl_err
			A.sock_raw.setblocking(False)
		else:
			A.sock = A.sock_raw

		A.poller_r = uselect.poll()
		A.poller_r.register(A.sock, uselect.POLLERR | uselect.POLLIN | uselect.POLLHUP)
		A.poller_w = uselect.poll()
		A.poller_w.register(A.sock, uselect.POLLOUT)
		G = bytearray(b'\x10\x00\x00\x00\x00\x00')
		B = bytearray(b'\x00\x04MQTT\x04\x00\x00\x00')
		E = 10 + 2 + len(A.client_id)
		B[7] = bool(F) << 1
		if bool(F): A.rcv_pids.clear()
		if A.user is not None:
			E += 2 + len(A.user); B[7] |= 1 << 7
			if A.pswd is not None: E += 2 + len(A.pswd); B[7] |= 1 << 6
		if A.keepalive:
			assert A.keepalive < 65536
			B[8] |= A.keepalive >> 8; B[9] |= A.keepalive & 255
		if A.lw_topic:
			E += 2 + len(A.lw_topic) + 2 + len(A.lw_msg)
			B[7] |= 4 | (A.lw_qos & 1) << 3 | (A.lw_qos & 2) << 3
			B[7] |= A.lw_retain << 5
		J = A._varlen_encode(E, G, 1)
		A._write(G, J); A._write(B); A._send_str(A.client_id)
		if A.lw_topic: A._send_str(A.lw_topic); A._send_str(A.lw_msg)
		if A.user is not None:
			A._send_str(A.user)
			if A.pswd is not None: A._send_str(A.pswd)
		C = A._read(4)
		if not (C[0] == 32 and C[1] == 2): raise MQTTException(29)
		if C[3] != 0:
			if 1 <= C[3] <= 5: raise MQTTException(20 + C[3])
			else: raise MQTTException(20, C[3])
		A.last_cpacket = ticks_ms()
		return C[2] & 1

	# ---- [PATCH-2] disconnect(): Cierre de sock_raw (Anti Memory Leak) ----
	def disconnect(A):
		# Intentamos enviar DISCONNECT limpio si hay socket SSL activo
		if A.sock:
			try: A._write(b'\xe0\x00')
			except (OSError, MQTTException): pass
			# Desregistramos pollers del socket SSL
			if A.poller_r:
				try: A.poller_r.unregister(A.sock)
				except OSError: pass
			if A.poller_w:
				try: A.poller_w.unregister(A.sock)
				except OSError: pass
			# Cerramos el socket SSL
			try: A.sock.close()
			except OSError: pass

		# [PATCH-2] SIEMPRE cerramos sock_raw, incluso si sock (SSL) nunca se creó.
		# Sin este cierre, cada fallo de handshake SSL (-202) deja un socket TCP
		# zombie abierto que consume ~5KB de RAM y un File Descriptor del sistema.
		# Tras 3-4 reintentos fallidos: EBUSY (sin FDs) → ENOMEM → WDT Reset.
		if A.sock_raw and A.sock_raw is not A.sock:
			try: A.sock_raw.close()
			except OSError: pass

		A.poller_r = None
		A.poller_w = None
		A.sock = None
		A.sock_raw = None

	def ping(A):
		A._write(b'\xc0\x00')
		A.last_ping = ticks_ms()

	def publish(A, topic, msg, retain=False, qos=0, dup=False):
		E = topic; B = qos
		assert B in (0, 1)
		C = bytearray(b'0\x00\x00\x00\x00')
		C[0] |= B << 1 | retain | int(dup) << 3
		F = 2 + len(E) + len(msg)
		if B > 0: F += 2
		G = A._varlen_encode(F, C, 1)
		A._write(C, G); A._send_str(E)
		if B > 0:
			D = next(A.newpid)
			A._write(D.to_bytes(2, 'big'))
		A._write(msg)
		if B > 0:
			A.rcv_pids[D] = ticks_add(ticks_ms(), A.message_timeout * 1000)
			return D

	def subscribe(A, topic, qos=0):
		E = topic
		assert qos in (0, 1)
		assert A.cb is not None, 'Subscribe callback is not set'
		B = bytearray(b'\x82\x00\x00\x00\x00\x00\x00')
		C = next(A.newpid)
		F = 2 + 2 + len(E) + 1
		D = A._varlen_encode(F, B, 1)
		B[D:D+2] = C.to_bytes(2, 'big')
		A._write(B, D + 2); A._send_str(E)
		A._write(qos.to_bytes(1, 'little'))
		A.rcv_pids[C] = ticks_add(ticks_ms(), A.message_timeout * 1000)
		return C

	# ---- [PATCH-5] _message_timeout(): Gestión de PIDs sin Fugas de RAM ----
	def _message_timeout(A):
		"""Limpia los PIDs vencidos sin fragmentar la memoria RAM."""
		C = ticks_ms()
		D = []
		# Iteramos solo sobre las llaves (keys) para no clonar todo en memoria
		for B in A.rcv_pids:
			if ticks_diff(A.rcv_pids[B], C) <= 0:
				D.append(B)
		# Limpieza post-iteración (no se modifica el dict durante el loop)
		for B in D:
			A.rcv_pids.pop(B)
			A.cbstat(B, 0)

	def check_msg(A):
		if A.sock:
			try:
				D = A.sock.read(1)
				if D is None:
					if not A.poller_r.poll(-1 if A.socket_timeout is None else 1):
						A._message_timeout()
						return None
					D = A.sock.read(1)
					if D is None:
						A._message_timeout()
						return None
			except OSError as H:
				if H.args[0] == 110 or H.args[0] == 11:
					A._message_timeout()
					return None
				else:
					raise H
		else:
			raise MQTTException(28)
		if D == b'': raise MQTTException(1)
		if D == b'\xd0':
			if A._read(1)[0] != 0: raise MQTTException(-1)
			A.last_cpacket = ticks_ms()
			return
		B = D[0]
		if B == 64:
			E = A._read(1)
			if E != b'\x02': raise MQTTException(-1)
			G = int.from_bytes(A._read(2), 'big')
			if G in A.rcv_pids:
				A.last_cpacket = ticks_ms()
				A.rcv_pids.pop(G)
				A.cbstat(G, 1)
			else:
				A.cbstat(G, 2)
		if B == 144:
			C = A._read(4)
			if C[0] != 3: raise MQTTException(40, C)
			if C[3] == 128: raise MQTTException(44)
			if C[3] not in (0, 1, 2): raise MQTTException(40, C)
			F = C[2] | C[1] << 8
			if F in A.rcv_pids:
				A.last_cpacket = ticks_ms()
				A.rcv_pids.pop(F)
				A.cbstat(F, 1)
			else:
				raise MQTTException(5)
		A._message_timeout()
		if B & 240 != 48: return B
		E = A._recv_len()
		I = int.from_bytes(A._read(2), 'big')
		J = A._read(I)
		E -= I + 2
		if B & 6:
			F = int.from_bytes(A._read(2), 'big')
			E -= 2
		K = A._read(E) if E else b''
		L = B & 1; M = B & 8
		A.cb(J, K, bool(L), bool(M))
		A.last_cpacket = ticks_ms()
		if B & 6 == 2:
			A._write(b'@\x02')
			A._write(F.to_bytes(2, 'big'))
		elif B & 6 == 4:
			raise NotImplementedError()
		elif B & 6 == 6:
			raise MQTTException(-1)

	def wait_msg(A):
		B = A.socket_timeout
		A.socket_timeout = None
		C = A.check_msg()
		A.socket_timeout = B
		return C