import os

d = r'c:\Dev\pristinoplant\docs\diagrams'
os.makedirs(d, exist_ok=True)

fases_mmd = """graph TD
    subgraph FASE_GLOBAL["FASE GLOBAL DE PREPARACIÓN"]
        F1["1. Análisis Preliminar Global<br>(Factibilidad Técnica, Operacional, Financiera y Entorno)"] --> F2["2. Diseño de la Capa Tecnológica<br>(Arquitectura Global, Bloques y Topología)"]
    end

    subgraph CICLO_ITERATIVO["CICLO ITERATIVO POR ENTREGABLE (HW + SW)"]
        F3["3. Requisitos Detallados<br>(Casos de Uso UML y Criterios)"] --> F4["4. Generación de Modelos<br>(Modelado MDE, BDD y Diagramas)"]
        F4 --> F5["5. Generación de Pruebas TDD<br>(Tests HW/SW e In-Situ)"]
        F5 --> F6["6. Diseño Nodos / Circuitos<br>(Pinout, Relés y Sensores)"]
        F6 --> F7["7. Generación de Código<br>(Firmware C++/MicroPython y Backend)"]
        F7 --> F8["8. Integración HW / SW<br>(Power Cycle, Autorreparación)"]
        F8 --> F9["9. Despliegue In-Situ<br>(Instalación Física en Invernadero)"]
        F9 --> F10["10. Pruebas del Cliente<br>(Aceptación por el Cultivador)"]
        F10 --> F11["11. Mantenimiento y Evolución<br>(Ajustes In-Situ y Estabilización)"]
        F11 -.->|"Siguiente Iteración / Entregable"| F3
    end

    F2 --> F3
"""

roles_mmd = """graph TD
    subgraph ROLES_TDDM4IOTS["ROLES EN TDDM4IoTS - ADAPTACIÓN PRISTINOPLANT"]
        FP["Facilitador del Proyecto<br><b>Rol Teórico:</b> Líder Ágil y Mediador<br><b>Pristinoplant:</b> Desarrollador Unipersonal (Gestión, Docker, VPS)"]
        CS["Consejero / Counselor<br><b>Rol Teórico:</b> Líder Técnico Informal<br><b>Pristinoplant:</b> Desarrollador Unipersonal (Firmware, UTP Cat6 Anti-EMI, SSL/MQTT)"]
        CL["Cliente / Usuario Final<br><b>Rol Teórico:</b> Dueño del Negocio<br><b>Pristinoplant:</b> Agrónomo / Cultivador Real (Pautas de Riego, Umbrales T/HR)"]
        EQ["Equipo de Desarrollo<br><b>Rol Teórico:</b> Célula Multidisciplinaria<br><b>Pristinoplant:</b> Desarrollador Unipersonal Fullstack e IoT"]
    end
"""

flujo_mmd = """graph LR
    subgraph FLUJO_IN_SITU["CICLO ITERATIVO IN-SITU (TDDM4IoTS + DEVOPS)"]
        A["1. Entrada / Diagnóstico<br>Requisitos y Observaciones In-Situ"] --> B["2. Diseño y Construcción<br>Prototipado Rápido HW/SW"]
        B --> C["3. Despliegue en Caliente<br>Monitoreo Real en Invernadero"]
        C --> D["4. Estabilización Operativa<br>Módulo Robusto y Consolidado"]
        C -.->|"Detector de Bugs / Fallos Climáticos"| B
    end
"""

with open(os.path.join(d, 'tddm4iots_11_fases.mmd'), 'w', encoding='utf-8') as f:
    f.write(fases_mmd)

with open(os.path.join(d, 'tddm4iots_roles.mmd'), 'w', encoding='utf-8') as f:
    f.write(roles_mmd)

with open(os.path.join(d, 'tddm4iots_flujo_insitu.mmd'), 'w', encoding='utf-8') as f:
    f.write(flujo_mmd)

print("ALL_MMD_FILES_WRITTEN_PERFECTLY")
