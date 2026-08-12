import { config } from '../config'

export class ApiClient {
  constructor(private readonly getAccessToken: () => Promise<string | null>) {}

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.getAccessToken()
    const response = await fetch(`${config.apiUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    })

    if (!response.ok) throw new Error(`API request failed: ${response.status}`)
    return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>)
  }
}
