# 🌸 PristinoPlant | Orchidium Project

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

Abre el archivo `.env` y ajusta las variables si es necesario (aunque los valores por defecto son adecuados para el desarrollo local).

### 2. Instalar Dependencias

Instala las dependencias del proyecto utilizando pnpm.

```bash
pnpm install
```

### 3. Levantar la Infraestructura de Backend

Desde la **raíz del proyecto**, ejecuta:

```bash
docker-compose up --build -d
```

Esto iniciará PostgreSQL, InfluxDB, Mosquitto, el servicio de Ingesta y el Schedule.

* `--build`: Es necesario la primera vez para construir la imagen del servicio de ingesta.

* `-d`: Ejecuta los contenedores en segundo plano (detached mode).

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

---

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
    │   │   │   │   │   └── Header.tsx
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
    │   │   │   │   └──title/
    │   │   │   │       └── Title.tsx
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
