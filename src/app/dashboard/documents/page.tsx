'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Search, FileDown, Trash2, X, Upload, Edit2, AlertCircle, FileText } from 'lucide-react'
import ModernModal from '@/components/ModernModal'

type Category = {
  id: string
  name: string
  scope: string
}

type Field = {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'file'
  is_required: boolean
}

type Document = {
  id: string
  category_id: string
  data: any
  file_url: string
  created_at: string
  profiles: { name: string }
}

export default function DocumentsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [fields, setFields] = useState<Field[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({})
  const [file, setFile] = useState<File | null>(null)
  const [existingFileUrl, setExistingFileUrl] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Custom Modal State
  const [alertConfig, setAlertConfig] = useState<{isOpen: boolean, title: string, message: string, type: any, onConfirm?: () => void}>({
    isOpen: false, title: '', message: '', type: 'info'
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      fetchFieldsAndDocuments(selectedCategoryId)
    } else {
      setDocuments([])
      setFields([])
    }
  }, [selectedCategoryId])

  const fetchInitialData = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setUserProfile(profile)

    let query = supabase.from('categories').select('id, name, scope')
    if (profile.role !== 'admin' && profile.role !== 'direktur') {
      query = query.eq('scope', profile.role)
    }
    const { data: catData } = await query
    setCategories(catData || [])
    if (catData && catData.length > 0) {
      setSelectedCategoryId(catData[0].id)
    }
    setLoading(false)
  }

  const fetchFieldsAndDocuments = async (catId: string) => {
    setLoading(true)
    const { data: fieldData } = await supabase.from('fields').select('*').eq('category_id', catId)
    setFields(fieldData || [])

    const { data: docData } = await supabase
      .from('documents')
      .select('*, profiles(name)')
      .eq('category_id', catId)
      .order('created_at', { ascending: false })
    
    setDocuments(docData || [])
    setLoading(false)
  }

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value })
  }

  const handleOpenAddModal = () => {
    setCurrentDocumentId(null)
    setFormData({})
    setFile(null)
    setExistingFileUrl(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (doc: Document) => {
    setCurrentDocumentId(doc.id)
    setFormData(doc.data)
    setFile(null)
    setExistingFileUrl(doc.file_url)
    setIsModalOpen(true)
  }

  const handleSaveDocument = async () => {
    // Basic validation
    for (const field of fields) {
      if (field.is_required && !formData[field.name]) {
        setAlertConfig({ isOpen: true, title: 'Input Tidak Lengkap', message: `Kolom "${field.name}" wajib diisi.`, type: 'warning' })
        return
      }
    }

    setLoading(true)
    let fileUrl = existingFileUrl || ''

    if (file) {
      const fileName = `${Date.now()}_${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file)
      
      if (uploadError) {
        setAlertConfig({ isOpen: true, title: 'Gagal Mengunggah', message: uploadError.message, type: 'error' })
        setLoading(false)
        return
      }
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
      fileUrl = publicUrl
    }

    const payload = {
      category_id: selectedCategoryId,
      data: formData,
      file_url: fileUrl,
    }

    let error
    if (currentDocumentId) {
      // Update existing document
      const { error: updateError } = await supabase
        .from('documents')
        .update(payload)
        .eq('id', currentDocumentId)
      error = updateError
    } else {
      // Insert new document
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          ...payload,
          created_by: userProfile.id,
        })
      error = insertError
    }

    if (error) {
      setAlertConfig({ isOpen: true, title: 'Gagal Menyimpan', message: error.message, type: 'error' })
    } else {
      setAlertConfig({ isOpen: true, title: 'Berhasil!', message: 'Data dokumen telah disimpan.', type: 'success' })
      setIsModalOpen(false)
      setFormData({})
      setFile(null)
      setCurrentDocumentId(null)
      fetchFieldsAndDocuments(selectedCategoryId)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    setAlertConfig({
      isOpen: true,
      title: 'Hapus Dokumen?',
      message: 'Dokumen ini akan dihapus secara permanen dari sistem.',
      type: 'confirm',
      onConfirm: async () => {
        await supabase.from('documents').delete().eq('id', id)
        fetchFieldsAndDocuments(selectedCategoryId)
      }
    })
  }

  const handleExport = () => {
    if (documents.length === 0) return

    const headers = [...fields.map(f => f.name), 'Penginput', 'Tanggal Input', 'Tautan Berkas']
    const csvRows = documents.map(doc => {
      const row = fields.map(f => doc.data[f.name] || '')
      row.push(doc.profiles?.name || '')
      row.push(new Date(doc.created_at).toLocaleDateString('id-ID'))
      row.push(doc.file_url || '')
      return row.join(',')
    })

    const csvContent = [headers.join(','), ...csvRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_${categories.find(c => c.id === selectedCategoryId)?.name}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredDocuments = documents.filter(doc => {
    const searchStr = (JSON.stringify(doc.data) + (doc.profiles?.name || '')).toLowerCase()
    return searchStr.includes(searchQuery.toLowerCase())
  })

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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Arsip Dokumen</h1>
          <div className="mt-4 flex items-center space-x-3 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kategori:</span>
            <select 
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-black text-primary focus:ring-0 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name} ({cat.scope})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center justify-center space-x-2 rounded-2xl border-2 border-slate-100 bg-white px-6 py-4 text-xs font-black text-slate-600 hover:bg-slate-50 transition-all active:scale-95 uppercase tracking-widest shadow-sm"
          >
            <FileDown size={18} />
            <span>Unduh Laporan</span>
          </button>
          {userProfile?.role !== 'direktur' && (
            <button 
              onClick={handleOpenAddModal}
              className="flex items-center justify-center space-x-2 rounded-2xl bg-primary px-6 py-4 text-xs font-black text-white shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest"
            >
              <Plus size={18} />
              <span>Input Dokumen</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
          <Search className="h-5 w-5 text-slate-300 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="text"
          className="block w-full rounded-[1.5rem] border-2 border-slate-100 bg-white py-4 pl-14 pr-6 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all shadow-sm"
          placeholder="Cari data dokumen atau penginput..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                {fields.map(f => (
                  <th key={f.id} className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{f.name}</th>
                ))}
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Penginput</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Berkas</th>
                {userProfile?.role !== 'direktur' && (
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                  {fields.map(f => (
                    <td key={f.id} className="px-8 py-5 text-sm font-bold text-slate-600">{doc.data[f.name] || '-'}</td>
                  ))}
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary uppercase">
                        {doc.profiles?.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-slate-600">{doc.profiles?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-slate-400">
                    {new Date(doc.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-8 py-5">
                    {doc.file_url ? (
                      <a href={doc.file_url} target="_blank" className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[10px] font-black text-blue-600 hover:bg-blue-100 transition-colors uppercase tracking-tight">
                         <FileText size={12} />
                         <span>LIHAT BERKAS</span>
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 italic">Tidak Ada</span>
                    )}
                  </td>
                  {userProfile?.role !== 'direktur' && (
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenEditModal(doc)} 
                          className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-blue-600 hover:bg-blue-50 hover:border-blue-100 transition-all"
                          title="Ubah Dokumen"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc.id)} 
                          className="flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-red-500 hover:bg-red-50 hover:border-red-100 transition-all"
                          title="Hapus Dokumen"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                       <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 mb-4">
                          <AlertCircle size={32} className="text-slate-200" />
                       </div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Tidak ada dokumen ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Input/Edit Dokumen */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-[2.5rem] bg-white p-10 shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {currentDocumentId ? 'Ubah Dokumen' : 'Input Dokumen Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kategori Dokumen:</span>
                <span className="text-lg font-black text-primary">{categories.find(c => c.id === selectedCategoryId)?.name}</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      {field.name} {field.is_required && <span className="text-red-500">*</span>}
                    </label>
                    <input 
                      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                      className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 px-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-primary outline-none transition-all"
                      placeholder={`Masukkan ${field.name}`}
                      value={formData[field.name] || ''}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3 text-center">Unggah Berkas Scan (Opsional)</label>
                <div className="flex flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-slate-200 p-10 hover:border-primary/50 transition-colors bg-slate-50 group">
                  <Upload className="h-12 w-12 text-slate-300 group-hover:text-primary transition-colors mb-4" />
                  <div className="flex text-sm text-slate-600 justify-center">
                    <label className="relative cursor-pointer rounded-md font-black text-primary hover:text-primary/80 transition-colors">
                      <span>Pilih Berkas</span>
                      <input type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <p className="pl-1 font-bold">atau seret ke sini</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">PDF, PNG, JPG (Maks. 10MB)</p>
                  
                  {/* Status Berkas */}
                  {file ? (
                    <div className="mt-6 flex items-center space-x-3 rounded-2xl bg-primary/5 px-5 py-3 border border-primary/10">
                      <span className="text-xs font-black text-primary truncate max-w-[200px]">{file.name}</span>
                      <button 
                        type="button"
                        onClick={() => setFile(null)}
                        className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm transition-colors"
                      >
                        <X size={14} className="stroke-[3px]" />
                      </button>
                    </div>
                  ) : existingFileUrl ? (
                    <div className="mt-6 flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-3 rounded-2xl bg-slate-100 px-5 py-3 border border-slate-200">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Berkas Terunggah</span>
                        <button 
                          type="button"
                          onClick={() => setExistingFileUrl(null)}
                          className="text-red-500 hover:text-red-700 p-1 bg-white rounded-full shadow-sm transition-colors"
                        >
                          <X size={14} className="stroke-[3px]" />
                        </button>
                      </div>
                      <a href={existingFileUrl} target="_blank" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Lihat Berkas Saat Ini</a>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-8 border-t border-slate-100 mt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-3 rounded-2xl border-2 border-slate-100 text-xs font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                  disabled={loading}
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveDocument}
                  disabled={loading}
                  className="px-10 py-3 rounded-2xl bg-primary text-xs font-black text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 uppercase tracking-widest disabled:opacity-50"
                >
                  {loading ? 'MENYIMPAN...' : (currentDocumentId ? 'SIMPAN PERUBAHAN' : 'SIMPAN DATA')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
