import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-notice',
  icons: {
    icon: '/page-icons/notice.svg',
    apple: '/page-icons/notice.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
