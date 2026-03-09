export interface Account {
  id: number
  email: string
  phoneNumber?: string
  displayName?: string
  active: boolean
  loggedIn: boolean
  proxyId?: number
  proxyUrl?: string
  ringId?: number
  ringNumber?: number
  ringAlias?: string
  createdAt: string
  updatedAt: string
}

export interface Proxy {
  id: number
  name?: string
  proxyUrl: string
  proxyType: string
  host?: string
  port?: number
  country?: string
  active: boolean
  working?: boolean
  lastCheckedAt?: string
  createdAt: string
}

export interface Ring {
  id: number
  ringNumber: number
  alias: string
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface Branch {
  id: number
  code: string
  name: string
  active: boolean
}

export type TaskStatus =
  | 'IDLE' | 'WAITING' | 'PRESOLVING' | 'RUNNING'
  | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED'

export interface SnipeTask {
  id: number
  name: string
  branchCode: string
  branchName?: string
  targetDateTime: string
  status: TaskStatus
  accountIds?: number[]
  totalAccounts?: number
  successCount?: number
  failCount?: number
  startedAt?: string
  completedAt?: string
  useRandomLocation?: boolean
  createdAt: string
}

export interface TaskLog {
  id: number
  taskId: number
  accountEmail?: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS'
  message: string
  createdAt: string
}

export interface Ticket {
  id: number
  taskId?: number
  accountId?: number
  accountEmail?: string
  branchId?: number
  branchCode?: string
  branchName?: string
  queueNumber?: string
  holderName?: string
  arrivalTime?: string
  bookedAt: string
}

export interface DashboardStats {
  totalAccounts: number
  activeAccounts: number
  loggedInAccounts: number
  totalProxies: number
  activeProxies: number
  totalTasks: number
  totalTickets: number
}

export interface AppSettings {
  pollIntervalMs: number
  presolveBeforeSec: number
  maxConcurrentAccounts: number
  capsolverApiKey: string
  recaptchaSitekey: string
  baseUrl: string
}

export interface WsEvent {
  type: 'LOG' | 'TASK_UPDATE' | 'TICKET_SUCCESS' | 'ACCOUNT_STATUS'
  taskId?: number
  message?: string
  payload?: unknown
  timestamp: string
}
