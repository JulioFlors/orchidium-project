# Configuración de Autenticación (Better-Auth) en Desarrollo

Esta guía detalla los pasos para habilitar el inicio de sesión en entornos locales y evitar errores comunes de redirección.

## 1. Detección Inteligente de URL (baseURL)

La aplicación detecta automáticamente si estás en un entorno de desarrollo. No es necesario modificar `baseURL` manualmente para alternar entre local y producción.

### Lógica de Detección en `app/src/lib/auth.ts`

- Si se detecta `VERCEL === '1'`, se utiliza `BETTER_AUTH_URL` (Producción).
- Si no está en Vercel, se utiliza `localhost:3000` **a menos que** `BETTER_AUTH_URL` contenga una IP local (ej. `192.168.x.x`).

## 2. Errores Comunes

### `error=state_mismatch` / Redirección a Producción

Este error ocurre cuando inicias sesión desde `localhost` pero el sistema redirige a `vercel.app`.

- **Causa**: `BETTER_AUTH_URL` en tu archivo `.env` local apunta a la URL de producción.
- **Solución Automática**: El código actual ahora ignora la URL de producción si detecta que estás corriendo localmente. No obstante, se recomienda mantener `.env` limpio.

## 3. Orígenes de Confianza (Trusted Origins)

Better-Auth bloquea por seguridad cualquier petición que no provenga de un origen conocido. Si accedes a la aplicación mediante una dirección IP (ej. `http://192.168.0.227:3000`), debes registrarla.

### Configuración en `app/src/lib/auth.ts`

```typescript
trustedOrigins: [
  'http://localhost:3000',
  'http://192.168.0.227:3000', // Ejemplo
],
```

## 4. Orígenes de Google (OAuth)

Para que el login con Google funcione, debes añadir los siguientes "Authorized JavaScript Origins" en Google Cloud Console:

- `http://localhost:3000`
- `http://192.168.x.x:3000`

Y las correspondientes URIs de redirección:

- `http://localhost:3000/api/auth/callback/google`

> [!WARNING]
> Si cambias tu IP, recuerda actualizar tanto `trustedOrigins` como la Google Cloud Console.
