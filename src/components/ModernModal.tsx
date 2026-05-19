'use client'

import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react'

type ModalType = 'info' | 'success' | 'warning' | 'error' | 'confirm'

interface ModernModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
}

export default function ModernModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
}: ModernModalProps) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle2 className="text-emerald-500" size={48} />
      case 'warning': return <AlertTriangle className="text-amber-500" size={48} />
      case 'error': return <AlertCircle className="text-red-500" size={48} />
      case 'confirm': return <AlertTriangle className="text-primary" size={48} />
      default: return <Info className="text-blue-500" size={48} />
    }
  }

  const getButtonClass = () => {
    switch (type) {
      case 'success': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
      case 'error': return 'bg-red-600 hover:bg-red-700 shadow-red-200'
      default: return 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-2xl scale-in-95 animate-in duration-200">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 p-4 rounded-3xl bg-slate-50 border border-slate-100">
            {getIcon()}
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-3">{title}</h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed mb-8">{message}</p>
          
          <div className="flex w-full gap-3">
            {type === 'confirm' || onConfirm ? (
              <>
                <button 
                  onClick={onClose}
                  className="flex-1 rounded-2xl border-2 border-slate-100 px-4 py-3 text-xs font-black text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest"
                >
                  {cancelText}
                </button>
                <button 
                  onClick={() => { onConfirm?.(); onClose(); }}
                  className={`flex-[1.5] rounded-2xl px-4 py-3 text-xs font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest ${getButtonClass()}`}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button 
                onClick={onClose}
                className={`w-full rounded-2xl px-4 py-3 text-xs font-black text-white shadow-lg transition-all active:scale-95 uppercase tracking-widest ${getButtonClass()}`}
              >
                TUTUP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
