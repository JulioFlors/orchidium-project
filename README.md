# 🌸 Orchidium Project

A continuacion se proporciona un Sistema de Gestión de Invernaderos basado en Agricultura Inteligente para el Cultivo de Orquídeas. Este repositorio contiene todo el código fuente, firmware y configuración de infraestructura necesarios para el proyecto.

## 📋 Descripción General

Este proyecto consiste en un sistema IoT completo diseñado para monitorear y controlar las condiciones ambientales de un invernadero. Utiliza un nodo de hardware basado en ESP32 para la recolección de datos en tiempo real (Edge Computing) y una aplicación web para la visualización, control y análisis de datos históricos.

## 📂 Estructura del Repositorio

Este es un monorepo que contiene varios sub-proyectos y configuraciones:

* **/app/**: Aplicación web principal construida con Next.js. Sirve como el dashboard para la visualización de datos y el control manual del sistema de riego.

* **/firmware/**: Contiene el firmware de MicroPython para los nodos IoT (ESP32). Es responsable de leer los sensores y ejecutar los comandos de los actuadores.

* **/infrastructure/**: Almacena los archivos de configuración para los servicios de soporte, como la configuración del broker Mosquitto.

* **/database/**: Carpeta generada por Docker, en esta se almacenan los datos persistentes de la base de datos PostgreSQL. **Incluir en `.gitignore`**

* `docker-compose.yml`: El archivo principal que orquesta el lanzamiento de todos los servicios de backend (Base de Datos, Broker MQTT, Servicio de Ingesta MQTT).

```bash
└── pristinoplant/
    │
    ├── 📁 .turbo/                <-- Configuración de turborepo
    │
    ├── 📁 .vscode/                <-- Configuración de VS Code
    │   └── settings.json
    │
    ├── 📁 app/                    <-- proyecto de Next.js
    │   ├── .next/
    │   ├── node_modules/
    │   ├── public/
    │   ├── src/
    │   ├── eslint.config.mjs
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── ...
    │
    ├── 📁 firmware/               <-- Código del ESP32
    │   ├── bh1750.py
    │   ├── boot.py
    │   ├── main.py
    │   └── README.md
    │
    ├── 📁 infrastructure/         <-- Configuración de servicios de Docker
    │   └── mosquitto/
    │       └── config/
    │           └── mosquitto.conf
    │
    ├── 📁 node_modules/           <-- node_modules del monorepo
    │
    ├── 📁 packages/               <-- Paquetes del monorepo
    │   └── database/
    │       ├── generated/
    │       ├── node_modules/
    │       ├── postgres/
    │       ├── prisma/
    │       ├── src/
    │       │   └── index.ts
    │       ├── package.json
    │       └── tsconfig.json
    │
    ├── 📁 services/               <-- Servicios de Docker
    │   ├── mqtt/
    │   │   ├── dist/
    │   │   ├── node_modules/
    │   │   ├── src/
    │   │   │   └── index.ts
    │   │   ├── Dockerfile
    │   │   ├── entrypoint.sh
    │   │   ├── package.json
    │   │   └── tsconfig.json
    │   │
    │   └── seed/
    │       ├── node_modules/
    │       ├── src/
    │       │   ├── seed-data.ts
    │       │   └── seed-database.ts
    │       ├── package.json
    │       └── tsconfig.json
    │
    ├── .dockerignore
    ├── .env
    ├── .env.template
    ├── .gitignore
    ├── docker-compose.yml
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── README.md
    ├── tsconfig.base.json
    └── turbo.json
```

## 🚀 Guía de Desarrollo Local

Sigue estos pasos para configurar y ejecutar el entorno de desarrollo completo en tu máquina local.

### Requisitos Previos

* [Docker](https://www.docker.com/products/docker-desktop/)
* [Node.js](https://nodejs.org/) (versión 20.x o superior)
* [pnpm](https://pnpm.io/installation)

### 1. Configurar las Variables de Entorno

Dentro de la carpeta `app` crea una copia del archivo `.env.template` y renómbrala a `.env`. Este archivo contendrá las credenciales y configuraciones locales.

```bash
cp .env.template .env
```

Abre el archivo `.env` y ajusta las variables si es necesario (aunque los valores por defecto son adecuados para el desarrollo local).

### 2. Instalar Dependencias

Desde la carpeta `app` instala las dependencias del proyecto utilizando pnpm.

```bash
cd app
pnpm install
```

### 3. Levantar la Infraestructura de Backend

Desde la **raíz del proyecto**, ejecuta el siguiente comando. Esto iniciará los servicios del backend (Base de Datos PostgreSQL, Broker MQTT, Servicio de Ingesta de Datos, etc.) en segundo plano.

```bash
# Desde la raíz del proyecto
docker-compose up --build -d
```

* `--build`: Es necesario la primera vez para construir la imagen del servicio de ingesta.

* `-d`: Ejecuta los contenedores en segundo plano (detached mode).

Para ver los logs de los servicios:

```bash
# Desde la raíz del proyecto
docker-compose logs -f
```

### 4. Aplicar las Migraciones de la Base de Datos

Una vez que la base de datos esté corriendo, aplica el esquema de datos más reciente utilizando Prisma Migrate. Este comando asegurará que las tablas y columnas de tu base de datos coincidan con los modelos definidos en prisma/schema.prisma.

```bash
# Desde la carpeta app
pnpm dlx prisma migrate dev -n init
```

### 5. Cargar Datos Iniciales

Ejecuta `pnpm run seed` para insertar en la base de datos un conjunto de datos predefinidos, creando un estado inicial consistente para el entorno de desarrollo y asegurando que la aplicación sea funcional desde el primer momento.

```bash
# Desde la carpeta app
pnpm run seed
```

### 6. Iniciar la Aplicación Web

Inicia el servidor de desarrollo de Next.js.

```bash
# Desde la carpeta app
pnpm run dev
```

### 7. Flashear el Firmware

Consulta el `README.md` dentro de la carpeta `/firmware` para obtener instrucciones detalladas sobre cómo flashear y configurar los dispositivos ESP32.
