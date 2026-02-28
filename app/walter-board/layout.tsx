import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-walter',
  icons: {
    icon: '/page-icons/walter-board.svg',
    apple: '/page-icons/walter-board.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
