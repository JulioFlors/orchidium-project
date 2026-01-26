interface Props {
  subtitle: string
  className?: string
}

export function Subtitle({ subtitle, className }: Props) {
  return (
    <h3
      className={`text-primary bg-canvas/30 dark:bg-canvas/60 tds-xs:sticky tds-xs:backdrop-blur-lg top-14 z-9 mt-10 w-full text-xl leading-10.5 font-medium tracking-wider antialiased ${className}`}
    >
      {subtitle}
    </h3>
  )
}
