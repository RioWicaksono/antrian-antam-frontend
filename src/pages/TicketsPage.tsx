import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ticketsApi } from '../services/api'
import { Ticket } from '../types'
import { Ticket as TicketIcon, Download, Search, Loader2 } from 'lucide-react'
import { formatDate } from '../lib/utils'

export default function TicketsPage() {
  const [search, setSearch] = useState('')

  const { data: tickets = [], isLoading } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: ticketsApi.list,
    refetchInterval: 10_000,
  })

  const filtered = tickets.filter(t =>
    t.accountEmail?.toLowerCase().includes(search.toLowerCase()) ||
    String(t.queueNumber).includes(search) ||
    t.branchCode?.toLowerCase().includes(search.toLowerCase()) ||
    (t.holderName || '').toLowerCase().includes(search.toLowerCase())
  )

  function exportCsv() {
    const header = 'ID,Akun,Cabang,No Antrian,Nama,Jam Kedatangan,Dibooking'
    const rows = filtered.map(t =>
      [t.id, t.accountEmail, t.branchCode, t.queueNumber, t.holderName || '', t.arrivalTime || '', t.bookedAt].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tiket-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <TicketIcon className="w-5 h-5 text-green-400" />
          <h1 className="text-xl font-bold text-white">Tiket Berhasil</h1>
          <span className="bg-slate-700 text-slate-300 text-xs px-2 py-0.5 rounded-full">{tickets.length}</span>
        </div>
        <button onClick={exportCsv}
          disabled={tickets.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors disabled:opacity-40">
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-400">{tickets.length}</p>
          <p className="text-xs text-slate-400 mt-1">Total Tiket</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            {new Set(tickets.map(t => t.accountEmail)).size}
          </p>
          <p className="text-xs text-slate-400 mt-1">Akun Berhasil</p>
        </div>
        <div className="bg-slate-900 border border-white/10 rounded-xl p-4 text-center sm:col-auto col-span-2">
          <p className="text-3xl font-bold text-blue-400">
            {new Set(tickets.map(t => t.branchCode)).size}
          </p>
          <p className="text-xs text-slate-400 mt-1">Cabang Berbeda</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500/30"
          placeholder="Cari tiket..." />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <TicketIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'Tidak ada hasil pencarian' : 'Belum ada tiket berhasil'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Akun</th>
                  <th className="text-left px-4 py-3 font-medium">Cabang</th>
                  <th className="text-center px-4 py-3 font-medium">No Antrian</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Nama Pemegang</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Jam Kedatangan</th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">Waktu Booking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((t, i) => (
                  <tr key={t.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-600">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-slate-300">{t.accountEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-700 text-slate-200 px-2 py-0.5 rounded">{t.branchCode}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-yellow-400 text-lg">{t.queueNumber}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white hidden md:table-cell">
                      {t.holderName || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell">
                      {t.arrivalTime || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden xl:table-cell">
                      {formatDate(t.bookedAt)}
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
