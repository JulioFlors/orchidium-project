import { SVGProps } from 'react'

interface Props extends SVGProps<SVGSVGElement> {
  fillColor?: string
}

export function SearchIcon({ fillColor, className, ...props }: Props) {
  return (
    <svg
      // Sin tamaño por defecto. Se controlará 100% vía className (ej: icon-search)
      aria-hidden="true"
      className={className}
      fill="none"
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="m20.267 19.207-4.818-4.818A6.97 6.97 0 0 0 17 10a7 7 0 1 0-7 7 6.97 6.97 0 0 0 4.389-1.55l4.818 4.817a.75.75 0 0 0 1.06 0 .75.75 0 0 0 0-1.06M4.5 10c0-3.033 2.467-5.5 5.5-5.5s5.5 2.467 5.5 5.5-2.467 5.5-5.5 5.5-5.5-2.467-5.5-5.5"
        fill={fillColor || 'currentColor'}
      />
    </svg>
  )
}
