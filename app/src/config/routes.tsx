import {
  IoCalendarOutline,
  IoConstructOutline,
  IoFlaskOutline,
  IoGridOutline,
  IoHardwareChipOutline,
  IoImagesOutline,
  IoLeafOutline,
  IoListOutline,
  IoPricetagsOutline,
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
    slug: 'monitoring',
    name: 'Monitoreo',
    icon: <IoGridOutline size={20} />,
    layout: 'informational',
    items: [
      {
        name: 'Estación Meteorológica',
        url: '/monitoring',
        icon: <IoHardwareChipOutline />,
        description: 'Telemetría cruda y gráficas de diagnostico',
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
        description: 'Accionar y supervisar circuitos de riego en tiempo real',
      },
      {
        name: 'Cola de Ejecución',
        url: '/queue',
        icon: <IoListOutline />,
        description: 'Tareas de riego diferidas en espera de ejecución',
      },
      {
        name: 'Programaciones',
        url: '/schedules',
        icon: <IoCalendarOutline />,
        description: 'Rutinas de riego automatizadas',
      },
      {
        name: 'Historial',
        url: '/history',
        icon: <IoListOutline />,
        description: 'Registro de ejecuciones pasadas',
      },
    ],
  },
]
