import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-schedule',
  icons: {
    icon: '/page-icons/schedule.svg',
    apple: '/page-icons/schedule.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
