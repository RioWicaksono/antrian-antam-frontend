import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { captchaDbApi } from '../services/api'
import {
  Database, CheckCircle2, XCircle, Clock,
  Trash2, Edit3, RotateCcw, TrendingUp, AlertTriangle
} from 'lucide-react'
import { cn } from '../lib/utils'

interface CaptchaEntry {
  id: number
  captchaType: string
  questionText: string | null
  answer: string | null
  answerConfirmed: boolean
  autoSolved: boolean
  hitCount: number
  createdAt: string
  lastSeenAt: string
  lastSolvedAt: string | null
}

interface DbStats {
  total: number
  confirmed: number
  pending: number
  solveRate: number
}

type FilterType = 'ALL' | 'PENDING' | 'ARITHMETIC' | 'TEXT_QUESTION' | 'IMAGE' | 'RECAPTCHA' | 'HCAPTCHA'

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ARITHMETIC:    { label: 'Aritmatika',    cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    TEXT_QUESTION: { label: 'Teks',          cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    IMAGE:         { label: 'Gambar',        cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    RECAPTCHA:     { label: 'reCAPTCHA',     cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    HCAPTCHA:      { label: 'hCaptcha',      cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    NONE:          { label: 'Tidak Ada',     cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    UNKNOWN:       { label: 'Unknown',       cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  }
  const s = map[type] ?? { label: type, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium', s.cls)}>
      {s.label}
    </span>
  )
}

function EntryRow({
  entry,
  onConfirm,
  onClear,
  onDelete,
}: {
  entry: CaptchaEntry
  onConfirm: (id: number, answer: string) => void
  onClear: (id: number) => void
  onDelete: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [answerInput, setAnswerInput] = useState(entry.answer ?? '')

  const handleConfirm = () => {
    if (answerInput.trim()) {
      onConfirm(entry.id, answerInput.trim())
      setEditing(false)
    }
  }

  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      entry.answerConfirmed
        ? 'bg-slate-800/30 border-white/5'
        : 'bg-orange-500/5 border-orange-500/20'
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {/* Left: type + question */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <TypeBadge type={entry.captchaType} />
            {entry.answerConfirmed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-green-500/20 text-green-400 border-green-500/30">
                <CheckCircle2 className="w-3 h-3" />
                {entry.autoSolved ? 'Auto' : 'Dikonfirmasi'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs bg-orange-500/20 text-orange-400 border-orange-500/30">
                <AlertTriangle className="w-3 h-3" /> Perlu Jawaban
              </span>
            )}
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {entry.hitCount}x muncul
            </span>
          </div>
          <p className="text-sm text-slate-300 break-all font-mono">
            {entry.questionText ?? <span className="text-slate-500 italic">—</span>}
          </p>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {entry.answerConfirmed && !entry.autoSolved && (
            <button
              onClick={() => onClear(entry.id)}
              title="Reset jawaban"
              className="p-1.5 rounded-lg text-slate-500 hover:text-orange-400 hover:bg-orange-400/10 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          {!entry.autoSolved && (
            <button
              onClick={() => { setEditing(!editing); setAnswerInput(entry.answer ?? '') }}
              title="Edit jawaban"
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onDelete(entry.id)}
            title="Hapus"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Answer display */}
      {entry.answerConfirmed && entry.answer && !editing && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-500">Jawaban:</span>
          <span className="text-sm font-medium text-green-400 font-mono">{entry.answer}</span>
        </div>
      )}

      {/* Answer input (for pending or editing) */}
      {(editing || !entry.answerConfirmed) && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={answerInput}
            onChange={e => setAnswerInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            placeholder="Masukkan jawaban captcha..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/50"
          />
          <button
            onClick={handleConfirm}
            disabled={!answerInput.trim()}
            className="px-3 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-medium transition-all disabled:opacity-40"
          >
            Simpan
          </button>
          {editing && (
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm transition-all">
              Batal
            </button>
          )}
        </div>
      )}

      {/* Timestamps */}
      <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Terakhir: {new Date(entry.lastSeenAt).toLocaleString('id-ID')}
        </span>
        <span>Dibuat: {new Date(entry.createdAt).toLocaleDateString('id-ID')}</span>
      </div>
    </div>
  )
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'PENDING', label: '⏳ Menunggu' },
  { key: 'ARITHMETIC', label: 'Aritmatika' },
  { key: 'TEXT_QUESTION', label: 'Teks' },
  { key: 'IMAGE', label: 'Gambar' },
  { key: 'RECAPTCHA', label: 'reCAPTCHA' },
  { key: 'HCAPTCHA', label: 'hCaptcha' },
]

export default function CaptchaDBPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState<FilterType>('ALL')

  const { data: stats } = useQuery<DbStats>({
    queryKey: ['captcha-db-stats'],
    queryFn: captchaDbApi.stats,
    refetchInterval: 5000,
  })

  const { data: entries = [], isLoading } = useQuery<CaptchaEntry[]>({
    queryKey: ['captcha-db', filter],
    queryFn: () => {
      if (filter === 'PENDING') return captchaDbApi.pending()
      if (filter === 'ALL') return captchaDbApi.list()
      return captchaDbApi.list(filter)
    },
    refetchInterval: 5000,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['captcha-db'] })
    qc.invalidateQueries({ queryKey: ['captcha-db-stats'] })
  }

  const confirmMutation = useMutation({
    mutationFn: ({ id, answer }: { id: number; answer: string }) =>
      captchaDbApi.confirmAnswer(id, answer),
    onSuccess: invalidate,
  })

  const clearMutation = useMutation({
    mutationFn: (id: number) => captchaDbApi.clearAnswer(id),
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => captchaDbApi.delete(id),
    onSuccess: invalidate,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Database className="w-5 h-5 text-yellow-400" />
          <h1 className="text-xl font-bold text-white">Captcha Learning DB</h1>
        </div>
        <p className="text-sm text-slate-400">
          Database captcha yang dipelajari otomatis. Isi jawaban untuk captcha yang belum ter-solve — berikutnya akan di-solve otomatis dari DB ini.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Total Tersimpan</p>
          <p className="text-2xl font-bold text-white">{stats?.total ?? 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Ter-solve</p>
          <p className="text-2xl font-bold text-green-400">{stats?.confirmed ?? 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Menunggu Jawaban</p>
          <p className="text-2xl font-bold text-orange-400">{stats?.pending ?? 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Solve Rate</p>
          <p className="text-2xl font-bold text-yellow-400">
            {stats?.solveRate ?? 0}%
          </p>
        </div>
      </div>

      {/* Info box for pending */}
      {(stats?.pending ?? 0) > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/30 bg-orange-500/10">
          <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-orange-300">
              {stats!.pending} captcha menunggu jawaban
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Isi jawaban untuk captcha yang muncul — mulai berikutnya akan di-solve otomatis tanpa perlu input manual lagi.
            </p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              filter === f.key
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-slate-800/40 text-slate-400 border-white/5 hover:bg-slate-700/50'
            )}
          >
            {f.label}
            {f.key === 'PENDING' && (stats?.pending ?? 0) > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-orange-500 text-white text-xs">
                {stats!.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Entries list */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Memuat...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">
            {filter === 'PENDING'
              ? 'Semua captcha sudah memiliki jawaban 🎉'
              : 'Belum ada captcha tersimpan. Aktifkan CF Monitor untuk mulai mengumpulkan data.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onConfirm={(id, answer) => confirmMutation.mutate({ id, answer })}
              onClear={id => clearMutation.mutate(id)}
              onDelete={id => {
                if (confirm('Hapus entry ini?')) deleteMutation.mutate(id)
              }}
            />
          ))}
        </div>
      )}

      {/* Empty confirmed state */}
      {!isLoading && entries.length > 0 && (
        <p className="text-center text-xs text-slate-600">
          {entries.length} entri ditampilkan · auto-refresh setiap 5 detik
        </p>
      )}
    </div>
  )
}
