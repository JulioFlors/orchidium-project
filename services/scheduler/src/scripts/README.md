# BACKFILL: Historial de Datos Ambientales → PostgreSQL

## En el VPS: Ejecutar desde ~/pristinoplant/services/scheduler

Si no especificas la variable BACKFILL_DAYS, el script tiene un valor por defecto de 30 días (puedes verlo en la línea 40 de backfill-history.ts).

Sin la variable: Intentará reconstruir todo el último mes.
Con BACKFILL_DAYS=2: Solo procesará ayer y hoy (mucho más rápido).

```bash
cd ~/pristinoplant/services/scheduler

docker run --rm -it \
  -v "$(pwd)/../../:/app" \
  -w /app/services/scheduler \
  --env-file ../../.env \
  -e INFLUX_URL="https://vps.sisparrow.com:8181" \
  -e INFLUX_TOKEN="apiv3_kcwBrLenNHizPffsCsEy03KmFeYWpvxkopjhQbCuDUBp2nCWw5ZMB7cSnV27D5OGmjsECS5KN4HzO8oNwE7JcQ" \
  -e INFLUX_ORG="PristinoPlant" \
  --network host \
  node:24-alpine \
  sh -c "corepack enable && pnpm install && pnpm --filter=@package/database db:generate && pnpm tsx src/scripts/backfill-history.ts"

```

```bash
docker run --rm -it \
  -v "$(pwd)/../../:/app" \
  -w /app/services/scheduler \
  --env-file ../../.env \
  -e INFLUX_URL="https://vps.sisparrow.com:8181" \
  -e INFLUX_TOKEN="apiv3_kcwBrLenNHizPffsCsEy03KmFeYWpvxkopjhQbCuDUBp2nCWw5ZMB7cSnV27D5OGmjsECS5KN4HzO8oNwE7JcQ" \
  -e INFLUX_ORG="PristinoPlant" \
  --network host \
  node:24-alpine \
  sh -c "corepack enable && pnpm install && pnpm --filter=@package/database db:generate && BACKFILL_DAYS=2 pnpm tsx src/scripts/backfill-history.ts"

```

## En local: Ejecutar desde ~/pristinoplant/services/scheduler/

```bash
cd ./services/scheduler/

$env:BACKFILL_DAYS=60; npx dotenv-cli -e ../../.env -- pnpm tsx src/scripts/backfill-history.ts
```
