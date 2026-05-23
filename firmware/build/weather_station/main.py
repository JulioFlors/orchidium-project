# Bootstrap para cargar app.mpy optimizado
import uasyncio
import app

if __name__ == '__main__':
    try:
        uasyncio.run(app.main())
    except KeyboardInterrupt:
        # Interfaz Unificada: Cada firmware implementa su propia parada local rápida.
        app.stopped_program()
    except Exception as e:
        print(f"Error fatal no capturado: {e}")
        try:
            # Interfaz Unificada: Intentar un reinicio seguro si el firmware lo soporta
            if hasattr(app, 'safe_reset'):
                app.safe_reset()
            else:
                import machine
                machine.reset()
        except:
            pass
