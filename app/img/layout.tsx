import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-img',
  icons: {
    icon: '/page-icons/img.svg',
    apple: '/page-icons/img.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
