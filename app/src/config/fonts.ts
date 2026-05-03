import Ubuntu from 'next/font/local'
import Inter from 'next/font/local'

export const titleFont = Ubuntu({
  src: [
    {
      path: '../../public/fonts/ubuntu/Ubuntu-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ubuntu/Ubuntu-Medium.woff',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ubuntu/Ubuntu-Bold.woff',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/ubuntu/Ubuntu-BoldItalic.woff',
      weight: '700',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-ubuntu',
})

export const textFont = Inter({
  src: [
    {
      path: '../../public/fonts/inter/Inter-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../public/fonts/inter/Inter-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
})
