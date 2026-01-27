import {
  IoBarChartOutline,
  IoLeafOutline,
  IoFlaskOutline,
  IoConstructOutline,
  IoSettingsOutline,
  IoGridOutline,
  IoCalendarOutline,
  IoHardwareChipOutline,
  IoWaterOutline,
  IoWarningOutline,
  IoListOutline,
  IoPeopleOutline,
  IoServerOutline,
  IoPricetagsOutline,
  IoImagesOutline,
} from 'react-icons/io5'

import { AdminNavModule } from '@/interfaces'

export const Navigation: AdminNavModule[] = [
  {
    slug: 'dashboard',
    name: 'Dashboard',
    basePath: '/orchidarium', // Root del admin
    icon: <IoGridOutline size={20} />,
    dropdownLayout: 'simple',
    sidebarItems: [
      {
        name: 'Resumen General',
        url: '/orchidarium',
        icon: <IoBarChartOutline />,
        description: 'KPIs globales y estado del sistema',
      },
      {
        name: 'Monitor Ambiental',
        url: '/orchidarium/monitoring',
        icon: <IoHardwareChipOutline />,
        description: 'Sensores en tiempo real por zona',
      },
      {
        name: 'Línea de Tiempo',
        url: '/orchidarium/timeline',
        icon: <IoListOutline />,
        description: 'Log de actividades y eventos',
      },
      {
        name: 'Alertas',
        url: '/orchidarium/alerts',
        icon: <IoWarningOutline />,
        description: 'Notificaciones críticas y avisos',
      },
    ],
  },
  {
    slug: 'inventory',
    name: 'Inventario',
    basePath: '/orchidarium/inventory',
    icon: <IoLeafOutline size={20} />,
    dropdownLayout: 'rich', // ⚡ Estilo visual con fotos
    sidebarItems: [
      {
        name: 'Catálogo Especies',
        url: '/orchidarium/inventory/species',
        icon: <IoLeafOutline />,
        image: '/images/menu/inventory-catalog.webp',
        description: 'Gestión taxonómica',
      },
      {
        name: 'Gestión Stock',
        url: '/orchidarium/inventory/stock',
        icon: <IoListOutline />,
        image: '/images/menu/inventory-stock.webp',
        description: 'Movimientos y lotes',
      },
      {
        name: 'Tienda',
        url: '/orchidarium/inventory/shop-manager',
        icon: <IoImagesOutline />,
        image: '/images/menu/inventory-shop.webp',
        description: 'Fotos y precios públicos',
      },
    ],
  },
  {
    slug: 'lab',
    name: 'Laboratorio',
    basePath: '/orchidarium/lab',
    icon: <IoFlaskOutline size={20} />,
    dropdownLayout: 'simple',
    sidebarItems: [
      {
        name: 'Insumos Químicos',
        url: '/orchidarium/lab/supplies',
        icon: <IoPricetagsOutline />,
        description: 'Inventario de Fertilizantes y Fungicidas',
      },
      {
        name: 'Recetas y Mezclas',
        url: '/orchidarium/lab/recipes',
        icon: <IoFlaskOutline />,
        description: 'Preparaciones y fórmulas guardadas',
      },
    ],
  },
  {
    slug: 'operations',
    name: 'Operaciones',
    basePath: '/orchidarium/operations',
    icon: <IoConstructOutline size={20} />,
    dropdownLayout: 'rich',
    sidebarItems: [
      {
        name: 'Centro de Control',
        url: '/orchidarium/operations/control',
        icon: <IoWaterOutline />,
        image: '/images/menu/ops-control.webp',
        description: 'Accionamiento manual de sistemas',
      },
      {
        name: 'Planificador',
        url: '/orchidarium/operations/planner',
        icon: <IoCalendarOutline />,
        image: '/images/menu/ops-planner.webp',
        description: 'Calendario de tareas automáticas',
      },
      {
        name: 'Historial',
        url: '/orchidarium/operations/history',
        icon: <IoListOutline />,
        // Sin imagen, aparecerá solo texto o fallback en el grid
        description: 'Registro de ejecuciones pasadas',
      },
    ],
  },
  {
    slug: 'admin',
    name: 'Admin',
    basePath: '/orchidarium/settings',
    icon: <IoSettingsOutline size={20} />,
    dropdownLayout: 'simple',
    sidebarItems: [
      {
        name: 'Usuarios y Roles',
        url: '/orchidarium/settings/users',
        icon: <IoPeopleOutline />,
        description: 'Gestión de permisos y accesos',
      },
      {
        name: 'Configuración Sistema',
        url: '/orchidarium/settings/system',
        icon: <IoServerOutline />,
        description: 'Ajustes globales y hardware IoT',
      },
    ],
  },
]
