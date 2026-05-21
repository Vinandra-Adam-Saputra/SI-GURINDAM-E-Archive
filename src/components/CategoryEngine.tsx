'use client'


import { useEffect, useState } from 'react'
import { Plus, Trash2, Edit2, X, AlertCircle, Settings } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import ModernModal from '@/components/ModernModal'

type Category = {
  id: string
  name: string
  description: string
  scope: string
  kegiatan_id?: string
}

type Field = {
  id?: string
  name: string
  type: 'text' | 'number' | 'date' | 'file'
  is_required: boolean
}

interface CategoryEngineProps {
  kegiatanId?: string
  scope?: string
}

export default function CategoryEngine({ kegiatanId, scope }: CategoryEngineProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    scope: scope || 'arsip',
    kegiatan_id: kegiatanId
  })
  const [fields, setFields] = useState<Field[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Custom Modal State
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any, onConfirm?: () => void}>({
    isOpen: false, title: '', message: '', type: 'info'
  })

  useEffect(() => {
    fetchProfileAndCategories()
  }, [kegiatanId, scope])

  const fetchProfileAndCategories = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    
    setUserProfile(profile)

    let query = supabase.from('categories').select('*')
    
    if (kegiatanId) {
      query = query.eq('kegiatan_id', kegiatanId)
    } else if (scope) {
      query = query.eq('scope', scope).is('kegiatan_id', null)
    } else if (profile.role !== 'admin') {
      query = query.eq('scope', profile.role).is('kegiatan_id', null)
    } else {
      query = query.is('kegiatan_id', null)
    }

    const { data } = await query
    setCategories(data || [])
    setLoading(false)
  }

  const handleSaveCategory = async () => {
    if (!currentCategory.name) {
      setAlertConfig({ isOpen: true, title: 'Input Tidak Lengkap', message: 'Nama kategori wajib diisi.', type: 'warning' })
      return
    }

    const { data: categoryData, error: catError } = await supabase
      .from('categories')
      .upsert({
        id: currentCategory.id,
        name: currentCategory.name,
        description: currentCategory.description,
        scope: currentCategory.scope,
        kegiatan_id: kegiatanId || null
      })
      .select()
      .single()

    if (catError) {
      setAlertConfig({ isOpen: true, title: 'Gagal Menyimpan', message: catError.message, type: 'error' })
      return
    }

    if (currentCategory.id) {
      await supabase.from('fields').delete().eq('category_id', currentCategory.id)
    }

    const fieldsToInsert = fields.map(f => ({
      category_id: categoryData.id,
      name: f.name,
      type: f.type,
      is_required: f.is_required,
    }))

    if (fieldsToInsert.length > 0) {
      await supabase.from('fields').insert(fieldsToInsert)
    }

    setAlertConfig({ isOpen: true, title: 'Berhasil!', message: 'Data kategori dan kolom telah disimpan.', type: 'success' })
    setIsModalOpen(false)
    fetchProfileAndCategories()
    resetForm()
  }

  const handleDelete = (id: string) => {
    setAlertConfig({
      isOpen: true,
      title: 'Hapus Kategori?',
      message: 'Semua dokumen di bawah kategori ini juga akan terhapus secara permanen.',
      type: 'confirm',
      onConfirm: async () => {
        await supabase.from('categories').delete().eq('id', id)
        fetchProfileAndCategories()
      }
    })
  }

  const handleEdit = async (cat: Category) => {
    setCurrentCategory(cat)
    const { data } = await supabase.from('fields').select('*').eq('category_id', cat.id)
    setFields(data || [])
    setIsModalOpen(true)
  }

  const resetForm = () => {
    setCurrentCategory({ 
      name: '', 
      description: '', 
      scope: scope || (userProfile?.role === 'admin' ? 'arsip' : userProfile?.role),
      kegiatan_id: kegiatanId
    })
    setFields([])
  }

  return (
    <div className="space-y-8">
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
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Kategori</h2>
          <p className="text-slate-500 mt-1 font-medium text-sm">Struktur data untuk {kegiatanId ? 'kegiatan ini' : 'arsip umum'}.</p>
        </div>
        {userProfile?.role !== 'direktur' && (
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center space-x-2 rounded-2xl bg-primary px-6 py-4 text-xs font-black text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>TAMBAH KATEGORI</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div key={cat.id} className="group rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Settings size={64} className="text-primary" />
             </div>
             <div className="relative z-10">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/5 text-[10px] font-black text-primary uppercase tracking-widest mb-4">
                  {cat.scope}
                </span>
                <h3 className="text-xl font-black text-slate-800 leading-tight mb-2">{cat.name}</h3>
                <p className="text-sm text-slate-400 font-medium line-clamp-2">{cat.description || 'Tidak ada deskripsi'}</p>
             </div>
             <div className="mt-8 flex items-center space-x-2 relative z-10">
                <button 
                  onClick={() => handleEdit(cat)}
                  className="flex-1 flex items-center justify-center space-x-2 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs font-black text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                >
                  <Edit2 size={14} />
                  <span>UBAH</span>
                </button>
                {userProfile?.role !== 'direktur' && (
                  <button 
                    onClick={() => handleDelete(cat.id)}
                    className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-3 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
             </div>
          </div>
        ))}
        {categories.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center rounded-[2rem] border-2 border-dashed border-slate-100">
             <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
             <p className="text-xs font-black text-slate-300 uppercase tracking-widest">Belum Ada Kategori</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentCategory.id ? 'Ubah Kategori' : 'Kategori Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Kategori</label>
                  <input 
                    type="text" 
                    className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                    placeholder="Misal: Kwitansi"
                  />
                </div>
                {!kegiatanId && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lingkup (Scope)</label>
                    <select 
                      className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                      value={currentCategory.scope}
                      onChange={(e) => setCurrentCategory({...currentCategory, scope: e.target.value})}
                      disabled={userProfile?.role !== 'admin'}
                    >
                      <option value="arsip">Arsip (Persuratan)</option>
                      <option value="bendahara">Bendahara (Keuangan)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Singkat</label>
                <textarea 
                  className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                  value={currentCategory.description}
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                  rows={2}
                  placeholder="Penjelasan singkat mengenai kategori ini..."
                />
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Definisi Kolom Data</h3>
                  <button 
                    onClick={() => setFields([...fields, { name: '', type: 'text', is_required: false }])}
                    className="flex items-center space-x-2 text-[10px] font-black text-primary hover:text-primary/80 transition-colors bg-primary/5 px-4 py-2 rounded-xl"
                  >
                    <Plus size={14} />
                    <span>TAMBAH KOLOM</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-2">
                  {fields.map((field, index) => (
                    <div key={index} className="flex items-end space-x-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 group">
                      <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                        <input 
                          type="text" 
                          className="block w-full bg-white border-2 border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-primary transition-all"
                          value={field.name}
                          onChange={(e) => {
                            const n = [...fields]; n[index].name = e.target.value; setFields(n);
                          }}
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipe</label>
                        <select 
                          className="block w-full bg-white border-2 border-slate-100 rounded-xl py-2 px-3 text-xs font-bold text-slate-900 outline-none focus:border-primary transition-all"
                          value={field.type}
                          onChange={(e) => {
                            const n = [...fields]; n[index].type = e.target.value as any; setFields(n);
                          }}
                        >
                          <option value="text">Teks</option>
                          <option value="number">Angka</option>
                          <option value="date">Tanggal</option>
                        </select>
                      </div>
                      <div className="flex items-center h-10 px-2 space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded-lg text-primary focus:ring-primary h-4 w-4 border-slate-300"
                          checked={field.is_required}
                          onChange={(e) => {
                            const n = [...fields]; n[index].is_required = e.target.checked; setFields(n);
                          }}
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Wajib</span>
                      </div>
                      <button 
                        onClick={() => { const n = [...fields]; n.splice(index,1); setFields(n); }}
                        className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-8">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-xs font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveCategory}
                  className="px-10 py-3 rounded-2xl bg-primary text-xs font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest"
                >
                  Simpan Kategori
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
