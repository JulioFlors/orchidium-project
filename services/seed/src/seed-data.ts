// ---- Enums ----
type RoleType = 'USER' | 'ADMIN'

type ZoneType = 'ZONA_A' | 'ZONA_B' | 'ZONA_C' | 'ZONA_D'
type TableType = 'MESA_1' | 'MESA_2' | 'MESA_3' | 'MESA_4' | 'MESA_5' | 'MESA_6'
type PlantType = 'ORCHID' | 'ADENIUM_OBESUM' | 'CACTUS' | 'SUCCULENT' | 'BROMELIAD'
type PotSize = 'NRO_5' | 'NRO_7' | 'NRO_10' | 'NRO_14'
type TaskPurpose = 'IRRIGATION' | 'FERTIGATION' | 'FUMIGATION' | 'HUMIDIFICATION' | 'SOIL_WETTING'

type AgrochemicalType = 'FERTILIZANTE' | 'FITOSANITARIO'
type AgrochemicalPurpose =
  | 'DESARROLLO'
  | 'FLORACION'
  | 'MANTENIMIENTO'
  | 'ACARICIDA'
  | 'BACTERICIDA'
  | 'FUNGICIDA'
  | 'INSECTICIDA'

// ---- Interfaces ----
interface SeedUser {
  name: string
  email: string
  password: string
  role: RoleType
}

interface SeedGenus {
  name: string
  type: PlantType
}

interface SeedVariant {
  size: PotSize
  price: number
  quantity: number
  available: boolean
}

interface SeedSpecies {
  name: string
  slug: string
  genus: { name: string }
  description?: string
  images: string[]
  variants: SeedVariant[]
}

interface SeedPlant {
  pottingDate?: Date
  currentSize: PotSize
  species: { name: string }
  location?: {
    zone: ZoneType
    table: TableType
  }
}

interface SeedAgrochemical {
  name: string
  description: string
  type: AgrochemicalType
  purpose: AgrochemicalPurpose
  preparation: string
}

// ---- Rutinas de RIEGO ----
export interface SeedFertilizationCycle {
  sequence: number
  agrochemical: { name: string }
}

interface SeedFertilizationProgram {
  name: string
  weeklyFrequency: number
  productsCycle: SeedFertilizationCycle[]
}

export interface SeedPhytosanitaryCycle {
  sequence: number
  agrochemical: { name: string }
}

interface SeedPhytosanitaryProgram {
  name: string
  monthlyFrequency: number
  productsCycle: SeedPhytosanitaryCycle[]
}

// ---- Automatización de las Rutinas ----
interface SeedAutomationSchedule {
  name: string
  description?: string
  purpose: TaskPurpose
  cronTrigger: string
  durationMinutes: number
  zones: ZoneType[]
  isEnabled: boolean
  // Opcionales para vincular
  fertilizationProgramName?: string
  phytosanitaryProgramName?: string
}

// ---- Estructura del SeedData ----
interface SeedData {
  users: SeedUser[]
  genus: SeedGenus[]
  species: SeedSpecies[]
  plants: SeedPlant[]
  agrochemicals: SeedAgrochemical[]
  fertilizationPrograms: SeedFertilizationProgram[]
  phytosanitaryPrograms: SeedPhytosanitaryProgram[]
  automationSchedules: SeedAutomationSchedule[]
}

export const initialData: SeedData = {
  users: [
    {
      email: 'noesjulio@gmail.com',
      name: 'Julio Flores',
      password: process.env.ADMIN_PASSWORD || '12345678',
      role: 'ADMIN'
    }
  ],
  genus: [
    { name: 'Cattleya', type: 'ORCHID' },
    { name: 'Dendrobium', type: 'ORCHID' },
    { name: 'Dimerandra', type: 'ORCHID' },
    { name: 'Enciclea', type: 'ORCHID' },
    { name: 'Single Petals', type: 'ADENIUM_OBESUM' },
    { name: 'Multiple Petals', type: 'ADENIUM_OBESUM' },
    { name: 'Euphorbia', type: 'CACTUS' },
    { name: 'Mammillaria', type: 'CACTUS' },
    { name: 'Rebutia', type: 'CACTUS' },
    { name: 'Crassula', type: 'SUCCULENT' },
    { name: 'Graptopetalum', type: 'SUCCULENT' },
    { name: 'Graptoveria', type: 'SUCCULENT' },
    { name: 'Haworthiopsis', type: 'SUCCULENT' },
    { name: 'Orostachys', type: 'SUCCULENT' },
    { name: 'Pachyveria', type: 'SUCCULENT' },
    { name: 'Senecio', type: 'SUCCULENT' },
    { name: 'Cryptanthus', type: 'BROMELIAD' },
    { name: 'Dyckia', type: 'BROMELIAD' },
  ],
  species: [
    /* Bromeliad */
    /* {
      name: 'Dyckia brevifolia',
      genus: { name: 'Dyckia' },
      slug: 'dyckia-brevifolia',
      images: [
        'bromeliads/dyckia-brevifolia_0_2000.webp',
        'bromeliads/dyckia-brevifolia_1_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 20, available: true },
        { size: 'NRO_7', price: 4, quantity: 15, available: true },
        { size: 'NRO_10', price: 6, quantity: 10, available: true },
      ]
    }, */
    /* Orchid - Cattleya ($35 NRO_10, $45 NRO_14) */
    {
      name: 'Cattleya Violacea',
      genus: { name: 'Cattleya' },
      slug: 'cattleya-violacea',
      images: [
        'orchids/cattleya-violacea_0_2000.webp',
        'orchids/cattleya-violacea_1_2000.webp',
        'orchids/cattleya-violacea_2_2000.webp',
      ],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 5, available: true },
        { size: 'NRO_14', price: 45, quantity: 2, available: true },
      ]
    },
    {
      name: 'Cattlianthe Mary Elizabeth Bohn',
      genus: { name: 'Cattleya' },
      slug: 'cattlianthe-mary-elizabeth-bohn',
      images: [
        'orchids/cattlianthe-mary-elizabeth-bohn_0_2000.webp',
        'orchids/cattlianthe-mary-elizabeth-bohn_1_2000.webp',
      ],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 4, available: true },
        { size: 'NRO_14', price: 45, quantity: 0, available: false }, // Agotado
      ]
    },
    {
      name: 'Cattleya Caudebec x Cattleya Bactia',
      genus: { name: 'Cattleya' },
      slug: 'cattleya-caudebec-x-cattleya-bactia',
      images: ['orchids/cattleya-caudebec-x-cattleya-bactia_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 1, available: true },
        { size: 'NRO_14', price: 45, quantity: 0, available: false },
      ]
    },
    {
      name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana',
      genus: { name: 'Cattleya' },
      slug: 'cattleya-lueddemanniana-x-cattleya-gaskelliana',
      images: ['orchids/cattleya-lueddemanniana-x-cattleya-gaskelliana_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 4, available: true },
        { size: 'NRO_14', price: 45, quantity: 3, available: true },
      ]
    },
    {
      name: "Rhyncholaeliocattleya George King 'Southern Cross'",
      genus: { name: 'Cattleya' },
      slug: 'rhyncholaeliocattleya-george-king',
      images: [
        'orchids/rhyncholaeliocattleya-george-king_0_2000.webp',
        'orchids/rhyncholaeliocattleya-george-king_1_2000.webp',
      ],
      description:
        "Esta Rhyncholaeliocattleya George King 'Southern Cross' es un híbrido clásico muy apreciado por sus grandes y vistosas flores de color salmón a rosa melocotón. Presenta un labio amplio y distintivo con flecos (fruncido), a menudo con tonos amarillentos en la garganta. Las flores son dulcemente perfumadas y suelen aparecer una o dos veces al año. Es una planta de crecimiento vigoroso, ideal para añadir un toque de color y fragancia.",
      variants: [
        { size: 'NRO_10', price: 35, quantity: 6, available: true },
        { size: 'NRO_14', price: 45, quantity: 4, available: true },
      ]
    },
    {
      name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'",
      genus: { name: 'Cattleya' },
      slug: 'rhyncholaeliocattleya-memoria-anna-balmores',
      images: ['orchids/rhyncholaeliocattleya-memoria-anna-balmores_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 6, available: true },
        { size: 'NRO_14', price: 45, quantity: 2, available: true },
      ]
    },
    {
      name: 'Cattleya Supersonic',
      genus: { name: 'Cattleya' },
      slug: 'cattleya-supersonic',
      images: ['orchids/cattleya-supersonic_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 35, quantity: 1, available: true },
        { size: 'NRO_14', price: 45, quantity: 0, available: false },
      ]
    },
    /* Orchid - Dendrobium ($30 NRO_10, $40 NRO_14) */
    {
      name: 'Dendrobium Striata',
      genus: { name: 'Dendrobium' },
      slug: 'dendrobium-striata',
      images: ['orchids/dendrobium-striata_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 30, quantity: 3, available: true },
        { size: 'NRO_14', price: 40, quantity: 1, available: true },
      ]
    },
    {
      name: 'Dendrobium Ocean Blue',
      genus: { name: 'Dendrobium' },
      slug: 'dendrobium-ocean-blue',
      images: ['orchids/dendrobium-ocean-blue_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 30, quantity: 8, available: true },
        { size: 'NRO_14', price: 40, quantity: 5, available: true },
      ]
    },
    {
      name: 'Dendrobium Diamond',
      genus: { name: 'Dendrobium' },
      slug: 'dendrobium-diamond',
      images: ['orchids/dendrobium-diamond_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 30, quantity: 2, available: true },
        { size: 'NRO_14', price: 40, quantity: 0, available: false },
      ]
    },
    /* Orchid - Others ($25 NRO_10, $35 NRO_14) */
    {
      name: 'Dimerandra Stenotepala',
      genus: { name: 'Dimerandra' },
      slug: 'dimerandra-stenotepala',
      images: ['orchids/dimerandra-stenotepala_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 25, quantity: 1, available: true },
        { size: 'NRO_14', price: 35, quantity: 0, available: false },
      ]
    },
    {
      name: 'Enciclea Cordijera',
      genus: { name: 'Enciclea' },
      slug: 'enciclea-cordijera',
      images: ['orchids/enciclea-cordijera_0_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 25, quantity: 3, available: true },
        { size: 'NRO_14', price: 35, quantity: 1, available: true },
      ]
    },
    /* Adenium_Obesum ($25 NRO_10, $35 NRO_14) */
    {
      name: 'Adenium Obesum Genoa GNA',
      genus: { name: 'Multiple Petals' },
      slug: 'adenium-obesum-genoa-gna',
      images: [
        'adenium_obesum/genoa-gna_0_2000.webp',
        'adenium_obesum/genoa-gna_1_2000.webp',
        'adenium_obesum/genoa-gna_2_2000.webp',
      ],
      variants: [
        { size: 'NRO_10', price: 25, quantity: 1, available: true },
        { size: 'NRO_14', price: 35, quantity: 5, available: true },
      ]
    },
    {
      name: 'Adenium Obesum Marbella',
      genus: { name: 'Multiple Petals' },
      slug: 'adenium-obesum-marbella',
      images: ['adenium_obesum/marbella_0_2000.webp', 'adenium_obesum/marbella_1_2000.webp'],
      variants: [
        { size: 'NRO_10', price: 25, quantity: 1, available: true },
        { size: 'NRO_14', price: 35, quantity: 0, available: false },
      ]
    },
    /* Cactus & Succulents ($2 NRO_5, $4 NRO_7, $6 NRO_10) */
    {
      name: 'Euphorbia ritchiei',
      genus: { name: 'Euphorbia' },
      slug: 'euphorbia-ritchiei',
      images: ['cactus/euphorbia-ritchiei_0_2000.webp', 'cactus/euphorbia-ritchiei_1_2000.webp'],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 9, available: true },
        { size: 'NRO_7', price: 4, quantity: 5, available: true },
        { size: 'NRO_10', price: 6, quantity: 2, available: true },
      ]
    },
    {
      name: 'Mammillaria prolifera ssp. haitiensis',
      genus: { name: 'Mammillaria' },
      slug: 'mammillaria-prolifera-ssp-haitiensis',
      images: [
        'cactus/mammillaria-prolifera-ssp-haitiensis_0_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_1_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_2_2000.webp',
        'cactus/mammillaria-prolifera-ssp-haitiensis_3_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 3, available: true },
        { size: 'NRO_7', price: 4, quantity: 0, available: false },
        { size: 'NRO_10', price: 6, quantity: 1, available: true },
      ]
    },
    {
      name: 'Mammillaria vetula ssp. gracilis',
      genus: { name: 'Mammillaria' },
      slug: 'mammillaria-vetula-ssp-gracilis',
      images: [
        'cactus/mammillaria-vetula-ssp-gracilis_0_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_1_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_2_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis_3_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 3, available: true },
        { size: 'NRO_7', price: 4, quantity: 2, available: true },
      ]
    },
    {
      name: 'Mammillaria vetula ssp. gracilis cv. roi baudoin yonneux',
      genus: { name: 'Mammillaria' },
      slug: 'mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux',
      images: [
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_0_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_1_2000.webp',
        'cactus/mammillaria-vetula-ssp-gracilis-cv-roi-baudoin-yonneux_2_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 2, available: true },
        { size: 'NRO_7', price: 4, quantity: 1, available: true },
      ]
    },
    {
      name: 'Rebutia heliosa ssp. teresae',
      genus: { name: 'Rebutia' },
      slug: 'rebutia-heliosa-teresae',
      images: [
        'cactus/rebutia-heliosa-ssp-teresae_0_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_1_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_2_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_3_2000.webp',
        'cactus/rebutia-heliosa-ssp-teresae_4_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 4, available: true },
        { size: 'NRO_7', price: 4, quantity: 0, available: false },
      ]
    },
    /* Succulent */
    {
      name: 'Crassula capitella "Campfire"',
      genus: { name: 'Crassula' },
      slug: 'crassula-capitella-campfire',
      images: [
        'succulents/crassula-capitella-campfire_0_2000.webp',
        'succulents/crassula-capitella-campfire_1_2000.webp',
        'succulents/crassula-capitella-campfire_2_2000.webp',
        'succulents/crassula-capitella-campfire_3_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 1, available: true },
        { size: 'NRO_7', price: 4, quantity: 5, available: true },
      ]
    },
    {
      name: 'Crassula ovata "Gollum"',
      genus: { name: 'Crassula' },
      slug: 'crassula-ovata-gollum',
      images: ['succulents/crassula-ovata-gollum_0_2000.webp'],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 0, available: false },
        { size: 'NRO_7', price: 4, quantity: 2, available: true },
      ]
    },
    {
      name: 'Graptopetalum paraguayense',
      genus: { name: 'Graptopetalum' },
      slug: 'graptopetalum-paraguayense',
      images: [
        'succulents/graptopetalum-paraguayense_0_2000.webp',
        'succulents/graptopetalum-paraguayense_1_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 3, available: true },
        { size: 'NRO_7', price: 4, quantity: 1, available: true },
      ]
    },
    {
      name: 'Graptoveria fénix',
      genus: { name: 'Graptoveria' },
      slug: 'graptoveria-fenix',
      images: [
        'succulents/graptoveria-fenix_0_2000.webp',
        'succulents/graptoveria-fenix_1_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 2, available: true },
        { size: 'NRO_7', price: 4, quantity: 0, available: false },
      ]
    },
    {
      name: 'Haworthiopsis attenuata "Zebrina"',
      genus: { name: 'Haworthiopsis' },
      slug: 'haworthiopsis-attenuata-zebrina',
      images: ['succulents/haworthiopsis-attenuata-zebrina_0_2000.webp'],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 0, available: false }, // Agotado totalmente
      ]
    },
    {
      name: 'Orostachys boehmeri "Keiko"',
      genus: { name: 'Orostachys' },
      slug: 'orostachys-boehmeri-keiko',
      images: [
        'succulents/orostachys-boehmeri-keiko_0_2000.webp',
        'succulents/orostachys-boehmeri-keiko_1_2000.webp',
        'succulents/orostachys-boehmeri-keiko_2_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 10, available: true },
        { size: 'NRO_7', price: 4, quantity: 5, available: true },
      ]
    },
    {
      name: 'Senecio rowleyanus "Rosario"',
      genus: { name: 'Senecio' },
      slug: 'senecio-rowleyanus-rosario',
      images: ['succulents/senecio-rowleyanus-rosario_0_2000.webp'],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 0, available: false },
      ]
    },
    {
      name: 'Pachyveria "Scheideckeri"',
      genus: { name: 'Pachyveria' },
      slug: 'pachyveria-scheideckeri',
      images: [
        'succulents/pachyveria-scheideckeri_0_2000.webp',
        'succulents/pachyveria-scheideckeri_1_2000.webp',
        'succulents/pachyveria-scheideckeri_2_2000.webp',
        'succulents/pachyveria-scheideckeri_3_2000.webp',
      ],
      variants: [
        { size: 'NRO_5', price: 2, quantity: 4, available: true },
        { size: 'NRO_7', price: 4, quantity: 2, available: true },
        { size: 'NRO_10', price: 6, quantity: 1, available: true },
      ]
    },
  ],
  plants: [
    {
      species: { name: 'Cattleya Violacea' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-15'),
      location: { zone: 'ZONA_A', table: 'MESA_1' },
    },
    {
      species: { name: 'Cattleya Violacea' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-20'),
      location: { zone: 'ZONA_A', table: 'MESA_1' },
    },
    {
      species: { name: 'Cattlianthe Mary Elizabeth Bohn' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2023-12-20'),
      location: { zone: 'ZONA_A', table: 'MESA_1' },
    },
    {
      species: { name: 'Cattlianthe Mary Elizabeth Bohn' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-03-01'),
      location: { zone: 'ZONA_A', table: 'MESA_2' },
    },
    {
      species: { name: 'Cattleya Caudebec x Cattleya Bactia' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-01'),
      location: { zone: 'ZONA_A', table: 'MESA_2' },
    },
    {
      species: { name: 'Cattleya Caudebec x Cattleya Bactia' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-10'),
      location: { zone: 'ZONA_A', table: 'MESA_2' },
    },
    {
      species: { name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-25'),
      location: { zone: 'ZONA_A', table: 'MESA_3' },
    },
    {
      species: { name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-05'),
      location: { zone: 'ZONA_A', table: 'MESA_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya George King 'Southern Cross'" },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-15'),
      location: { zone: 'ZONA_A', table: 'MESA_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya George King 'Southern Cross'" },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-30'),
      location: { zone: 'ZONA_A', table: 'MESA_4' },
    },
    {
      species: { name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'" },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-15'),
      location: { zone: 'ZONA_A', table: 'MESA_3' },
    },
    {
      species: { name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'" },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-30'),
      location: { zone: 'ZONA_A', table: 'MESA_4' },
    },
    {
      species: { name: 'Cattleya Supersonic' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-28'),
      location: { zone: 'ZONA_A', table: 'MESA_4' },
    },
    {
      species: { name: 'Cattleya Supersonic' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-03-10'),
      location: { zone: 'ZONA_A', table: 'MESA_4' },
    },
    {
      species: { name: 'Dendrobium Striata' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-05'),
      location: { zone: 'ZONA_A', table: 'MESA_5' },
    },
    {
      species: { name: 'Dendrobium Striata' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-12'),
      location: { zone: 'ZONA_A', table: 'MESA_5' },
    },
    {
      species: { name: 'Dendrobium Ocean Blue' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2023-12-25'),
      location: { zone: 'ZONA_A', table: 'MESA_5' },
    },
    {
      species: { name: 'Dendrobium Ocean Blue' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-20'),
      location: { zone: 'ZONA_A', table: 'MESA_6' },
    },
    {
      species: { name: 'Dendrobium Diamond' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-08'),
      location: { zone: 'ZONA_A', table: 'MESA_6' },
    },
    {
      species: { name: 'Dendrobium Diamond' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-03-15'),
      location: { zone: 'ZONA_A', table: 'MESA_6' },
    },
    {
      species: { name: 'Dimerandra Stenotepala' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-18'),
      location: { zone: 'ZONA_A', table: 'MESA_1' },
    },
    {
      species: { name: 'Dimerandra Stenotepala' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-02-22'),
      location: { zone: 'ZONA_A', table: 'MESA_2' },
    },
    {
      species: { name: 'Enciclea Cordijera' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-01-28'),
      location: { zone: 'ZONA_A', table: 'MESA_3' },
    },
    {
      species: { name: 'Enciclea Cordijera' },
      currentSize: 'NRO_10',
      pottingDate: new Date('2024-03-05'),
      location: { zone: 'ZONA_A', table: 'MESA_4' },
    },
  ],
  agrochemicals: [
    {
      name: 'Osmocote Plus',
      description:
        'Fertilizante Granular de liberación lenta. Formulacion 15-9-12 + microelementos. Aplicar cada 4 meses.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1/4 cdita por planta',
    },
    {
      name: 'Solucat 25-5-5',
      description:
        'Fertilizante NPK cristalino rico en nitrógeno con microelementos, adecuado como complemento al abonado o para aplicar en las fases de crecimiento vegetativo dónde se consume nitrógeno.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1 gramo por litro de agua',
    },
    {
      name: 'Nitrifort M935',
      description:
        'Promueve el crecimiento y desarrollo de hojas verdes, esencial para la fotosíntesis.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '2 ml/L',
    },
    {
      name: 'Bio-Fert 72',
      description: 'Vigorizante y estimulador de nuevos brotes vegetativos.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1 g/L',
    },
    {
      name: 'Razormin',
      description:
        'Bioestimulante y enraizante. Favorece la absorción de nutrientes. Aplicar cada 21 dias.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1 ml/L',
    },
    {
      name: 'Melaza',
      description:
        'Promueve el desarrollo radicular, optimiza la capacidad de intercambio catiónico del sustrato e Intensifica la actividad microbiológica del sustrato. Aplicar cada semana (se mezcla con otros fertilizantes).',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1 cda/L',
    },
    {
      name: 'Dalgin',
      description:
        'Aporta vitalidad y energía al cultivo, especialmente durante el desarrollo vegetativo, y activa la clorofila y procesos fotosintéticos. Aplicar cada mes.',
      type: 'FERTILIZANTE',
      purpose: 'DESARROLLO',
      preparation: '1 ml/L',
    },
    {
      name: 'Triple 20-20-20',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'FERTILIZANTE',
      purpose: 'MANTENIMIENTO',
      preparation: '1 g/L',
    },
    {
      name: 'Triple 19-19-19',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'FERTILIZANTE',
      purpose: 'MANTENIMIENTO',
      preparation: '1 g/L',
    },
    {
      name: 'Solucat 10-52-10',
      description: 'El fósforo fortalece las raíces, mejora la floración.',
      type: 'FERTILIZANTE',
      purpose: 'FLORACION',
      preparation: '1 g/L',
    },
    {
      name: 'Calcio + Boro',
      description:
        'Aumenta la turgencia de las plantas, el desarrollo de las flores y la calidad de las flores. Aplicar cada semana.',
      type: 'FERTILIZANTE',
      purpose: 'FLORACION',
      preparation: '2 ml/L',
    },
    {
      name: 'Curtail',
      description:
        'Actúa por contacto e ingestión contra un amplio espectro de plagas masticadoras, minadoras y perforadoras, tanto larvas, ninfas y adultos.',
      type: 'FITOSANITARIO',
      purpose: 'INSECTICIDA',
      preparation: '3 ml/L',
    },
    {
      name: 'ABAC',
      description:
        'insecticida por ingestión y por contacto, el insecto queda inmovilizado poco después de ingerir el producto, deja de alimentarse y acaba muriendo, sin destruir la planta.',
      type: 'FITOSANITARIO',
      purpose: 'ACARICIDA',
      preparation: '3 ml/L',
    },
    {
      name: 'Sulphor-NF',
      description:
        'Posee un alto contenido de azufre siendo también un compuesto nitrogenado que favorece el crecimiento y fortalece los cultivos contra condiciones adversas como: stress, plagas y enfermedades por su triple acción (fungicida, acaricida y nutricional).',
      type: 'FITOSANITARIO',
      purpose: 'ACARICIDA',
      preparation: '3 ml/L',
    },
    {
      name: 'Kasumin',
      description:
        'Fungicida – bactericida de origen biológico, con acción sistémico con actividad preventiva y curativa.',
      type: 'FITOSANITARIO',
      purpose: 'FUNGICIDA',
      preparation: '5 ml/L',
    },
    {
      name: 'Vitavax-200F',
      description:
        'Se puede aplicar a la semilla para prevenir las enfermedades provocadas por microorganismos que pueden ser transmitidos en las semillas o encontrarse en el suelo, protegiendo las semillas durante su almacenaje, germinación y a las plántulas en sus primeros días de desarrollo.',
      type: 'FITOSANITARIO',
      purpose: 'FUNGICIDA',
      preparation: '10 ml/L',
    },
    {
      name: 'Mancozeb',
      description:
        'Presenta un amplio espectro antifúngico frente a hongos endoparásitos causantes de enfermedades foliares.',
      type: 'FITOSANITARIO',
      purpose: 'FUNGICIDA',
      preparation: '5 g/L',
    },
    {
      name: 'Bitter 97',
      description: 'De acción sistémica, preventiva y curativa.',
      type: 'FITOSANITARIO',
      purpose: 'FUNGICIDA',
      preparation: '5 ml/L',
    },
    {
      name: 'Agua Oxigenada',
      description: '12h x 7dias.',
      type: 'FITOSANITARIO',
      purpose: 'FUNGICIDA',
      preparation: '50:50',
    },
  ],
  fertilizationPrograms: [
    // ---- BLOQUES MENSUALES (Duración: 4 semanas) ----
    // El usuario elige uno de estos bloques para iniciar un ciclo de 4 semanas.
    {
      name: 'Desarrollo Solucat (Mensual)',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Solucat 25-5-5' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },
    {
      name: 'Desarrollo Nitrifort (Mensual)',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Nitrifort M935' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },
    {
      name: 'Desarrollo Bio-Fert (Mensual)',
      weeklyFrequency: 4,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Bio-Fert 72' } },
        { sequence: 2, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 3, agrochemical: { name: 'Triple 20-20-20' } },
        { sequence: 4, agrochemical: { name: 'Solucat 10-52-10' } },
      ],
    },

    // ---- BLOQUES ADICIONALES / PARALELOS ----
    // Plan Aditivo: Calcio + Boro (Siempre constante)
    {
      name: 'Calcio + Boro Semanal',
      weeklyFrequency: 1,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Calcio + Boro' } },
      ],
    },
    // Plan Estimulante: Razormin (Cada 21 días ~ 3 semanas)
    {
      name: 'Estimulación Radicular (Razormin)',
      weeklyFrequency: 3, // Se aplica cada 3 semanas
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Razormin' } },
      ],
    },
    // Plan Lento: Osmocote (Cada 4 meses ~ 16 semanas)
    {
      name: 'Fertilización Granular (Osmocote)',
      weeklyFrequency: 16,
      productsCycle: [
        { sequence: 1, agrochemical: { name: 'Osmocote Plus' } },
      ],
    },
  ],
  phytosanitaryPrograms: [
    // Control Fungicida (Rotación Anual - Cada 2 meses)
    {
      name: 'Control Fungicida (Rotación Anual)',
      monthlyFrequency: 2,
      productsCycle: [
        // Proyección de un año (6 aplicaciones)
        { sequence: 1, agrochemical: { name: 'Kasumin' } },
        { sequence: 2, agrochemical: { name: 'Sulphor-NF' } },
        { sequence: 3, agrochemical: { name: 'Kasumin' } },
        { sequence: 4, agrochemical: { name: 'Mancozeb' } },
        { sequence: 5, agrochemical: { name: 'Sulphor-NF' } },
        { sequence: 6, agrochemical: { name: 'Bitter 97' } },
      ],
    },
    // Control Acaricida (Cada 3 meses, Terapia de choque 3 semanas)
    {
      name: 'Control Acaricida (ABAC)',
      monthlyFrequency: 3,
      productsCycle: [
        // Ciclo de 3 semanas con el mismo producto
        { sequence: 1, agrochemical: { name: 'ABAC' } },
        { sequence: 2, agrochemical: { name: 'ABAC' } },
        { sequence: 3, agrochemical: { name: 'ABAC' } },
      ],
    },
    // Control Insecticida (Cada 4 meses, Terapia de choque 3 semanas)
    {
      name: 'Control Insecticida (Curtail)',
      monthlyFrequency: 4,
      productsCycle: [
        // Ciclo de 3 semanas con el mismo producto
        { sequence: 1, agrochemical: { name: 'Curtail' } },
        { sequence: 2, agrochemical: { name: 'Curtail' } },
        { sequence: 3, agrochemical: { name: 'Curtail' } },
      ],
    },
  ],
  automationSchedules: [
    // ---- RIEGOS DIARIOS/INTERDIARIOS (Agua) ----
    {
      name: 'Riego Interdiario (6:00)',
      description: 'Riego Interdiario a las 6:00 AM',
      purpose: 'IRRIGATION',
      // Cron: A las 06:00, todos los días. (El service/scheduler decide si toca según intervalo)
      cronTrigger: '0 6 * * *',
      durationMinutes: 20,
      zones: ['ZONA_A'],
      isEnabled: true
    },
    {
      name: 'Nebulización (16:00)',
      description: 'Mantener humedad relativa',
      purpose: 'HUMIDIFICATION',
      // Cron: A las 16:00, todos los días
      cronTrigger: '0 18 * * *',
      durationMinutes: 10,
      zones: ['ZONA_A'],
      isEnabled: true
    },
    {
      name: 'Humidificación del Suelo (11:00)',
      description: 'Mantener humedad relativa',
      purpose: 'SOIL_WETTING',
      // Cron: A las 11:00, todos los días
      cronTrigger: '0 11 * * *',
      durationMinutes: 10,
      zones: ['ZONA_A'],
      isEnabled: true
    },
    {
      name: 'Humidificación del Suelo (15:00)',
      description: 'Mantener humedad relativa',
      purpose: 'SOIL_WETTING',
      // Cron: A las 15:00, todos los días
      cronTrigger: '0 15 * * *',
      durationMinutes: 10,
      zones: ['ZONA_A'],
      isEnabled: true
    },
    // ---- Fertirriego ----
    {
      name: 'Fertirriego Desarrollo Solucat (Lunes)',
      description: 'Aplicación del plan de desarrollo semanal.',
      purpose: 'FERTIGATION',
      // Cron: A las 17:00, cada Lunes
      cronTrigger: '0 17 * * 1',
      durationMinutes: 5,
      zones: ['ZONA_A'],
      isEnabled: true,
      fertilizationProgramName: 'Desarrollo Solucat (Mensual)',
    },
    {
      name: 'Control Fungicida (Viernes)',
      description: 'Aplicación preventiva quincenal/mensual.',
      purpose: 'FUMIGATION',
      // Cron: A las 17:00, cada Viernes
      cronTrigger: '0 17 * * 5',
      durationMinutes: 5,
      zones: ['ZONA_A'],
      isEnabled: true,
      phytosanitaryProgramName: 'Control Fungicida (Rotación Anual)',
    },
  ],
}