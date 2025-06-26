import Image from 'next/image'

interface Props {
  src?: string
  alt: string
  className?: React.StyleHTMLAttributes<HTMLImageElement>['className']
  style?: React.StyleHTMLAttributes<HTMLImageElement>['style']
  width: number
  height: number
}

export function ProductImage({ src, alt, className, style, width, height }: Props) {
  const localSrc = src ? (src.startsWith('http') ? src : `/plants/${src}`) : '/imgs/placeholder.jpg'

  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      src={localSrc}
      style={style}
      width={width}
    />
  )
}
