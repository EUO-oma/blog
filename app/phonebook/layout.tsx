import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-phonebook',
  icons: {
    icon: '/page-icons/phonebook.svg',
    apple: '/page-icons/phonebook.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
