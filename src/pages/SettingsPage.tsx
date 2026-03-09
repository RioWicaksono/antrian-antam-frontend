import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { dashboardApi, authApi } from '../services/api'
import { AppSettings } from '../types'
import { Settings, Save, Lock, Loader2, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    pollIntervalMs: 20,
    presolveBeforeSec: 17,
    capsolverApiKey: '',
    maxConcurrentAccounts: 300,
    recaptchaSitekey: '',
    baseUrl: '',
  })
  const [toast, setToast] = useState('')
  const [toastColor, setToastColor] = useState('green')
  const [showKey, setShowKey] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const { data: serverSettings, isLoading } = useQuery<AppSettings>({
    queryKey: ['settings'],
    queryFn: dashboardApi.settings,
  })

  useEffect(() => {
    if (serverSettings) setSettings(serverSettings)
  }, [serverSettings])

  function showToast(msg: string, color = 'green') {
    setToast(msg)
    setToastColor(color)
    setTimeout(() => setToast(''), 3500)
  }

  const saveMut = useMutation({
    mutationFn: () => dashboardApi.updateSettings(settings as unknown as Record<string, unknown>),
    onSuccess: () => showToast('Pengaturan tersimpan'),
    onError: () => showToast('Gagal menyimpan', 'red'),
  })

  const pwMut = useMutation({
    mutationFn: () => authApi.changePassword(pwForm.currentPassword, pwForm.newPassword),
    onSuccess: () => {
      showToast('Password berhasil diubah')
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    },
    onError: () => showToast('Gagal mengubah password', 'red'),
  })

  function handlePwSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      showToast('Password baru tidak cocok', 'red')
      return
    }
    if (pwForm.newPassword.length < 6) {
      showToast('Password minimal 6 karakter', 'red')
      return
    }
    pwMut.mutate()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {toast && (
        <div className={`fixed top-4 right-4 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 ${toastColor === 'green' ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-slate-400" />
        <h1 className="text-xl font-bold text-white">Pengaturan Aplikasi</h1>
      </div>

      {/* Bot Settings */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 pb-2 border-b border-white/10">Konfigurasi Bot</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                Interval Polling (ms)
                <span className="ml-1 text-slate-600">· default: 20</span>
              </label>
              <input
                type="number"
                min={5}
                max={5000}
                value={settings.pollIntervalMs}
                onChange={e => setSettings(s => ({ ...s, pollIntervalMs: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">Seberapa cepat bot mencoba submit antrian. Lebih kecil = lebih cepat.</p>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">
                Pre-solve Sebelum (detik)
                <span className="ml-1 text-slate-600">· default: 17</span>
              </label>
              <input
                type="number"
                min={5}
                max={60}
                value={settings.presolveBeforeSec}
                onChange={e => setSettings(s => ({ ...s, presolveBeforeSec: Number(e.target.value) }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
              />
              <p className="text-xs text-slate-600 mt-1">Berapa detik sebelum target, bot mulai menyelesaikan CAPTCHA.</p>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">
              Maks Akun Concurrent
              <span className="ml-1 text-slate-600">· default: 300</span>
            </label>
            <input
              type="number"
              min={1}
              max={1000}
              value={settings.maxConcurrentAccounts}
              onChange={e => setSettings(s => ({ ...s, maxConcurrentAccounts: Number(e.target.value) }))}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Capsolver API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.capsolverApiKey}
                onChange={e => setSettings(s => ({ ...s, capsolverApiKey: e.target.value }))}
                className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 pr-10 text-sm text-white font-mono focus:outline-none focus:border-yellow-500/50"
                placeholder="CAP-xxxxxxxxxxxxxxxxxxxxxx"
              />
              <button type="button" onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Dapatkan API key di{' '}
              <a href="https://capsolver.com" target="_blank" rel="noopener noreferrer" className="text-yellow-500 hover:underline">
                capsolver.com
              </a>
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-sm font-medium transition-colors disabled:opacity-50">
              {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Simpan Pengaturan
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
          <Lock className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-white">Ganti Password</h2>
        </div>
        <form onSubmit={handlePwSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Password Saat Ini</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Password Baru</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
              required
              minLength={6}
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500/50"
            />
          </div>
          <button
            type="submit"
            disabled={pwMut.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {pwMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Ganti Password
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3 pb-2 border-b border-white/10">Informasi Sistem</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Aplikasi</span>
            <span className="text-white">Antrian Logam Mulia Auto-Booking</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Backend</span>
            <span className="text-slate-200">Spring Boot 3 + Java 21</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Frontend</span>
            <span className="text-slate-200">React 18 + Vite + PWA</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Target</span>
            <a href="https://antrean.logammulia.com" target="_blank" rel="noopener noreferrer"
              className="text-yellow-400 hover:underline">
              antrean.logammulia.com
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
