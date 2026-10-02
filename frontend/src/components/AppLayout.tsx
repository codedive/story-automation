import type { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  )
}
