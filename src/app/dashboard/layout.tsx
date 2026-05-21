'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Settings, 
  FileText, 
  Users, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  FolderOpen
} from 'lucide-react'
import ModernModal from '@/components/ModernModal'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<any>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [loading, setLoading] = useState(true)
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!profileData) {
        setProfile({
          id: user.id,
          name: user.user_metadata?.name || 'User',
          role: user.user_metadata?.role || 'arsip'
        })
      } else {
        setProfile(profileData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleConfirmLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const menuItems = [
    {
      title: 'Dasbor',
      icon: <LayoutDashboard size={22} />,
      href: '/dashboard',
      roles: ['admin', 'arsip', 'bendahara', 'direktur'],
    },
    {
      title: 'Kelola Kegiatan',
      icon: <FolderOpen size={22} />,
      href: '/dashboard/kegiatan',
      roles: ['admin', 'bendahara', 'direktur'],
    },
    {
      title: 'Manajemen Kategori',
      icon: <Settings size={22} />,
      href: '/dashboard/category-engine',
      roles: ['admin', 'arsip'],
    },
    {
      title: 'Arsip Dokumen',
      icon: <FileText size={22} />,
      href: '/dashboard/documents',
      roles: ['admin', 'arsip', 'direktur'],
    },
    {
      title: 'Kelola Pengguna',
      icon: <Users size={22} />,
      href: '/dashboard/user-management',
      roles: ['admin'],
    },
  ]

  const filteredMenu = menuItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  )

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="relative h-20 w-20">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      <ModernModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar dari SI-GURINDAM? Anda perlu masuk kembali untuk mengakses data."
        type="confirm"
        confirmText="YA, KELUAR"
        cancelText="BATAL"
      />

      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transition-all duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col`}
      >
        <div className="p-8 border-b border-slate-50">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">SI-GURINDAM</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider leading-relaxed">
              Sistem Informasi Gudang Rekaman Informasi dan Dokumentasi
            </p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
          {filteredMenu.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between group rounded-2xl px-4 py-4 transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary hover:translate-x-1'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-primary'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-sm">{item.title}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </Link>
            )
          })}
        </nav>

        <div className="p-6">
          <div className="rounded-3xl bg-slate-50 p-6 border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150 duration-500"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Signed in as</p>
              <p className="text-sm font-black text-slate-800 truncate mb-1">{profile?.name || 'User'}</p>
              <div className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/10">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[10px] font-black text-primary uppercase">{profile?.role}</span>
              </div>
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-xs font-black text-red-600 shadow-sm hover:bg-red-50 hover:border-red-100 transition-all active:scale-95"
              >
                <LogOut size={16} />
                <span>LOGOUT</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-20 items-center justify-between bg-white px-8 lg:hidden shadow-sm">
          <div className="flex flex-col">
              <span className="text-lg font-black text-slate-800 tracking-tighter">SI-GURINDAM</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-50 text-slate-600 hover:text-primary transition-colors"
          >
            <Menu size={24} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
