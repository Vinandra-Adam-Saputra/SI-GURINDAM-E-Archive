'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  FileText, 
  FolderKanban, 
  Users, 
  TrendingUp,
  Files
} from 'lucide-react'

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    documents: 0,
    categories: 0,
    users: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        // Stats based on role
        const isAdmin = profileData?.role === 'admin'
        const role = profileData?.role

        // Fetch counts
        const { count: docCount } = await (isAdmin 
          ? supabase.from('documents').select('*', { count: 'exact', head: true })
          : supabase.from('documents').select('*, categories!inner(*)', { count: 'exact', head: true }).eq('categories.scope', role)
        )

        const { count: catCount } = await (isAdmin
          ? supabase.from('categories').select('*', { count: 'exact', head: true })
          : supabase.from('categories').select('*', { count: 'exact', head: true }).eq('scope', role)
        )

        const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })

        setStats({
          documents: docCount || 0,
          categories: catCount || 0,
          users: userCount || 0,
        })
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) return null

  const isAdmin = profile?.role === 'admin'

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Selamat Datang,<br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                {profile?.name}
              </span>
            </h2>
            <p className="mt-8 text-lg text-slate-400 font-medium leading-relaxed">
               <span className="text-white font-bold">SI-GURINDAM</span> siap membantu pengelolaan arsip dokumen LPP Gurindam hari ini.
            </p>
          </div>
          <div className="hidden lg:block">
             <div className="h-44 w-44 rounded-full border border-white/10 flex items-center justify-center bg-white/5 backdrop-blur-sm shadow-inner">
                <Files size={88} className="text-white/20" />
             </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {/* Documents Stat */}
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 h-40 w-40 -mr-20 -mt-20 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 transition-transform group-hover:scale-110 duration-300">
              <FileText size={32} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Dokumen</p>
            <div className="flex items-baseline space-x-3">
              <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{stats.documents}</h3>
              <span className="text-sm font-bold text-slate-400 uppercase">Arsip</span>
            </div>
          </div>
        </div>

        {/* Categories Stat */}
        <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
          <div className="absolute top-0 right-0 h-40 w-40 -mr-20 -mt-20 rounded-full bg-secondary/5 group-hover:bg-secondary/10 transition-colors"></div>
          <div className="relative z-10">
            <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-8 transition-transform group-hover:scale-110 duration-300">
              <FolderKanban size={32} />
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Kategori Aktif</p>
            <div className="flex items-baseline space-x-3">
              <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{stats.categories}</h3>
              <span className="text-sm font-bold text-slate-400 uppercase">Kategori</span>
            </div>
          </div>
        </div>

        {/* Users Stat (Only for Admin) */}
        {isAdmin ? (
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="absolute top-0 right-0 h-40 w-40 -mr-20 -mt-20 rounded-full bg-slate-900/5 group-hover:bg-slate-900/10 transition-colors"></div>
            <div className="relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-900 mb-8 transition-transform group-hover:scale-110 duration-300">
                <Users size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Pengguna</p>
              <div className="flex items-baseline space-x-3">
                <h3 className="text-6xl font-black text-slate-800 tracking-tighter">{stats.users}</h3>
                <span className="text-sm font-bold text-slate-400 uppercase">Staff</span>
              </div>
            </div>
          </div>
        ) : (
          /* Role Info for Staff instead of Users count */
          <div className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-50 to-white p-10 shadow-sm border border-slate-100">
            <div className="relative z-10 flex flex-col h-full">
              <div className="h-16 w-16 rounded-2xl bg-slate-200/50 flex items-center justify-center text-slate-400 mb-8">
                <TrendingUp size={32} />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Akses Lingkup</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight uppercase">
                {profile?.role === 'arsip' ? 'Persuratan' : 'Keuangan'}
              </h3>
              <div className="mt-auto pt-8">
                <div className="h-1 w-12 bg-primary rounded-full mb-3"></div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-wider">Otoritas Bidang Terkait</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-8 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          SI-GURINDAM &bull; LPP GURINDAM &bull; 2026
        </p>
      </div>
    </div>
  )
}
