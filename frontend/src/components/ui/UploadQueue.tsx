import { useUploadQueueStore } from '@/store/uploadQueue';
import { formatFileSize } from '@/lib/format';
import type { QueueItem } from '@/lib/uploadQueue';
import styles from './UploadQueue.module.css';

function StatusIcon({ item }: { item: QueueItem }) {
  switch (item.status) {
    case 'uploading':
      return <span className={styles.statusUploading} title="Загружается">↑</span>;
    case 'paused':
      return <span className={styles.statusPaused} title="Пауза">⏸</span>;
    case 'done':
      return <span className={styles.statusDone} title="Готово">✓</span>;
    case 'error':
      return <span className={styles.statusError} title="Ошибка">✕</span>;
    case 'pending':
    default:
      return <span className={styles.statusPending} title="Ожидание">⏳</span>;
  }
}

function StatusLabel({ item }: { item: QueueItem }) {
  switch (item.status) {
    case 'uploading': {
      const p = item.progress;
      if (p && p.totalChunks > 0) {
        const pct = Math.round((p.uploadedChunks / p.totalChunks) * 100);
        if (p.status === 'assembling') return <span className={styles.statusLabelUploading}>Сборка…</span>;
        return <span className={styles.statusLabelUploading}>{pct}%</span>;
      }
      return <span className={styles.statusLabelUploading}>Загрузка…</span>;
    }
    case 'paused':
      return <span className={styles.statusLabelPaused}>Пауза</span>;
    case 'done':
      return <span className={styles.statusLabelDone}>Готово</span>;
    case 'error':
      return <span className={styles.statusLabelError}>Ошибка</span>;
    case 'pending':
    default:
      return <span className={styles.statusLabelPending}>Ожидание</span>;
  }
}

function ProgressBar({ item }: { item: QueueItem }) {
  if (item.status !== 'uploading' && item.status !== 'paused') return null;
  const p = item.progress;
  const pct =
    p && p.totalChunks > 0
      ? Math.round((p.uploadedChunks / p.totalChunks) * 100)
      : 0;

  return (
    <div className={styles.progressTrack}>
      <div
        className={`${styles.progressBar} ${item.status === 'uploading' ? styles.progressBarActive : styles.progressBarPaused}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function UploadQueue() {
  const { items, isVisible, pause, resume, retry, remove, clearDone, toggleVisible } =
    useUploadQueueStore();

  if (items.length === 0) return null;

  const hasDone = items.some((i) => i.status === 'done');

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.title}>Загрузки ({items.length})</span>
        <div className={styles.headerActions}>
          {hasDone && (
            <button
              className={styles.btnClear}
              onClick={clearDone}
              title="Очистить завершённые"
            >
              Очистить
            </button>
          )}
          <button
            className={styles.btnToggle}
            onClick={toggleVisible}
            title={isVisible ? 'Свернуть' : 'Развернуть'}
          >
            {isVisible ? '−' : '+'}
          </button>
        </div>
      </div>

      {/* List */}
      {isVisible && (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={`${styles.item} ${styles[`item_${item.status}`]}`}>
              <div className={styles.itemTop}>
                <span className={styles.fileIcon}>📎</span>
                <div className={styles.fileInfo}>
                  <span className={styles.fileName} title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span className={styles.fileMeta}>
                    {formatFileSize(item.file.size)}
                    {item.retryCount > 0 && (
                      <span className={styles.retryBadge}> · попытка {item.retryCount + 1}</span>
                    )}
                  </span>
                </div>
                <div className={styles.itemStatus}>
                  <StatusIcon item={item} />
                  <StatusLabel item={item} />
                </div>
                {item.status !== 'done' && (
                  <button
                    className={styles.btnRemove}
                    onClick={() => remove(item.id)}
                    title="Удалить"
                  >
                    ✕
                  </button>
                )}
              </div>

              <ProgressBar item={item} />

              {item.status === 'error' && item.error && (
                <div className={styles.errorText}>{item.error}</div>
              )}

              <div className={styles.itemActions}>
                {item.status === 'uploading' && (
                  <button className={styles.btnAction} onClick={() => pause(item.id)}>
                    ⏸ Пауза
                  </button>
                )}
                {item.status === 'paused' && (
                  <button className={styles.btnAction} onClick={() => resume(item.id)}>
                    ▶ Возобновить
                  </button>
                )}
                {item.status === 'error' && (
                  <button className={styles.btnAction} onClick={() => retry(item.id)}>
                    🔄 Повтор
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UploadQueue;
