
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


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

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

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
  zone: 'zone',
  sensorType: 'sensorType',
  value: 'value',
  timestamp: 'timestamp'
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
exports.PlantType = exports.$Enums.PlantType = {
  Adenium_Obesum: 'Adenium_Obesum',
  Bromeliad: 'Bromeliad',
  Cactus: 'Cactus',
  Orchid: 'Orchid',
  Succulent: 'Succulent'
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

exports.AgrochemicalType = exports.$Enums.AgrochemicalType = {
  Fertilizante: 'Fertilizante',
  Fitosanitario: 'Fitosanitario'
};

exports.AgrochemicalPorpose = exports.$Enums.AgrochemicalPorpose = {
  Desarrollo: 'Desarrollo',
  Mantenimiento: 'Mantenimiento',
  Floracion: 'Floracion',
  Fungicida: 'Fungicida',
  Insecticida: 'Insecticida',
  Acaricida: 'Acaricida'
};

exports.TaskStatus = exports.$Enums.TaskStatus = {
  Pendiente: 'Pendiente',
  Completada: 'Completada',
  Cancelada: 'Cancelada',
  Reprogramada: 'Reprogramada'
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

exports.SensorType = exports.$Enums.SensorType = {
  Humedad_Relativa: 'Humedad_Relativa',
  Temperatura: 'Temperatura',
  Intensidad_Luminosa: 'Intensidad_Luminosa'
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
  SensorReading: 'SensorReading'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
