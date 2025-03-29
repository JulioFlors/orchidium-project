interface Props {
  subtitle: string
}

export function Subtitle({ subtitle }: Props) {
  return (
    <nav aria-labelledby="category-title" className="sticky-category-title w-full">
      <h2
        className="text-primary tracking-4 mt-10 mb-2 text-xl leading-10.5 font-medium antialiased"
        id="category-heading"
      >
        {subtitle}
      </h2>
    </nav>
  )
}
