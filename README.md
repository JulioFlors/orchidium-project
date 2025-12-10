# 🌸 Orchidium Project

A continuacion se proporciona un Sistema de Gestión de Invernaderos basado en Agricultura Inteligente para el Cultivo de Orquídeas. Este repositorio contiene todo el código fuente, firmware y configuración de infraestructura necesarios para el proyecto.

## 📋 Descripción General

Este proyecto consiste en un sistema IoT completo diseñado para monitorear y controlar las condiciones ambientales de un invernadero. Utiliza un nodo de hardware basado en ESP32 para la recolección de datos en tiempo real (Edge Computing) y una aplicación web para la visualización, control y análisis de datos históricos.

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

## 🐱‍💻 Guía de Desarrollo (Local)

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
pnpm prisma migrate deploy
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

## 🚀 Guía de Despliegue (Vercel)

Esta sección describe los pasos para configurar y desplegar la aplicación Next.js de este monorepositorio en Vercel.

### Configuración del Proyecto en Vercel

Para desplegar correctamente el directorio `app`, configura tu proyecto en Vercel de la siguiente manera:

1. Navega a la pestaña **Settings** de tu proyecto.
2. Ve a la sección **Build & Development Settings**.
3. Asegúrate de aplicar la siguiente configuración:
    * **Framework Preset:** `Next.js`
    * **Build Command:** `turbo run build`
    * **Install Command:** `pnpm install`
    * **Root Directory:** `app`

4. Habilita la opción **"Include files outside of the Root Directory in the Build Step"**. Esto es fundamental para que Turborepo pueda acceder a toda la estructura del monorepositorio durante el proceso de compilación.

5. Habilita la opción **"Skip deployments when there are no changes to the root directory or its dependencies."**. Evita Despliegues innecesarios, configura Vercel para que omita una compilación si un commit no afecta a la aplicación web.

## Ficheros del Proyecto

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
    │   ├── .turbo/
    │   ├── node_modules/
    │   ├── public/
    │   ├── src/
    │   │   ├── actions/
    │   │   │   ├── auth/
    │   │   │   │   ├── login.ts
    │   │   │   │   ├── logout.ts
    │   │   │   │   └── register.ts
    │   │   │   ├── navigation/
    │   │   │   │   └── get-plants-navigation.ts
    │   │   │   ├── product/
    │   │   │   │   ├── get-all-species.ts
    │   │   │   │   ├── get-paginated-species.ts
    │   │   │   │   ├── get-search-species-by-term.ts
    │   │   │   │   ├── get-search-suggestions.ts
    │   │   │   │   ├── get-species-by-slug.ts
    │   │   │   │   ├── get-species-by-type.ts
    │   │   │   │   └── get-stock-by-slug.ts
    │   │   │   └── index.ts
    │   │   ├── app/
    │   │   │   ├── (shop)/
    │   │   │   │   ├── admin/
    │   │   │   │   │   ├── dashboard/
    │   │   │   │   │   │   └── page.tsx
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── cart/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── category/
    │   │   │   │   │   ├── plants/
    │   │   │   │   │   │   ├── [slug]/
    │   │   │   │   │   │   │   └── page.tsx
    │   │   │   │   │   │   └── page.tsx
    │   │   │   │   │   ├── error.tsx
    │   │   │   │   │   └── not-found.tsx
    │   │   │   │   ├── checkout/
    │   │   │   │   │   ├── address/
    │   │   │   │   │   │   └── page.tsx
    │   │   │   │   │   ├── ui/
    │   │   │   │   │   │   └── AddressForm.tsx
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── empty/
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── orders/
    │   │   │   │   │   ├── [id]/
    │   │   │   │   │   │   └── page.tsx
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── product/
    │   │   │   │   │   └── [slug]/
    │   │   │   │   │       └── page.tsx
    │   │   │   │   ├── search/
    │   │   │   │   │   ├── page.tsx
    │   │   │   │   │   └── SearchPageClient.tsx
    │   │   │   │   ├── layout.tsx
    │   │   │   │   └── page.tsx
    │   │   │   ├── api/
    │   │   │   │   └── auth/
    │   │   │   │       └── [...nextauth]/
    │   │   │   │           └── route.ts
    │   │   │   ├── auth/
    │   │   │   │   ├── login/
    │   │   │   │   │   ├── ui/
    │   │   │   │   │   │   └── LoginForm.tsx
    │   │   │   │   │   └── page.tsx
    │   │   │   │   ├── new-account/
    │   │   │   │   │   ├── ui/
    │   │   │   │   │   │   └── RegisterForm.tsx
    │   │   │   │   │   └── page.tsx
    │   │   │   │   └── layout.tsx
    │   │   │   ├── dashboard/
    │   │   │   │   ├── layout.tsx
    │   │   │   │   └── page.tsx
    │   │   │   ├── error.tsx
    │   │   │   ├── favicon.ico
    │   │   │   ├── globals.css
    │   │   │   ├── layout.tsx
    │   │   │   └── not-found.tsx
    │   │   ├── components/
    │   │   │   ├── cart/
    │   │   │   │   ├── OrderSummary.tsx
    │   │   │   │   └── ProductsInCart.tsx
    │   │   │   ├── product/
    │   │   │   │   ├── product-image/
    │   │   │   │   │   └── ProductImage.tsx
    │   │   │   │   ├── quantity-selector/
    │   │   │   │   │   ├── QuantityDropdown.tsx
    │   │   │   │   │   └── QuantitySelector.tsx
    │   │   │   │   ├── size-selector/
    │   │   │   │   │   └── SizeSelector.tsx
    │   │   │   │   ├── slideshow/
    │   │   │   │   │   ├── MobileSlideshow.tsx
    │   │   │   │   │   ├── slideshow.css
    │   │   │   │   │   └── Slideshow.tsx
    │   │   │   │   ├── stock-label/
    │   │   │   │   │   └── StockLabel.tsx
    │   │   │   │   ├── stock-notification/
    │   │   │   │   │   └── StockNotificationWhatsapp.tsx
    │   │   │   │   └── ui/
    │   │   │   │       └── AddToCart.tsx
    │   │   │   ├── products/
    │   │   │   │   └── product-grid/
    │   │   │   │       ├── ProductGrid.tsx
    │   │   │   │       ├── ProductGridItem.tsx
    │   │   │   │       ├── ProductGridItemSkeleton.tsx
    │   │   │   │       └── ProductGridSkeleton.tsx
    │   │   │   ├── ui/
    │   │   │   │   ├── footer/
    │   │   │   │   │   └── Footer.tsx
    │   │   │   │   ├── form/
    │   │   │   │   │   └── FormField.tsx
    │   │   │   │   ├── header/
    │   │   │   │   │   └── AuthHeader.tsx
    │   │   │   │   ├── icons/
    │   │   │   │   │   └── PristinoPlant.tsx
    │   │   │   │   ├── not-found/
    │   │   │   │   │   └── PageNotFound.tsx
    │   │   │   │   ├── radio-group/
    │   │   │   │   │   └── RadioGroup.tsx
    │   │   │   │   ├── radio-option-group/
    │   │   │   │   │   └── RadioOptionGroup.tsx
    │   │   │   │   ├── search-box/
    │   │   │   │   │   ├── SearchBox.tsx
    │   │   │   │   │   └── SearchBox.utils.ts
    │   │   │   │   ├── sidebar/
    │   │   │   │   │   ├── CategoryContent.tsx
    │   │   │   │   │   ├── MainContent.tsx
    │   │   │   │   │   ├── Sidebar.tsx
    │   │   │   │   │   └── Sidebar.utils.ts
    │   │   │   │   ├── skeleton/
    │   │   │   │   │   └── OrderSummarySkeleton.tsx
    │   │   │   │   ├── subtitle/
    │   │   │   │   │   └── Subtitle.tsx
    │   │   │   │   ├── title/
    │   │   │   │   │   └── Title.tsx
    │   │   │   │   └── top-menu/
    │   │   │   │       ├── TopMenu.tsx
    │   │   │   │       └── TopMenu.utils.ts
    │   │   │   └── index.ts
    │   │   ├── config/
    │   │   │   ├── fonts.ts
    │   │   │   ├── index.ts
    │   │   │   ├── mappings.ts
    │   │   │   └── routes.ts
    │   │   ├── interfaces/
    │   │   │   ├── index.ts
    │   │   │   ├── product.interface.ts
    │   │   │   └── route.interface.ts
    │   │   ├── store/
    │   │   │   │   └── cart-store.ts
    │   │   │   ├── cart/
    │   │   │   ├── ui/
    │   │   │   │   └── ui-store.ts
    │   │   │   └── index.ts
    │   │   ├── utils/
    │   │   │   ├── currencyFormat.ts
    │   │   │   └── index.ts
    │   │   ├── auth.config.ts
    │   │   └── proxy.ts
    │   ├── .editorconfig
    │   ├── eslint.config.mjs
    │   ├── next-env.d.ts
    │   ├── next.config.ts
    │   ├── nextauth.d.ts
    │   ├── package.json
    │   ├── postcss.config.mjs
    │   ├── README.md
    │   └── tsconfig.json
    │
    ├── 📁 firmware/               <-- Código del ESP32
    │   ├── lib/
    │   │   ├── bh1750/
    │   │   │   └──__init__.py
    │   │   ├── ota/
    │   │   │   └──__init__.py
    │   │   ├── secrets/
    │   │   │   └──__init__template.py
    │   │   └── umqtt/
    │   │       ├──__init__.py
    │   │       ├──errno.py
    │   │       └──simple2.py
    │   ├── relay_modules/
    │   │   ├── main.py
    │   │   └── manifest.json
    │   ├── sensors/
    │   │   ├── main.py
    │   │   └── manifest.json
    │   ├── shared/
    │   │   └── update_creds_template.py
    │   ├── ESP32_2025-08-09_v1.26.0.bin
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
    │       ├── .turbo/
    │       │   └── turbo-build.log
    │       ├── dist/
    │       │   ├── client.js
    │       │   └── index.js
    │       ├── node_modules/
    │       ├── postgres/
    │       ├── prisma/
    │       │   ├── migrations/
    │       │   └── schema.prisma
    │       ├── src/
    │       │   ├── generated/
    │       │   ├── client.ts
    │       │   └── index.ts
    │       ├── package.json
    │       ├── prisma.config.ts
    │       └── tsconfig.json
    │
    ├── 📁 services/               <-- Servicios de Docker
    │   ├── mqtt/
    │   │   ├── .turbo/
    │   │   │   └── turbo-build.log
    │   │   ├── dist/
    │   │   │   └── bundle.mjs
    │   │   ├── node_modules/
    │   │   ├── src/s
    │   │   │   └── index.ts
    │   │   ├── Dockerfile
    │   │   ├── entrypoint.sh
    │   │   ├── package.json
    │   │   └── tsconfig.json
    │   │
    │   └── seed/
    │       ├── node_modules/
    │       ├── src/
    │       │   ├── index.ts
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
