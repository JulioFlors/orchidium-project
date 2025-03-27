import { Ubuntu, Inter } from 'next/font/google'

export const titleFont = Ubuntu({
  subsets: ['latin'],
  weight: ['500', '700'],
  style: ['normal', 'italic'],
})

export const textFont = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})
