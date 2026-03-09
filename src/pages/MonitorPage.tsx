import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { monitorApi } from '../services/api'
import { wsService } from '../services/websocket'
import {
  Activity, RefreshCw, Play, Pause,
  XCircle, AlertCircle, Clock, Shield, Hash, Zap, CheckCircle
} from 'lucide-react'
import { cn } from '../lib/utils'

type CaptchaType = 'ARITHMETIC' | 'TEXT_QUESTION' | 'IMAGE' | 'RECAPTCHA' | 'HCAPTCHA' | 'NONE' | 'UNKNOWN'

interface MonitorResult {
  timestamp: string
  checkNumber: number
  cfClearanceObtained: boolean
  captchaType: CaptchaType | null
  captchaQuestion: string | null
  captchaSolution: string | null
  captchaSolved: boolean
  /** AUTO_ARITHMETIC | LEARNED_DB | null */
  solveSource: string | null
  pageTitle: string | null
  cfStatus: string
  durationMs: number
  error: string | null
}

interface MonitorInfo {
  enabled: boolean
  checkCount: number
  hasResult: boolean
}

function CfBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    OK: { label: 'CF Bypass OK', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
    NO_COOKIE: { label: 'No cf_clearance', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    CF_BLOCKED: { label: 'CF Blocked', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
    FLARESOLVERR_NULL: { label: 'FlareSolverr Error', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    ERROR: { label: 'Error', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' }
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium', s.cls)}>
      <Shield className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function CaptchaBadge({ type, solved }: { type: CaptchaType | null; solved: boolean }) {
  if (!type || type === 'NONE') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-slate-500/20 text-slate-400 border-slate-500/30">
      <XCircle className="w-3 h-3" /> No Captcha
    </span>
  )
  const map: Record<CaptchaType, { label: string; cls: string }> = {
    ARITHMETIC: solved
      ? { label: 'Arithmetic ✓', cls: 'bg-green-500/20 text-green-400 border-green-500/30' }
      : { label: 'Arithmetic', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    TEXT_QUESTION: { label: 'Text Question', cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    IMAGE: { label: 'Image Captcha', cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    RECAPTCHA: { label: 'reCAPTCHA', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    HCAPTCHA: { label: 'hCaptcha', cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    NONE: { label: 'No Captcha', cls: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
    UNKNOWN: { label: 'Unknown', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  }
  const s = map[type]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium', s.cls)}>
      <Hash className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function SolveBadge({ source }: { source: string | null }) {
  if (!source) return null
  if (source === 'LEARNED_DB') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-blue-500/20 text-blue-400 border-blue-500/30">
      🧠 Dari DB
    </span>
  )
  if (source === 'AUTO_ARITHMETIC') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-green-500/20 text-green-400 border-green-500/30">
      ⚡ Auto
    </span>
  )
  if (source === 'CAPSOLVER') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-medium bg-purple-500/20 text-purple-400 border-purple-500/30">
      🤖 Capsolver
    </span>
  )
  return null
}

function ResultCard({ result, isLatest = false }: { result: MonitorResult; isLatest?: boolean }) {
  const time = new Date(result.timestamp)
  return (
    <div className={cn(
      'rounded-xl border p-4 transition-all',
      isLatest
        ? 'bg-slate-800/60 border-yellow-500/30'
        : 'bg-slate-800/30 border-white/5'
    )}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {isLatest && <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">Latest</span>}
          <span className="text-xs text-slate-500">#{result.checkNumber}</span>
          <CfBadge status={result.cfStatus} />
          <CaptchaBadge type={result.captchaType} solved={result.captchaSolved} />
          <SolveBadge source={result.solveSource} />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {result.durationMs}ms
          </span>
          <span>{time.toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      {result.pageTitle && (
        <p className="mt-2 text-xs text-slate-400">
          <span className="text-slate-500">Judul halaman: </span>
          {result.pageTitle}
        </p>
      )}

      {result.captchaQuestion && result.captchaType === 'ARITHMETIC' && (
        <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <Hash className="w-4 h-4 text-yellow-400 flex-shrink-0" />
          <div>
            <p className="text-xs text-slate-400 mb-0.5">
              {result.solveSource === 'LEARNED_DB' ? 'Aritmatika (solved dari DB 🧠):' : 'Soal aritmatika (auto-solved ⚡):'}
            </p>
            <p className="text-sm font-mono font-bold text-yellow-300">
              {result.captchaQuestion}{' '}
              <span className="text-green-400 ml-2">→ {result.captchaSolution}</span>
            </p>
          </div>
        </div>
      )}

      {result.captchaQuestion && result.captchaType === 'TEXT_QUESTION' && (
        <div className={cn(
          'mt-3 flex items-center gap-3 p-3 rounded-lg border',
          result.solveSource === 'LEARNED_DB'
            ? 'bg-green-500/10 border-green-500/20'
            : 'bg-blue-500/10 border-blue-500/20'
        )}>
          <AlertCircle className={cn('w-4 h-4 flex-shrink-0', result.solveSource === 'LEARNED_DB' ? 'text-green-400' : 'text-blue-400')} />
          <div>
            <p className="text-xs text-slate-400 mb-0.5">
              {result.solveSource === 'LEARNED_DB' ? 'Pertanyaan teks (solved dari DB 🧠):' : 'Pertanyaan teks (perlu input manual di Captcha DB):'}
            </p>
            <p className={cn('text-sm font-medium', result.solveSource === 'LEARNED_DB' ? 'text-green-300' : 'text-blue-300')}>
              {result.captchaQuestion}
              {result.solveSource === 'LEARNED_DB' && result.captchaSolution && (
                <span className="text-green-400 ml-2">→ {result.captchaSolution}</span>
              )}
            </p>
          </div>
        </div>
      )}

      {result.captchaType && ['IMAGE', 'RECAPTCHA', 'HCAPTCHA'].includes(result.captchaType) && (
        result.solveSource === 'CAPSOLVER' ? (
          <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 mb-0.5">Diselesaikan oleh Capsolver 🤖</p>
              <p className="text-sm font-mono text-purple-300 truncate">
                {result.captchaSolution ? result.captchaSolution.substring(0, 60) + '…' : '-'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <XCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Captcha belum bisa di-solve otomatis:</p>
              <p className="text-sm font-medium text-orange-300">
                {result.captchaType === 'IMAGE' && (result.captchaQuestion ?? 'Image-based captcha detected')}
                {result.captchaType === 'RECAPTCHA' && 'Google reCAPTCHA — pastikan Capsolver API key sudah dikonfigurasi'}
                {result.captchaType === 'HCAPTCHA' && 'hCaptcha — pastikan Capsolver API key sudah dikonfigurasi'}
              </p>
            </div>
          </div>
        )
      )}

      {result.error && (
        <div className="mt-2 flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{result.error}</p>
        </div>
      )}
    </div>
  )
}

export default function MonitorPage() {
  const queryClient = useQueryClient()
  const [history, setHistory] = useState<MonitorResult[]>([])
  const [liveResult, setLiveResult] = useState<MonitorResult | null>(null)
  const [isTriggerLoading, setIsTriggerLoading] = useState(false)
  const MAX_HISTORY = 10

  const { data: info } = useQuery<MonitorInfo>({
    queryKey: ['monitor-info'],
    queryFn: monitorApi.info,
    refetchInterval: 10_000,
  })

  const { data: status } = useQuery<MonitorResult | null>({
    queryKey: ['monitor-status'],
    queryFn: monitorApi.status,
    refetchInterval: 15_000,
    retry: false,
  })

  // WebSocket: subscribe to real-time monitor events
  useEffect(() => {
    const unsub = wsService.subscribe('/topic/monitor', (payload) => {
      const result = payload as MonitorResult
      setLiveResult(result)
      setHistory(prev => {
        // Avoid duplicate results with the same checkNumber and timestamp
        if (prev.length > 0 && 
            prev[0].checkNumber === result.checkNumber && 
            prev[0].timestamp === result.timestamp) {
          return prev
        }
        return [result, ...prev].slice(0, MAX_HISTORY)
      })
      queryClient.invalidateQueries({ queryKey: ['monitor-info'] })
    })
    return () => unsub()
  }, [queryClient])

  // Seed history with the persisted last result
  useEffect(() => {
    if (status && !liveResult) {
      setLiveResult(status)
    }
  }, [status, liveResult])

  const configMutation = useMutation({
    mutationFn: (enabled: boolean) => monitorApi.config({ enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitor-info'] }),
  })

  const handleTrigger = async () => {
    setIsTriggerLoading(true)
    try {
      const result = await monitorApi.trigger()
      setLiveResult(result)
      setHistory(prev => {
        // Avoid duplicate results with the same checkNumber and timestamp
        if (prev.length > 0 && 
            prev[0].checkNumber === result.checkNumber && 
            prev[0].timestamp === result.timestamp) {
          return prev
        }
        return [result, ...prev].slice(0, MAX_HISTORY)
      })
      queryClient.invalidateQueries({ queryKey: ['monitor-info'] })
    } catch (err) {
      console.error('Trigger failed', err)
    } finally {
      setIsTriggerLoading(false)
    }
  }

  const displayResult = liveResult ?? status ?? null
  const enabled = info?.enabled ?? true

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-yellow-400" />
            Captcha Monitor
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sub-agent otomatis scrape web target setiap 30 detik via FlareSolverr
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Enable/Disable toggle */}
          <button
            onClick={() => configMutation.mutate(!enabled)}
            disabled={configMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all',
              enabled
                ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                : 'bg-slate-700/50 text-slate-400 border-white/10 hover:bg-slate-700'
            )}
          >
            {enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {enabled ? 'Running' : 'Paused'}
          </button>

          {/* Manual trigger */}
          <button
            onClick={handleTrigger}
            disabled={isTriggerLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-yellow-500 hover:bg-yellow-400 text-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={cn('w-4 h-4', isTriggerLoading && 'animate-spin')} />
            {isTriggerLoading ? 'Checking...' : 'Check Sekarang'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Total Checks</p>
          <p className="text-2xl font-bold text-white">{info?.checkCount ?? 0}</p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <p className={cn('text-sm font-bold', enabled ? 'text-green-400' : 'text-slate-400')}>
            {enabled ? 'Aktif (30s)' : 'Dijeda'}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">CF Bypass</p>
          <p className={cn('text-sm font-bold',
            displayResult?.cfClearanceObtained ? 'text-green-400' : 'text-red-400')}>
            {displayResult
              ? (displayResult.cfClearanceObtained ? 'OK' : 'Blocked')
              : '—'}
          </p>
        </div>
        <div className="bg-slate-800/60 rounded-xl border border-white/5 p-4">
          <p className="text-xs text-slate-400 mb-1">Captcha Terakhir</p>
          <p className={cn('text-sm font-bold',
            displayResult?.captchaSolved ? 'text-green-400' :
            displayResult?.captchaType === 'TEXT_QUESTION' ? 'text-blue-400' :
            displayResult?.captchaType && ['IMAGE','RECAPTCHA','HCAPTCHA'].includes(displayResult.captchaType) ? 'text-orange-400' :
            'text-slate-400')}>
            {displayResult?.captchaType
              ? displayResult.captchaType === 'ARITHMETIC'
                ? (displayResult.captchaQuestion ?? 'Arithmetic')
                : displayResult.captchaType === 'NONE'
                  ? 'Tidak ada'
                  : displayResult.captchaType
              : '—'}
          </p>
        </div>
      </div>

      {/* Latest result */}
      {isTriggerLoading && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10">
          <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
          <div>
            <p className="text-sm font-medium text-yellow-300">Menghubungi FlareSolverr...</p>
            <p className="text-xs text-slate-400 mt-0.5">Proses bypass CF + extract captcha (~30-60 detik)</p>
          </div>
        </div>
      )}

      {displayResult && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Hasil Terbaru
          </h2>
          <ResultCard result={displayResult} isLatest />
        </div>
      )}

      {!displayResult && !isTriggerLoading && (
        <div className="text-center py-16 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Belum ada hasil. Klik "Check Sekarang" untuk memulai.</p>
        </div>
      )}

      {/* Live history from WebSocket */}
      {history.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Riwayat Sesi Ini ({history.length})
          </h2>
          <div className="space-y-3">
            {history.slice(1).map((r) => (
              <ResultCard key={`${r.checkNumber}-${r.timestamp}`} result={r} />
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="rounded-xl border border-white/5 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <p className="font-medium text-slate-400">Cara kerja sub-agent ini:</p>
        <p>1. Setiap 30 detik, sistem mengirim request ke FlareSolverr yang membuka Chromium headless</p>
        <p>2. Chromium menyelesaikan Cloudflare Interactive Challenge dan mengembalikan HTML halaman asli</p>
        <p>3. HTML di-parse untuk mengekstrak soal aritmatika captcha (misal: "3 + 7 = ?")</p>
        <p>4. Solusi dihitung otomatis dan ditampilkan di sini</p>
        <p>5. Hasil di-broadcast via WebSocket sehingga halaman ini update secara real-time</p>
      </div>
    </div>
  )
}
