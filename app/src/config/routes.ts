import { Route } from '@/interfaces'

// Estas alimentan el Header y Sidebar de la tienda pública.
export const shopNavigation: Route[] = [
  {
    name: 'Plantas',
    slug: 'plants',
    url: '/category/plants',
    featuredItem: {
      name: 'Dendrobium Striata',
      image: '/plants/orchids/orchids.webp',
      url: '/product/dendrobium-striata',
    },
    categories: [
      {
        name: 'Orquídeas',
        slug: 'orchids',
        url: '/category/plants/orchids',
        image: '/plants/orchids/orchids.webp',
      },
      {
        name: 'Rosas del Desierto',
        slug: 'adenium_obesum',
        url: '/category/plants/adenium_obesum',
        image: '/plants/adenium_obesum/marbella_0_2000.webp',
      },
      {
        name: 'Cactus',
        slug: 'cactus',
        url: '/category/plants/cactus',
        image: '/plants/cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
      },
      {
        name: 'Suculentas',
        slug: 'succulents',
        url: '/category/plants/succulents',
        image: '/plants/succulents/pachyveria-scheideckeri_2_2000.webp',
      },
      /* {
        name: 'Bromelias',
        slug: 'bromeliads',
        url: '/category/plants/bromeliads',
        image: '/plants/bromeliads/pachyveria-scheideckeri_2_2000.webp',
      }, */
    ],
  },

  {
    name: 'Contacto',
    slug: 'contacto',
    url: '/about/contacto',
  },

  {
    name: 'Iniciar sesión',
    slug: 'login',
    url: '/auth/login',
  },
]

// =====================================================================
// 2. RUTAS DE GESTIÓN (ORCHIDARIUM - CORE)
// =====================================================================
/*
  ARQUITECTURA DE NAVEGACIÓN - CONTEXTO ADMINISTRACIÓN (ORCHIDARIUM)

  A. Sidebar Izquierdo (Desktop) / Modal de Título (Móvil):
     - Utiliza: `orchidariumMainRoutes`
     - Propósito: Navegación PRINCIPAL del sistema de gestión (Core).
     - Contenido: Herramientas de trabajo diario.
       * Dashboard: Visión general.
       * Inventario: Gestión de plantas/insumos.
       * Planificador: Calendario y rutinas.
       * Monitoreo: Sensores y actuadores.

  B. Sidebar Derecho Global (Botón "Menú"):
     - Utiliza: `orchidariumMenuRoutes`
     - Propósito: Navegación de USUARIO, SALIDA y CONTEXTO GLOBAL.
     - Contenido: Acciones meta-sistema.
       * Perfil: Ajustes de cuenta personal.
       * Ir a Tienda: Salir del admin a la vista pública.
       * Cerrar Sesión.
       * Tema: Preferencias de UI.

*/

// Rutas de Secciones de Gestion del Orquideario
// A. El Sidebar Izquierdo Fijo (Desktop)
// B. El Modal Pop-up que sale del Título (Móvil)
export const orchidariumMainRoutes: Route[] = [
  {
    name: 'Dashboard',
    slug: 'dashboard',
    url: '/orchidarium',
  },
  {
    name: 'Inventario',
    slug: 'inventory',
    url: '/orchidarium/inventory',
  },
  {
    name: 'Planificador',
    slug: 'planner',
    url: '/orchidarium/planner',
  },
  {
    name: 'Monitoreo IoT',
    slug: 'monitoring',
    url: '/orchidarium/monitoring',
  },
  {
    name: 'Configuración',
    slug: 'settings',
    url: '/orchidarium/settings',
  },
]

// =====================================================================
// A. RUTAS DE NAVEGACIÓN del hearder modo desktop
// B. BOTÓN MENÚ EN HEADER que abre el sidebar derecho modo mobile
// =====================================================================
export const orchidariumMenuRoutes: Route[] = [
  {
    name: 'Tienda',
    slug: 'shop',
    url: '/',
  },
]
