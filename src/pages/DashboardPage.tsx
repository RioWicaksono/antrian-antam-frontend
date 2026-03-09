import { useQuery } from '@tanstack/react-query'
import { dashboardApi, tasksApi, ticketsApi } from '../services/api'
import { DashboardStats, SnipeTask, Ticket } from '../types'
import { Link } from 'react-router-dom'
import {
  Users, Globe, CalendarClock, Ticket as TicketIcon,
  TrendingUp, Activity, CheckCircle2, XCircle, Zap
} from 'lucide-react'
import { formatDate, STATUS_LABEL } from '../lib/utils'
import StatusBadge from '../components/StatusBadge'

function StatCard({
  label, value, icon: Icon, color, sub
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  sub?: string
}) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['stats'],
    queryFn: dashboardApi.stats,
    refetchInterval: 10_000,
  })

  const { data: tasks = [] } = useQuery<SnipeTask[]>({
    queryKey: ['tasks'],
    queryFn: tasksApi.list,
    refetchInterval: 10_000,
  })

  const { data: tickets = [] } = useQuery<Ticket[]>({
    queryKey: ['tickets'],
    queryFn: ticketsApi.list,
    refetchInterval: 30_000,
  })

  const activeTasks = tasks.filter(t =>
    t.status === 'RUNNING' || t.status === 'WAITING'
  )
  const recentTickets = tickets.slice(0, 5)
  const recentTasks = tasks.slice(0, 6)

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-yellow-500">
          <Zap className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <p className="text-xs text-slate-400">Antrian Logam Mulia Auto-Booking</p>
        </div>
        {activeTasks.length > 0 && (
          <div className="ml-auto flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-3 py-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs text-yellow-400 font-medium">{activeTasks.length} task aktif</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Akun"
          value={stats?.totalAccounts ?? 0}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
          sub={`${stats?.loggedInAccounts ?? 0} login aktif`}
        />
        <StatCard
          label="Proxy Aktif"
          value={stats?.activeProxies ?? 0}
          icon={Globe}
          color="bg-purple-500/20 text-purple-400"
          sub={`dari ${stats?.totalProxies ?? 0} total`}
        />
        <StatCard
          label="Total Task"
          value={stats?.totalTasks ?? 0}
          icon={CalendarClock}
          color="bg-yellow-500/20 text-yellow-400"
          sub={`${activeTasks.length} sedang berjalan`}
        />
        <StatCard
          label="Tiket Berhasil"
          value={stats?.totalTickets ?? 0}
          icon={TicketIcon}
          color="bg-green-500/20 text-green-400"
          sub="dari semua task"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="bg-slate-900 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-yellow-400" />
              Task Terbaru
            </h2>
            <Link to="/tasks" className="text-xs text-yellow-400 hover:text-yellow-300">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentTasks.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">Belum ada task</p>
            ) : recentTasks.map(task => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {task.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {task.targetDateTime ? new Date(task.targetDateTime).toLocaleString('id-ID') : ''} · {task.accountIds?.length ?? task.totalAccounts ?? 0} akun
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-3">
                  {task.status === 'COMPLETED' || task.status === 'PARTIAL' ? (
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {task.successCount}/{task.accountIds?.length ?? task.totalAccounts ?? 0}
                    </span>
                  ) : task.status === 'FAILED' ? (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      Gagal
                    </span>
                  ) : null}
                  <StatusBadge status={task.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-slate-900 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              Tiket Terbaru
            </h2>
            <Link to="/tickets" className="text-xs text-yellow-400 hover:text-yellow-300">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {recentTickets.length === 0 ? (
              <p className="text-center text-slate-500 text-sm py-8">Belum ada tiket berhasil</p>
            ) : recentTickets.map(ticket => (
              <div key={ticket.id} className="px-5 py-3 success-glow-row">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">
                      {ticket.accountEmail}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ticket.branchName} · No. {ticket.queueNumber}
                    </p>
                    <p className="text-xs text-green-400 mt-0.5">
                      Kedatangan: {ticket.arrivalTime}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 flex-shrink-0 ml-2">
                    {formatDate(ticket.bookedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
