'use client'

import DocumentEntry from '@/components/DocumentEntry'

export default function DocumentsPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Arsip Dokumen</h1>
        <p className="text-slate-500 mt-1 font-medium">Kelola dan telusuri seluruh arsip dokumen yang tersedia.</p>
      </div>
      <DocumentEntry />
    </div>
  )
}
