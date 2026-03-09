import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { proxiesApi } from '../services/api'
import { Proxy } from '../types'
import { Plus, Trash2, Edit, Upload, CheckCircle2, XCircle, Globe, Loader2, Search, Activity } from 'lucide-react'
import Modal from '../components/Modal'
import { formatDate } from '../lib/utils'

export default function ProxiesPage() {
  const qc = useQueryClient()
  const [mode, setMode] = useState<'list' | 'add' | 'edit' | 'bulk'>('list')
  const [editTarget, setEditTarget] = useState<Proxy | null>(null)
  const [search, setSearch] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [form, setForm] = useState({ name: '', proxyUrl: '', proxyType: 'HTTP', country: '', active: true })
  const [toast, setToast] = useState('')
  const [checkingId, setCheckingId] = useState<number | null>(null)

  const { data: proxies = [], isLoading } = useQuery<Proxy[]>({
    queryKey: ['proxies'],
    queryFn: proxiesApi.list,
    refetchInterval: 30_000,
  })

  const createMut = useMutation({
    mutationFn: proxiesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proxies'] }); setMode('list'); showToast('Proxy ditambahkan') },
  })

  const updateMut = useMutation({
    mutationFn: (d: typeof form) => proxiesApi.update(editTarget!.id, d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proxies'] }); setMode('list'); showToast('Proxy diperbarui') },
  })

  const deleteMut = useMutation({
    mutationFn: proxiesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proxies'] }); showToast('Proxy dihapus') },
  })

  const bulkMut = useMutation({
    mutationFn: (text: string) => proxiesApi.bulkText(text),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['proxies'] })
      setMode('list')
      showToast(`${data.created} proxy berhasil ditambahkan`)
    },
  })

  const checkMut = useMutation({
    mutationFn: (id: number) => { setCheckingId(id); return proxiesApi.checkHealth(id) },
    onSuccess: () => { setCheckingId(null); qc.invalidateQueries({ queryKey: ['proxies'] }); showToast('Health check selesai') },
    onError: () => setCheckingId(null),
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function openEdit(p: Proxy) {
    setEditTarget(p)
    setForm({ name: p.name || '', proxyUrl: p.proxyUrl, proxyType: p.proxyType || 'HTTP', country: p.country || '', active: p.active })
    setMode('edit')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'add') createMut.mutate(form)
    else if (mode === 'edit') updateMut.mutate(form)
  }

  const filtered = proxies.filter(p =>
    p.proxyUrl.toLowerCase().includes(search.toLowerCase()) ||
    (p.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-purple-400" />
          <h1 className="text-xl font-bold text-white">Manajemen Proxy</h1>
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{proxies.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setMode('bulk'); setBulkText('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors">
            <Upload className="w-3.5 h-3.5" /> Bulk Import
          </button>
          <button onClick={() => { setMode('add'); setForm({ name: '', proxyUrl: '', proxyType: 'HTTP', country: '', active: true }) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" /> Tambah Proxy
          </button>
        </div>
      </div>

      {/* Bulk Import */}
      <Modal isOpen={mode === 'bulk'} onClose={() => setMode('list')} title="Bulk Import Proxy">
        <p className="text-xs text-slate-400 mb-2">Format: http://user:pass@host:port atau host:port (satu per baris)</p>
        <textarea
          value={bulkText}
          onChange={e => setBulkText(e.target.value)}
          rows={10}
          className="w-full bg-slate-800 border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:outline-none focus:border-yellow-500/50 resize-y"
          placeholder="http://user:pass@192.168.1.1:8080"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button onClick={() => setMode('list')} className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600">Batal</button>
          <button
            onClick={() => bulkMut.mutate(bulkText)}
            disabled={bulkMut.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-yellow-500 text-slate-900 font-medium hover:bg-yellow-400 disabled:opacity-50">
            {bulkMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Import
          </button>
        </div>
      </Modal>

      {/* Add/Edit Modal */}
      <Modal isOpen={mode === 'add' || mode === 'edit'} onClose={() => setMode('list')} title={mode === 'add' ? 'Tambah Proxy' : 'Edit Proxy'}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nama (opsional)</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              placeholder="My Proxy 1" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">URL Proxy *</label>
            <input value={form.proxyUrl} onChange={e => setForm(f => ({ ...f, proxyUrl: e.target.value }))}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-yellow-500/50"
              placeholder="http://user:pass@host:port" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tipe</label>
              <select value={form.proxyType} onChange={e => setForm(f => ({ ...f, proxyType: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                <option>HTTP</option>
                <option>HTTPS</option>
                <option>SOCKS5</option>
                <option>SOCKS4</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Negara</label>
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
                placeholder="ID" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pactive" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} className="w-4 h-4 accent-yellow-400" />
            <label htmlFor="pactive" className="text-sm text-slate-300">Aktif</label>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setMode('list')}
              className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600">Batal</button>
            <button type="submit" disabled={createMut.isPending || updateMut.isPending}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-yellow-500 text-slate-900 font-medium hover:bg-yellow-400 disabled:opacity-50">
              {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/30"
          placeholder="Cari proxy..." />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Globe className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada proxy</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">Proxy URL</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Tipe</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Dicek</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        {p.name && <p className="text-xs text-slate-400">{p.name}</p>}
                        <p className="text-white font-mono text-xs truncate max-w-[300px]">{p.proxyUrl}</p>
                        {p.country && <span className="text-xs text-slate-500">{p.country}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-slate-300 bg-slate-700 px-2 py-0.5 rounded">{p.proxyType}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.working === true ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-green-400">
                          <CheckCircle2 className="w-3 h-3" /> OK
                        </span>
                      ) : p.working === false ? (
                        <span className="flex items-center justify-center gap-1 text-xs text-red-400">
                          <XCircle className="w-3 h-3" /> Gagal
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {p.lastCheckedAt ? formatDate(p.lastCheckedAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => checkMut.mutate(p.id)}
                          disabled={checkingId === p.id}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors" title="Health Check">
                          {checkingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => openEdit(p)}
                          className="p-1.5 rounded text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteMut.mutate(p.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
