interface Props {
  title: string
  className?: string
}

export function Title({ title, className }: Props) {
  return (
    <h1
      aria-labelledby="category-heading"
      className={`text-primary mt-9 text-2xl leading-10.5 font-bold tracking-tighter antialiased ${className} `}
      id={`${title}__category-heading`}
    >
      {title}
    </h1>
  )
}
