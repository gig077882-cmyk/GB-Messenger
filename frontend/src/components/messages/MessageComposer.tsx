import { useRef, useState } from 'react';
import { messages as messagesApi } from '@/lib/api';
import { useUploadQueueStore } from '@/store/uploadQueue';
import { useChatsStore } from '@/store/chats';
import { useTyping } from '@/hooks/useTyping';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { IconButton } from '@/components/ui/IconButton';
import { Button } from '@/components/ui/Button';
import { formatDuration } from '@/lib/format';
import type { Message } from '@/types/api';
import styles from './MessageComposer.module.css';

interface MessageComposerProps { chatId: string; replyTo: Message | null; onCancelReply: () => void; }

export function MessageComposer({ chatId, replyTo, onCancelReply }: MessageComposerProps) {
  const addMessage = useChatsStore((s) => s.addMessage);
  const addToQueue = useUploadQueueStore((s) => s.add);
  const [text, setText] = useState('');
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

  const handleFile = (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024 * 1024) { alert('Максимальный размер файла — 5 ГБ'); return; }
    addToQueue(file, chatId, replyTo?.id);
    onCancelReply();
  };

  const handleVoice = async () => {
    if (!recorder.isRecording) { await recorder.start(); return; }
    const recording = await recorder.stop();
    const file = new File([recording.blob], `Голосовое-${Date.now()}.webm`, { type: 'audio/webm' });
    handleFile(file);
  };

  return <div className={styles.composerWrap}>
    {replyTo && <div className={styles.replying}><div><b>Ответ</b><span>{replyTo.text ?? 'Вложение'}</span></div><IconButton label="Отменить ответ" size="sm" onClick={onCancelReply}>✕</IconButton></div>}
    <div className={styles.composer}>
      <input ref={fileRef} type="file" className={styles.fileInput} onChange={(e) => handleFile(e.target.files?.[0])} />
      <IconButton label="Прикрепить файл" onClick={() => fileRef.current?.click()}>＋</IconButton>
      <textarea aria-label="Сообщение" placeholder="Сообщение..." value={text} onChange={(e) => { setText(e.target.value); onInput(); }} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendText(); } }} rows={1} />
      {recorder.isRecording && <span className={styles.recording}>● {formatDuration(recorder.duration)}</span>}
      {text.trim() ? <Button size="sm" onClick={() => void sendText()} loading={sending}>Отправить</Button> : <IconButton label={recorder.isRecording ? 'Остановить запись' : 'Записать голосовое'} active={recorder.isRecording} onClick={() => void handleVoice()}>{recorder.isRecording ? '■' : '🎙'}</IconButton>}
    </div>
  </div>;
}