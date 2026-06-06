import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import NotificationBell from '../components/NotificationBell'
import { useAuth } from '../context/authContext'
import Loading from '../components/Loading'

const Layout = () => {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className='flex h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30'>
      <Sidebar />
      <div className='flex flex-col flex-1 overflow-hidden'>
        {/* Top bar with notification bell — desktop only */}
        <header className='hidden lg:flex items-center justify-end px-6 py-3 bg-[#0a0d1a] border-b border-slate-800/60 shrink-0'>
          <NotificationBell />
        </header>
        <main className='flex-1 overflow-y-auto bg-[#0a0d1a]'>
          <div className='p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 max-w-400 mx:-auto'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout