'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FileText, Lock, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setError(loginError.message === 'Invalid login credentials' 
          ? 'Email atau kata sandi tidak terdaftar.' 
          : loginError.message)
        setLoading(false)
        return
      }

      if (data?.session) {
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      setError('Terjadi kesalahan koneksi sistem.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Left Side - Visual Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900 items-center justify-center p-12">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]"></div>
        
        <div className="relative z-10 max-w-lg text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2.5rem] bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl mb-8">
            <FileText size={40} className="text-white" />
          </div>
          <h1 className="text-6xl font-black text-white tracking-tighter mb-6">SI-GURINDAM</h1>
          <p className="text-xl text-slate-400 font-medium leading-relaxed">
            Sistem Informasi Gudang Rekaman Informasi & Dokumentasi.
          </p>
          <div className="mt-12 flex justify-center space-x-4">
             <div className="h-2 w-12 rounded-full bg-primary"></div>
             <div className="h-2 w-2 rounded-full bg-slate-700"></div>
             <div className="h-2 w-2 rounded-full bg-slate-700"></div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16 bg-white">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-4 duration-700">
          <div className="lg:hidden flex flex-col items-center mb-12">
             <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
                <FileText className="text-white" size={28} />
             </div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tighter">SI-GURINDAM</h2>
          </div>

          <div className="mb-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Selamat Datang Kembali</h3>
            <p className="text-slate-500 font-medium">Silakan masuk untuk mengelola arsip digital LPP Gurindam.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Email</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="email@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Kata Sandi</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-bold animate-in shake duration-300">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="relative w-full overflow-hidden group rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10 flex items-center justify-center space-x-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>MASUK SEKARANG</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
             <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">SI-GURINDAM &bull; 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
