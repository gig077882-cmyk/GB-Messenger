import { uploadFile, type UploadProgress } from './upload';

export interface QueueItem {
  id: string;
  file: File;
  chatId: string;
  replyToId?: string;
  status: 'pending' | 'uploading' | 'paused' | 'done' | 'error';
  progress: UploadProgress | null;
  uploadId?: string;
  retryCount: number;
  error?: string;
  abortController?: AbortController;
}

export class UploadQueueManager {
  readonly MAX_CONCURRENT = 2;
  private items: Map<string, QueueItem> = new Map();
  private onChange: (items: QueueItem[]) => void;
  private onComplete: (item: QueueItem, fileId: string) => void;

  constructor(
    onChange: (items: QueueItem[]) => void,
    onComplete: (item: QueueItem, fileId: string) => void,
  ) {
    this.onChange = onChange;
    this.onComplete = onComplete;
  }

  getItems(): QueueItem[] {
    return Array.from(this.items.values());
  }

  add(file: File, chatId: string, replyToId?: string): string {
    const id = crypto.randomUUID();
    const item: QueueItem = {
      id,
      file,
      chatId,
      replyToId,
      status: 'pending',
      progress: null,
      retryCount: 0,
    };
    this.items.set(id, item);
    this._notify();
    this._tick();
    return id;
  }

  remove(id: string): void {
    const item = this.items.get(id);
    if (!item) return;
    if (item.status === 'uploading') {
      item.abortController?.abort();
    }
    this.items.delete(id);
    this._notify();
  }

  pause(id: string): void {
    const item = this.items.get(id);
    if (!item || item.status !== 'uploading') return;
    item.abortController?.abort();
    item.status = 'paused';
    this._notify();
  }

  resume(id: string): void {
    const item = this.items.get(id);
    if (!item || item.status !== 'paused') return;
    item.status = 'pending';
    this._notify();
    this._tick();
  }

  retry(id: string): void {
    const item = this.items.get(id);
    if (!item || item.status !== 'error') return;
    item.retryCount++;
    item.status = 'pending';
    item.error = undefined;
    this._notify();
    this._tick();
  }

  clearDone(): void {
    for (const [id, item] of this.items) {
      if (item.status === 'done') {
        this.items.delete(id);
      }
    }
    this._notify();
  }

  _tick(): void {
    const uploadingCount = this.getItems().filter(
      (i) => i.status === 'uploading',
    ).length;
    const freeSlots = this.MAX_CONCURRENT - uploadingCount;
    if (freeSlots <= 0) return;

    const pendingItems = this.getItems().filter((i) => i.status === 'pending');
    for (let i = 0; i < Math.min(freeSlots, pendingItems.length); i++) {
      this._start(pendingItems[i]);
    }
  }

  _start(item: QueueItem): void {
    const abortController = new AbortController();
    item.abortController = abortController;
    item.status = 'uploading';
    this._notify();

    uploadFile(
      item.file,
      (p: UploadProgress) => {
        item.progress = p;
        item.uploadId = p.uploadId;
        this._notify();
      },
      abortController.signal,
    )
      .then((uploadId: string) => {
        item.status = 'done';
        item.uploadId = uploadId;
        this._notify();
        this.onComplete(item, uploadId);
        this._tick();
      })
      .catch((e: unknown) => {
        const err = e as Error;
        if (err.name === 'AbortError' && item.status === 'paused') {
          return;
        }
        item.status = 'error';
        item.error = err.message ?? 'Upload failed';
        this._notify();
        this._tick();
      });
  }

  _notify(): void {
    this.onChange(this.getItems());
  }
}
