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
  /*  {
    name: 'Orchid',
    slug: 'orchid',
    url: '/category/plantsg',
    featuredItem: {
      name: 'Dendrobium Striata',
      image: '/plants/orchids/rhyncholaeliocattleya-george-king_0_2000.webp',
      url: '/product/dendrobium-striata',
    },
    categories: [
      {
        name: 'Cattleya',
        slug: 'Cattleya',
        url: '/category/plants/orchids',
        image: '/plants/orchids/orchids.webp',
      },
      {
        name: 'Dendrobium',
        slug: 'Dendrobium',
        url: '/category/plants/adenium_obesum',
        image: '/plants/adenium_obesum/marbella_0_2000.webp',
      },
      {
        name: 'Dimeranta',
        slug: 'Dimeranta',
        url: '/category/plants/cactus',
        image: '/plants/cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
      },
    ],
  },
  {
    name: 'Adenium Obesum',
    slug: 'Adenium_Obesum',
    url: '/category/plantsq',
    featuredItem: {
      name: 'Dendrobium Striata',
      image: '/plants/adenium_obesum/marbella_0_2000.webp',
      url: '/product/dendrobium-striata',
    },
    categories: [
      {
        name: 'Simple Petals',
        slug: 'Simple_Petals',
        url: '/category/plants/orchids',
        image: '/plants/orchids/orchids.webp',
      },
      {
        name: 'Multi Petals',
        slug: 'Multi_Petals',
        url: '/category/plants/adenium_obesum',
        image: '/plants/adenium_obesum/marbella_0_2000.webp',
      },
    ],
  },
  {
    name: 'Cactus',
    slug: 'cactus',
    url: '/category/plantss',
    featuredItem: {
      name: 'Dendrobium Striata',
      image: '/plants/cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
      url: '/product/dendrobium-striata',
    },
    categories: [
      {
        name: 'Mammillaria',
        slug: 'Mammillaria',
        url: '/category/plants/orchids',
        image: '/plants/orchids/orchids.webp',
      },
    ],
  },
  {
    name: 'Suculentas',
    slug: 'suculentas',
    url: '/category/plantss',
    featuredItem: {
      name: 'Dendrobium Striata',
      image: '/plants/succulents/haworthiopsis-attenuata-zebrina_0_2000.webp',
      url: '/product/dendrobium-striata',
    },
    categories: [
      {
        name: 'Haworthiopsis',
        slug: 'Haworthiopsis',
        url: '/category/plants/adenium_obesum',
        image: '/plants/adenium_obesum/marbella_0_2000.webp',
      },
      {
        name: 'Sedum',
        slug: 'Sedum',
        url: '/category/plants/cactus',
        image: '/plants/cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
      },
    ],
  }, */
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
]
