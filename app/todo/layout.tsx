import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'euo-todo',
  icons: {
    icon: '/page-icons/todo.svg',
    apple: '/page-icons/todo.svg',
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
