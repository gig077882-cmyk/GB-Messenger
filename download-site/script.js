const releaseApi = 'https://api.github.com/repos/gig077882-cmyk/GB-Messenger/releases/latest';
const status = document.querySelector('#release-status');
const download = document.querySelector('.button-primary');

document.querySelectorAll('a[target="_blank"]').forEach((link) => {
  link.setAttribute('rel', 'noopener noreferrer');
});

fetch(releaseApi, {headers: {Accept: 'application/vnd.github+json'}})
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((release) => {
    const asset = release.assets?.find((item) => item.name === 'GB-Messenger-0.1.0-release.apk');
    if (asset?.browser_download_url?.startsWith('https://')) download.href = asset.browser_download_url;
    status.textContent = `Версия ${release.tag_name || 'latest'} · опубликована ${new Date(release.published_at).toLocaleDateString('ru-RU')}`;
  })
  .catch(() => {
    status.textContent = 'Актуальная версия доступна по стабильной ссылке';
  });
