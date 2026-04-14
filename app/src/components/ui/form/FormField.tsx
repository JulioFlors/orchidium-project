import clsx from 'clsx'
import { ReactNode } from 'react'

interface Props {
  label: string
  htmlFor: string
  children: ReactNode // Etiqueta HTML <input> o <select>
  className?: string
}

export function FormField({ label, htmlFor, children, className }: Props) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label
        className="text-secondary w-fit cursor-pointer text-sm leading-5 font-semibold tracking-wide"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
