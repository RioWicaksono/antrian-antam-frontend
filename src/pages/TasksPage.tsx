import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tasksApi, accountsApi, branchesApi } from '../services/api'
import { SnipeTask, Account, Branch } from '../types'
import { Plus, Play, Square, Eye, Trash2, CalendarClock, Loader2, CheckSquare, Square as SquareIcon } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import Modal from '../components/Modal'
import { formatDate } from '../lib/utils'

interface TaskForm {
  name: string
  branchCode: string
  targetDate: string
  targetTime: string
  accountIds: number[]
  useRandomLocation?: boolean
}

export default function TasksPage() {
  const nav = useNavigate()
  const qc = useQueryClient()
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<TaskForm>({ name: '', branchCode: '', targetDate: '', targetTime: '08:00', accountIds: [], useRandomLocation: false })
  const [toast, setToast] = useState('')

  const { data: tasks = [], isLoading } = useQuery<SnipeTask[]>({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
    refetchInterval: 5_000,
  })

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ['accounts'],
    queryFn: accountsApi.list,
    enabled: modal,
  })

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ['branches'],
    queryFn: branchesApi.list,
    enabled: modal,
  })

  const createMut = useMutation({
    mutationFn: (f: TaskForm) => tasksApi.create({
      name: f.name,
      branchCode: f.branchCode,
      targetDateTime: `${f.targetDate}T${f.targetTime}:00`,
      accountIds: f.accountIds,
      useRandomLocation: f.useRandomLocation,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setModal(false)
      showToast('Task berhasil dibuat')
    },
  })

  const startMut = useMutation({
    mutationFn: tasksApi.start,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const cancelMut = useMutation({
    mutationFn: tasksApi.cancel,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteMut = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); showToast('Task dihapus') },
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleAccount(id: number) {
    setForm(f => ({
      ...f,
      accountIds: f.accountIds.includes(id) ? f.accountIds.filter(x => x !== id) : [...f.accountIds, id],
    }))
  }

  function toggleAllAccounts() {
    const activeIds = accounts.filter(a => a.active).map(a => a.id)
    if (form.accountIds.length === activeIds.length) {
      setForm(f => ({ ...f, accountIds: [] }))
    } else {
      setForm(f => ({ ...f, accountIds: activeIds }))
    }
  }

  function openModal() {
    const today = new Date().toISOString().split('T')[0]
    setForm({ name: '', branchCode: '', targetDate: today, targetTime: '08:00', accountIds: [], useRandomLocation: false })
    setModal(true)
  }

  const canStart = (t: SnipeTask) => t.status === 'IDLE' || t.status === 'FAILED'
  const canCancel = (t: SnipeTask) => t.status === 'WAITING' || t.status === 'RUNNING' || t.status === 'PRESOLVING'

  return (
    <div className="space-y-5 max-w-5xl">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarClock className="w-5 h-5 text-yellow-400" />
          <h1 className="text-xl font-bold text-white">Snipe Tasks</h1>
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-medium transition-colors">
          <Plus className="w-3.5 h-3.5" /> Buat Task
        </button>
      </div>

      {/* Create Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="Buat Snipe Task">
        <form onSubmit={e => { e.preventDefault(); createMut.mutate(form) }} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Nama Task *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              placeholder="Task Senin Pagi" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Lokasi/Cabang *</label>
            <select value={form.branchCode} onChange={e => setForm(f => ({ ...f, branchCode: e.target.value }))}
              required className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">-- Pilih Lokasi --</option>
              <option value="RANDOM">🎲 Random (Semua Lokasi)</option>
              {branches.map(b => (
                <option key={b.code} value={b.code}>{b.name} ({b.code})</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Tanggal *</label>
              <input type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))}
                required className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Jam Target *</label>
              <input type="time" value={form.targetTime} onChange={e => setForm(f => ({ ...f, targetTime: e.target.value }))}
                required className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50" />
            </div>
          </div>

          {/* Account selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-400">Akun ({form.accountIds.length} dipilih)</label>
              <button type="button" onClick={toggleAllAccounts}
                className="text-xs text-yellow-400 hover:text-yellow-300">
                {form.accountIds.length === accounts.filter(a => a.active).length ? 'Batal semua' : 'Pilih semua aktif'}
              </button>
            </div>
            <div className="bg-slate-800 border border-white/10 rounded-lg max-h-48 overflow-y-auto divide-y divide-white/5">
              {accounts.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">Belum ada akun</p>
              )}
              {accounts.map(a => (
                <label key={a.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/5 ${!a.active ? 'opacity-50' : ''}`}>
                  <input type="checkbox" checked={form.accountIds.includes(a.id)} onChange={() => toggleAccount(a.id)}
                    disabled={!a.active} className="accent-yellow-400" />
                  <div>
                    <p className="text-sm text-white">{a.displayName || a.email}</p>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </div>
                  {!a.active && <span className="ml-auto text-xs text-slate-600">nonaktif</span>}
                </label>
              ))}
            </div>
          </div>

          {/* Random Location Toggle */}
          <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-white/10 rounded-lg">
            <input type="checkbox" id="useRandomLocation" checked={form.useRandomLocation || false}
              onChange={e => setForm(f => ({ ...f, useRandomLocation: e.target.checked }))}
              className="w-4 h-4 accent-yellow-400 cursor-pointer" />
            <label htmlFor="useRandomLocation" className="text-sm text-white cursor-pointer flex-1">
              🎲 <span className="font-medium">Random Lokasi</span>
              <p className="text-xs text-slate-400 mt-0.5">Cari di semua Ring yang tersedia secara acak</p>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setModal(false)}
              className="px-4 py-2 text-sm rounded-lg bg-slate-700 text-white hover:bg-slate-600">Batal</button>
            <button type="submit" disabled={createMut.isPending || form.accountIds.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-yellow-500 text-slate-900 font-medium hover:bg-yellow-400 disabled:opacity-50">
              {createMut.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Buat Task
            </button>
          </div>
        </form>
      </Modal>

      {/* Task list */}
      <div className="space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          </div>
        )}
        {!isLoading && tasks.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-slate-900 border border-white/10 rounded-xl">
            <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada task. Buat task baru untuk mulai snipe!</p>
          </div>
        )}
        {tasks.map(t => (
          <div key={t.id}
            className="bg-slate-900 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={t.status} />
                  <h3 className="text-white font-medium text-sm truncate">{t.name}</h3>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                  <span>Cabang: <span className="text-slate-200">{t.branchCode}</span></span>
                  <span>Target: <span className="text-slate-200">{formatDate(t.targetDateTime)}</span></span>
                  <span>Akun: <span className="text-slate-200">{t.accountIds?.length ?? 0}</span></span>
                  {t.status === 'COMPLETED' && (
                    <span>Tiket: <span className="text-green-400 font-semibold">{t.successCount ?? 0} berhasil</span></span>
                  )}
                </div>
                {(t.status === 'RUNNING' || t.status === 'WAITING') && t.accountIds && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{t.successCount ?? 0} / {t.accountIds.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 transition-all duration-500"
                        style={{ width: `${t.accountIds.length ? ((t.successCount ?? 0) / t.accountIds.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canStart(t) && (
                  <button onClick={() => startMut.mutate(t.id)}
                    disabled={startMut.isPending}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-xs transition-colors">
                    <Play className="w-3 h-3" /> Start
                  </button>
                )}
                {canCancel(t) && (
                  <button onClick={() => cancelMut.mutate(t.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs transition-colors">
                    <Square className="w-3 h-3" /> Batalkan
                  </button>
                )}
                <button onClick={() => nav(`/tasks/${t.id}`)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-xs transition-colors">
                  <Eye className="w-3 h-3" /> Detail
                </button>
                {(t.status === 'IDLE' || t.status === 'FAILED' || t.status === 'CANCELLED' || t.status === 'COMPLETED') && (
                  <button onClick={() => deleteMut.mutate(t.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
