import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-post',
  icons: {
    icon: '/page-icons/posting.svg',
    apple: '/page-icons/posting.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
