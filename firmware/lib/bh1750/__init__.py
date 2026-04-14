"""
Driver MicroPython para el sensor de iluminancia BH1750 con Auto-Escala MTreg.
"""

from utime import sleep_ms # type: ignore

class BH1750():
    """Driver MicroPython para el sensor de iluminancia BH1750."""

    PWR_OFF = 0x00
    PWR_ON  = 0x01
    RESET   = 0x07

    # modos de operación
    CONT_LOWRES  = 0x13
    CONT_HIRES_1 = 0x10
    CONT_HIRES_2 = 0x11
    ONCE_HIRES_1 = 0x20
    ONCE_HIRES_2 = 0x21
    ONCE_LOWRES  = 0x23

    # dirección por defecto addr=0x23 si el pin addr está flotando o conectado a tierra (GND)
    # addr=0x5c si el pin addr está conectado a nivel alto (VCC)
    def __init__(self, bus, addr=0x23):
        self.bus = bus
        self.addr = addr
        self.mtreg = 69
        self.mode = None
        self.off()
        self.reset()
        self.set_mtreg(self.mtreg)

    def off(self):
        """Apaga el sensor."""
        self._set_mode(self.PWR_OFF)

    def on(self):
        """Enciende el sensor."""
        self._set_mode(self.PWR_ON)

    def reset(self):
        """Reinicia el sensor, encendiéndolo primero si es necesario."""
        self.on()
        self._set_mode(self.RESET)

    def _set_mode(self, mode):
        """Establece el modo de operación del sensor."""
        self.mode = mode
        self.bus.writeto(self.addr, bytes([self.mode]))

    def set_mtreg(self, mtreg):
        """
        Ajusta el Registro de Tiempo de Medición (MTreg) para cambiar la sensibilidad.
        Rango válido: de 31 a 254 (Por defecto: 69).
        """
        mtreg = max(31, min(mtreg, 254))
        self.mtreg = mtreg
        
        # Byte alto (H): 01000_MT[7,6,5]
        # Byte bajo (L): 011_MT[4,3,2,1,0]
        high = 0x40 | (mtreg >> 5)
        low = 0x60 | (mtreg & 0x1F)
        
        # Cambiar el MTreg requiere que el sensor esté encendido
        self.bus.writeto(self.addr, bytes([high]))
        self.bus.writeto(self.addr, bytes([low]))

    def get_auto_luminance(self):
        """
        Medición de iluminancia con auto-escala.
        Utiliza el ajuste de MTreg para prevenir la saturación y medir hasta ~121,557 lux.
        Eficiencia energética: utiliza modos de lectura única (ONCE).
        """
        # Primero, tomamos una muestra con el MTreg por defecto para condiciones generales
        self.set_mtreg(69)
        lux = self.luminance(self.ONCE_HIRES_1)
        
        if lux > 40000.0:
            # Acercándose a la saturación (máx ~54k). Reducimos MTreg a 31 (menor sensibilidad)
            self.set_mtreg(31)
            lux = self.luminance(self.ONCE_HIRES_1)
        elif lux < 100.0:
            # Muy oscuro o sombra intensa. Aumentamos MTreg a 254 y usamos HIGH_RES_2 (máxima sensibilidad)
            self.set_mtreg(254)
            lux = self.luminance(self.ONCE_HIRES_2)
            
        return lux

    def luminance(self, mode):
        """Muestra la iluminancia (en lux), usando el modo especificado."""
        # modos continuos
        if mode & 0x10 and mode != self.mode:
            self._set_mode(mode)
        # modos de lectura única (one shot)
        elif mode & 0x20:
            self._set_mode(mode)

        # Calculamos un retardo dinámico basado en el valor actual del MTreg.
        base_delay = 24 if mode in (0x13, 0x23) else 180
        delay = (base_delay * self.mtreg) // 69 + 1 # +1 de margen de seguridad
        sleep_ms(delay)
        
        data = self.bus.readfrom(self.addr, 2)
        factor = 2.0 if mode in (0x11, 0x21) else 1.0
        raw = (data[0] << 8 | data[1])
        
        # Fórmula: Lux = (Lectura Bruta / 1.2 / factor) * (69 / MTreg)
        return (raw / (1.2 * factor)) * (69 / self.mtreg)