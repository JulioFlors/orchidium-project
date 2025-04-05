interface Props {
  subtitle: string
  className?: string
}

export function Subtitle({ subtitle, className }: Props) {
  return (
    <h2
      className={`text-primary tracking-04 sticky top-14 z-[9] mt-10 w-full bg-white/30 text-xl leading-10.5 font-medium antialiased backdrop-blur-lg ${className}`}
      id="category-heading"
    >
      {subtitle}
    </h2>
  )
}
