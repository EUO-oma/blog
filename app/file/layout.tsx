import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-file',
  icons: {
    icon: '/page-icons/file.svg',
    apple: '/page-icons/file.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
