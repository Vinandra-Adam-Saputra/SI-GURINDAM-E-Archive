'use client'

import { useEffect, useState, use } from 'react'
import { supabase } from '@/lib/supabase'
import { FolderOpen, Settings, FileText, ChevronLeft, Calendar, Info } from 'lucide-react'
import Link from 'next/link'
import CategoryEngine from '@/components/CategoryEngine'
import DocumentEntry from '@/components/DocumentEntry'

type Kegiatan = {
  id: string
  nama_kegiatan: string
  deskripsi: string
  created_at: string
}

export default function KegiatanDetailPage({ params }: { params: Promise<{ kegiatanId: string }> }) {
  const { kegiatanId } = use(params)
  const [kegiatan, setKegiatan] = useState<Kegiatan | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'documents' | 'categories'>('documents')

  useEffect(() => {
    fetchKegiatan()
  }, [kegiatanId])

  const fetchKegiatan = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('kegiatan')
      .select('*')
      .eq('id', kegiatanId)
      .single()
    
    setKegiatan(data)
    setLoading(false)
  }

  if (loading) return null

  if (!kegiatan) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-black text-slate-800">Kegiatan Tidak Ditemukan</h2>
        <Link href="/dashboard/kegiatan" className="mt-4 text-primary font-bold hover:underline">
          Kembali ke Daftar Kegiatan
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <Link 
            href="/dashboard/kegiatan" 
            className="inline-flex items-center space-x-2 text-xs font-black text-slate-400 hover:text-primary transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={14} />
            <span>KEMBALI KE DAFTAR</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <FolderOpen size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{kegiatan.nama_kegiatan}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Calendar size={14} />
                  <span className="text-xs font-bold">{new Date(kegiatan.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="h-1 w-1 bg-slate-200 rounded-full"></div>
                <div className="flex items-center space-x-1.5 text-slate-400">
                  <Info size={14} />
                  <span className="text-xs font-bold">Folder Kegiatan</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description Card */}
      {kegiatan.deskripsi && (
        <div className="rounded-[2rem] bg-white p-8 border border-slate-100 shadow-sm">
           <p className="text-slate-500 font-medium leading-relaxed italic">"{kegiatan.deskripsi}"</p>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-[1.5rem] w-fit">
        <button 
          onClick={() => setActiveTab('documents')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${
            activeTab === 'documents' 
              ? 'bg-white text-primary shadow-md' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} />
          <span>ARSIP DOKUMEN</span>
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black transition-all ${
            activeTab === 'categories' 
              ? 'bg-white text-primary shadow-md' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={16} />
          <span>MANAJEMEN KATEGORI</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        {activeTab === 'documents' ? (
          <DocumentEntry kegiatanId={kegiatanId} />
        ) : (
          <CategoryEngine kegiatanId={kegiatanId} scope="bendahara" />
        )}
      </div>
    </div>
  )
}
