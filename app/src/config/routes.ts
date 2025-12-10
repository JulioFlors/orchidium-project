import { Route } from '@/interfaces'

export const staticRoutes: Route[] = [
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
  /*   {
    name: 'Accesorios',
    slug: 'accesorios',
    url: '/category/accesorios',
    categories: [
      {
        name: 'Macetas',
        slug: 'macetas',
        url: '/category/accesorios/macetas',
        image: '/placeholder.svg?height=200&width=200',
      },
      {
        name: 'Herramientas',
        slug: 'herramientas',
        url: '/category/accesorios/herramientas',
        image: '/placeholder.svg?height=200&width=200',
      },
    ],
  }, */
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
  {
    name: 'Dashboard',
    slug: 'dashboard',
    url: '/dashboard',
    protected: true,
  },
]
