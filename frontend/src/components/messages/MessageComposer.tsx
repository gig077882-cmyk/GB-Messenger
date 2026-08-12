import { useRef, useState } from 'react';
import { messages as messagesApi } from '@/lib/api';
import { uploadFile, type UploadProgress } from '@/lib/upload';
import { useChatsStore } from '@/store/chats';
import { useTyping } from '@/hooks/useTyping';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { formatDuration, formatFileSize } from '@/lib/format';
import type { Message } from '@/types/api';
import styles from './MessageComposer.module.css';

interface MessageComposerProps { chatId: string; replyTo: Message | null; onCancelReply: () => void; }

export function MessageComposer({ chatId, replyTo, onCancelReply }: MessageComposerProps) {
  const addMessage = useChatsStore((s) => s.addMessage);
  const [text, setText] = useState('');
  const [upload, setUpload] = useState<UploadProgress | null>(null);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { onInput } = useTyping(chatId);
  const recorder = useVoiceRecorder();

  const sendText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    try {
      const message = await messagesApi.send(chatId, { text: value, replyToId: replyTo?.id });
      addMessage(chatId, message);
      setText(''); onCancelReply();
    } finally { setSending(false); }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 * 1024) { alert('Максимальный размер файла — 5 ГБ'); return; }
    try {
      const fileId = await uploadFile(file, setUpload);
      const message = await messagesApi.send(chatId, { kind: 'file', fileId, replyToId: replyTo?.id });
      addMessage(chatId, message); onCancelReply();
    } catch (e) { setUpload((p) => p ? { ...p, status: 'error', error: (e as Error).message } : null); }
  };

  const handleVoice = async () => {
    if (!recorder.isRecording) { await recorder.start(); return; }
    const recording = await recorder.stop();
    const file = new File([recording.blob], `Голосовое-${Date.now()}.webm`, { type: 'audio/webm' });
    await handleFile(file);
  };

  return <div className={styles.composerWrap}>
    {replyTo && <div className={styles.replying}><div><b>Ответ</b><span>{replyTo.text ?? 'Вложение'}</span></div><IconButton label="Отменить ответ" size="sm" onClick={onCancelReply}>✕</IconButton></div>}
    {upload && <div className={styles.upload}><span>📎 {upload.fileName}</span><div className={styles.progress}><i style={{ width: `${(upload.uploadedChunks / upload.totalChunks) * 100}%` }} /></div><small>{upload.status === 'uploading' ? `${upload.uploadedChunks}/${upload.totalChunks} частей` : upload.status === 'assembling' ? 'Сборка файла...' : upload.status === 'ready' ? 'Готово' : `Ошибка: ${upload.error}`}</small></div>}
    <div className={styles.composer}>
      <input ref={fileRef} type="file" className={styles.fileInput} onChange={(e) => void handleFile(e.target.files?.[0])} />
      <IconButton label="Прикрепить файл" onClick={() => fileRef.current?.click()}>＋</IconButton>
      <textarea aria-label="Сообщение" placeholder="Сообщение..." value={text} onChange={(e) => { setText(e.target.value); onInput(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendText(); } }} rows={1} />
      {recorder.isRecording && <span className={styles.recording}>● {formatDuration(recorder.duration)}</span>}
      {text.trim() ? <Button size="sm" onClick={() => void sendText()} loading={sending}>Отправить</Button> : <IconButton label={recorder.isRecording ? 'Остановить запись' : 'Записать голосовое'} active={recorder.isRecording} onClick={() => void handleVoice()}>{recorder.isRecording ? '■' : '🎙'}</IconButton>}
    </div>
    {upload && <span className={styles.uploadMeta}>{formatFileSize(0)} · части до 8 МиБ · загрузка возобновляется по статусу сервера</span>}
  </div>;
}
