import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-people',
  icons: {
    icon: '/page-icons/people.svg',
    apple: '/page-icons/people.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
