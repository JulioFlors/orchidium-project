# Guía de Hidratación de Datos (Data Seeding)

En PristinoPlant, buscamos una **"Zero-Spinner Architecture"** (Arquitectura sin Spinners). Para lograrlo, utilizamos el patrón de **Hidratación**, que permite que los componentes del lado del cliente hereden datos ya obtenidos por el servidor durante el primer renderizado.

## 1. El Problema: El Parpadeo de Carga (FOLS)

Cuando un componente cliente usa un hook como `useSWR` o `authClient.useSession()`, el navegador debe:
1. Montar el componente.
2. Lanzar una petición de red.
3. Esperar la respuesta.
4. Mostrar un "Skeleton" o "Spinner" mientras tanto.

Esto genera una experiencia fragmentada y lenta, incluso si la red es rápida.

## 2. La Solución: Hidratación Server-to-Client

La solución consiste en obtener los datos en el **Server Layout** o **Server Page** y pasarlos al componente cliente como "semilla" inicial.

### Patrón A: `fallbackData` (Local)
Ideal para componentes simples o aislados.

```tsx
// Server Layout/Page
const data = await fetchData();

// Client Component
const { data: clientData } = useSWR(key, fetcher, { 
  fallbackData: data 
});
```

### Patrón B: `SWRConfig` (Global - Recomendado)
Ideal para evitar el "Prop Drilling" (pasar props por muchos niveles). El servidor puebla una caché global de la que todos los hijos pueden beber.

```tsx
// Server Layout
const session = await auth.api.getSession();

return (
  <SWRConfig value={{ fallback: { 'auth-session': session } }}>
    {children}
  </SWRConfig>
);

// Client Component (Profundo en el árbol)
const { data: session } = useSWR('auth-session'); // Datos instantáneos
```

## 3. Mejores Prácticas

1. **Serialización**: Solo pasa datos que sean serializables (JSON). Evita pasar objetos complejos con métodos funcionales.
2. **Llaves Únicas**: Mantén una nomenclatura clara para las llaves de caché (ej: `['/api/tasks/history', limit, offset]`).
3. **Respaldo Reactivo**: Siempre mantén el hook del cliente activo. El servidor da la **velocidad inicial**, pero el cliente mantiene la **reactividad** (ej: si el usuario cierra sesión, el cliente debe reaccionar sin refrescar la página).
4. **Prioridad**: Si el servidor entrega datos, ignora el estado `isLoading` o `isPending` en el primer renderizado.

## 4. Próximos Pasos en el Proyecto

- [ ] Migrar el Historial (`HistoryView`) a hidratación de primera página.
- [ ] Implementar hidratación en el Dashboard de Monitoreo para evitar el flash gris de los sensores.
- [ ] Estandarizar el uso de `SWRConfig` en los layouts principales.
