import { config } from '../config'

export type WsEvent = { type: string; [key: string]: unknown }

export const connectWebSocket = async (
  getAccessToken: () => Promise<string | null>,
  onEvent: (event: WsEvent) => void,
): Promise<WebSocket> => {
  const token = await getAccessToken()
  if (!token) throw new Error('Authentication is required before opening WebSocket')

  const socket = new WebSocket(`${config.wsUrl}/ws?token=${encodeURIComponent(token)}`)
  socket.addEventListener('message', ({ data }) => onEvent(JSON.parse(String(data)) as WsEvent))
  return socket
}
