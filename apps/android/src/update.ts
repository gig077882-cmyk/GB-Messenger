import {Alert, NativeModules} from 'react-native';
import {config} from './config';

type ReleaseManifest = {
  platform: 'android';
  version: string;
  versionCode: number;
  minSupportedVersionCode: number;
  downloadUrl: string;
  sha256: string | null;
  notes: string;
};

type NativeUpdateModule = {
  versionCode: number;
  versionName: string;
  openDownload: (url: string) => Promise<boolean>;
};

const nativeUpdate = NativeModules.KrugUpdate as NativeUpdateModule | undefined;

export async function checkForUpdate(options: {silent?: boolean} = {}) {
  if (!nativeUpdate) return;
  try {
    const response = await fetch(`${config.apiUrl}/api/releases/android/latest`, {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const release = (await response.json()) as ReleaseManifest;
    if (!Number.isInteger(release.versionCode) || !release.downloadUrl.startsWith('https://')) throw new Error('╨Э╨╡╨║╨╛╤А╤А╨╡╨║╤В╨╜╤Л╨╣ ╨╝╨░╨╜╨╕╤Д╨╡╤Б╤В ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╤П');
    if (release.versionCode <= nativeUpdate.versionCode) {
      if (!options.silent) Alert.alert('╨Ю╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╤П', `╨г╤Б╤В╨░╨╜╨╛╨▓╨╗╨╡╨╜╨░ ╨░╨║╤В╤Г╨░╨╗╤М╨╜╨░╤П ╨▓╨╡╤А╤Б╨╕╤П ${nativeUpdate.versionName}.`);
      return;
    }
    const required = nativeUpdate.versionCode < release.minSupportedVersionCode;
    const message = release.notes + (release.sha256 ? `\n\nSHA-256: ${release.sha256}` : '');
    const download = () => { nativeUpdate.openDownload(release.downloadUrl).catch(() => Alert.alert('╨Ю╤И╨╕╨▒╨║╨░', '╨Э╨╡ ╤Г╨┤╨░╨╗╨╛╤Б╤М ╨╛╤В╨║╤А╤Л╤В╤М ╤Б╤В╤А╨░╨╜╨╕╤Ж╤Г ╨╖╨░╨│╤А╤Г╨╖╨║╨╕')); };
    Alert.alert(required ? '╨в╤А╨╡╨▒╤Г╨╡╤В╤Б╤П ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╨╡' : `╨Ф╨╛╤Б╤В╤Г╨┐╨╜╨░ ╨▓╨╡╤А╤Б╨╕╤П ${release.version}`, message, required ? [{text: '╨б╨║╨░╤З╨░╤В╤М', onPress: download}] : [{text: '╨Я╨╛╨╖╨╢╨╡', style: 'cancel'}, {text: '╨б╨║╨░╤З╨░╤В╤М', onPress: download}], {cancelable: !required});
  } catch (error) {
    if (!options.silent) Alert.alert('╨Я╤А╨╛╨▓╨╡╤А╨║╨░ ╨╛╨▒╨╜╨╛╨▓╨╗╨╡╨╜╨╕╨╣', error instanceof Error ? error.message : '╨Э╨╡ ╤Г╨┤╨░╨╗╨╛╤Б╤М ╨┐╤А╨╛╨▓╨╡╤А╨╕╤В╤М ╨▓╨╡╤А╤Б╨╕╤О');
  }
}
