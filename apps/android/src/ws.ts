import {config} from './config';
import type {WsEvent} from './types';

type Listener = (event: WsEvent) => void;

export class KrugWebSocket {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private attempts = 0;
  private closedByUser = false;
  private listeners = new Set<Listener>();

  connect(accessToken: string) {
    this.token = accessToken;
    this.closedByUser = false;
    this.open();
  }

  disconnect() {
    this.closedByUser = true;
    this.token = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.socket?.close();
    this.socket = null;
  }

  on(listener: Listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private open() {
    if (!this.token || this.socket?.readyState === WebSocket.OPEN) return;
    const url = `${config.wsUrl}/ws?token=${encodeURIComponent(this.token)}`;
    const socket = new WebSocket(url);
    this.socket = socket;

    socket.onopen = () => {
      this.attempts = 0;
    };
    socket.onmessage = event => {
      try {
        const parsed = JSON.parse(String(event.data)) as WsEvent;
        this.listeners.forEach(listener => listener(parsed));
      } catch {
        // Ignore malformed server events.
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.socket === socket) this.socket = null;
      if (!this.closedByUser) this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    const delay = Math.min(30_000, 1_000 * 2 ** Math.min(this.attempts++, 5));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.open();
    }, delay);
  }
}
