import { forwardRef } from 'react'
import clsx from 'clsx'
import { FieldError } from 'react-hook-form'

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: FieldError
  icon?: React.ReactNode
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="group mb-5 w-full">
        <label className="text-secondary mb-1 ml-1 block text-xs font-bold tracking-wider uppercase">
          {label}
        </label>

        <div className="relative flex items-center">
          {icon && (
            <div className="text-secondary/60 group-focus-within:text-action pointer-events-none absolute left-3 z-10 transition-colors">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={clsx(
              // Usamos tu clase .form-input definida en globals.css
              'form-input mt-0 transition-all duration-300',
              icon ? 'pl-10' : '',
              error ? 'ring-2 ring-red-500 focus:outline-none' : '',
              className,
            )}
            {...props}
          />
        </div>

        {error && (
          <span className="fade-in mt-1 ml-1 block text-[11px] font-medium text-red-500">
            {error.message}
          </span>
        )}
      </div>
    )
  },
)

AuthInput.displayName = 'AuthInput'
