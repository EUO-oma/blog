import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-word',
  icons: {
    icon: '/page-icons/word.svg',
    apple: '/page-icons/word.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
