// ─── Resumable chunked upload ─────────────────────────────────────────────────
import { uploads } from './api';

const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MiB

export interface UploadProgress {
  uploadId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: number;
  status: 'uploading' | 'assembling' | 'ready' | 'error';
  error?: string;
}

export type ProgressCallback = (p: UploadProgress) => void;

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function uploadFile(
  file: File,
  onProgress: ProgressCallback,
  signal?: AbortSignal,
): Promise<string> {
  // Compute full-file SHA-256
  const fileBuffer = await file.arrayBuffer();
  const fileSha256 = await sha256Hex(fileBuffer);

  const { id: uploadId, totalChunks } = await uploads.create(
    file.name,
    file.type || 'application/octet-stream',
    file.size,
    fileSha256,
  );

  const progress: UploadProgress = {
    uploadId,
    fileName: file.name,
    totalChunks,
    uploadedChunks: 0,
    status: 'uploading',
  };
  onProgress({ ...progress });

  // Check which chunks are already uploaded (resume support)
  const status = await uploads.status(uploadId);
  const uploaded = new Set((status.chunks ?? []).map((c) => c.chunk_index));

  for (let i = 0; i < totalChunks; i++) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (uploaded.has(i)) {
      progress.uploadedChunks++;
      onProgress({ ...progress });
      continue;
    }
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    await uploads.putChunk(uploadId, i, chunk);
    progress.uploadedChunks++;
    onProgress({ ...progress });
  }

  progress.status = 'assembling';
  onProgress({ ...progress });

  const result = await uploads.complete(uploadId);
  progress.status = result.status;
  onProgress({ ...progress });

  return uploadId;
}
