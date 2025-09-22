
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/library.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}




  const path = require('path')

/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.StockScalarFieldEnum = {
  id: 'id',
  quantity: 'quantity',
  available: 'available'
};

exports.Prisma.GenusScalarFieldEnum = {
  id: 'id',
  name: 'name',
  type: 'type'
};

exports.Prisma.SpeciesScalarFieldEnum = {
  id: 'id',
  name: 'name',
  price: 'price',
  slug: 'slug',
  description: 'description',
  genusId: 'genusId',
  stockId: 'stockId'
};

exports.Prisma.SpeciesImageScalarFieldEnum = {
  id: 'id',
  url: 'url',
  speciesId: 'speciesId'
};

exports.Prisma.LocationScalarFieldEnum = {
  id: 'id',
  zone: 'zone',
  table: 'table'
};

exports.Prisma.PlantScalarFieldEnum = {
  id: 'id',
  pottingDate: 'pottingDate',
  speciesId: 'speciesId',
  locationId: 'locationId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.AgrochemicalScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  porpose: 'porpose',
  preparation: 'preparation'
};

exports.Prisma.FertilizationProgramScalarFieldEnum = {
  id: 'id',
  name: 'name',
  weeklyFrequency: 'weeklyFrequency'
};

exports.Prisma.FertilizationCycleScalarFieldEnum = {
  id: 'id',
  sequence: 'sequence',
  agrochemicalId: 'agrochemicalId',
  programId: 'programId'
};

exports.Prisma.FertilizationTaskScalarFieldEnum = {
  id: 'id',
  scheduledDate: 'scheduledDate',
  executionDate: 'executionDate',
  zones: 'zones',
  note: 'note',
  status: 'status',
  agrochemicalId: 'agrochemicalId',
  productsCycleId: 'productsCycleId'
};

exports.Prisma.PhytosanitaryProgramScalarFieldEnum = {
  id: 'id',
  name: 'name',
  monthlyFrequency: 'monthlyFrequency'
};

exports.Prisma.PhytosanitaryCycleScalarFieldEnum = {
  id: 'id',
  sequence: 'sequence',
  agrochemicalId: 'agrochemicalId',
  programId: 'programId'
};

exports.Prisma.PhytosanitaryTaskScalarFieldEnum = {
  id: 'id',
  scheduledDate: 'scheduledDate',
  executionDate: 'executionDate',
  zones: 'zones',
  note: 'note',
  status: 'status',
  agrochemicalId: 'agrochemicalId',
  productsCycleId: 'productsCycleId'
};

exports.Prisma.IrrigationProgramScalarFieldEnum = {
  id: 'id',
  name: 'name',
  trigger: 'trigger',
  actuator: 'actuator',
  startTime: 'startTime',
  duration: 'duration',
  zones: 'zones'
};

exports.Prisma.IrrigationTaskScalarFieldEnum = {
  id: 'id',
  scheduledDate: 'scheduledDate',
  executionDate: 'executionDate',
  actuator: 'actuator',
  duration: 'duration',
  zones: 'zones',
  status: 'status',
  programId: 'programId'
};

exports.Prisma.SensorReadingScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  zone: 'zone',
  metric: 'metric',
  value: 'value',
  topic: 'topic'
};

exports.Prisma.EventLogScalarFieldEnum = {
  id: 'id',
  timestamp: 'timestamp',
  zone: 'zone',
  eventType: 'eventType',
  value: 'value',
  topic: 'topic'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.Role = exports.$Enums.Role = {
  User: 'User',
  Admin: 'Admin'
};

exports.ZoneType = exports.$Enums.ZoneType = {
  Zona_A: 'Zona_A',
  Zona_B: 'Zona_B',
  Zona_C: 'Zona_C',
  Zona_D: 'Zona_D'
};

exports.TableType = exports.$Enums.TableType = {
  Mesa_1: 'Mesa_1',
  Mesa_2: 'Mesa_2',
  Mesa_3: 'Mesa_3',
  Mesa_4: 'Mesa_4',
  Mesa_5: 'Mesa_5',
  Mesa_6: 'Mesa_6'
};

exports.PlantType = exports.$Enums.PlantType = {
  Adenium_Obesum: 'Adenium_Obesum',
  Bromeliad: 'Bromeliad',
  Cactus: 'Cactus',
  Orchid: 'Orchid',
  Succulent: 'Succulent'
};

exports.PotSize = exports.$Enums.PotSize = {
  Nro_5: 'Nro_5',
  Nro_7: 'Nro_7',
  Nro_10: 'Nro_10',
  Nro_14: 'Nro_14'
};

exports.TaskStatus = exports.$Enums.TaskStatus = {
  Pendiente: 'Pendiente',
  Completada: 'Completada',
  Cancelada: 'Cancelada',
  Reprogramada: 'Reprogramada'
};

exports.AgrochemicalType = exports.$Enums.AgrochemicalType = {
  Fertilizante: 'Fertilizante',
  Fitosanitario: 'Fitosanitario'
};

exports.AgrochemicalPorpose = exports.$Enums.AgrochemicalPorpose = {
  Desarrollo: 'Desarrollo',
  Floracion: 'Floracion',
  Mantenimiento: 'Mantenimiento',
  Acaricida: 'Acaricida',
  Bactericida: 'Bactericida',
  Fungicida: 'Fungicida',
  Insecticida: 'Insecticida'
};

exports.TriggerType = exports.$Enums.TriggerType = {
  Diario: 'Diario',
  Interdiario: 'Interdiario',
  Sensores: 'Sensores'
};

exports.ActuatorType = exports.$Enums.ActuatorType = {
  Aspercion: 'Aspercion',
  Nebulizacion: 'Nebulizacion',
  Humedecer_Suelo: 'Humedecer_Suelo'
};

exports.Metric = exports.$Enums.Metric = {
  Humidity: 'Humidity',
  Light_intensity: 'Light_intensity',
  Pressure: 'Pressure',
  Rain_intensity_percent: 'Rain_intensity_percent',
  Temperature: 'Temperature'
};

exports.EventType = exports.$Enums.EventType = {
  Irrigation_State: 'Irrigation_State',
  Rain_State: 'Rain_State',
  Rain_Duration: 'Rain_Duration',
  Device_Status: 'Device_Status'
};

exports.Prisma.ModelName = {
  Stock: 'Stock',
  Genus: 'Genus',
  Species: 'Species',
  SpeciesImage: 'SpeciesImage',
  Location: 'Location',
  Plant: 'Plant',
  Agrochemical: 'Agrochemical',
  FertilizationProgram: 'FertilizationProgram',
  FertilizationCycle: 'FertilizationCycle',
  FertilizationTask: 'FertilizationTask',
  PhytosanitaryProgram: 'PhytosanitaryProgram',
  PhytosanitaryCycle: 'PhytosanitaryCycle',
  PhytosanitaryTask: 'PhytosanitaryTask',
  IrrigationProgram: 'IrrigationProgram',
  IrrigationTask: 'IrrigationTask',
  SensorReading: 'SensorReading',
  EventLog: 'EventLog'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Dev\\orchidium-project\\prisma\\client",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "C:\\Dev\\orchidium-project\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../.env"
  },
  "relativePath": "..",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": "postgresql://postgres:5432@localhost:5432/orchidium?schema=public"
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"./client\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nenum Role {\n  User\n  Admin\n}\n\nenum ZoneType {\n  Zona_A\n  Zona_B\n  Zona_C\n  Zona_D\n}\n\nenum TableType {\n  Mesa_1\n  Mesa_2\n  Mesa_3\n  Mesa_4\n  Mesa_5\n  Mesa_6\n}\n\nenum PlantType {\n  Adenium_Obesum\n  Bromeliad\n  Cactus\n  Orchid\n  Succulent\n}\n\nenum PotSize {\n  Nro_5\n  Nro_7\n  Nro_10\n  Nro_14\n}\n\nenum TaskStatus {\n  Pendiente\n  Completada\n  Cancelada\n  Reprogramada\n}\n\nenum AgrochemicalType {\n  Fertilizante\n  Fitosanitario\n}\n\nenum AgrochemicalPorpose {\n  //Fertilizantes\n  Desarrollo\n  Floracion\n  Mantenimiento\n  //Fitosanitarios\n  Acaricida\n  Bactericida\n  Fungicida\n  Insecticida\n}\n\nenum TriggerType {\n  Diario\n  Interdiario\n  Sensores\n}\n\nenum ActuatorType {\n  Aspercion\n  Nebulizacion\n  Humedecer_Suelo\n}\n\nenum Metric {\n  Humidity\n  Light_intensity\n  Pressure\n  Rain_intensity_percent\n  Temperature\n}\n\nenum EventType {\n  Irrigation_State\n  Rain_State\n  Rain_Duration\n  Device_Status\n}\n\nmodel Stock {\n  id        String    @id @default(uuid())\n  quantity  Int       @default(0)\n  available Boolean   @default(false)\n  species   Species[]\n}\n\nmodel Genus {\n  id   String    @id @default(uuid())\n  name String    @unique\n  type PlantType\n\n  species Species[]\n}\n\nmodel Species {\n  id    String @id @default(uuid())\n  name  String @unique\n  price Int    @default(0)\n  slug  String @unique\n\n  description String?\n\n  genus   Genus  @relation(fields: [genusId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  genusId String\n\n  stock   Stock  @relation(fields: [stockId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  stockId String\n\n  plants Plant[]\n  images SpeciesImage[]\n  //  variants ProductVariant[]\n\n  @@index([genusId])\n}\n\n// Modelo para las variantes de producto (Stock por tamaño y precio)\n/**\n * model ProductVariant {\n * id        String  @id @default(uuid())\n * size      PotSize // Tamaño de la maceta/presentación\n * price     Int // Precio para este tamaño específico\n * quantity  Int     @default(0) // Cantidad en stock para este tamaño\n * available Boolean @default(false) // Calculado o manejado manualmente\n * species   Species @relation(fields: [speciesId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n * speciesId String\n * createdAt DateTime @default(now())\n * updatedAt DateTime @updatedAt\n * @@unique([speciesId, size]) // No puede haber dos entradas con la misma especie y tamaño\n * @@index([speciesId])\n * }\n */\n\n// Modelo para las Imágenes de Especies\nmodel SpeciesImage {\n  id  String @id @default(uuid())\n  url String @unique\n\n  species   Species @relation(fields: [speciesId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  speciesId String\n\n  @@index([speciesId])\n}\n\n// Modelo para Ubicaciones Físicas\nmodel Location {\n  id    String    @id @default(uuid())\n  zone  ZoneType\n  table TableType\n\n  plants Plant[] // Plantas ubicadas aquí\n}\n\n// Modelo para registrar eventos de floración\n/**\n * model FloweringEvent {\n * id        String    @id @default(uuid())\n * startDate DateTime // Fecha de inicio de la floración\n * endDate   DateTime? // Fecha de fin (null si aún está en floración)\n * plant   Plant  @relation(fields: [plantId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n * plantId String\n * createdAt DateTime @default(now())\n * updatedAt DateTime @updatedAt\n * @@index([plantId])\n * }\n */\n\nmodel Plant {\n  id          String    @id @default(uuid())\n  pottingDate DateTime?\n\n  species   Species @relation(fields: [speciesId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  speciesId String\n\n  location   Location? @relation(fields: [locationId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  locationId String?\n\n  //  FloweringEvent FloweringEvent[]\n\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n\n  @@index([speciesId])\n  @@index([locationId])\n}\n\nmodel Agrochemical {\n  id          String              @id @default(uuid())\n  name        String              @unique\n  description String\n  type        AgrochemicalType\n  porpose     AgrochemicalPorpose\n  preparation String\n\n  fertilizationCycles FertilizationCycle[]\n  fertilizationTasks  FertilizationTask[]\n  phytosanitaryCycles PhytosanitaryCycle[]\n  phytosanitaryTasks  PhytosanitaryTask[]\n}\n\nmodel FertilizationProgram {\n  id              String @id @default(uuid())\n  name            String @unique\n  weeklyFrequency Int\n\n  productsCycle FertilizationCycle[]\n}\n\nmodel FertilizationCycle {\n  id       String @id @default(uuid())\n  sequence Int\n\n  agrochemical   Agrochemical @relation(fields: [agrochemicalId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  agrochemicalId String\n\n  program   FertilizationProgram @relation(fields: [programId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  programId String\n\n  tasks FertilizationTask[]\n}\n\nmodel FertilizationTask {\n  id            String     @id @default(uuid())\n  scheduledDate DateTime\n  executionDate DateTime?\n  zones         ZoneType[]\n  note          String?\n  status        TaskStatus @default(Pendiente)\n\n  agrochemical   Agrochemical @relation(fields: [agrochemicalId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  agrochemicalId String\n\n  productsCycle   FertilizationCycle? @relation(fields: [productsCycleId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  productsCycleId String?\n}\n\nmodel PhytosanitaryProgram {\n  id               String @id @default(uuid())\n  name             String @unique\n  monthlyFrequency Int\n\n  productsCycle PhytosanitaryCycle[]\n}\n\nmodel PhytosanitaryCycle {\n  id       String @id @default(uuid())\n  sequence Int\n\n  agrochemical   Agrochemical @relation(fields: [agrochemicalId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  agrochemicalId String\n\n  program   PhytosanitaryProgram @relation(fields: [programId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  programId String\n\n  tasks PhytosanitaryTask[]\n}\n\nmodel PhytosanitaryTask {\n  id            String     @id @default(uuid())\n  scheduledDate DateTime\n  executionDate DateTime?\n  zones         ZoneType[]\n  note          String?\n  status        TaskStatus @default(Pendiente)\n\n  agrochemical   Agrochemical @relation(fields: [agrochemicalId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  agrochemicalId String\n\n  productsCycle   PhytosanitaryCycle? @relation(fields: [productsCycleId], references: [id])\n  productsCycleId String?\n}\n\nmodel IrrigationProgram {\n  id        String       @id @default(uuid())\n  name      String       @unique\n  trigger   TriggerType  @default(Interdiario)\n  actuator  ActuatorType @default(Aspercion)\n  startTime String       @default(\"05:00\")\n  duration  Int          @default(20)\n  zones     ZoneType[]   @default([Zona_A, Zona_B])\n\n  tasks IrrigationTask[]\n}\n\nmodel IrrigationTask {\n  id            String       @id @default(uuid())\n  scheduledDate DateTime\n  executionDate DateTime?\n  actuator      ActuatorType\n  duration      Int\n  zones         ZoneType[]\n  status        TaskStatus   @default(Pendiente)\n\n  program   IrrigationProgram? @relation(fields: [programId], references: [id], onDelete: Cascade, onUpdate: Cascade)\n  programId String?\n}\n\nmodel SensorReading {\n  id        String   @id @default(uuid())\n  timestamp DateTime @default(now())\n  zone      ZoneType\n  metric    Metric\n  value     Float\n  topic     String\n}\n\nmodel EventLog {\n  id        String    @id @default(uuid())\n  timestamp DateTime  @default(now())\n  zone      ZoneType\n  eventType EventType\n  value     String\n  topic     String\n}\n",
  "inlineSchemaHash": "18d23c5cfe060f662bec9f88ec9e46f9d29e61ab08b5dfdead151263fdcb23e1",
  "copyEngine": true
}

const fs = require('fs')

config.dirname = __dirname
if (!fs.existsSync(path.join(__dirname, 'schema.prisma'))) {
  const alternativePaths = [
    "prisma/client",
    "client",
  ]
  
  const alternativePath = alternativePaths.find((altPath) => {
    return fs.existsSync(path.join(process.cwd(), altPath, 'schema.prisma'))
  }) ?? alternativePaths[0]

  config.dirname = path.join(process.cwd(), alternativePath)
  config.isBundled = true
}

config.runtimeDataModel = JSON.parse("{\"models\":{\"Stock\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"quantity\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"available\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"species\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Species\",\"nativeType\":null,\"relationName\":\"SpeciesToStock\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Genus\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PlantType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"species\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Species\",\"nativeType\":null,\"relationName\":\"GenusToSpecies\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Species\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"price\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"slug\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"genus\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Genus\",\"nativeType\":null,\"relationName\":\"GenusToSpecies\",\"relationFromFields\":[\"genusId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"genusId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stock\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Stock\",\"nativeType\":null,\"relationName\":\"SpeciesToStock\",\"relationFromFields\":[\"stockId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"stockId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"plants\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Plant\",\"nativeType\":null,\"relationName\":\"PlantToSpecies\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"images\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"SpeciesImage\",\"nativeType\":null,\"relationName\":\"SpeciesToSpeciesImage\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SpeciesImage\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"url\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"species\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Species\",\"nativeType\":null,\"relationName\":\"SpeciesToSpeciesImage\",\"relationFromFields\":[\"speciesId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speciesId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Location\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zone\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"table\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"TableType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"plants\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Plant\",\"nativeType\":null,\"relationName\":\"LocationToPlant\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Plant\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pottingDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"species\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Species\",\"nativeType\":null,\"relationName\":\"PlantToSpecies\",\"relationFromFields\":[\"speciesId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"speciesId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"location\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Location\",\"nativeType\":null,\"relationName\":\"LocationToPlant\",\"relationFromFields\":[\"locationId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"locationId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Agrochemical\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AgrochemicalType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"porpose\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"AgrochemicalPorpose\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"preparation\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fertilizationCycles\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationCycle\",\"nativeType\":null,\"relationName\":\"AgrochemicalToFertilizationCycle\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"fertilizationTasks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationTask\",\"nativeType\":null,\"relationName\":\"AgrochemicalToFertilizationTask\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"phytosanitaryCycles\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryCycle\",\"nativeType\":null,\"relationName\":\"AgrochemicalToPhytosanitaryCycle\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"phytosanitaryTasks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryTask\",\"nativeType\":null,\"relationName\":\"AgrochemicalToPhytosanitaryTask\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FertilizationProgram\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"weeklyFrequency\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycle\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationCycle\",\"nativeType\":null,\"relationName\":\"FertilizationCycleToFertilizationProgram\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FertilizationCycle\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sequence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemical\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Agrochemical\",\"nativeType\":null,\"relationName\":\"AgrochemicalToFertilizationCycle\",\"relationFromFields\":[\"agrochemicalId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemicalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"program\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationProgram\",\"nativeType\":null,\"relationName\":\"FertilizationCycleToFertilizationProgram\",\"relationFromFields\":[\"programId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"programId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tasks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationTask\",\"nativeType\":null,\"relationName\":\"FertilizationCycleToFertilizationTask\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FertilizationTask\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executionDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zones\",\"kind\":\"enum\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"TaskStatus\",\"nativeType\":null,\"default\":\"Pendiente\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemical\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Agrochemical\",\"nativeType\":null,\"relationName\":\"AgrochemicalToFertilizationTask\",\"relationFromFields\":[\"agrochemicalId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemicalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycle\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FertilizationCycle\",\"nativeType\":null,\"relationName\":\"FertilizationCycleToFertilizationTask\",\"relationFromFields\":[\"productsCycleId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PhytosanitaryProgram\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"monthlyFrequency\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycle\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryCycle\",\"nativeType\":null,\"relationName\":\"PhytosanitaryCycleToPhytosanitaryProgram\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PhytosanitaryCycle\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sequence\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemical\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Agrochemical\",\"nativeType\":null,\"relationName\":\"AgrochemicalToPhytosanitaryCycle\",\"relationFromFields\":[\"agrochemicalId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemicalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"program\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryProgram\",\"nativeType\":null,\"relationName\":\"PhytosanitaryCycleToPhytosanitaryProgram\",\"relationFromFields\":[\"programId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"programId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tasks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryTask\",\"nativeType\":null,\"relationName\":\"PhytosanitaryCycleToPhytosanitaryTask\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PhytosanitaryTask\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executionDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zones\",\"kind\":\"enum\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"note\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"TaskStatus\",\"nativeType\":null,\"default\":\"Pendiente\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemical\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Agrochemical\",\"nativeType\":null,\"relationName\":\"AgrochemicalToPhytosanitaryTask\",\"relationFromFields\":[\"agrochemicalId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"agrochemicalId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycle\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PhytosanitaryCycle\",\"nativeType\":null,\"relationName\":\"PhytosanitaryCycleToPhytosanitaryTask\",\"relationFromFields\":[\"productsCycleId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"productsCycleId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"IrrigationProgram\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"trigger\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"TriggerType\",\"nativeType\":null,\"default\":\"Interdiario\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actuator\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ActuatorType\",\"nativeType\":null,\"default\":\"Aspercion\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startTime\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":\"05:00\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":20,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zones\",\"kind\":\"enum\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ZoneType\",\"nativeType\":null,\"default\":[\"Zona_A\",\"Zona_B\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"tasks\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"IrrigationTask\",\"nativeType\":null,\"relationName\":\"IrrigationProgramToIrrigationTask\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"IrrigationTask\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"scheduledDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"executionDate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"actuator\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ActuatorType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zones\",\"kind\":\"enum\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"TaskStatus\",\"nativeType\":null,\"default\":\"Pendiente\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"program\",\"kind\":\"object\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"IrrigationProgram\",\"nativeType\":null,\"relationName\":\"IrrigationProgramToIrrigationTask\",\"relationFromFields\":[\"programId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"relationOnUpdate\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"programId\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SensorReading\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zone\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"metric\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Metric\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"value\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"topic\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"EventLog\":{\"dbName\":null,\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"uuid\",\"args\":[4]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"zone\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ZoneType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"eventType\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"EventType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"value\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"topic\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"Role\":{\"values\":[{\"name\":\"User\",\"dbName\":null},{\"name\":\"Admin\",\"dbName\":null}],\"dbName\":null},\"ZoneType\":{\"values\":[{\"name\":\"Zona_A\",\"dbName\":null},{\"name\":\"Zona_B\",\"dbName\":null},{\"name\":\"Zona_C\",\"dbName\":null},{\"name\":\"Zona_D\",\"dbName\":null}],\"dbName\":null},\"TableType\":{\"values\":[{\"name\":\"Mesa_1\",\"dbName\":null},{\"name\":\"Mesa_2\",\"dbName\":null},{\"name\":\"Mesa_3\",\"dbName\":null},{\"name\":\"Mesa_4\",\"dbName\":null},{\"name\":\"Mesa_5\",\"dbName\":null},{\"name\":\"Mesa_6\",\"dbName\":null}],\"dbName\":null},\"PlantType\":{\"values\":[{\"name\":\"Adenium_Obesum\",\"dbName\":null},{\"name\":\"Bromeliad\",\"dbName\":null},{\"name\":\"Cactus\",\"dbName\":null},{\"name\":\"Orchid\",\"dbName\":null},{\"name\":\"Succulent\",\"dbName\":null}],\"dbName\":null},\"PotSize\":{\"values\":[{\"name\":\"Nro_5\",\"dbName\":null},{\"name\":\"Nro_7\",\"dbName\":null},{\"name\":\"Nro_10\",\"dbName\":null},{\"name\":\"Nro_14\",\"dbName\":null}],\"dbName\":null},\"TaskStatus\":{\"values\":[{\"name\":\"Pendiente\",\"dbName\":null},{\"name\":\"Completada\",\"dbName\":null},{\"name\":\"Cancelada\",\"dbName\":null},{\"name\":\"Reprogramada\",\"dbName\":null}],\"dbName\":null},\"AgrochemicalType\":{\"values\":[{\"name\":\"Fertilizante\",\"dbName\":null},{\"name\":\"Fitosanitario\",\"dbName\":null}],\"dbName\":null},\"AgrochemicalPorpose\":{\"values\":[{\"name\":\"Desarrollo\",\"dbName\":null},{\"name\":\"Floracion\",\"dbName\":null},{\"name\":\"Mantenimiento\",\"dbName\":null},{\"name\":\"Acaricida\",\"dbName\":null},{\"name\":\"Bactericida\",\"dbName\":null},{\"name\":\"Fungicida\",\"dbName\":null},{\"name\":\"Insecticida\",\"dbName\":null}],\"dbName\":null},\"TriggerType\":{\"values\":[{\"name\":\"Diario\",\"dbName\":null},{\"name\":\"Interdiario\",\"dbName\":null},{\"name\":\"Sensores\",\"dbName\":null}],\"dbName\":null},\"ActuatorType\":{\"values\":[{\"name\":\"Aspercion\",\"dbName\":null},{\"name\":\"Nebulizacion\",\"dbName\":null},{\"name\":\"Humedecer_Suelo\",\"dbName\":null}],\"dbName\":null},\"Metric\":{\"values\":[{\"name\":\"Humidity\",\"dbName\":null},{\"name\":\"Light_intensity\",\"dbName\":null},{\"name\":\"Pressure\",\"dbName\":null},{\"name\":\"Rain_intensity_percent\",\"dbName\":null},{\"name\":\"Temperature\",\"dbName\":null}],\"dbName\":null},\"EventType\":{\"values\":[{\"name\":\"Irrigation_State\",\"dbName\":null},{\"name\":\"Rain_State\",\"dbName\":null},{\"name\":\"Rain_Duration\",\"dbName\":null},{\"name\":\"Device_Status\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined
config.compilerWasm = undefined


const { warnEnvConflicts } = require('./runtime/library.js')

warnEnvConflicts({
    rootEnvPath: config.relativeEnvPaths.rootEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.rootEnvPath),
    schemaEnvPath: config.relativeEnvPaths.schemaEnvPath && path.resolve(config.dirname, config.relativeEnvPaths.schemaEnvPath)
})

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

// file annotations for bundling tools to include these files
path.join(__dirname, "query_engine-windows.dll.node");
path.join(process.cwd(), "prisma/client/query_engine-windows.dll.node")
// file annotations for bundling tools to include these files
path.join(__dirname, "schema.prisma");
path.join(process.cwd(), "prisma/client/schema.prisma")
