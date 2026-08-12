import * as Keychain from 'react-native-keychain';

const SERVICE = 'com.krug.messenger.tokens';

type Tokens = {accessToken: string};

export async function loadTokens(): Promise<Tokens | null> {
  const credentials = await Keychain.getGenericPassword({service: SERVICE});
  if (!credentials) return null;
  try {
    return JSON.parse(credentials.password) as Tokens;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function saveTokens(tokens: Tokens): Promise<void> {
  await Keychain.setGenericPassword('krug', JSON.stringify(tokens), {
    service: SERVICE,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
  });
}

export async function clearTokens(): Promise<void> {
  await Keychain.resetGenericPassword({service: SERVICE});
}
