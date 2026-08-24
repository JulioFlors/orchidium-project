import clsx from 'clsx'
import { ReactNode } from 'react'

export interface FormFieldProps {
  label: string
  htmlFor: string
  children: ReactNode // Etiqueta HTML <input> o <select>
  error?: string
  required?: boolean
  className?: string
}

export function FormField({ label, htmlFor, children, error, className }: FormFieldProps) {
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label
        className="text-secondary w-fit cursor-pointer text-sm leading-5 font-semibold tracking-wide"
        htmlFor={htmlFor}
      >
        {label}
      </label>
      {children}
      {error && (
        <span
          className="fade-in mt-1 text-[11px] font-medium tracking-wide text-red-800/75 dark:text-red-400/75"
          role="alert"
        >
          {error}
        </span>
      )}
    </div>
  )
}
