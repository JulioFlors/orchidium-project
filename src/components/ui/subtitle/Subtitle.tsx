interface Props {
  subtitle: string
}

export function Subtitle({ subtitle }: Props) {
  return (
    <h2
      className="text-primary tracking-4 sticky top-14 z-[9] mt-10 mb-2 w-full bg-white/30 text-xl leading-10.5 font-medium antialiased backdrop-blur-xl"
      id="category-heading"
    >
      {subtitle}
    </h2>
  )
}
