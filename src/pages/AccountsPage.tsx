import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { accountsApi, proxiesApi, ringsApi } from '../services/api'
import { Account, Proxy, Ring } from '../types'
import {
  Plus, Trash2, Edit, Upload, Globe, CheckCircle, XCircle,
  Search, Loader2, Users, Circle, ChevronUp, ChevronDown
} from 'lucide-react'
import Modal from '../components/Modal'
import { formatDate } from '../lib/utils'

type Mode = 'list' | 'add' | 'edit' | 'bulk' | 'manage-rings'

export default function AccountsPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<Mode>('list')
  const [editTarget, setEditTarget] = useState<Account | null>(null)
  const [search, setSearch] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [form, setForm] = useState({ email: '', phoneNumber: '', password: '', displayName: '', active: true, proxyId: '', ringId: '' })
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email')
  const [toast, setToast] = useState('')
  const [newRingAlias, setNewRingAlias] = useState('')

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
    refetchInterval: 15_000,
  })

  const { data: proxies = [] } = useQuery<Proxy[]>({
    queryKey: ['proxies'],
    queryFn: proxiesApi.list,
  })

  const { data: rings = [] } = useQuery<Ring[]>({
    queryKey: ['rings'],
    queryFn: ringsApi.list,
  })

  const createMut = useMutation({
    mutationFn: (d: typeof form) => accountsApi.create({
      ...d, proxyId: d.proxyId ? Number(d.proxyId) : null, ringId: d.ringId ? Number(d.ringId) : null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setMode('list'); showToast('Akun berhasil ditambahkan') },
  })

  const updateMut = useMutation({
    mutationFn: (d: typeof form) => accountsApi.update(editTarget!.id, {
      ...d, proxyId: d.proxyId ? Number(d.proxyId) : null, ringId: d.ringId ? Number(d.ringId) : null
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); setMode('list'); showToast('Akun diperbarui') },
  })

  const deleteMut = useMutation({
    mutationFn: accountsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['accounts'] }); showToast('Akun dihapus') },
  })

  const bulkMut = useMutation({
    mutationFn: (text: string) => accountsApi.bulkText(text),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['accounts'] })
      setMode('list')
      showToast(`${data.created} akun berhasil ditambahkan`)
    },
  })

  const createRingMut = useMutation({
    mutationFn: (data: { alias: string }) => ringsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rings'] })
      setNewRingAlias('')
      showToast('Ring baru berhasil ditambahkan')
    },
  })

  const deleteRingMut = useMutation({
    mutationFn: (id: number) => ringsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rings'] })
      showToast('Ring berhasil dihapus')
    },
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function openEdit(acc: Account) {
    setEditTarget(acc)
    setForm({
      email: acc.email,
      phoneNumber: acc.phoneNumber || '',
      password: '',
      displayName: acc.displayName || '',
      active: acc.active,
      proxyId: acc.proxyId ? String(acc.proxyId) : '',
      ringId: acc.ringId ? String(acc.ringId) : '',
    })
    setIdentifierType('email')
    setMode('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'add') createMut.mutate(form)
    else if (mode === 'edit') updateMut.mutate(form)
  }

  const filtered = accounts.filter(a =>
    (a.email && a.email.toLowerCase().includes(search.toLowerCase())) ||
    (a.phoneNumber && a.phoneNumber.includes(search)) ||
    (a.displayName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-yellow-400" />
          <h1 className="text-xl font-bold text-white">Manajemen Akun</h1>
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">
            {accounts.length}
          </span>
          
          {/* Rings Counter */}
          <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/10">
            <Circle className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-slate-300">Rings:</span>
            <span className="font-bold text-blue-400">{rings.length}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('manage-rings')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
          >
            <Circle className="w-3.5 h-3.5" /> Kelola Ring
          </button>
          <button
            onClick={() => { setMode('bulk'); setBulkText('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Import
          </button>
          <button
            onClick={() => { setMode('add'); setForm({ email: '', phoneNumber: '', password: '', displayName: '', active: true, proxyId: '', ringId: '' }); setIdentifierType('email') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Akun
          </button>
        </div>
      </div>

      {/* Bulk Import Modal */}
      <Modal isOpen={mode === 'bulk'} onClose={() => setMode('list')} title="Bulk Import Akun">
        <p className="text-xs text-slate-400 mb-2">Format: email:password atau nomor_hp:password (satu per baris)</p>
        <p className="text-xs text-slate-500 mb-3">Contoh:
          <br/>user@email.com:password123
          <br/>08123456789:password456
        </p>
        <textarea
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          rows={10}
          className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-yellow-500/50 resize-y"
          placeholder={`user1@email.com:password1\n08123456789:password2`}
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setMode('list')} className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600">Batal</button>
          <button
            onClick={() => bulkMut.mutate(bulkText)}
            disabled={bulkMut.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-yellow-500 text-slate-900 font-medium hover:bg-yellow-400 disabled:opacity-50"
          >
            {bulkMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Import
          </button>
        </div>
      </Modal>

      {/* Manage Rings Modal */}
      <Modal isOpen={mode === 'manage-rings'} onClose={() => setMode('list')} title="📌 Kelola Ring">
        <div className="space-y-4">
          {/* Add New Ring */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">Tambah Ring Baru</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRingAlias}
                onChange={e => setNewRingAlias(e.target.value)}
                placeholder="Nama/Alias Ring (cth: Ring 1, Premium, etc)"
                className="flex-1 bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => {
                  if (newRingAlias.trim()) {
                    createRingMut.mutate({ alias: newRingAlias })
                  }
                }}
                disabled={createRingMut.isPending || !newRingAlias.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {createRingMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Tambah
              </button>
            </div>
          </div>

          {/* Daftar Ring */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">Daftar Ring ({rings.length})</label>
            <div className="bg-slate-800 border border-white/10 rounded-lg max-h-72 overflow-y-auto divide-y divide-white/5">
              {rings.length === 0 ? (
                <div className="px-4 py-6 text-center text-slate-500">
                  <Circle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada Ring. Tambahkan Ring baru!</p>
                </div>
              ) : (
                rings.map((ring, idx) => (
                  <div key={ring.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">Ring {ring.ringNumber}</span>
                        <span className="text-sm text-white font-medium">{ring.alias || `Ring ${ring.ringNumber}`}</span>
                      </div>
                      {ring.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{ring.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteRingMut.mutate(ring.id)}
                      disabled={deleteRingMut.isPending}
                      className="ml-3 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs"
                    >
                      {deleteRingMut.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      Hapus
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Informasi */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <p className="text-xs text-blue-300">💡 <strong>Tips:</strong> Ring digunakan untuk mengorganisir akun. Setiap akun dapat ditetapkan ke salah satu Ring.</p>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/10">
            <button
              onClick={() => setMode('list')}
              className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={mode === 'add' || mode === 'edit'} onClose={() => setMode('list')} title={mode === 'add' ? '➕ Tambah Akun Baru' : '✏️ Edit Akun'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'add' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 font-semibold uppercase tracking-wide">Pilih Jenis Identifier</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIdentifierType('email')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    identifierType === 'email' 
                      ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400' 
                      : 'bg-slate-800 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-slate-700'
                  }`}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  onClick={() => setIdentifierType('phone')}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                    identifierType === 'phone' 
                      ? 'bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-500/30 ring-2 ring-yellow-400' 
                      : 'bg-slate-800 text-slate-300 border border-white/10 hover:border-white/20 hover:bg-slate-700'
                  }`}
                >
                  📱 Nomor HP
                </button>
              </div>
              <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent my-2"></div>
            </div>
          )}
          {identifierType === 'email' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200 block">📧 Alamat Email</label>
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required={identifierType === 'email'}
                className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
                placeholder="user@email.com"
              />
              <p className="text-xs text-slate-400">Format: nama@domain.com</p>
            </div>
          )}
          {identifierType === 'phone' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-200 block">📱 Nomor Ponsel</label>
              <input
                value={form.phoneNumber}
                onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                required={identifierType === 'phone'}
                className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
                placeholder="081234567890"
              />
              <p className="text-xs text-slate-400">Format: 08XXXXXXXXXX atau dengan kode negara</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">🔐 Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required={mode === 'add'}
              className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
              placeholder="••••••••••••"
            />
            {mode === 'edit' && <p className="text-xs text-slate-500">(Kosongkan jika tidak ingin mengubah)</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">📝 Nama Akun (Opsional)</label>
            <input
              value={form.displayName}
              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
              placeholder="Nama untuk identifikasi"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">🌐 Proxy (Opsional)</label>
            <select
              value={form.proxyId}
              onChange={e => setForm(f => ({ ...f, proxyId: e.target.value }))}
              className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
            >
              <option value="">— Tanpa Proxy —</option>
              {proxies.map(p => (
                <option key={p.id} value={p.id}>{p.name || p.proxyUrl}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-200 block">📌 Ring (Grup)</label>
            <select
              value={form.ringId}
              onChange={e => setForm(f => ({ ...f, ringId: e.target.value }))}
              required
              className="w-full bg-slate-800 border-2 border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500 focus:bg-slate-800/50 transition-all"
            >
              <option value="">— Pilih Ring —</option>
              {rings.map(r => (
                <option key={r.id} value={r.id}>Ring {r.ringNumber}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-3 border border-white/5">
            <input
              type="checkbox"
              id="active"
              checked={form.active}
              onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
              className="w-5 h-5 accent-yellow-400 cursor-pointer"
            />
            <label htmlFor="active" className="text-sm font-medium text-slate-200 cursor-pointer">
              ✓ Akun Aktif
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => setMode('list')}
              className="px-6 py-2.5 text-sm font-medium rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg bg-yellow-500 text-slate-900 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-yellow-500/20"
            >
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'add' ? '💾 Simpan Akun' : '💾 Perbarui'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/30"
          placeholder="Cari akun..."
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada akun</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Identifier</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Proxy</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Ring</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-center px-4 py-3 font-medium">Login</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Dibuat</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(acc => (
                  <tr key={acc.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white font-medium">
                          {acc.phoneNumber ? (
                            <span>📱 {acc.phoneNumber}</span>
                          ) : (
                            <span>📧 {acc.email}</span>
                          )}
                        </p>
                        {acc.displayName && <p className="text-xs text-slate-400">{acc.displayName}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {acc.proxyUrl ? (
                        <span className="flex items-center gap-1 text-xs text-purple-400">
                          <Globe className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{acc.proxyUrl}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {acc.ringNumber ? (
                        <span className="text-xs text-orange-400 font-medium">
                          📍 Ring {acc.ringNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {acc.active ? (
                        <span className="text-xs text-green-400 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 flex items-center justify-center gap-1">
                          <XCircle className="w-3 h-3" /> Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {acc.loggedIn ? (
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" title="Login aktif" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" title="Belum login" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {formatDate(acc.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(acc)}
                          className="p-1.5 rounded text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMut.mutate(acc.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
