import { ReactNode } from 'react'

interface Props {
  label: string
  htmlFor: string
  children: ReactNode // Etiqueta HTML <input> o <select>
  className?: string
}

export function FormField({ label, htmlFor, children, className }: Props) {
  return (
    <div className={className}>
      <label
        className="-tracking-2 text-label text-[13.5px] leading-5 font-semibold"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
