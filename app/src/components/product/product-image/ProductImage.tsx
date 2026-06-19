import Image from 'next/image'

import { getImageUrl } from '@/lib'

interface Props {
  src?: string
  alt: string
  className?: React.StyleHTMLAttributes<HTMLImageElement>['className']
  style?: React.StyleHTMLAttributes<HTMLImageElement>['style']
  width: number
  height: number
}

export function ProductImage({ src, alt, className, style, width, height }: Props) {
  return (
    <Image
      alt={alt}
      className={className}
      height={height}
      src={getImageUrl(src)}
      style={style}
      width={width}
    />
  )
}
