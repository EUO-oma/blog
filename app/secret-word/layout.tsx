import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-secret-word',
  icons: {
    icon: '/page-icons/secret-word.svg',
    apple: '/page-icons/secret-word.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
