// Basado en firmware/sensors/main.py
export interface EnvironmentalReading {
  temperature?: number
  humidity?: number
  light_intensity?: number
}

// Basado en firmware/sensors/main.py
export interface RainEvent {
  duration_seconds: number
  average_intensity_percent: number
}

// Basado en firmware/relay_modules/main.py
export interface IrrigationCommand {
  actuator: string | number // "pump" o 3
  state: 'ON' | 'OFF'
  duration?: number // Segundos
  start_delay?: number // Segundos
}

// Estado de conexión del cliente
export type MqttStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'
