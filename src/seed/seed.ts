//type RoleType = 'User' | 'Admin'
type ZoneType = 'Zona_A' | 'Zona_B' | 'Zona_C' | 'Zona_D'
type TableType = 'Mesa_1' | 'Mesa_2' | 'Mesa_3' | 'Mesa_4' | 'Mesa_5' | 'Mesa_6'
type PlantType = 'Orchid' | 'Adenium_Obesum' | 'Cactus' | 'Succulent'

type TaskStatus = 'Pendiente' | 'Completada' | 'Cancelada' | 'Reprogramada'
type AgrochemicalType = 'Fertilizante' | 'Fitosanitario'
type AgrochemicalPorpose =
  | 'Desarrollo'
  | 'Mantenimiento'
  | 'Floracion'
  | 'Fungicida'
  | 'Insecticida'
  | 'Acaricida'
type TriggerType = 'Diario' | 'Interdiario' | 'Sensores'
type ActuatorType = 'Aspercion' | 'Nebulizacion' | 'Humedecer_Suelo'
/* type SensorType = 'Humedad_Relativa' | 'Temperatura' | 'Intensidad_Luminosa' */

export interface SeedCategory {
  id: string
  title: string
  subcategories?: SeedSubcategory[]
  url?: string
}

export interface SeedSubcategory {
  id: string
  title: string
  image: string
  url: string
}

interface SeedGenus {
  name: string
  type: PlantType
}

interface SeedSpecies {
  name: string
  genus: {
    name: string // el nombre del genero sera relacionado por UUID en seed-database.ts
  }
  price: number
  slug: string
  stock: {
    quantity: number
    available: boolean
  }
  images: string[]
}

interface SeedPlant {
  pottingDate?: Date
  species: {
    name: string // el nombre de la especie sera relacionado por UUID en seed-database.ts
  }
  location?: {
    zone: ZoneType
    table: TableType
  }
}

interface SeedAgrochemical {
  name: string
  description: string
  type: AgrochemicalType
  porpose: AgrochemicalPorpose
  preparation: string
}

interface SeedFertilizationProgram {
  name: string
  weeklyFrequency: number
  productsCycle: SeedFertilizationCycle[]
}

export interface SeedFertilizationCycle {
  sequence: number
  agrochemical: {
    name: string // Es necesario relacionarlo en seed-database.ts
  }
}

interface SeedFertilizationTask {
  scheduledDate: Date
  executionDate?: Date
  zones: ZoneType[]
  note?: string
  status?: TaskStatus
  agrochemical: {
    name: string // Es necesario relacionarlo en seed-database.ts
  }
  productsCycle?: {
    sequence: number
    programName: string // Es necesario relacionarlo en seed-database.ts
  }
}

interface SeedPhytosanitaryProgram {
  name: string
  monthlyFrequency: number
  productsCycle: SeedPhytosanitaryCycle[]
}

export interface SeedPhytosanitaryCycle {
  sequence: number
  agrochemical: {
    name: string // Es necesario relacionarlo en seed-database.ts
  }
}

interface SeedPhytosanitaryTask {
  scheduledDate: Date
  executionDate?: Date
  zones: ZoneType[]
  note?: string
  status?: TaskStatus
  agrochemical: {
    name: string // Es necesario relacionarlo en seed-database.ts
  }
  productsCycle?: {
    sequence: number
    programName: string // Es necesario relacionarlo en seed-database.ts
  }
}

interface SeedIrrigationProgram {
  name: string
  trigger: TriggerType
  actuator: ActuatorType
  startTime: string
  duration: number
  zones: ZoneType[]
}

interface SeedIrrigationTask {
  scheduledDate: Date
  executionDate?: Date
  actuator: ActuatorType
  duration: number
  zones: ZoneType[]
  status?: TaskStatus
  program?: {
    name: string // Es necesario relacionarlo en seed-database.ts
  }
}

/* interface SeedSensorReading {
  zone: ZoneType
  sensorType: SensorType
  value: number
  timestamp?: Date
} */

interface SeedData {
  categories: SeedCategory[]
  genus: SeedGenus[]
  species: SeedSpecies[]
  plants: SeedPlant[]
  agrochemicals: SeedAgrochemical[]
  fertilizationPrograms: SeedFertilizationProgram[]
  fertilizationTasks: SeedFertilizationTask[]
  phytosanitaryPrograms: SeedPhytosanitaryProgram[]
  phytosanitaryTasks: SeedPhytosanitaryTask[]
  irrigationPrograms: SeedIrrigationProgram[]
  irrigationTasks: SeedIrrigationTask[]
}

export const initialData: SeedData = {
  // Datos de ejemplo para las categorías
  categories: [
    {
      id: 'plantas',
      title: 'Plantas',
      url: '/category/plantas',
      subcategories: [
        {
          id: 'orquideas',
          title: 'Orquídeas',
          image: '/plants/orchids/orchids.webp',
          url: '/category/orquideas',
        },
        {
          id: 'rosas-del-desierto',
          title: 'Rosas del Desierto',
          image: '/plants/adenium_obesum/marbella_0_2000.webp',
          url: '/category/rosas-del-desierto',
        },
        {
          id: 'cactus',
          title: 'Cactus',
          image: '/plants/cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
          url: '/category/cactus',
        },
        {
          id: 'suculentas',
          title: 'Suculentas',
          image: '/plants/succulents/xpachyveria-scheideckeri_2_2000.webp',
          url: '/category/suculentas',
        },
      ],
    },
    {
      id: 'accesorios',
      title: 'Accesorios',
      url: '/category/accesorios',
      subcategories: [
        {
          id: 'macetas',
          title: 'Macetas',
          image: '/placeholder.svg?height=200&width=200',
          url: '/category/macetas',
        },
        {
          id: 'herramientas',
          title: 'Herramientas',
          image: '/placeholder.svg?height=200&width=200',
          url: '/category/herramientas',
        },
      ],
    },
    {
      id: 'contacto',
      title: 'Contacto',
      url: '/about/contacto',
    },
    {
      id: 'login',
      title: 'Iniciar sesión',
      url: '/auth/login',
    },
  ],
  genus: [
    { name: 'Cattleya', type: 'Orchid' },
    { name: 'Dendrobium', type: 'Orchid' },
    { name: 'Dimerandra', type: 'Orchid' },
    { name: 'Enciclea', type: 'Orchid' },
    { name: 'Single Petals', type: 'Adenium_Obesum' },
    { name: 'Multiple Petals', type: 'Adenium_Obesum' },
    { name: 'Euphorbia', type: 'Cactus' },
    { name: 'Mammillaria', type: 'Cactus' },
    { name: 'Rebutia', type: 'Cactus' },
    { name: 'Crassula', type: 'Succulent' },
    { name: 'Graptopetalum', type: 'Succulent' },
    { name: 'Graptoveria', type: 'Succulent' },
    { name: 'Haworthiopsis', type: 'Succulent' },
    { name: 'Orostachys', type: 'Succulent' },
    { name: 'Senecio', type: 'Succulent' },
    { name: 'xPachyveria', type: 'Succulent' },
  ],
  species: [
    /* Orchid */
    {
      name: 'Cattleya Violacea',
      genus: { name: 'Cattleya' },
      price: 25,
      slug: 'cattleya-violacea',
      stock: { quantity: 5, available: true },
      images: [
        'orchids/cattleya-violacea_0_2000.webp',
        'orchids/cattleya-violacea_1_2000.webp',
        'orchids/cattleya-violacea_2_2000.webp',
      ],
    },
    {
      name: 'Cattlianthe Mary Elizabeth Bohn',
      genus: { name: 'Cattleya' },
      price: 20,
      slug: 'cattlianthe-mary-elizabeth-bohn',
      stock: { quantity: 4, available: true },
      images: [
        'orchids/cattlianthe-mary-elizabeth-bohn_0_2000.webp',
        'orchids/cattlianthe-mary-elizabeth-bohn_1_2000.webp',
      ],
    },
    {
      name: 'Cattleya Caudebec x Cattleya Bactia',
      genus: { name: 'Cattleya' },
      price: 30,
      slug: 'cattleya-caudebec-x-cattleya-bactia',
      stock: { quantity: 1, available: false },
      images: ['orchids/cattleya-caudebec-x-cattleya-bactia_0_2000.webp'],
    },
    {
      name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana',
      genus: { name: 'Cattleya' },
      price: 30,
      slug: 'cattleya-lueddemanniana-x-cattleya-gaskelliana',
      stock: { quantity: 4, available: true },
      images: ['orchids/cattleya-lueddemanniana-x-cattleya-gaskelliana_0_2000.webp'],
    },
    {
      name: "Rhyncholaeliocattleya George King 'Southern Cross'",
      genus: { name: 'Cattleya' },
      price: 30,
      slug: 'rhyncholaeliocattleya-george-king',
      stock: { quantity: 6, available: true },
      images: [
        'orchids/rhyncholaeliocattleya-george-king_0_2000.webp',
        'orchids/rhyncholaeliocattleya-george-king_1_2000.webp',
      ],
    },
    {
      name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'",
      genus: { name: 'Cattleya' },
      price: 30,
      slug: 'rhyncholaeliocattleya-memoria-anna-balmores',
      stock: { quantity: 6, available: true },
      images: ['orchids/rhyncholaeliocattleya-memoria-anna-balmores_0_2000.webp'],
    },
    {
      name: 'Cattleya Supersonic',
      genus: { name: 'Cattleya' },
      price: 30,
      slug: 'cattleya-supersonic',
      stock: { quantity: 1, available: false },
      images: ['orchids/cattleya-supersonic_0_2000.webp'],
    },
    {
      name: 'Dendrobium Striata',
      genus: { name: 'Dendrobium' },
      price: 20,
      slug: 'dendrobium-striata',
      stock: { quantity: 3, available: true },
      images: ['orchids/dendrobium-striata_0_2000.webp'],
    },
    {
      name: 'Dendrobium Ocean Blue',
      genus: { name: 'Dendrobium' },
      price: 25,
      slug: 'dendrobium-ocean-blue',
      stock: { quantity: 8, available: true },
      images: ['orchids/dendrobium-ocean-blue_0_2000.webp'],
    },
    {
      name: 'Dendrobium Diamond',
      genus: { name: 'Dendrobium' },
      price: 20,
      slug: 'dendrobium-diamond',
      stock: { quantity: 2, available: false },
      images: ['orchids/dendrobium-diamond_0_2000.webp'],
    },
    {
      name: 'Dimerandra Stenotepala',
      genus: { name: 'Dimerandra' },
      price: 20,
      slug: 'dimerandra-stenotepala',
      stock: { quantity: 1, available: false },
      images: ['orchids/dimerandra-stenotepala_0_2000.webp'],
    },
    {
      name: 'Enciclea Cordijera',
      genus: { name: 'Enciclea' },
      price: 20,
      slug: 'enciclea-cordijera',
      stock: { quantity: 3, available: true },
      images: ['orchids/enciclea-cordijera_0_2000.webp'],
    },
    /* Adenium_Obesum */
    {
      name: 'Adenium Obesum Genoa GNA',
      genus: { name: 'Multiple Petals' },
      price: 20,
      slug: 'adenium-obesum-genoa-gna',
      stock: { quantity: 1, available: false },
      images: [
        'adenium_obesum/genoa-gna_0_2000.webp',
        'adenium_obesum/genoa-gna_1_2000.webp',
        'adenium_obesum/genoa-gna_2_2000.webp',
      ],
    },
    {
      name: 'Adenium Obesum Marbella',
      genus: { name: 'Multiple Petals' },
      price: 20,
      slug: 'adenium-obesum-marbella',
      stock: { quantity: 1, available: false },
      images: ['adenium_obesum/marbella_0_2000.webp', 'adenium_obesum/marbella_1_2000.webp'],
    },
    /* Cactus */
    {
      name: 'Euphorbia ritchiei',
      genus: { name: 'Euphorbia' },
      price: 3,
      slug: 'euphorbia-ritchiei',
      stock: { quantity: 9, available: true },
      images: ['cactus/euphorbia-ritchiei_0_2000.webp', 'euphorbia-ritchiei_1_2000.webp'],
    },
    {
      name: 'Mammillaria prolifera ssp. haitiensis',
      genus: { name: 'Mammillaria' },
      price: 3,
      slug: 'mammillaria-prolifera-ssp-haitiensis',
      stock: { quantity: 3, available: false },
      images: [
        'cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_1_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_2_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_3_2000.webp',
      ],
    },
    {
      name: 'Mammillaria vetula ssp. gracilis',
      genus: { name: 'Mammillaria' },
      price: 3,
      slug: 'mammillaria-vetula-ssp-gracilis',
      stock: { quantity: 3, available: false },
      images: [
        'cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_1_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_2_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_3_2000.webp',
      ],
    },
    {
      name: 'Mammillaria vetula ssp. gracilis cv. roi baudoin yonneux',
      genus: { name: 'Mammillaria' },
      price: 3,
      slug: 'mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux',
      stock: { quantity: 2, available: false },
      images: [
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_0_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_1_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_2_2000.webp',
      ],
    },
    {
      name: 'Rebutia heliosa ssp. teresae',
      genus: { name: 'Rebutia' },
      price: 2,
      slug: 'rebutia-heliosa-teresae',
      stock: { quantity: 4, available: false },
      images: [
        'cactus/rebutia-heliosa-ssp-teresae_0_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_1_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_2_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_3_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_4_2000.webp',
      ],
    },
    /* Succulent */
    {
      name: 'Crassula capitella "Campfire"',
      genus: { name: 'Crassula' },
      price: 4,
      slug: 'crassula-capitella-campfire',
      stock: { quantity: 1, available: false },
      images: [
        'succulents/crassula-capitella-campfire_0_2000.webp',
        'succulents/crassula-capitella-campfire_1_2000.webp',
        'succulents/crassula-capitella-campfire_2_2000.webp',
        'succulents/crassula-capitella-campfire_3_2000.webp',
      ],
    },
    {
      name: 'Crassula ovata "Gollum"',
      genus: { name: 'Crassula' },
      price: 5,
      slug: 'crassula-ovata-gollum',
      stock: { quantity: 0, available: false },
      images: ['succulents/crassula-ovata-gollum_0_2000.webp'],
    },
    {
      name: 'Graptopetalum paraguayense',
      genus: { name: 'Graptopetalum' },
      price: 3,
      slug: 'graptopetalum-paraguayense',
      stock: { quantity: 3, available: false },
      images: [
        'succulents/graptopetalum-paraguayense_0_2000.webp',
        'succulents/graptopetalum-paraguayense_1_2000.webp',
      ],
    },
    {
      name: 'Graptoveria Fénix',
      genus: { name: 'Graptoveria' },
      price: 3,
      slug: 'graptoveria-fenix',
      stock: { quantity: 2, available: false },
      images: [
        'succulents/graptoveria-fenix_0_2000.webp',
        'succulents/graptoveria-fenix_1_2000.webp',
      ],
    },
    {
      name: 'Haworthiopsis attenuata "Zebrina"',
      genus: { name: 'Haworthiopsis' },
      price: 6,
      slug: 'haworthiopsis-attenuata-zebrina',
      stock: { quantity: 0, available: false },
      images: ['succulents/haworthiopsis-attenuata-zebrina_0_2000.webp'],
    },
    {
      name: 'Orostachys boehmeri "Keiko"',
      genus: { name: 'Orostachys' },
      price: 3,
      slug: 'orostachys-boehmeri-keiko',
      stock: { quantity: 10, available: true },
      images: [
        'succulents/orostachys-boehmeri-keiko_0_2000.webp',
        'succulents/orostachys-boehmeri-keiko_1_2000.webp',
        'succulents/orostachys-boehmeri-keiko_2_2000.webp',
      ],
    },
    {
      name: 'Senecio rowleyanus "Rosario"',
      genus: { name: 'Senecio' },
      price: 4,
      slug: 'senecio-rowleyanus-rosario',
      stock: { quantity: 0, available: false },
      images: ['succulents/senecio-rowleyanus-rosario_0_2000.webp'],
    },
    {
      name: 'xPachyveria "Scheideckeri"',
      genus: { name: 'xPachyveria' },
      price: 4,
      slug: 'xpachyveria-scheideckeri',
      stock: { quantity: 4, available: false },
      images: [
        'succulents/xpachyveria-scheideckeri_0_2000.webp',
        'succulents/xpachyveria-scheideckeri_1_2000.webp',
        'succulents/xpachyveria-scheideckeri_2_2000.webp',
        'succulents/xpachyveria-scheideckeri_3_2000.webp',
      ],
    },
  ],
  plants: [
    {
      species: { name: 'Cattleya Violacea' },
      pottingDate: new Date('2024-01-15'),
      location: { zone: 'Zona_A', table: 'Mesa_1' },
    },
    {
      species: { name: 'Cattleya Violacea' },
      pottingDate: new Date('2024-02-20'),
      location: { zone: 'Zona_A', table: 'Mesa_1' },
    },
    {
      species: { name: 'Cattlianthe Mary Elizabeth Bohn' },
      pottingDate: new Date('2023-12-20'),
      location: { zone: 'Zona_A', table: 'Mesa_1' },
    },
    {
      species: { name: 'Cattlianthe Mary Elizabeth Bohn' },
      pottingDate: new Date('2024-03-01'),
      location: { zone: 'Zona_A', table: 'Mesa_2' },
    },
    {
      species: { name: 'Cattleya Caudebec x Cattleya Bactia' },
      pottingDate: new Date('2024-02-01'),
      location: { zone: 'Zona_A', table: 'Mesa_2' },
    },
    {
      species: { name: 'Cattleya Caudebec x Cattleya Bactia' },
      pottingDate: new Date('2024-02-10'),
      location: { zone: 'Zona_A', table: 'Mesa_2' },
    },
    {
      species: { name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana' },
      pottingDate: new Date('2024-01-25'),
      location: { zone: 'Zona_A', table: 'Mesa_3' },
    },
    {
      species: { name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana' },
      pottingDate: new Date('2024-02-05'),
      location: { zone: 'Zona_A', table: 'Mesa_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya George King 'Southern Cross'" },
      pottingDate: new Date('2024-02-15'),
      location: { zone: 'Zona_A', table: 'Mesa_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya George King 'Southern Cross'" },
      pottingDate: new Date('2024-01-30'),
      location: { zone: 'Zona_A', table: 'Mesa_4' },
    },
    {
      species: { name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'" },
      pottingDate: new Date('2024-02-15'),
      location: { zone: 'Zona_A', table: 'Mesa_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'" },
      pottingDate: new Date('2024-01-30'),
      location: { zone: 'Zona_A', table: 'Mesa_4' },
    },
    {
      species: { name: 'Cattleya Supersonic' },
      pottingDate: new Date('2024-02-28'),
      location: { zone: 'Zona_A', table: 'Mesa_4' },
    },
    {
      species: { name: 'Cattleya Supersonic' },
      pottingDate: new Date('2024-03-10'),
      location: { zone: 'Zona_A', table: 'Mesa_4' },
    },
    {
      species: { name: 'Dendrobium Striata' },
      pottingDate: new Date('2024-01-05'),
      location: { zone: 'Zona_A', table: 'Mesa_5' },
    },
    {
      species: { name: 'Dendrobium Striata' },
      pottingDate: new Date('2024-02-12'),
      location: { zone: 'Zona_A', table: 'Mesa_5' },
    },
    {
      species: { name: 'Dendrobium Ocean Blue' },
      pottingDate: new Date('2023-12-25'),
      location: { zone: 'Zona_A', table: 'Mesa_5' },
    },
    {
      species: { name: 'Dendrobium Ocean Blue' },
      pottingDate: new Date('2024-01-20'),
      location: { zone: 'Zona_A', table: 'Mesa_6' },
    },
    {
      species: { name: 'Dendrobium Diamond' },
      pottingDate: new Date('2024-02-08'),
      location: { zone: 'Zona_A', table: 'Mesa_6' },
    },
    {
      species: { name: 'Dendrobium Diamond' },
      pottingDate: new Date('2024-03-15'),
      location: { zone: 'Zona_A', table: 'Mesa_6' },
    },
    {
      species: { name: 'Dimerandra Stenotepala' },
      pottingDate: new Date('2024-01-18'),
      location: { zone: 'Zona_A', table: 'Mesa_1' },
    },
    {
      species: { name: 'Dimerandra Stenotepala' },
      pottingDate: new Date('2024-02-22'),
      location: { zone: 'Zona_A', table: 'Mesa_2' },
    },
    {
      species: { name: 'Enciclea Cordijera' },
      pottingDate: new Date('2024-01-28'),
      location: { zone: 'Zona_A', table: 'Mesa_3' },
    },
    {
      species: { name: 'Enciclea Cordijera' },
      pottingDate: new Date('2024-03-05'),
      location: { zone: 'Zona_A', table: 'Mesa_4' },
    },
  ],
  agrochemicals: [
    {
      name: 'Osmocote Plus',
      description:
        'Fertilizante Granular de liberación lenta. Formulacion 15-9-12 + microelementos. Aplicar cada 4 meses.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1/4 cdita por planta',
    },
    {
      name: 'Solucat 25-5-5',
      description:
        'Fertilizante NPK cristalino rico en nitrógeno con microelementos, adecuado como complemento al abonado o para aplicar en las fases de crecimiento vegetativo dónde se consume nitrógeno.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1 gramo por litro de agua',
    },
    {
      name: 'Nitrifort M935',
      description:
        'Promueve el crecimiento y desarrollo de hojas verdes, esencial para la fotosíntesis.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '2 ml/L',
    },
    {
      name: 'Bio-Fert 72',
      description: 'Vigorizante y estimulador de nuevos brotes vegetativos.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1 g/L',
    },
    {
      name: 'Razormin',
      description:
        'Bioestimulante y enraizante. Favorece la absorción de nutrientes. Aplicar cada 21 dias.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1 ml/L',
    },
    {
      name: 'Melaza',
      description:
        'Promueve el desarrollo radicular, optimiza la capacidad de intercambio catiónico del sustrato e Intensifica la actividad microbiológica del sustrato. Aplicar cada semana (se mezcla con otros fertilizantes).',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1 cda/L',
    },
    {
      name: 'Dalgin',
      description:
        'Aporta vitalidad y energía al cultivo, especialmente durante el desarrollo vegetativo, y activa la clorofila y procesos fotosintéticos. Aplicar cada mes.',
      type: 'Fertilizante',
      porpose: 'Desarrollo',
      preparation: '1 ml/L',
    },
    {
      name: 'Triple 20-20-20',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'Fertilizante',
      porpose: 'Mantenimiento',
      preparation: '1 g/L',
    },
    {
      name: 'Triple 19-19-19',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'Fertilizante',
      porpose: 'Mantenimiento',
      preparation: '1 g/L',
    },
    {
      name: 'Solucat 10-52-10',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'Fertilizante',
      porpose: 'Floracion',
      preparation: '1 g/L',
    },
    {
      name: 'Calcio + Boro',
      description:
        'Aumenta la turgencia de las plantas, el desarrollo de las flores y la calidad de las flores. Aplicar cada semana.',
      type: 'Fertilizante',
      porpose: 'Floracion',
      preparation: '2 ml/L',
    },
    {
      name: 'Curtail',
      description:
        'Actúa por contacto e ingestión contra un amplio espectro de plagas masticadoras, minadoras y perforadoras, tanto larvas, ninfas y adultos.',
      type: 'Fitosanitario',
      porpose: 'Insecticida',
      preparation: '3 ml/L',
    },
    {
      name: 'ABAC',
      description:
        'insecticida por ingestión y por contacto, el insecto queda inmovilizado poco después de ingerir el producto, deja de alimentarse y acaba muriendo, sin destruir la planta.',
      type: 'Fitosanitario',
      porpose: 'Acaricida',
      preparation: '3 ml/L',
    },
    {
      name: 'Sulphor-NF',
      description:
        'Posee un alto contenido de azufre siendo también un compuesto nitrogenado que favorece el crecimiento y fortalece los cultivos contra condiciones adversas como: stress, plagas y enfermedades por su triple acción (fungicida, acaricida y nutricional).',
      type: 'Fitosanitario',
      porpose: 'Acaricida',
      preparation: '3 ml/L',
    },
    {
      name: 'Kasumin',
      description:
        'Fungicida – bactericida de origen biológico, con acción sistémico con actividad preventiva y curativa.',
      type: 'Fitosanitario',
      porpose: 'Fungicida',
      preparation: '5 ml/L',
    },
    {
      name: 'Vitavax-200F',
      description:
        'Se puede aplicar a la semilla para prevenir las enfermedades provocadas por microorganismos que pueden ser transmitidos en las semillas o encontrarse en el suelo, protegiendo las semillas durante su almacenaje, germinación y a las plántulas en sus primeros días de desarrollo.',
      type: 'Fitosanitario',
      porpose: 'Fungicida',
      preparation: '10 ml/L',
    },
    {
      name: 'Mancozeb',
      description:
        'Presenta un amplio espectro antifúngico frente a hongos endoparásitos causantes de enfermedades foliares.',
      type: 'Fitosanitario',
      porpose: 'Fungicida',
      preparation: '5 g/L',
    },
    {
      name: 'Bitter 97',
      description: 'De acción sistémica, preventiva y curativa.',
      type: 'Fitosanitario',
      porpose: 'Fungicida',
      preparation: '5 ml/L',
    },
    {
      name: 'Agua Oxigenada',
      description: '12h x 7dias.',
      type: 'Fitosanitario',
      porpose: 'Fungicida',
      preparation: '50:50',
    },
  ],
  fertilizationPrograms: [
    {
      name: 'Desarrollo Solucat mensual',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Solucat 25-5-5' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },
    {
      name: 'Desarrollo Nitrifort mensual',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Nitrifort M935' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },
    {
      name: 'Desarrollo Bio-Fert 72 mensual',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Bio-Fert 72' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },
    {
      name: 'Calcio + Boro Semanal',
      weeklyFrequency: 1,
      productsCycle: [{ sequence: 1, agrochemical: { name: 'Calcio + Boro' } }],
    },
    {
      name: 'Razormin 21 dias',
      weeklyFrequency: 3,
      productsCycle: [{ sequence: 1, agrochemical: { name: 'Razormin' } }],
    },
    {
      name: 'Osmocote Plus 4 meses',
      weeklyFrequency: 16,
      productsCycle: [{ sequence: 1, agrochemical: { name: 'Osmocote Plus' } }],
    },
  ],
  fertilizationTasks: [
    // Tareas para Desarrollo Solucat mensual (Marzo 2025 - Mes 1 de alternancia) (Comienzo en Lunes 3 de Marzo)
    {
      scheduledDate: new Date('2025-03-03T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Solucat 25-5-5' },
      productsCycle: { sequence: 1, programName: 'Desarrollo Solucat mensual' },
    }, // Semana 1 - Marzo
    {
      scheduledDate: new Date('2025-03-10T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 2, programName: 'Desarrollo Solucat mensual' },
    }, // Semana 2 - Marzo
    {
      scheduledDate: new Date('2025-03-17T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 3, programName: 'Desarrollo Solucat mensual' },
    }, // Semana 3 - Marzo
    {
      scheduledDate: new Date('2025-03-24T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Solucat 10-52-10' },
      productsCycle: { sequence: 4, programName: 'Desarrollo Solucat mensual' },
    }, // Semana 4 - Marzo

    // Tareas para Desarrollo Nitrifort mensual (Abril 2025 - Mes 2 de alternancia) (Comienzo en Lunes 7 de Abril)
    {
      scheduledDate: new Date('2025-04-07T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Nitrifort M935' },
      productsCycle: { sequence: 1, programName: 'Desarrollo Nitrifort mensual' },
    }, // Semana 1 - Abril
    {
      scheduledDate: new Date('2025-04-14T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 2, programName: 'Desarrollo Nitrifort mensual' },
    }, // Semana 2 - Abril
    {
      scheduledDate: new Date('2025-04-21T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 3, programName: 'Desarrollo Nitrifort mensual' },
    }, // Semana 3 - Abril
    {
      scheduledDate: new Date('2025-04-28T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Solucat 10-52-10' },
      productsCycle: { sequence: 4, programName: 'Desarrollo Nitrifort mensual' },
    }, // Semana 4 - Abril

    // Tareas para Programa Desarrollo Bio-Fert 72 (Mayo 2025 - Mes 3 de alternancia) (Comienzo en Lunes 5 de Mayo)
    {
      scheduledDate: new Date('2025-05-05T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Bio-Fert 72' },
      productsCycle: { sequence: 1, programName: 'Desarrollo Bio-Fert 72 mensual' },
    }, // Semana 1 - Mayo
    {
      scheduledDate: new Date('2025-05-12T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 2, programName: 'Desarrollo Bio-Fert 72 mensual' },
    }, // Semana 2 - Mayo
    {
      scheduledDate: new Date('2025-05-19T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Triple 20-20-20' },
      productsCycle: { sequence: 3, programName: 'Desarrollo Bio-Fert 72 mensual' },
    }, // Semana 3 - Mayo
    {
      scheduledDate: new Date('2025-05-26T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Solucat 10-52-10' },
      productsCycle: { sequence: 4, programName: 'Desarrollo Bio-Fert 72 mensual' },
    }, // Semana 4 - Mayo

    // Tareas para Programa Calcio + Boro Semanal (aplicación semanal continua a partir de Marzo 2025) (Martes 4 de Marzo)
    {
      scheduledDate: new Date('2025-03-04T09:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Calcio + Boro' },
      productsCycle: { sequence: 1, programName: 'Calcio + Boro Semanal' },
    }, // Semana 1 - Marzo
    {
      scheduledDate: new Date('2025-03-11T09:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Calcio + Boro' },
      productsCycle: { sequence: 1, programName: 'Calcio + Boro Semanal' },
    }, // Semana 2 - Marzo
    {
      scheduledDate: new Date('2025-03-18T09:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Calcio + Boro' },
      productsCycle: { sequence: 1, programName: 'Calcio + Boro Semanal' },
    }, // Semana 3 - Marzo
    {
      scheduledDate: new Date('2025-03-25T09:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Calcio + Boro' },
      productsCycle: { sequence: 1, programName: 'Calcio + Boro Semanal' },
    }, // Semana 4 - Marzo
    {
      scheduledDate: new Date('2025-04-01T09:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Calcio + Boro' },
      productsCycle: { sequence: 1, programName: 'Calcio + Boro Semanal' },
    }, // Semana 1 - Abril

    // Tareas para Razormin 21 dias (aplicación cada 21 días a partir de Marzo 2025)
    {
      scheduledDate: new Date('2025-03-06T11:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Razormin' },
      productsCycle: { sequence: 1, programName: 'Razormin 21 dias' },
    }, // Inicio Marzo (Jueves 6 de Marzo)
    {
      scheduledDate: new Date('2025-03-27T11:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Razormin' },
      productsCycle: { sequence: 1, programName: 'Razormin 21 dias' },
    }, // ~21 días después (finales de Marzo)
    {
      scheduledDate: new Date('2025-04-17T11:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Razormin' },
      productsCycle: { sequence: 1, programName: 'Razormin 21 dias' },
    }, // ~21 días después (mediados de Abril)

    // Tareas para Osmocote Plus 4 meses (aplicación cada 4 meses a partir de Marzo 2025)
    {
      scheduledDate: new Date('2025-03-05T07:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Osmocote Plus' },
      productsCycle: { sequence: 1, programName: 'Osmocote Plus 4 meses' },
    }, // Marzo 2025
    {
      scheduledDate: new Date('2025-07-05T07:00:00Z'),
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      agrochemical: { name: 'Osmocote Plus' },
      productsCycle: { sequence: 1, programName: 'Osmocote Plus 4 meses' },
    }, // Julio 2025 (4 meses después)

    // Tarea Ad hoc
    {
      scheduledDate: new Date('2025-03-01T08:00:00Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Melaza' },
    },
  ],
  phytosanitaryPrograms: [
    {
      name: 'Programa Fungicida Ciclo 2 Meses',
      monthlyFrequency: 2,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Kasumin' } },
        { sequence: 2, agrochemical: { name: 'Sulphor-NF' } },
        { sequence: 3, agrochemical: { name: 'Kasumin' } },
        { sequence: 4, agrochemical: { name: 'Mancozeb' } },
        { sequence: 5, agrochemical: { name: 'Sulphor-NF' } },
        { sequence: 6, agrochemical: { name: 'Bitter 97' } },
      ],
    },
    {
      name: 'Programa Acaricida Ciclo 3 Meses',
      monthlyFrequency: 3,
      productsCycle: [{ sequence: 1, agrochemical: { name: 'ABAC' } }],
    },
    {
      name: 'Programa Insecticida Ciclo 4 Meses',
      monthlyFrequency: 4,
      productsCycle: [{ sequence: 1, agrochemical: { name: 'Curtail' } }],
    },
  ],
  phytosanitaryTasks: [
    // Programa Fungicida Ciclo 2 Meses - Inicio Marzo 2025 - Repetición cada 2 meses
    {
      scheduledDate: new Date('2025-03-05T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 1, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 1: Kasumin - Semana 1
    {
      scheduledDate: new Date('2025-03-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 1, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 1: Kasumin - Semana 2
    {
      scheduledDate: new Date('2025-03-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 1, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 1: Kasumin - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-05-14T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 2, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 2: Sulphor-NF - Semana 1 (8 semanas después de la ÚLTIMA aplicación de Kasumin)
    {
      scheduledDate: new Date('2025-05-21T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 2, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 2: Sulphor-NF - Semana 2
    {
      scheduledDate: new Date('2025-05-28T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 2, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 2: Sulphor-NF - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-07-23T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 3, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 3: Kasumin - Semana 1 (8 semanas después de la ÚLTIMA aplicación de Sulphor-NF)
    {
      scheduledDate: new Date('2025-07-30T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 3, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 3: Kasumin - Semana 2
    {
      scheduledDate: new Date('2025-08-06T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Kasumin' },
      productsCycle: { sequence: 3, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 3: Kasumin - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-10-01T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Mancozeb' },
      productsCycle: { sequence: 4, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 4: Mancozeb - Semana 1 (8 semanas después de la ÚLTIMA aplicación de Kasumin)
    {
      scheduledDate: new Date('2025-10-08T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Mancozeb' },
      productsCycle: { sequence: 4, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 4: Mancozeb - Semana 2
    {
      scheduledDate: new Date('2025-10-15T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Mancozeb' },
      productsCycle: { sequence: 4, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 4: Mancozeb - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-12-10T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 5, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 5: Sulphor-NF - Semana 1 (8 semanas después de la ÚLTIMA aplicación de Mancozeb)
    {
      scheduledDate: new Date('2025-12-17T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 5, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 5: Sulphor-NF - Semana 2
    {
      scheduledDate: new Date('2025-12-24T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Sulphor-NF' },
      productsCycle: { sequence: 5, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 5: Sulphor-NF - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2026-02-18T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Bitter 97' },
      productsCycle: { sequence: 6, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 6: Bitter 97 - Semana 1 (8 semanas después de la ÚLTIMA aplicación de Sulphor-NF)
    {
      scheduledDate: new Date('2026-02-25T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Bitter 97' },
      productsCycle: { sequence: 6, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 6: Bitter 97 - Semana 2
    {
      scheduledDate: new Date('2026-03-04T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Bitter 97' },
      productsCycle: { sequence: 6, programName: 'Programa Fungicida Ciclo 2 Meses' },
    }, // Secuencia 6: Bitter 97 - Semana 3 (ÚLTIMA APLICACIÓN)

    // Programa Acaricida Ciclo 3 Meses - Inicio Marzo 2025 - Repetición cada 3 meses
    {
      scheduledDate: new Date('2025-03-05T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 1
    {
      scheduledDate: new Date('2025-03-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 2
    {
      scheduledDate: new Date('2025-03-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-06-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 1 (Ciclo 3 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2025-06-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 2
    {
      scheduledDate: new Date('2025-06-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-09-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 1 (Ciclo 3 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2025-09-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 2
    {
      scheduledDate: new Date('2025-09-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-12-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 1 (Ciclo 3 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2025-12-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 2
    {
      scheduledDate: new Date('2025-12-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2026-03-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 1 (Ciclo 3 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2026-03-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 2
    {
      scheduledDate: new Date('2026-03-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'ABAC' },
      productsCycle: { sequence: 1, programName: 'Programa Acaricida Ciclo 3 Meses' },
    }, // Secuencia 1: ABAC - Semana 3 (ÚLTIMA APLICACIÓN)

    // Programa Insecticida Ciclo 4 Meses - Inicio Abril 2025 - Repetición cada 4 meses
    {
      scheduledDate: new Date('2025-04-05T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 1
    {
      scheduledDate: new Date('2025-04-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 2
    {
      scheduledDate: new Date('2025-04-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-08-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 1 (Ciclo 4 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2025-08-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 2
    {
      scheduledDate: new Date('2025-08-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2025-12-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 1 (Ciclo 4 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2025-12-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 2
    {
      scheduledDate: new Date('2025-12-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 3 (ÚLTIMA APLICACIÓN)

    {
      scheduledDate: new Date('2026-04-12T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 1 (Ciclo 4 meses después, 8 semanas después de la ÚLTIMA aplicación)
    {
      scheduledDate: new Date('2026-04-19T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 2
    {
      scheduledDate: new Date('2026-04-26T07:00:00.000Z'),
      zones: ['Zona_A', 'Zona_B', 'Zona_C', 'Zona_D'],
      status: 'Pendiente',
      agrochemical: { name: 'Curtail' },
      productsCycle: { sequence: 1, programName: 'Programa Insecticida Ciclo 4 Meses' },
    }, // Secuencia 1: Curtail - Semana 3 (ÚLTIMA APLICACIÓN)

    // Tarea Ad hoc
    {
      scheduledDate: new Date('2025-03-08T08:00:00.000Z'),
      zones: ['Zona_A'],
      status: 'Pendiente',
      agrochemical: { name: 'Agua Oxigenada' },
    },
  ],
  irrigationPrograms: [
    {
      name: 'Riego Interdiario Aspersion',
      trigger: 'Interdiario',
      actuator: 'Aspercion',
      startTime: '05:00',
      duration: 20,
      zones: ['Zona_A', 'Zona_B'],
    },
    {
      name: 'Riego Diario Nebulizacion',
      trigger: 'Diario',
      actuator: 'Nebulizacion',
      startTime: '18:00',
      duration: 10,
      zones: ['Zona_A', 'Zona_B'],
    },
    {
      name: 'Riego Diario Humedecer Suelo',
      trigger: 'Diario',
      actuator: 'Humedecer_Suelo',
      startTime: '12:00',
      duration: 10,
      zones: ['Zona_A', 'Zona_B'],
    },
  ],
  irrigationTasks: [
    {
      scheduledDate: new Date('2025-03-03T05:00:00Z'),
      actuator: 'Aspercion',
      duration: 20,
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      program: { name: 'Riego Interdiario Aspersion' },
    },
    {
      scheduledDate: new Date('2025-03-03T18:00:00Z'),
      actuator: 'Nebulizacion',
      duration: 10,
      zones: ['Zona_A', 'Zona_B'],
      status: 'Completada',
      program: { name: 'Riego Diario Nebulizacion' },
    },
    {
      scheduledDate: new Date('2025-03-03T12:00:00Z'),
      actuator: 'Humedecer_Suelo',
      duration: 10,
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
      program: { name: 'Riego Diario Humedecer Suelo' },
    },
    {
      scheduledDate: new Date('2025-03-08T07:00:00Z'),
      actuator: 'Aspercion',
      duration: 15,
      zones: ['Zona_A', 'Zona_B'],
      status: 'Pendiente',
    },
  ],
}
