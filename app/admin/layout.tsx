import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-admin',
  icons: {
    icon: '/page-icons/admin.svg',
    apple: '/page-icons/admin.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
