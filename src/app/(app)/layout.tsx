import Sidebar from '@/components/nav/Sidebar'
import BottomNav from '@/components/nav/BottomNav'
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar className="hidden md:flex" />
      <main className="md:ml-64 pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav className="block md:hidden fixed bottom-0 left-0 right-0" />
      <Toaster position="bottom-center" />
    </div>
  )
}
