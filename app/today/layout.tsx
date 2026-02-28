import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-today',
  icons: {
    icon: '/page-icons/today.svg',
    apple: '/page-icons/today.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
