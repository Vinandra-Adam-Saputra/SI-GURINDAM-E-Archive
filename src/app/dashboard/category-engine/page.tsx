'use client'

import CategoryEngine from '@/components/CategoryEngine'


export default function CategoryEnginePage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Kategori</h1>
        <p className="text-slate-500 mt-1 font-medium">Atur struktur kategori dan kolom dinamis dokumen umum.</p>
      </div>
      <CategoryEngine />
    </div>
  )
}
