import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '../services/api'
import { wsService } from '../services/websocket'
import { SnipeTask, TaskLog, Ticket } from '../types'
import StatusBadge from '../components/StatusBadge'
import { ArrowLeft, Play, Square, RefreshCw, Terminal, Ticket as TicketIcon, Clock, CheckCircle2 } from 'lucide-react'
import { formatDate, formatTime } from '../lib/utils'

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const qc = useQueryClient()
  const taskId = Number(id)

  const [logs, setLogs] = useState<TaskLog[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [tab, setTab] = useState<'logs' | 'tickets'>('logs')
  const [autoScroll, setAutoScroll] = useState(true)
  const [countdown, setCountdown] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  const { data: task } = useQuery<SnipeTask>({
    queryKey: ['task', taskId],
    queryFn: () => tasksApi.get(taskId),
    refetchInterval: 3_000,
  })

  const { data: initLogs = [] } = useQuery<TaskLog[]>({
    queryKey: ['task-logs', taskId],
    queryFn: () => tasksApi.logs(taskId),
    refetchOnWindowFocus: false,
  })

  const { data: initTickets = [] } = useQuery<Ticket[]>({
    queryKey: ['task-tickets', taskId],
    queryFn: () => tasksApi.tickets(taskId),
    refetchInterval: 5_000,
  })

  useEffect(() => {
    setLogs(initLogs)
  }, [initLogs])

  useEffect(() => {
    setTickets(initTickets)
  }, [initTickets])

  // WebSocket subscriptions
  useEffect(() => {
    const unsubs = [
      wsService.subscribe(`/topic/task/${taskId}/logs`, (msg) => {
        const log = (msg as { payload?: TaskLog }).payload as TaskLog
        setLogs(prev => [...prev, log].slice(-1000))
      }),
      wsService.subscribe(`/topic/task/${taskId}/tickets`, (msg) => {
        const ticket = (msg as { payload?: Ticket }).payload as Ticket
        setTickets(prev => [ticket, ...prev])
        setTab('tickets')
      }),
      wsService.subscribe(`/topic/task/${taskId}`, () => {
        qc.invalidateQueries({ queryKey: ['task', taskId] })
      }),
    ]
    return () => unsubs.forEach(fn => fn())
  }, [taskId, qc])

  // Auto scroll
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  // Countdown timer
  useEffect(() => {
    if (!task) return
    const update = () => {
      const diff = new Date(task.targetDateTime).getTime() - Date.now()
      if (diff <= 0) { setCountdown('Sudah lewat'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setCountdown(`${h > 0 ? h + 'j ' : ''}${m}m ${s}s`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [task])

  const startMut = useMutation({
    mutationFn: () => tasksApi.start(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  })
  const cancelMut = useMutation({
    mutationFn: () => tasksApi.cancel(taskId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', taskId] }),
  })

  const handleScroll = useCallback(() => {
    if (!logRef.current) return
    const el = logRef.current
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setAutoScroll(atBottom)
  }, [])

  const logLevelClass = (level: string) => ({
    SUCCESS: 'log-SUCCESS', INFO: 'log-INFO', WARN: 'log-WARN', ERROR: 'log-ERROR',
  }[level] ?? 'log-INFO')

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-yellow-400 animate-spin" />
      </div>
    )
  }

  const canStart = task.status === 'IDLE' || task.status === 'FAILED'
  const canCancel = task.status === 'WAITING' || task.status === 'RUNNING' || task.status === 'PRESOLVING'
  const totalAccounts = task.accountIds?.length ?? 0
  const successCount = task.successCount ?? 0
  const progress = totalAccounts > 0 ? (successCount / totalAccounts) * 100 : 0

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => nav('/tasks')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-white">{task.name}</h1>
            <p className="text-xs text-slate-400">ID: {task.id} · Cabang: {task.branchCode}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={task.status} />
          {canStart && (
            <button onClick={() => startMut.mutate()}
              disabled={startMut.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-white text-sm font-medium transition-colors">
              <Play className="w-3.5 h-3.5" /> Mulai
            </button>
          )}
          {canCancel && (
            <button onClick={() => cancelMut.mutate()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white text-sm font-medium transition-colors">
              <Square className="w-3.5 h-3.5" /> Batalkan
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Target Waktu</p>
          <p className="text-sm font-semibold text-white">{formatTime(task.targetDateTime)}</p>
          <p className="text-xs text-slate-500">{new Date(task.targetDateTime).toLocaleDateString('id-ID')}</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-yellow-400" />
            <p className="text-xs text-slate-400">Countdown</p>
          </div>
          <p className="text-sm font-mono font-semibold text-yellow-400">{countdown}</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Akun</p>
          <p className="text-2xl font-bold text-white">{totalAccounts}</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
            <p className="text-xs text-slate-400">Tiket Berhasil</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{successCount}</p>
        </div>
      </div>

      {/* Progress bar */}
      {totalAccounts > 0 && (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Progress Pengambilan Tiket</span>
            <span>{successCount} / {totalAccounts} akun berhasil</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-green-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">{progress.toFixed(1)}%</p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="flex border-b border-white/10">
          <button onClick={() => setTab('logs')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${tab === 'logs' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <Terminal className="w-3.5 h-3.5" />
            Log Aktivitas
            <span className="bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">{logs.length}</span>
          </button>
          <button onClick={() => setTab('tickets')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${tab === 'tickets' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}>
            <TicketIcon className="w-3.5 h-3.5" />
            Tiket Berhasil
            {tickets.length > 0 && (
              <span className="bg-green-500/30 text-green-400 text-xs px-1.5 py-0.5 rounded-full">{tickets.length}</span>
            )}
          </button>
        </div>

        {/* Log console */}
        {tab === 'logs' && (
          <div>
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
              <span className="text-xs text-slate-500">{logs.length} pesan</span>
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="accent-yellow-400 w-3.5 h-3.5" />
                Auto-scroll
              </label>
            </div>
            <div
              ref={logRef}
              onScroll={handleScroll}
              className="log-console h-96 overflow-y-auto p-3 font-mono text-xs space-y-0.5"
            >
              {logs.length === 0 && (
                <p className="text-slate-600 italic">Belum ada log. Mulai task untuk melihat aktivitas.</p>
              )}
              {logs.map((log, i) => (
                <div key={log.id ?? i} className={`log-line ${logLevelClass(log.level)}`}>
                  <span className="text-slate-600">[{formatTime(log.createdAt)}]</span>{' '}
                  <span className="text-slate-400">[{log.accountEmail?.split('@')[0] ?? 'SYS'}]</span>{' '}
                  {log.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tickets table */}
        {tab === 'tickets' && (
          <div className="overflow-x-auto">
            {tickets.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <TicketIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">Belum ada tiket berhasil</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs text-slate-400">
                    <th className="text-left px-4 py-3 font-medium">Akun</th>
                    <th className="text-left px-4 py-3 font-medium">No Antrian</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Nama</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Jam Kedatangan</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Dibooking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map(t => (
                    <tr key={t.id} className="hover:bg-white/3">
                      <td className="px-4 py-3 text-xs text-slate-300">{t.accountEmail}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-yellow-400 text-base">{t.queueNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white hidden md:table-cell">{t.holderName || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">{t.arrivalTime || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{formatDate(t.bookedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
