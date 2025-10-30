import clsx from 'clsx'

interface Props {
  className?: string
  MobileSlideshow?: boolean
  Slideshow?: boolean
}

export function StockLabel({ className, MobileSlideshow = false, Slideshow = false }: Props) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'bg-label absolute z-[5] cursor-default font-bold whitespace-nowrap text-white select-none',
        {
          // Estilos para el componente ProductGridItem
          'top-0 left-0 min-h-[25px] w-auto min-w-[50px] rounded-tl-xs rounded-br-xs px-0.5 py-1.5 text-center text-[9px] leading-tight':
            !MobileSlideshow && !Slideshow,
          'sm:min-h-[30px] sm:min-w-[80px] sm:px-[2px] sm:py-[8px] sm:text-[11px]':
            !MobileSlideshow && !Slideshow,
          'xl:min-h-[35px] xl:min-w-[75px] xl:px-[5px] xl:py-[10px] xl:text-sm':
            !MobileSlideshow && !Slideshow,

          // Estilos para el componente MobileSlideshow
          'top-0 left-0 w-full px-[36px] py-2.5 text-center text-[13px] leading-3.5':
            MobileSlideshow,
          'sm:h-auto sm:w-auto': MobileSlideshow,

          // Estilos para el componente Slideshow
          'top-0 left-0 h-auto w-auto px-9 py-2.5 text-center': Slideshow,
        },
        className,
      )}
    >
      Agotado
    </span>
  )
}
