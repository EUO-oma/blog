import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TodoList',
  manifest: '/todo.webmanifest',
  icons: {
    icon: '/page-icons/todo.svg',
    apple: '/page-icons/todo.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
