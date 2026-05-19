'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Shield, X, Edit2, Trash2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Profile = {
  id: string
  name: string
  role: string
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'arsip'
  })

  useEffect(() => {
    fetchUsers()
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentAdminId(user.id)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const result = await res.json()
      if (result.data) {
        setUsers(result.data)
      }
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  const handleOpenAddModal = () => {
    setEditingUser(null)
    setFormData({ email: '', password: '', name: '', role: 'arsip' })
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (user: Profile) => {
    setEditingUser(user)
    setFormData({ email: '', password: '', name: user.name, role: user.role })
    setIsModalOpen(true)
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const method = editingUser ? 'PATCH' : 'POST'
      const body = editingUser 
        ? { id: editingUser.id, name: formData.name, role: formData.role }
        : formData

      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const result = await res.json()
      
      if (result.error) {
        alert('Gagal: ' + result.error)
      } else {
        alert(editingUser ? 'Akun berhasil diperbarui!' : 'Akun berhasil dibuat!')
        setIsModalOpen(false)
        fetchUsers()
      }
    } catch (err) {
      alert('Terjadi kesalahan.')
    }
    setLoading(false)
  }

  const handleDeleteUser = async (id: string) => {
    if (id === currentAdminId) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.')
      return
    }

    if (confirm('Apakah Anda yakin ingin menghapus akun ini secara permanen?')) {
      setLoading(true)
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' })
        const result = await res.json()
        if (result.error) {
          alert('Gagal menghapus: ' + result.error)
        } else {
          fetchUsers()
        }
      } catch (err) {
        alert('Terjadi kesalahan.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Pengguna</h1>
          <p className="text-gray-500 mt-1">Manajemen akses staf dan peran sistem kearsipan.</p>
        </div>
        <button 
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95"
        >
          <UserPlus size={18} />
          <span>Tambah Staff Baru</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-xs font-bold uppercase text-gray-400 border-b">
              <tr>
                <th className="px-6 py-4">Nama Pengguna</th>
                <th className="px-6 py-4">Status & Peran</th>
                <th className="px-6 py-4">Tanggal Daftar</th>
                <th className="px-6 py-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-white ${
                        u.role === 'admin' ? 'bg-red-500' : 'bg-primary'
                      }`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">ID: {u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`inline-flex items-center space-x-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-red-50 text-red-700' : 
                      u.role === 'direktur' ? 'bg-purple-50 text-purple-700' : 
                      'bg-green-50 text-green-700'
                    }`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        u.role === 'admin' ? 'bg-red-700' : 
                        u.role === 'direktur' ? 'bg-purple-700' : 
                        'bg-green-700'
                      }`}></div>
                      <span>{u.role === 'arsip' ? 'Staff Arsip' : u.role}</span>
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-500 font-medium">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenEditModal(u)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ubah Peran"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(u.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          u.id === currentAdminId ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'
                        }`}
                        disabled={u.id === currentAdminId}
                        title="Hapus Pengguna"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-gray-400">
                    <div className="flex flex-col items-center">
                      <Users size={40} className="mb-4 text-gray-200" />
                      <p>Belum ada data pengguna ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl scale-in-95 animate-in duration-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Ubah Data Pengguna' : 'Buat Akun Staff'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              {!editingUser && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Alamat Email</label>
                    <input 
                      type="email" 
                      required
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@gurindam.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
                    <input 
                      type="password" 
                      required
                      className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Minimal 6 karakter"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wider">Peran Sistem (Role)</label>
                <select 
                  className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all bg-white"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="arsip">Staff Arsip (Persuratan)</option>
                  <option value="bendahara">Bendahara (Keuangan)</option>
                  <option value="direktur">Direktur (Monitoring Only)</option>
                  <option value="admin">Administrator (Akses Penuh)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-6 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex items-center justify-center space-x-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  {editingUser ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                  <span>{loading ? 'Memproses...' : (editingUser ? 'Simpan Perubahan' : 'Buat Akun Staff')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
