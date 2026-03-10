# 🌸 PristinoPlant

A continuación se proporciona un Sistema de Gestión de Invernaderos basado en Agricultura Inteligente para el Cultivo de Orquídeas. Este repositorio contiene todo el código fuente, firmware y configuración de infraestructura necesarios para el proyecto.

## 📋 Descripción General

Este proyecto consiste en una plataforma integral que fusiona un E-commerce moderno con un Sistema IoT completo diseñado para monitorear y controlar las condiciones ambientales de un invernadero.

Utiliza un nodo de hardware basado en ESP32 para la recolección de datos en tiempo real (Edge Computing) y una aplicación web (Next.js) para la gestión del ciclo de vida de los activos biológicos, desde su cultivo hasta su venta online.

---

## 🔧 Arquitectura y Lógica de Negocio

El proyecto está estructurado como un **Monorepo** (Turborepo) para separar responsabilidades:

* **App (Next.js 15+ / App Router):** Tienda online y Dashboard administrativo.
* **Database (Prisma v7):** Capa de acceso a datos compartida.
* **Firmware (MicroPython/ESP32):** Lógica de control para nodos IoT (Sensores y Actuadores).
* **Services:** Servicios de backend auxiliares (MQTT, Seeders).

### Base de Datos Híbrida (PostgreSQL - Neon)

* **Desarrollo Local:** Usa driver `pg` nativo (TCP) para máxima compatibilidad con Docker.
* **Producción (Serverless):** Usa driver `@neondatabase/serverless` (WebSockets) y Pooling para manejar la alta concurrencia y conexiones inestables.

### Modelo de Datos (Triple Fuente de Verdad)

Resolvemos la discrepancia entre el inventario físico y el catálogo digital mediante tres modelos clave:

1. **Species (Catálogo):** Información botánica, fotos y descripción. *No tiene precio ni stock directo.*
2. **ProductVariant (Venta):** Define el SKU comercial. Combina una Especie con un Tamaño (Maceta). Aquí reside el **Precio** y la **Disponibilidad**.
3. **Plant (Activo Físico - Gemelo Digital):** Representa una planta real en el invernadero.

* Se vincula a una `Species`.
* Tiene un `currentSize` (que determina a qué variante pertenece).
* Tiene un `status` (`AVAILABLE` o `MOTHER`).
* **Regla de Stock:** El stock de una `ProductVariant` se calcula contando las instancias de `Plant` disponibles de ese tamaño específico.

---

Tienes toda la razón. Mi respuesta anterior fue un bloque de texto que no dejaba claro **dónde** pegarlo o qué reemplazar.

Aquí tienes la versión definitiva. Esta sección **reemplaza por completo** el bloque que me mostraste (`## 📂 Guía de Organización de Archivos...`).

He combinado la redacción profesional ("más general") con tus ejemplos específicos (que son muy valiosos), para que quede elegante pero útil.

Copia y pega esto en tu `README.md`:

---

## 📂 Guía de Organización de Archivos

Para garantizar la escalabilidad y el mantenimiento del proyecto, seguimos una arquitectura modular basada en tres principios fundamentales:

### 1. Filosofía de "Co-ubicación" (Co-location)

Priorizamos mantener el código cerca de donde se utiliza. Si un componente es exclusivo de una vista o ruta específica, se aloja en una carpeta local `ui/` junto a su página (`page.tsx`), encapsulando así su contexto.

* **Ejemplo:** `app/auth/login/ui/LoginForm.tsx` (Solo usado en el Login).
* **Ejemplo:** `app/product/[slug]/ui/ProductClientWrapper.tsx` (Lógica interactiva exclusiva del detalle de producto).

### 2. Componentes Compartidos (Shared)

Los elementos de UI que se reutilizan en múltiples partes de la aplicación se centralizan en `src/components/`.
**Regla de Dominios:** Se organizan estrictamente por **Entidad de Negocio** en **SINGULAR**.

* ✅ `src/components/product/` (Cards, Slideshows, Selectores).
* ✅ `src/components/cart/` (Resumen de orden, lista de items).
* ✅ `src/components/ui/` (Átomos genéricos: Títulos, Grids, Footers).

### 3. Separación de Responsabilidades (Lógica vs. UI)

Mantenemos la UI "limpia" desacoplando la lógica compleja.

* **Cálculos y Estado:** Se extraen a *hooks* personalizados o funciones auxiliares (fuera del componente visual).
* **Definiciones:** Las interfaces (`src/interfaces/`) y enumeraciones (`@package/database/enums`) están centralizadas para evitar dependencias circulares.

---

## 📂 Estructura del Repositorio

Este es un monorepo que contiene varios sub-proyectos y configuraciones:

* `app/`: Aplicación web principal construida con Next.js. Sirve como el dashboard para la visualización de datos y el control manual del sistema de riego.

* `firmware/`: Contiene el firmware de MicroPython para los nodos IoT (ESP32). Es responsable de leer los sensores y ejecutar los comandos de los actuadores.

* `infrastructure/`: Almacena los archivos de configuración para los servicios de soporte, como la configuración del broker Mosquitto y la base de datos PostgreSQL.

* `packages/`: Contiene paquetes locales del monorepo.
  * `database/`: Paquete que gestiona la conexión y el esquema de la base de datos con Prisma.

* `services/`: Contiene los servicios de backend que se ejecutan en contenedores Docker.
  * `mqtt/`: Servicio de ingesta de datos que recibe los mensajes de los sensores a través de MQTT y los guarda en la base de datos.
  * `seed/`: Servicio para popular la base de datos con datos iniciales.

* `docker-compose.yml`: El archivo principal que orquesta el lanzamiento de todos los servicios de backend (Base de Datos, Broker MQTT, Servicio de Ingesta MQTT).

---

## 🐱‍💻 Guía de Desarrollo (Local)

Sigue estos pasos para configurar y ejecutar el entorno de desarrollo completo en tu máquina local.

### Requisitos Previos

* [Docker](https://www.docker.com/products/docker-desktop/)
* [Node.js](https://nodejs.org/) (versión 22.x o superior)
* [pnpm](https://pnpm.io/installation)

### 1. Configurar las Variables de Entorno

Dentro de la carpeta `app` crea una copia del archivo `.env.template` y renómbrala a `.env`.

```bash
cp .env.template .env
```

El archivo `.env` está dividido en secciones. Rellena tus credenciales (Google, Neon, HiveMQ) en las variables correspondientes.

#### ⚙️ Configuración de la App (Next.js)

Al final del archivo `.env`, encontrarás la sección **"APP NEXT.JS"**. Aquí decides a dónde se conecta tu entorno de desarrollo local (`pnpm dev`):

* **Opción A (Cloud):** Descomenta las líneas bajo `Opción A` para usar datos reales en la nube (Neon, HiveMQ).
* **Opción B (Local):** Descomenta las líneas bajo `Opción B` para usar los contenedores locales (Postgres, Mosquitto).

> **Nota:** Esto solo afecta a la App Web. Los servicios de backend (ingesta/scheduler) se controlan por separado usando **Docker Profiles** (ver paso 3).

### 2. Instalar Dependencias

Instala las dependencias del proyecto utilizando pnpm.

```bash
pnpm install
```

### 3. Levantar la Infraestructura (Selecciona tu Perfil)

Hemos simplificado el despliegue usando **Docker Profiles**. Elige el comando según tu entorno deseado:

#### OPCIÓN A: Entorno 100% Local (Offline)

Levanta toda la infraestructura localmente: Postgres, Mosquitto, InfluxDB y los servicios conectados a ellos.

```bash
docker-compose --profile local up --build -d
```

#### OPCIÓN B: Entorno Híbrido (Cloud)

Levanta SOLO los servicios de aplicación (`ingest`, `scheduler`) que se conectan a HiveMQ y Neon en la nube.
*(No levanta bases de datos locales).*

```bash
docker-compose --profile cloud up --build -d
```

#### Detener todo

```bash
docker-compose --profile cloud down
```

> [!TIP]
> **Nombre del Proyecto (Stack):**
> Por defecto, Docker usa el nombre de la carpeta (`pristinoplant`). Si ya tienes un stack con este nombre o quieres correr ambos perfiles simultáneamente en stacks separados, usa la bandera `-p`:
>
> ```bash
> docker-compose -p pristinoplant-cloud --profile cloud up --build -d
> ```

### 4. Aplicar las Migraciones de la Base de Datos

Una vez que la base de datos esté corriendo, aplica el esquema de datos más reciente.

```bash
pnpm db:deploy
```

### 5. Poblar Base de Datos

Insertamos en la base de datos un conjunto de datos predefinidos, creando un estado inicial consistente para el entorno de desarrollo y asegurando que la aplicación sea funcional desde el primer momento.

```bash
pnpm db:seed
```

### 6. Iniciar la Aplicación Web

Inicia el servidor de desarrollo de Next.js.

```bash
pnpm dev
```

### 7. Flashear el Firmware

Consulta el `README.md` dentro de la carpeta `/firmware` para obtener instrucciones detalladas sobre cómo flashear y configurar los dispositivos ESP32.

---

## 🚀 Guía de Despliegue (Vercel)

Esta sección describe los pasos para configurar y desplegar la aplicación Next.js.

### Configuración del Proyecto en Vercel

Para desplegar correctamente el directorio `app`, configura el proyecto en Vercel de la siguiente manera:

1. Navega a la pestaña **Settings** de tu proyecto.
2. Ve a la sección **Build & Development Settings**.
3. Asegúrate de aplicar la siguiente configuración:
    * **Framework Preset:** `Next.js`
    * **Build Command:** `turbo run build`
    * **Install Command:** `pnpm install`
    * **Root Directory:** `app`

4. Habilita la opción **"Include files outside of the Root Directory in the Build Step"**. Esto es fundamental para que Turborepo pueda acceder a toda la estructura del monorepositorio durante el proceso de compilación.

5. Habilita la opción **"Skip deployments when there are no changes to the root directory or its dependencies."**. Evita Despliegues innecesarios, configura Vercel para que omita una compilación si un commit no afecta a la aplicación web.

## ☁️ Guía de Administración del Servidor (VPS)

Esta sección documenta el proceso para gestionar el acceso, aprovisionar la infraestructura y mantener los servicios de Backend (**Ingest** y **Scheduler**) en el servidor de producción.

### 🔑 Gestión de Acceso SSH

El servidor utiliza autenticación exclusiva por llaves SSH para garantizar la seguridad. **No se permite el acceso por contraseña.**

#### 1. Generar una nueva Llave SSH (Local)

Si aún no tienes un par de llaves SSH en tu computadora, abre tu terminal y ejecuta:

```bash
ssh-keygen -t ed25519 -C "tu_email@ejemplo.com"
```

1. Presiona **Enter** para aceptar la ubicación predeterminada.
2. Ingresa una contraseña para mayor seguridad.

Esto generará dos archivos en tu carpeta `.ssh`:

* `id_ed25519`: **Llave Privada** (NUNCA la compartas).
* `id_ed25519.pub`: **Llave Pública** (Esta es la que se sube al servidor).

Para ver y copiar tu llave pública:

```bash
# Linux / Mac
cat ~/.ssh/id_ed25519.pub

# Windows (PowerShell)
Get-Content $env:USERPROFILE\.ssh\id_ed25519.pub
```

#### 2. Agregar Acceso a un Servidor Existente

> ⚠️ **Nota:** Plataformas como Hetzner solo inyectan llaves al *crear* el servidor. Para agregar usuarios a un servidor activo, debes hacerlo manualmente.

**Ingresa al servidor:** con una llave que ya tenga acceso (o pide al administrador que lo haga)

```bash
# El acceso se realiza mediante protocolo SSH utilizando llaves criptográficas (no contraseñas).
ssh root@<IP_DEL_SERVIDOR>
```

**Edita el archivo de llaves autorizadas:**

```bash
nano ~/.ssh/authorized_keys
```

**Agrega la nueva llave:**

* Ve al final del archivo usando las flechas.
* Crea una **nueva línea** vacía.
* Pega la **Llave Pública** del nuevo usuario (el texto largo que comienza con `ssh-ed25519...`).
* *¡Cuidado! No borres las llaves existentes.*

**Guarda los cambios:**

* Presiona `Ctrl + O` y `Enter` para guardar.
* Presiona `Ctrl + X` para salir.

---

### 🛠️ Aprovisionamiento e Instalación

Pasos para preparar un servidor limpio (Ubuntu 24.04) para alojar el proyecto.

#### 1. Instalar Docker Engine

```bash
# Actualizar el sistema
apt update && apt upgrade -y

# Instalar Docker (Script oficial)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Eliminamos el instalador
rm get-docker.sh
```

#### 2. Configuración del Proyecto (Setup Inicial)

Clonamos el repositorio en la carpeta `pristinoplant` y configuramos las variables de entorno de producción.

```bash
# Clonar la rama main en una carpeta con el nombre del proyecto
git clone -b main https://github.com/JulioFlors/orchidium-project.git pristinoplant
cd pristinoplant
```

#### 3. Configuración de Secretos (.env)

El archivo `.env` **no se sube al repositorio**. Debes crearlo manualmente en el servidor:

```bash
nano .env
```

Pega tus credenciales de producción (Neon DB, HiveMQ, Google Auth)

**Guarda los cambios:**

* Presiona `Ctrl + O` y `Enter` para guardar.
* Presiona `Ctrl + X` para salir.

> **Importante:** Asegúrate de incluir la variable `COMPOSE_PROFILES=cloud` al final del archivo para que Docker levante solo los servicios de producción conectados a Neon y HiveMQ.

#### 4. Generación de Certificados SSL (Mosquitto Cloud)

Para que el frontend (Vercel) y los ESP32 puedan conectarse de forma segura al broker MQTT en el VPS, es obligatorio generar certificados SSL válidos utilizando Let's Encrypt.

Para mantener el sistema anfitrión limpio, ejecutamos Certbot de forma efímera a través de Docker. Esto creará los certificados y los guardará directamente en la carpeta del proyecto.

> **Requisito previo:** Asegúrate de que los subdominios (ej. `vps.tudominio.com`) ya estén apuntando a la IP del VPS y que el puerto 80 del servidor esté libre.

Ejecuta el siguiente comando en la raíz del proyecto (`pristinoplant`):

```bash
cd pristinoplant
sudo docker run -it --rm -p 80:80 \
  -v $(pwd)/infrastructure/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d vps.midominio.com -d mqtt.midominio.com
```

> **Nota:** Siempre que quieras actualizar los certificados, ejecuta el comando anterior.

---

### 🚀 Despliegue y Actualización Continua

Para garantizar un flujo de trabajo ágil y seguro en el entorno de producción (VPS), utilizamos un script de automatización. Este script se encarga de descargar la última versión del código, aplicar migraciones de base de datos interactivamente y reconstruir los contenedores de Docker de forma controlada.

#### 1. Configuración del Script de Despliegue (`deploy.sh`)

Crea el archivo `deploy.sh` en la raíz del proyecto. Su contenido está diseñado para proteger los archivos generados localmente en el servidor (como certificados o logs) mientras sincroniza el código fuente:

```bash
#!/bin/bash
# deploy.sh - Script de despliegue para VPS-Sparrow

set -e

# ---- Colores ----
RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'

# Evitar que pnpm pida confirmaciones interactivas
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

confirm() {
    echo ""
    read -p "$(echo -e "${YELLOW}⚡ $1 [s/N]: ${RESET}")" choice
    case "$choice" in
        s|S|si|SI|Si ) return 0 ;;
        * ) return 1 ;;
    esac
}
echo ""
echo -e "${GREEN}🌵 PristinoPlant | Deploy${RESET}"
echo ""

# ================================================================
# PASO 1: Sincronizar (Protegiendo infraestructura local)
# ================================================================
echo -e "${CYAN}📡 [1/5] Sincronizando con origin/main${RESET}"
echo ""
git fetch origin main
# PROTECCIÓN: Resetear el código pero sin tocar la carpeta de certificados y logs
git reset --hard origin/main

echo ""
echo -e "${GREEN}✅ Repositorio Sincronizado${RESET}"

# ================================================================
# PASO 2: Construir imágenes
# ================================================================
echo ""
echo -e "${CYAN}🏗️ [2/5] Construyendo imágenes${RESET}"
docker compose --profile cloud build
echo ""
echo -e "${GREEN}✅ Imágenes construidas${RESET}"
echo ""

# ================================================================
# PASO 3: Migraciones (CON FILTRO)
# ================================================================
if confirm "¿Ejecutar migraciones de base de datos (prisma db:deploy)?"; then
    echo ""
    echo -e "${CYAN}📦 [3/5] Aplicando migraciones${RESET}"
    # Usamos el filtro para encontrar el comando db:deploy en el paquete correcto
    docker compose --profile cloud run --rm scheduler pnpm --filter @package/database db:deploy
    echo ""
    echo -e "${GREEN}✅ Migraciones aplicadas${RESET}"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⏭️ Migraciones omitidas${RESET}"
fi

# ================================================================
# PASO 4: Levantar servicios
# ================================================================
echo ""
echo -e "${CYAN}🚀 [4/5] Levantando servicios cloud${RESET}"
docker compose --profile cloud up -d --remove-orphans
echo ""
echo -e "${GREEN}✅ Servicios cloud levantados${RESET}"
echo ""

if confirm "¿Levantar/Reiniciar Mosquitto (perfil vps)?"; then
    echo ""
    echo -e "${CYAN}🚀 Levantando Mosquitto${RESET}"
    echo ""
    docker compose --profile vps up -d
    echo ""
    echo -e "${GREEN}✅ Mosquitto levantado${RESET}"
    echo ""
fi

# ================================================================
# PASO 5: Limpieza
# ================================================================
echo ""
echo -e "${CYAN}🧹 [5/5] Limpiando imágenes antiguas${RESET}"
docker image prune -f

echo ""
echo -e "${GREEN}✅ Deploy Finalizado${RESET}"
echo ""
docker compose --profile cloud --profile vps ps
```

#### 2. Otorgar Permisos de Ejecución Permanentes (Entorno Local)

Para evitar que el VPS bloquee la ejecución del script con un error de `Permission denied`, es fundamental registrar los permisos de ejecución (`+x`) directamente en el historial de Git desde tu computadora local.

Ejecuta este flujo de trabajo en tu entorno local (estando en la rama `Dev`):

```bash
# 1. Verificar que estamos en Dev
git checkout Dev

# 2. Registrar el permiso de ejecución de forma permanente en Git
git update-index --chmod=+x deploy.sh

# 3. Guardar el cambio
git commit -m "⚙️ chore: otorgar permisos de ejecución permanentes a deploy.sh"

# 4. Subir el cambio a la rama Dev
git push

```

#### 3. Sincronización hacia Producción (`main`)

Para que estos cambios (y cualquier código nuevo) lleguen al servidor, debes completar el ciclo de integración hacia la rama principal:

```bash
# 1. Preparar el commit
git add .

# 2. Cargar el commit desde un archivo
git commit -F commit.txt

# 3. Eliminar el archivo
rm commit.txt

# 4 Subir los cambios a la rama Dev
git push

# 5. Cambiar a la rama de producción
git checkout main

# 6. Actualizar para evitar conflictos
git pull origin main

# 7. Fusionar los cambios desde Dev
git merge Dev

# 8. Subir la versión final a GitHub
git push origin main

# 9. Volver al entorno de desarrollo
git checkout Dev

```

#### 4. Flujo de Trabajo Habitual (Actualizar el Servidor)

Una vez configurado lo anterior, el proceso para actualizar la plataforma en el futuro se reduce a dos simples pasos. Cada vez que fusiones código nuevo a la rama `main`, ingresa a tu VPS y ejecuta:

```bash
cd pristinoplant
./deploy.sh
```

El script interactivo se encargará de descargar la última versión, reconstruir exclusivamente las capas modificadas y reiniciar los servicios (como `ingest` y `scheduler`) minimizando cualquier tiempo de inactividad.

#### 5. Mantenimiento de Datos y Reglas del Scheduler

Durante la administración de PristinoPlant en el servidor, frecuentemente surgirán dudas respecto a cómo interactuar con los comandos de Prisma y el ciclo de vida del contenedor Scheduler. Aquí tienes la guía definitiva:

* **¿Cuándo aplicar migraciones (`db:deploy`) en el script `./deploy.sh`?**
  Sólo cuando un desarrollador haya alterado o creado **nuevas columnas o tablas** en el archivo `schema.prisma`. Agregar plantas, usuarios, o cambiar la configuración desde la página web NO requiere migración.

* **Diferencia entre cambios por código y por UI**
  Si editas una rutina de riego desde la interfaz web (cambias la hora o la apagas), el Scheduler reacciona solo, limpiando su RAM y programando el nuevo Cron al vuelo sin tocar Docker. Pero, si haces un cambio forzoso por terminal, la plataforma queda desfasada temporalmente.

* **Semillas y Borrado Forzado (`db:seed` / `db:push --force-reset`)**
  Si en algún punto necesitas formatear la base de datos por terminal, las rutinas de la base de datos obtendrán nuevos identificadores UUID únicos. Dado que el Scheduler mantiene los CronJobs orquestados en la RAM atados a identificadores viejos, debes notificarle para que recargue y se vuelva a enlazar:

  ```bash
  # Tras hacer un db:seed o reset, ejecuta siempre:
  docker compose --profile cloud restart scheduler
  ```

  *(No hace falta volver a ejecutar un "build" de la imagen).*

* **Error P3005 al Desplegar (Desincronización de Migraciones)**
  Si hiciste un borrado/reseteo forzado, la tabla interna `_prisma_migrations` se perdió. Cuando ejecutes `./deploy.sh` y respondas "SÍ" a las migraciones, Prisma intentará correrlas desde cero y chocará con las tablas que ya existen, arrojando el Error P3005. Tu BD no está rota.
  Para arreglar esto y decirle a Prisma "acepta que la BD ya tiene esta estructura", debes resolver (baseline) la migración conflictiva que lance el error:

  ```bash
  # Ejecuta esto en el VPS sustituyendo el nombre exacto de la carpeta de la migración que falló
  docker compose --profile cloud run --rm scheduler pnpm --filter @package/database exec npx prisma migrate resolve --applied 20240316123000_init
  ```

  Una vez resuelto, podrás usar `db:deploy` normalmente en los despliegues futuros.

#### 6. Operaciones Diarias y Monitoreo (Docker)

El orquestador en el VPS de producción utiliza Docker Compose bajo la red cloud. Para el monitoreo y manipulación manual rápida de los servicios scheduler, ingest o la web, aquí tienes los comandos fundamentales que debes ejecutar siempre dentro de la carpeta /pristinoplant:

* **Ver estado de los servicios (Encendido/Stop)**

  ```bash
  docker compose --profile cloud ps
  ```

* **Reiniciar un servicio específico (ej: Scheduler)**

  ```bash
  # Útil tras semillas o cambios forzados de BBDD
  docker compose --profile cloud restart scheduler
  `

* **Apagar o Encender un servicio individual**

  ```bash
  docker compose --profile cloud stop scheduler
  docker compose --profile cloud start scheduler
  ```

* **Leer en vivo los Logs de un microservicio**

  ```bash
  # El flag -f mantiene la terminal escuchando los nuevos logs en tiempo real (Ctrl+C para salir)
  docker logs -f scheduler
  ```

* **Filtrar Logs (Para evitar saturar la terminal con días de historial)**

  ```bash
  # Imprime solamente las últimas 50 líneas y se queda escuchando
  docker logs -f --tail 50 scheduler

  # Imprime logs de las últimas 2 horas
  docker logs --since 2h scheduler
  ```
