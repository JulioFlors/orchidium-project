import {
  IoBarChartOutline,
  IoCalendarOutline,
  IoConstructOutline,
  IoFlaskOutline,
  IoGridOutline,
  IoHardwareChipOutline,
  IoImagesOutline,
  IoLeafOutline,
  IoListOutline,
  IoPeopleOutline,
  IoPricetagsOutline,
  IoServerOutline,
  IoSettingsOutline,
  IoWarningOutline,
  IoWaterOutline,
} from 'react-icons/io5'

import { AdminRoute, ShopRoute } from '@/interfaces'

export const shopRoutes: ShopRoute[] = [
  {
    name: 'Plantas',
    slug: 'plants',
    url: '/category/plants',
    layout: 'catalog',
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
    ],
  },
  {
    name: 'Contacto',
    slug: 'contacto',
    url: '/about/contacto',
    layout: 'informational',
  },
  {
    name: 'Iniciar sesión',
    slug: 'login',
    url: '/auth/login',
    layout: 'informational',
  },
]

export const adminRoutes: AdminRoute[] = [
  {
    slug: 'dashboard',
    name: 'Dashboard',
    icon: <IoGridOutline size={20} />,
    layout: 'informational',
    items: [
      {
        name: 'Resumen General',
        url: '/orchidarium',
        icon: <IoBarChartOutline />,
        description: 'KPIs globales y estado del sistema',
      },
      {
        name: 'Monitor Ambiental',
        url: '/monitoring',
        icon: <IoHardwareChipOutline />,
        description: 'Sensores en tiempo real por zona',
      },
      {
        name: 'Línea de Tiempo',
        url: '/timeline',
        icon: <IoListOutline />,
        description: 'Log de actividades y eventos',
      },
      {
        name: 'Alertas',
        url: '/alerts',
        icon: <IoWarningOutline />,
        description: 'Notificaciones críticas y avisos',
      },
    ],
  },
  {
    slug: 'inventory',
    name: 'Inventario',
    icon: <IoLeafOutline size={20} />,
    layout: 'hybrid',
    items: [
      {
        name: 'Catálogo Especies',
        url: '/species',
        icon: <IoLeafOutline />,
        image: '/imgs/psyduck_0054.webp',
        description: 'Gestión taxonómica',
      },
      {
        name: 'Gestión Stock',
        url: '/stock',
        icon: <IoListOutline />,
        image: '/imgs/psyduck_0054.webp',
        description: 'Movimientos y lotes',
      },
      {
        name: 'Tienda',
        url: '/shop-manager',
        icon: <IoImagesOutline />,
        image: '/imgs/psyduck_0054.webp',
        description: 'Fotos y precios públicos',
      },
    ],
  },
  {
    slug: 'lab',
    name: 'Laboratorio',
    icon: <IoFlaskOutline size={20} />,
    layout: 'informational',
    items: [
      {
        name: 'Insumos Químicos',
        url: '/supplies',
        icon: <IoPricetagsOutline />,
        description: 'Inventario de Fertilizantes y Fungicidas',
      },
      {
        name: 'Recetas y Mezclas',
        url: '/recipes',
        icon: <IoFlaskOutline />,
        description: 'Preparaciones y fórmulas guardadas',
      },
    ],
  },
  {
    slug: 'operations',
    name: 'Operaciones',
    icon: <IoConstructOutline size={20} />,
    layout: 'hybrid',
    items: [
      {
        name: 'Centro de Control',
        url: '/control',
        icon: <IoWaterOutline />,
        image: '/imgs/psyduck_0054.webp',
        description: 'Accionamiento manual de sistemas',
      },
      {
        name: 'Planificador',
        url: '/planner',
        icon: <IoCalendarOutline />,
        image: '/imgs/psyduck_0054.webp',
        description: 'Calendario de tareas automáticas',
      },
      {
        name: 'Historial',
        url: '/history',
        icon: <IoListOutline />,
        // Sin imagen, aparecerá solo texto o fallback en el grid
        description: 'Registro de ejecuciones pasadas',
      },
    ],
  },
  {
    slug: 'admin',
    name: 'Admin',
    icon: <IoSettingsOutline size={20} />,
    layout: 'informational',
    items: [
      {
        name: 'Usuarios y Roles',
        url: '/users',
        icon: <IoPeopleOutline />,
        description: 'Gestión de permisos y accesos',
      },
      {
        name: 'Configuración Sistema',
        url: '/system',
        icon: <IoServerOutline />,
        description: 'Ajustes globales y hardware IoT',
      },
    ],
  },
]
