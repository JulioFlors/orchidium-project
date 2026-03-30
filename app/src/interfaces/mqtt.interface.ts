// Basado en firmware/sensors/main.py
export interface EnvironmentalReading {
  temperature?: number
  humidity?: number
  illuminance?: number
}

// Basado en firmware/sensors/main.py
export interface RainEvent {
  duration_seconds: number
  average_intensity_percent: number
}

// Basado en firmware/relay_modules/main.py
// Modo Circuito: El ESP32 desglosa el macro en 3 relés
interface CircuitCommand {
  circuit: string // "IRRIGATION", "HUMIDIFICATION", etc.
  state: 'ON' | 'OFF'
  duration?: number // Segundos
  task_id?: string
}

// Modo Individual: Control directo de un relé (Mantenimiento/Debugger)
interface ActuatorCommand {
  actuator: string | number // "pump" o 3
  state: 'ON' | 'OFF'
  duration?: number // Segundos
  start_delay?: number // Segundos
}

// Tipo Unión: el firmware acepta ambos formatos
export type IrrigationCommand = CircuitCommand | ActuatorCommand

// Estado de conexión del cliente
export type MqttStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
