import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useChatsStore } from '@/store/chats';
import { messages as messagesApi, uploads } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { formatMessageTime } from '@/lib/format';
import type { Message, User } from '@/types/api';
import clsx from 'clsx';
import styles from './MessageBubble.module.css';

interface MessageBubbleProps {
  message: Message & { reactions?: Record<string, string[]> };
  isOwn: boolean;
  sender?: User;
  replyTo?: Message;
  onReply: () => void;
}

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢'];

export function MessageBubble({ message, isOwn, sender, replyTo, onReply }: MessageBubbleProps) {
  const currentUser = useAuthStore((s) => s.user);
  const updateReaction = useChatsStore((s) => s.updateReaction);
  const deleteMessage = useChatsStore((s) => s.deleteMessage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const deleted = !!message.deleted_for_everyone_at;
  const reactions = message.reactions ?? {};

  const react = async (emoji: string) => {
    const mine = reactions[emoji]?.includes(currentUser?.id ?? '');
    try {
      if (mine) await messagesApi.unreact(message.id, emoji);
      else await messagesApi.react(message.id, emoji);
      if (currentUser) updateReaction(message.id, currentUser.id, emoji, !mine);
    } finally { setShowReactions(false); }
  };

  const remove = async (scope: 'me' | 'everyone') => {
    await messagesApi.delete(message.id, scope);
    deleteMessage(message.id, scope);
    setMenuOpen(false);
  };

  return (
    <div className={clsx(styles.row, isOwn && styles.own)}>
      {!isOwn && <Avatar name={sender?.displayName ?? 'Пользователь'} src={sender?.avatarUrl} size="xs" className={styles.avatar} />}
      <div className={styles.wrap}>
        {!isOwn && sender && <span className={styles.sender}>{sender.displayName}</span>}
        <div className={clsx(styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble)}>
          {replyTo && <div className={styles.replyPreview}><span>↩</span>{replyTo.text ?? 'Вложение'}</div>}
          {deleted ? <p className={styles.deleted}>Сообщение удалено</p> : message.kind === 'file' ? <a className={styles.file} href={message.file_id ? uploads.downloadUrl(message.file_id) : '#'} target="_blank" rel="noreferrer">📎 Файл</a> : <p className={styles.text}>{message.text}</p>}
          <div className={styles.meta}><time>{formatMessageTime(message.created_at)}</time>{isOwn && <span className={styles.status} title="Отправлено">✓✓</span>}</div>
        </div>
        {Object.keys(reactions).length > 0 && <div className={styles.reactions}>{Object.entries(reactions).map(([emoji, ids]) => <button key={emoji} onClick={() => void react(emoji)} className={clsx(styles.reaction, ids.includes(currentUser?.id ?? '') && styles.reactionMine)}>{emoji} {ids.length}</button>)}</div>}
        {!deleted && <div className={styles.controls}>
          <IconButton label="Ответить" size="sm" onClick={onReply}>↩</IconButton>
          <IconButton label="Реакция" size="sm" onClick={() => setShowReactions(!showReactions)}>☺</IconButton>
          <IconButton label="Меню" size="sm" onClick={() => setMenuOpen(!menuOpen)}>⋮</IconButton>
          {showReactions && <div className={styles.reactionPicker}>{EMOJIS.map((emoji) => <button key={emoji} onClick={() => void react(emoji)}>{emoji}</button>)}</div>}
          {menuOpen && <div className={styles.menu}>
            <button onClick={() => void remove('me')}>Удалить у меня</button>
            {(isOwn || currentUser?.role === 'owner') && <button className={styles.danger} onClick={() => void remove('everyone')}>Удалить у всех</button>}
          </div>}
        </div>}
      </div>
    </div>
  );
}
