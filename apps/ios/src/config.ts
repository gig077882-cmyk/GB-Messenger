export type KrugConfig = {
  apiUrl: string
  wsUrl: string
}

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '')

export const config: KrugConfig = {
  apiUrl: trimTrailingSlash(process.env.KRUG_API_URL ?? 'https://localhost'),
  wsUrl: trimTrailingSlash(process.env.KRUG_WS_URL ?? 'wss://localhost'),
}
