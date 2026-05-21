'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, X, FolderOpen, AlertCircle, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ModernModal from '@/components/ModernModal'
import Link from 'next/link'

type Kegiatan = {
  id: string
  nama_kegiatan: string
  deskripsi: string
  created_at: string
}

export default function KegiatanPage() {
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentKegiatan, setCurrentKegiatan] = useState<Partial<Kegiatan>>({
    nama_kegiatan: '',
    deskripsi: '',
  })
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Custom Modal State
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any, onConfirm?: () => void}>({
    isOpen: false, title: '', message: '', type: 'info'
  })

  useEffect(() => {
    fetchProfileAndKegiatan()
  }, [])

  const fetchProfileAndKegiatan = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setUserProfile(profile)

    const { data } = await supabase
      .from('kegiatan')
      .select('*')
      .order('created_at', { ascending: false })

    setKegiatan(data || [])
    setLoading(false)
  }

  const handleSaveKegiatan = async () => {
    if (!currentKegiatan.nama_kegiatan) {
      setAlertConfig({ isOpen: true, title: 'Input Tidak Lengkap', message: 'Nama kegiatan wajib diisi.', type: 'warning' })
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('kegiatan')
      .upsert({
        id: currentKegiatan.id,
        nama_kegiatan: currentKegiatan.nama_kegiatan,
        deskripsi: currentKegiatan.deskripsi,
        created_by: user?.id,
      })

    if (error) {
      setAlertConfig({ isOpen: true, title: 'Gagal Menyimpan', message: error.message, type: 'error' })
      return
    }

    setAlertConfig({ isOpen: true, title: 'Berhasil!', message: 'Data kegiatan telah disimpan.', type: 'success' })
    setIsModalOpen(false)
    fetchProfileAndKegiatan()
    resetForm()
  }

  const handleDelete = (id: string) => {
    setAlertConfig({
      isOpen: true,
      title: 'Hapus Kegiatan?',
      message: 'Semua kategori dan dokumen di bawah kegiatan ini juga akan terhapus secara permanen.',
      type: 'confirm',
      onConfirm: async () => {
        await supabase.from('kegiatan').delete().eq('id', id)
        fetchProfileAndKegiatan()
      }
    })
  }

  const handleEdit = (keg: Kegiatan) => {
    setCurrentKegiatan(keg)
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setCurrentKegiatan({ nama_kegiatan: '', deskripsi: '' })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ModernModal 
        isOpen={alertConfig.isOpen}
        onClose={() => setAlertConfig({...alertConfig, isOpen: false})}
        onConfirm={alertConfig.onConfirm}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kelola Kegiatan</h1>
          <p className="text-slate-500 mt-1 font-medium">Gunakan folder kegiatan untuk mengelompokkan dokumen keuangan.</p>
        </div>
        {userProfile?.role !== 'direktur' && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center space-x-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>TAMBAH KEGIATAN BARU</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {kegiatan.map((keg) => (
          <div key={keg.id} className="group rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FolderOpen size={64} className="text-primary" />
             </div>
             <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/5 text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                  Kegiatan / Proyek
                </span>
                <h3 className="text-xl font-black text-slate-800 leading-tight mb-2">{keg.nama_kegiatan}</h3>
                <p className="text-sm text-slate-400 font-medium line-clamp-2">{keg.deskripsi || 'Tidak ada deskripsi'}</p>
             </div>
             
             <div className="mt-8 space-y-3 relative z-10">
                <Link 
                  href={`/dashboard/kegiatan/${keg.id}`}
                  className="w-full flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3 text-xs font-black text-primary hover:bg-primary/10 transition-all group/btn"
                >
                  <span>BUKA FOLDER</span>
                  <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                </Link>
                
                {userProfile?.role !== 'direktur' && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEdit(keg)}
                      className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs font-black text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                    >
                      <Edit2 size={14} />
                      <span>UBAH</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(keg.id)}
                      className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-3 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
             </div>
          </div>
        ))}

        {kegiatan.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center rounded-[2rem] border-2 border-dashed border-slate-100 bg-white">
            <FolderOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <h3 className="text-lg font-black text-slate-400">Belum Ada Kegiatan</h3>
            <p className="text-slate-300 text-sm mt-1">Mulai dengan menambahkan kegiatan baru untuk mengelola dokumen.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-[2.5rem] bg-white p-10 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentKegiatan.id ? 'Ubah Kegiatan' : 'Kegiatan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kegiatan</label>
                <input 
                  type="text" 
                  className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                  value={currentKegiatan.nama_kegiatan}
                  onChange={(e) => setCurrentKegiatan({...currentKegiatan, nama_kegiatan: e.target.value})}
                  placeholder="Misal: Pelatihan Kepemimpinan 2026"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Kegiatan</label>
                <textarea 
                  className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                  value={currentKegiatan.deskripsi}
                  onChange={(e) => setCurrentKegiatan({...currentKegiatan, deskripsi: e.target.value})}
                  rows={4}
                  placeholder="Penjelasan mengenai kegiatan ini..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-8 border-t border-slate-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-xs font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveKegiatan}
                  className="px-10 py-3 rounded-2xl bg-primary text-xs font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Simpan Kegiatan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
