import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-youtube',
  icons: {
    icon: '/page-icons/youtube.svg',
    apple: '/page-icons/youtube.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
