import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-favorite',
  icons: {
    icon: '/page-icons/favorites.svg',
    apple: '/page-icons/favorites.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
