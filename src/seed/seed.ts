type GenusType = 'Cattleya' | 'Dendrobium' | 'Dimerandra' | 'Enciclea'
type PlantType = 'Orchid' | 'Adenium' | 'Cactus' | 'Succulent'
type ZoneType = 'Zona_A' | 'Zona_B' | 'Zona_C' | 'Zona_D'
type TableType = 'Mesa_1' | 'Mesa_2' | 'Mesa_3' | 'Mesa_4' | 'Mesa_5' | 'Mesa_6'

interface SeedSpecies {
  name: string
  genus: GenusType
  type: PlantType
  price: number
  slug: string
  stock: {
    quantity: number
    available: boolean
  }
  speciesImage: string[]
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
interface SeedData {
  species: SeedSpecies[]
  plants: SeedPlant[]
}

export const initialData: SeedData = {
  species: [
    {
      name: 'Cattleya Violacea',
      genus: 'Cattleya',
      type: 'Orchid',
      price: 25.99,
      slug: 'cattleya-violacea',
      stock: { quantity: 5, available: true },
      speciesImage: [
        'cattleya-violacea-1.jpg',
        'cattleya-violacea-2.jpg',
        'cattleya-violacea-3.jpg',
      ],
    },
    {
      name: 'Cattlianthe Mary Elizabeth Bohn',
      genus: 'Cattleya',
      type: 'Orchid',
      price: 20,
      slug: 'cattlianthe-mary-elizabeth-bohn',
      stock: { quantity: 4, available: true },
      speciesImage: [
        'cattlianthe-mary-elizabeth-bohn-1.jpg',
        'cattlianthe-mary-elizabeth-bohn-2.jpg',
      ],
    },
    {
      name: 'Cattleya Caudebec x Cattleya Bactia',
      genus: 'Cattleya',
      type: 'Orchid',
      price: 30,
      slug: 'cattleya-caudebec-x-cattleya-bactia',
      stock: { quantity: 1, available: false },
      speciesImage: ['cattleya-caudebec-x-cattleya-bactia-1.jpg'],
    },
    {
      name: 'Cattleya Lueddemanniana x Cattleya Gaskelliana',
      genus: 'Cattleya',
      type: 'Orchid',
      price: 30,
      slug: 'cattleya-lueddemanniana-x-cattleya-gaskelliana',
      stock: { quantity: 4, available: true },
      speciesImage: ['cattleya-lueddemanniana-x-cattleya-gaskelliana-1.jpg'],
    },
    {
      name: "Rhyncholaeliocattleya George King 'Southern Cross'",
      genus: 'Cattleya',
      type: 'Orchid',
      price: 30,
      slug: 'rhyncholaeliocattleya-george-king',
      stock: { quantity: 6, available: true },
      speciesImage: ['rhyncholaeliocattleya-george-king-1', 'rhyncholaeliocattleya-george-king-2'],
    },
    {
      name: "Rhyncholaeliocattleya Memoria 'Anna Balmores'",
      genus: 'Cattleya',
      type: 'Orchid',
      price: 30,
      slug: 'rhyncholaeliocattleya-memoria-anna-balmores',
      stock: { quantity: 6, available: true },
      speciesImage: ['rhyncholaeliocattleya-memoria-anna-balmores-1.jpg'],
    },
    {
      name: 'Cattleya Supersonic',
      genus: 'Cattleya',
      type: 'Orchid',
      price: 30,
      slug: 'cattleya-supersonic',
      stock: { quantity: 1, available: false },
      speciesImage: ['cattleya-supersonic-1.jpg'],
    },
    {
      name: 'Dendrobium Striata',
      genus: 'Dendrobium',
      type: 'Orchid',
      price: 20,
      slug: 'dendrobium_striata',
      stock: { quantity: 3, available: true },
      speciesImage: ['dendrobium-striata-1.jpg'],
    },
    {
      name: 'Dendrobium Ocean Blue',
      genus: 'Dendrobium',
      type: 'Orchid',
      price: 25,
      slug: 'dendrobium-ocean-blue',
      stock: { quantity: 8, available: true },
      speciesImage: ['dendrobium-ocean-blue-1.jpg'],
    },
    {
      name: 'Dendrobium Diamond',
      genus: 'Dendrobium',
      type: 'Orchid',
      price: 20,
      slug: 'dendrobium-diamond',
      stock: { quantity: 2, available: false },
      speciesImage: ['dendrobium-diamond-1.jpg'],
    },
    {
      name: 'Dimerandra Stenotepala',
      genus: 'Dimerandra',
      type: 'Orchid',
      price: 20,
      slug: 'dimerandra-stenotepala',
      stock: { quantity: 1, available: false },
      speciesImage: ['dimerandra-stenotepala-1.jpg'],
    },
    {
      name: 'Enciclea Cordijera',
      genus: 'Enciclea',
      type: 'Orchid',
      price: 20,
      slug: 'enciclea-cordijera',
      stock: { quantity: 3, available: true },
      speciesImage: ['enciclea-cordijera-1.jpg'],
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
}
