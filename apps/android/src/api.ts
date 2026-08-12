import {config} from './config';
import type {AuthResponse, Chat, Message, User} from './types';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
  }
}

export class ApiClient {
  constructor(private readonly getAccessToken: () => Promise<string | null>) {}

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const response = await fetch(`${config.apiUrl}/api${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? {'Content-Type': 'application/json'} : {}),
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new ApiError(data.message ?? `Request failed (${response.status})`, response.status, data.error);
    }
    return data as T;
  }

  bootstrap(email: string, password: string, displayName: string) {
    return this.request<AuthResponse>('POST', '/auth/bootstrap', {email, password, displayName});
  }

  login(email: string, password: string) {
    return this.request<AuthResponse>('POST', '/auth/login', {email, password});
  }

  me() {
    return this.request<User>('GET', '/me');
  }

  chats() {
    return this.request<Chat[]>('GET', '/chats');
  }

  messages(chatId: string, before?: string, limit = 50) {
    const query = `?limit=${limit}${before ? `&before=${encodeURIComponent(before)}` : ''}`;
    return this.request<Message[]>('GET', `/chats/${chatId}/messages${query}`);
  }

  sendMessage(chatId: string, text: string) {
    return this.request<Message>('POST', `/chats/${chatId}/messages`, {kind: 'text', text});
  }
}
