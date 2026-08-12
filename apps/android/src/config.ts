export type KrugConfig = {
  apiUrl: string;
  wsUrl: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/$/, '');

// These are public build-time values, not credentials. Override with Gradle -P flags.
declare const __KRUG_API_URL__: string | undefined;
declare const __KRUG_WS_URL__: string | undefined;

export const config: KrugConfig = {
  apiUrl: trimTrailingSlash(
    typeof __KRUG_API_URL__ === 'string' && __KRUG_API_URL__
      ? __KRUG_API_URL__
      : 'https://invalid.krug.local',
  ),
  wsUrl: trimTrailingSlash(
    typeof __KRUG_WS_URL__ === 'string' && __KRUG_WS_URL__
      ? __KRUG_WS_URL__
      : 'wss://invalid.krug.local',
  ),
};
