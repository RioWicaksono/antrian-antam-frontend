import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(str: string): string {
  if (!str) return '-'
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export function formatTime(str: string): string {
  if (!str) return '-'
  return new Date(str).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  })
}

export const STATUS_LABEL: Record<string, string> = {
  IDLE: 'Idle',
  WAITING: 'Menunggu',
  PRESOLVING: 'Pre-solving',
  RUNNING: 'Berjalan',
  COMPLETED: 'Selesai',
  SUCCESS: 'Sukses',
  PARTIAL: 'Sebagian',
  FAILED: 'Gagal',
  CANCELLED: 'Dibatalkan',
}
