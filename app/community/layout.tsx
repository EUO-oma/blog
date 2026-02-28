import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-community',
  icons: {
    icon: '/page-icons/community.svg',
    apple: '/page-icons/community.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
