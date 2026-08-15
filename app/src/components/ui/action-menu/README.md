# ActionMenu - Estándar de Implementación y Reglas de Capas

El componente `ActionMenu` proporciona un menú contextual compacto de opciones (3 puntos) para tarjetas, tablas y elementos de lista.

## 🎯 Jerarquía de Capas (Z-Index)

Para evitar colisiones visuales entre el contenido de la página y el marco persistente de la aplicación, se establece la siguiente escala estricta:

| Elemento | Clase Z-Index | Justificación |
| :--- | :--- | :--- |
| **Toast** | `z-9999` | Notificaciones globales prioritarias. |
| **Sidebar / Drawer** | `z-30` | Panel lateral sobre el Header y contenido. |
| **Header (Submenú Abierto)** | `z-20` | Desplegable de navegación superior (`NavbarDropdown`). |
| **Backdrop del Header** | `z-15` | Desenfoque oscuro de fondo para el Navbar. |
| **Header (Reposo)** | `z-10` | Barra fija superior persistente. |
| **Subtitle Sticky** | `z-9` | Cabeceras de sección intermedias con sticky. |
| **ActionMenu / Dropdown Local** | `z-5` | Menú desplegado dentro de una tarjeta o fila. |
| **Tarjeta Activa / Interactuada** | `focus-within:z-5` | Se eleva para que su menú no sea tapado por la tarjeta hermana. |
| **Tarjetas en Reposo / Contenido** | `z-0` (`z-auto`) | Nivel base del flujo DOM. |

## ⚠️ Reglas Obligatorias de Implementación

### 1. No Usar `createPortal` para Menús Locales
- Los menús locales de tarjeta deben renderizarse dentro de su propio contenedor con `position: absolute`.
- Montar en `document.body` mediante portales destruye la jerarquía relativa de la tarjeta y posiciona el menú por encima del `Backdrop` (`z-15`) y del `Header` (`z-10`/`z-20`).

### 2. Aislamiento con `isOpen && 'z-5'`
- El contenedor del menú debe tener `relative` y elevar su capa a `z-5` únicamente cuando `isOpen === true`.
- La tarjeta contenedora padre debe tener `focus-within:z-5` (y **NUNCA** `hover:z-2`) para que al mover el cursor hacia las opciones del menú no se active el hover de la tarjeta inferior.

### 3. Aislamiento de Capa GPU para Prevenir Parpadeo de Texto (*Flicker*)
- En Chromium, cuando un menú flotante se dibuja sobre una tarjeta hermana que cambia de color, el motor recalculaba el suavizado de fuentes (*subpixel antialiasing*).
- Todo menú desplegable animado con Framer Motion debe incluir:
  ```tsx
  className="transform-gpu antialiased [backface-visibility:hidden] ..."
  ```
- Las tarjetas contenedoras deben usar `transition-colors duration-200` en lugar de `transition-all` para evitar invalidar la geometría del compositor gráfico.

### 4. Accesibilidad y Navegación por Teclado
- Cerrar con tecla `Escape`.
- Navegación vertical cíclica con `ArrowUp` y `ArrowDown`.
- Cerrar al perder el foco con `Tab`.
- Click exterior mediante listener `mousedown` en `document`.

## 📦 Ejemplo Canónico de Uso

```tsx
import { ActionMenu, ActionMenuItem } from '@/components'
import { IoSettingsOutline, IoCloseOutline } from 'react-icons/io5'

const items: ActionMenuItem[] = [
  {
    label: 'Editar',
    icon: <IoSettingsOutline className="size-4" />,
    onClick: () => handleEdit(item),
  },
  {
    label: 'Eliminar',
    icon: <IoCloseOutline className="size-4" />,
    onClick: () => handleDelete(item.id),
    variant: 'destructive',
  },
]

export function MyCard() {
  return (
    <div className="bg-surface border-input-outline group hover:bg-hover-overlay focus-within:z-5 relative rounded-xl border p-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3>Título de la Tarjeta</h3>
        <ActionMenu items={items} />
      </div>
    </div>
  )
}
```
