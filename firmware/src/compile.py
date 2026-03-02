
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

def log(msg, color=""):
    print(f"{color}[Build] {msg}\033[0m")

def clean_build_target(target_build_path):
    if target_build_path.exists():
        log(f"Limpiando {target_build_path.name}...", "\033[93m")
        shutil.rmtree(target_build_path)
    # create parent if needed
    target_build_path.parent.mkdir(parents=True, exist_ok=True)

def copy_project(source_path, dest_path):
    log(f"Copiando {source_path.name} -> {dest_path.name}...", "\033[94m")
    try:
        shutil.copytree(source_path, dest_path, 
                       ignore=shutil.ignore_patterns(*IGNORE_PATTERNS),
                       dirs_exist_ok=True)
    except Exception as e:
        log(f"Error copiando: {e}", "\033[91m")
        sys.exit(1)

def compile_main(target_build_path):
    py_file = target_build_path / "main.py"
    mpy_file = target_build_path / "app.mpy" # Renombrado para evitar conflicto
    
    if not py_file.exists():
        log(f"⚠️  No se encontró main.py en {target_build_path.name}. Saltando compilación.", "\033[93m")
        return

    log(f"Compilando main.py -> app.mpy...", "\033[96m")
    
    cmd = [MPY_CROSS_CMD, str(py_file), "-o", str(mpy_file)]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            log(f"✅ Éxito: main.py -> app.mpy", "\033[92m")
            # Borrar fuente original
            py_file.unlink() 
            
            # Crear Bootstrap main.py
            bootstrap_code = """# Bootstrap para cargar app.mpy optimizado
import uasyncio
import app

if __name__ == '__main__':
    try:
        uasyncio.run(app.main())
    except KeyboardInterrupt:
        app.stopped_program()
    except Exception as e:
        import machine
        print(f"Error fatal no capturado: {e}")
        machine.reset()
    finally:
        # Garantizar que el apago seguro se ejecute
        # (Desconectar WiFi, MQTT, pines OFF)
        try:
            app.shutdown()
        except:
            pass
"""
            with open(py_file, "w") as f:
                f.write(bootstrap_code)
            log(f"✅ Bootstrap main.py creado.", "\033[92m")
            
        else:
            log(f"❌ Error compilando main.py: {res.stderr}", "\033[91m")
            # No borramos si falla
    except FileNotFoundError:
        log("❌ Error: 'mpy-cross' no encontrado en PATH.", "\033[91m")
        sys.exit(1)

def main():
    if len(sys.argv) < 2:
        log("Uso: python compile.py <carpeta_proyecto>", "\033[93m")
        log("Proyectos disponibles:", "\033[97m")
        for d in ROOT_DIR.iterdir():
            if d.is_dir() and d.name not in ["build", "lib", "shared", ".git", ".vscode"]:
                 print(f" - {d.name}")
        sys.exit(1)

    project_name = sys.argv[1]
    source_path = ROOT_DIR / project_name
    
    if not source_path.exists() or not source_path.is_dir():
        log(f"❌ Error: El proyecto '{project_name}' no existe.", "\033[91m")
        sys.exit(1)

    target_build_path = BUILD_ROOT_DIR / project_name

    log(f"Iniciando Build para: {project_name}", "\033[97m")
    
    clean_build_target(target_build_path)
    copy_project(source_path, target_build_path)
    compile_main(target_build_path)
    
    log(f"Build Finalizado: {target_build_path}", "\033[92m")

if __name__ == "__main__":
    main()
