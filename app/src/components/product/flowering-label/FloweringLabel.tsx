import clsx from 'clsx'

interface Props {
  className?: string
}

export function FloweringLabel({ className }: Props) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'absolute top-0 right-0 z-5 cursor-default font-bold tracking-wider text-white uppercase select-none',
        'min-h-[25px] w-auto min-w-[50px] rounded-tr-[0.21rem] rounded-bl px-3 py-1.5 text-center text-[9px] leading-tight',
        'sm:min-h-[30px] sm:px-4 sm:py-2 sm:text-[10px]',
        'bg-pink-600 shadow-lg shadow-pink-900/20',
        className,
      )}
    >
      🌸 Floración
    </span>
  )
}
