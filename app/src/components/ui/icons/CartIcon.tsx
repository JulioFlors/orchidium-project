import { SVGProps } from 'react'

interface Props extends SVGProps<SVGSVGElement> {
  fillColor?: string
}

export function CartIcon({ fillColor = 'currentColor', className, ...props }: Props) {
  return (
    <svg
      // 1. Clases por defecto (24px) + clases externas (icon-cart)
      // 2. ViewBox exacto del símbolo original (24x24)
      // 3. Importante: fill="none" en el contenedor para que el path controle el relleno
      className={`${className || ''}`}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        // 4. El dibujo exacto del carrito Tesla
        d="M19.244 5.006 5.98 5.008l-.067-.487A1.755 1.755 0 0 0 4.18 3.008H2.753a.75.75 0 0 0 0 1.5H4.18a.25.25 0 0 1 .247.217l.09.283h-.022l1.234 9L5.91 15.5c.12.86.864 1.51 1.734 1.51h11.609a.75.75 0 0 0 0-1.5H7.643a.25.25 0 0 1-.247-.216l-.179-1.286h11.046a2 2 0 0 0 1.985-1.752l.733-5.26a1.753 1.753 0 0 0-1.737-1.99zm-.484 7.064a.5.5 0 0 1-.497.438H7.037l-.823-6 13.03-.002c.095 0 .156.047.19.087.035.04.073.106.061.196l-.735 5.28zM20 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-11 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"
        // 5. Relleno dinámico (por defecto 'currentColor' para heredar del texto)
        fill={fillColor}
      />
    </svg>
  )
}
