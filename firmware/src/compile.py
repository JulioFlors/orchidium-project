import os
import shutil
import subprocess
import sys
from pathlib import Path

# ---- Contexto ----
# Script centralizado para compilar firmware MicroPython.
# Uso: python compile.py <nombre_carpeta_proyecto>
# Ejemplo: python compile.py relay_modules

# Configuración
ROOT_DIR = Path(__file__).parent.parent.resolve()
BUILD_ROOT_DIR = ROOT_DIR / "build"
MPY_CROSS_CMD = "mpy-cross"

# Lista negra global
IGNORE_PATTERNS = [
    ".git", ".vscode", "__pycache__", "compile.py", "README.md",
    "pymakr.conf", "micropy.json", ".gitignore", "*.sh", "*.bat",
    "build" # Evitar recursividad
]

# ---- Paleta Minimalista ----
COLOR_INFO = "\033[96m"  # Cyan oscuro
COLOR_OK = "\033[92m"    # Verde brillante
COLOR_ERR = "\033[91m"   # Rojo
COLOR_DIM = "\033[90m"   # Gris (dim)
COLOR_RESET = "\033[0m"

def log_step(step, detail=""):
    """Formateo unificado para los pasos de compilación"""
    if detail:
        print(f"{COLOR_INFO}    │{COLOR_RESET} {step:<26} {COLOR_DIM}{detail}{COLOR_RESET}")
    else:
        print(f"{COLOR_INFO}    │{COLOR_RESET} {step}")

def clean_build_target(target_build_path):
    if target_build_path.exists():
        log_step("Limpiando  build anterior", f"({target_build_path.name})")
        shutil.rmtree(target_build_path)
    
    log_step("Preparando directorios", "Creando estructura")
    target_build_path.parent.mkdir(parents=True, exist_ok=True)

def copy_project(source_path, dest_path):
    log_step("Clonando   código fuente", "Aplicando .ignore")
    try:
        shutil.copytree(source_path, dest_path, 
                        ignore=shutil.ignore_patterns(*IGNORE_PATTERNS),
                        dirs_exist_ok=True)
    except Exception as e:
        print(f"\n{COLOR_ERR}❌  Error copiando: {e}{COLOR_RESET}")
        sys.exit(1)

def compile_main(target_build_path):
    py_file = target_build_path / "main.py"
    mpy_file = target_build_path / "app.mpy" 
    
    if not py_file.exists():
        log_step("Omitiendo compilación", "No se encontró main.py")
        return

    log_step("Compilando binario", "main.py ➔  app.mpy")
    cmd = [MPY_CROSS_CMD, str(py_file), "-o", str(mpy_file)]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            py_file.unlink() 
            
            # Crear Bootstrap main.py
            bootstrap_code = """# Bootstrap para cargar app.mpy optimizado
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
"""
            with open(py_file, "w") as f:
                f.write(bootstrap_code)
            log_step("Inyectando Bootstrap", "main.py regenerado")
            
        else:
            print(f"\n{COLOR_ERR}❌  Error mpy-cross: {res.stderr}{COLOR_RESET}")
    except FileNotFoundError:
        print(f"\n{COLOR_ERR}❌  Error crítico: 'mpy-cross' no está instalado o en el PATH.{COLOR_RESET}")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        print(f"\n{COLOR_ERR}❌  Faltan argumentos.{COLOR_RESET}")
        print(f"Uso: python compile.py <carpeta_proyecto>")
        sys.exit(1)

    project_name = sys.argv[1]
    source_path = ROOT_DIR / project_name
    
    if not source_path.exists() or not source_path.is_dir():
        print(f"\n{COLOR_ERR}❌  El proyecto '{project_name}' no existe en {ROOT_DIR}.{COLOR_RESET}")
        sys.exit(1)

    target_build_path = BUILD_ROOT_DIR / project_name

    print(f"\n{COLOR_INFO}⚙️  Construyendo: {project_name}{COLOR_RESET}")
    print(f"{COLOR_INFO}    ┌─────────────────────────────────────────────────┐{COLOR_RESET}")
    
    clean_build_target(target_build_path)
    copy_project(source_path, target_build_path)
    compile_main(target_build_path)
    
    print(f"{COLOR_INFO}    └─────────────────────────────────────────────────┘{COLOR_RESET}")
    print(f"{COLOR_INFO}☑️  Build Completado.{COLOR_RESET}\n")

if __name__ == "__main__":
    main()