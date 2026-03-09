import SockJS from 'sockjs-client'
import { Client, StompSubscription } from '@stomp/stompjs'
import { useAuthStore } from '../store/authStore'

type WsCallback = (payload: unknown) => void

const getWsUrl = () => {
  // In production (Vercel), use the environment variable
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }
  // In development, use relative path which proxies to localhost:8081
  return '/api/ws'
}

class WebSocketService {
  private client: Client | null = null
  private subscriptions: Map<string, StompSubscription> = new Map()
  private connected = false
  private connectCallbacks: (() => void)[] = []

  connect(onConnect?: () => void) {
    if (this.connected) {
      onConnect?.()
      return
    }
    if (onConnect) this.connectCallbacks.push(onConnect)

    const token = useAuthStore.getState().token
    this.client = new Client({
      webSocketFactory: () => new SockJS(getWsUrl()),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        this.connected = true
        this.connectCallbacks.forEach(cb => cb())
        this.connectCallbacks = []
      },
      onDisconnect: () => {
        this.connected = false
        this.subscriptions.clear()
      },
      onStompError: (err) => {
        console.error('STOMP error:', err)
      }
    })
    this.client.activate()
  }

  disconnect() {
    this.client?.deactivate()
    this.connected = false
    this.subscriptions.clear()
  }

  subscribe(destination: string, callback: WsCallback): () => void {
    const doSubscribe = () => {
      if (!this.client || !this.connected) return
      const sub = this.client.subscribe(destination, (msg) => {
        try {
          callback(JSON.parse(msg.body))
        } catch {
          callback(msg.body)
        }
      })
      this.subscriptions.set(destination, sub)
    }

    if (this.connected) {
      doSubscribe()
    } else {
      this.connect(doSubscribe)
    }

    return () => {
      const sub = this.subscriptions.get(destination)
      sub?.unsubscribe()
      this.subscriptions.delete(destination)
    }
  }
}

export const wsService = new WebSocketService()
