# -----------------------------------------------------------------------------
# PristinoPlant - Script de Prueba Independiente del Sensor de Gotas de Lluvia
# Descripción: Script interactivo para leer, calibrar y diagnosticar el sensor de
#              lluvia físico de forma totalmente aislada.
# Fecha: 03-07-2026
# Versión: v1.0.0
# -----------------------------------------------------------------------------

import time
from machine import Pin, ADC

# ---- Configuración de Hardware ----
RAIN_PIN_NUM = 35  # GPIO 35 (Entrada analógica del sensor)

# ---- Parámetros de Calibración (Idénticos al firmware de producción) ----
RAIN_START_VALUE  = 2300  # Mojado / Inicia evento (Valores inferiores indican lluvia)
RAIN_STOP_VALUE   = 2800  # Seco / Finaliza evento (Valores superiores indican fin de lluvia)
RAW_INTENSITY_MIN = 1700  # Valor correspondiente a 100% de intensidad (Saturación)

# ---- Códigos de Color ANSI para Consola Serial ----
class Colors:
    GREEN   = "\033[92m"
    BLUE    = "\033[94m"
    CYAN    = "\033[96m"
    YELLOW  = "\033[93m"
    MAGENTA = "\033[95m"
    RED     = "\033[91m"
    BOLD    = "\033[1m"
    RESET   = "\033[0m"

# ---- Inicialización del Hardware ----
print(f"{Colors.BOLD}{Colors.MAGENTA}=== INICIALIZANDO PRUEBA DE SENSOR DE LLUVIA ==={Colors.RESET}")
print(f"Configurando ADC en GPIO {RAIN_PIN_NUM}...")

try:
    # Pin 35 configurado como entrada y ADC
    adc_pin = Pin(RAIN_PIN_NUM, Pin.IN)
    adc_rain = ADC(adc_pin)
    # Atenuación de 11dB permite leer el rango completo de voltaje (hasta 3.6V aprox)
    adc_rain.atten(ADC.ATTN_11DB)
    print(f"[{Colors.GREEN}OK{Colors.RESET}] Hardware inicializado correctamente.\n")
except Exception as e:
    print(f"[{Colors.RED}ERROR{Colors.RESET}] Fallo al inicializar ADC: {e}")
    adc_rain = None

def fetch_rain_raw_avg(samples=10, delay_ms=50):
    """
    Realiza un oversampling robusto tomando múltiples muestras
    para estabilizar la lectura y mitigar el ruido eléctrico.
    """
    if adc_rain is None:
        return None

    raw_sum = 0
    valid_samples = 0
    
    for _ in range(samples):
        try:
            raw_sum += adc_rain.read()
            valid_samples += 1
        except Exception:
            pass
        time.sleep_ms(delay_ms)
        
    if valid_samples == 0:
        return None
        
    return raw_sum // valid_samples

def calculate_intensity(raw_value):
    """
    Calcula la intensidad de la lluvia como un porcentaje (0% - 100%)
    basado en los límites de calibración predefinidos.
    """
    # Clampar el valor crudo dentro de los límites
    clamped_raw = max(RAW_INTENSITY_MIN, min(raw_value, RAIN_STOP_VALUE))
    delta_max = RAIN_STOP_VALUE - RAW_INTENSITY_MIN
    
    # Cuanto menor es el valor de resistencia (raw), mayor es la intensidad de lluvia
    intensity = round(((RAIN_STOP_VALUE - clamped_raw) / delta_max) * 100)
    return intensity

def draw_bar(percentage, width=20):
    """
    Genera una barra gráfica simple para representación visual en consola.
    """
    filled_len = int(round(width * percentage / 100))
    bar = "█" * filled_len + "░" * (width - filled_len)
    return bar

def run_test():
    if adc_rain is None:
        print(f"{Colors.RED}No se puede ejecutar la prueba debido a un fallo en la inicialización.{Colors.RESET}")
        return

    print(f"{Colors.BOLD}{Colors.CYAN}--- Iniciando ciclo de lectura interactivo (Muestreo cada 1.5s) ---{Colors.RESET}")
    print(f"Calibración de Producción:")
    print(f"  - Seco/Umbral parada (>= {RAIN_STOP_VALUE} raw)   -> 0% Intensidad")
    print(f"  - Umbral inicio lluvia (< {RAIN_START_VALUE} raw) -> Comienzo de detección")
    print(f"  - Saturación total (<= {RAW_INTENSITY_MIN} raw)  -> 100% Intensidad\n")
    print(f"{Colors.BOLD}{'Estado':<12} | {'Raw Avg':<8} | {'Intensidad':<10} | {'Visualización':<22}{Colors.RESET}")
    print("-" * 65)

    last_state = None

    while True:
        try:
            # Obtener el promedio de oversampling
            raw_avg = fetch_rain_raw_avg(samples=10, delay_ms=30)
            
            if raw_avg is None:
                print(f"{Colors.RED}{'DISCONNECTED':<12}{Colors.RESET} | {'N/A':<8} | {'N/A':<10} | Falla de lectura ADC")
                time.sleep(1.5)
                continue

            # Calcular la intensidad
            intensity = calculate_intensity(raw_avg)
            
            # Determinar el estado y el color correspondiente
            if raw_avg < RAIN_START_VALUE:
                state = "Raining"
                color = Colors.BLUE
                state_str = f"{Colors.BOLD}{color}{state:<12}{Colors.RESET}"
            elif raw_avg >= RAIN_STOP_VALUE:
                state = "Dry"
                color = Colors.GREEN
                state_str = f"{color}{state:<12}{Colors.RESET}"
            else:
                # Zona de histéresis intermedia (secándose o llovizna muy leve)
                state = "Stabilizing"
                color = Colors.YELLOW
                state_str = f"{color}{state:<12}{Colors.RESET}"

            # Detectar transiciones de estado para alertar visualmente
            transition_msg = ""
            if last_state is not None and last_state != state:
                transition_msg = f"  <-- {Colors.BOLD}{Colors.YELLOW}¡Cambio de estado!{Colors.RESET}"
            last_state = state

            # Formatear la barra visual
            bar_graph = f"[{color}{draw_bar(intensity)}{Colors.RESET}] {intensity}%"

            # Imprimir resultado en una línea limpia
            print(f"{state_str} | {raw_avg:<8d} | {intensity:<9d}% | {bar_graph:<22}{transition_msg}")

            # Espera para el siguiente ciclo
            time.sleep(1.5)

        except KeyboardInterrupt:
            print(f"\n{Colors.BOLD}{Colors.MAGENTA}Prueba finalizada por el usuario.{Colors.RESET}")
            break
        except Exception as e:
            print(f"\n{Colors.RED}Error durante el ciclo de prueba: {e}{Colors.RESET}")
            time.sleep(2.0)

# Ejecutar la prueba
if __name__ == "__main__":
    run_test()
