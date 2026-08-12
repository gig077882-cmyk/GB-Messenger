import { useState } from 'react';
import { useChatsStore } from '@/store/chats';
import { useAuthStore } from '@/store/auth';
import { useCallsStore } from '@/store/calls';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { SearchModal } from '@/components/messages/SearchModal';
import { chats as chatsApi } from '@/lib/api';
import type { Chat } from '@/types/api';
import styles from './ChatHeader.module.css';

interface ChatHeaderProps { chat: Chat; onBack: () => void; }

export function ChatHeader({ chat, onBack }: ChatHeaderProps) {
  const users = useChatsStore((s) => s.users);
  const onlineUsers = useChatsStore((s) => s.onlineUsers);
  const currentUser = useAuthStore((s) => s.user);
  const loadChats = useChatsStore((s) => s.loadChats);
  const startCall = useCallsStore((s) => s.startCall);
  const typing = useChatsStore((s) => s.typing);
  const [showSearch, setShowSearch] = useState(false);

  const otherId = chat.type === 'direct' ? chat.direct_key?.split(':').find((id) => id !== currentUser?.id) : null;
  const otherUser = otherId ? users[otherId] : null;
  const isOnline = otherId ? onlineUsers.has(otherId) : false;
  const title = chat.type === 'group' ? (chat.title ?? 'Группа') : (otherUser?.displayName ?? 'Пользователь');
  const typingUsers = [...(typing[chat.id] ?? [])].filter((id) => id !== currentUser?.id);
  const subtitle = typingUsers.length > 0 ? 'печатает...' : chat.type === 'direct' ? (isOnline ? 'в сети' : 'не в сети') : null;

  const preference = async (key: 'pinned' | 'archived', value: boolean) => {
    await chatsApi.setPreferences(chat.id, { [key]: value });
    await loadChats();
  };

  return <div className={styles.header}>
    <IconButton label="Назад" size="sm" className={styles.back} onClick={onBack}>←</IconButton>
    <div className={styles.info}>
      <Avatar name={title} src={otherUser?.avatarUrl} size="sm" online={chat.type === 'direct' ? isOnline : undefined} />
      <div className={styles.text}><span className={styles.title}>{title}</span>{subtitle && <span className={styles.subtitle}>{subtitle}</span>}</div>
    </div>
    <div className={styles.actions}>
      <IconButton label="Поиск" size="sm" onClick={() => setShowSearch(true)}>⌕</IconButton>
      <IconButton label="Звонок" size="sm" onClick={() => void startCall(chat.id)}>☎</IconButton>
      <IconButton label={chat.pinned_at ? 'Открепить' : 'Закрепить'} size="sm" onClick={() => void preference('pinned', !chat.pinned_at)}>📌</IconButton>
      <IconButton label={chat.archived_at ? 'Разархивировать' : 'Архивировать'} size="sm" onClick={() => void preference('archived', !chat.archived_at)}>▤</IconButton>
    </div>
    <SearchModal open={showSearch} onClose={() => setShowSearch(false)} chatId={chat.id} />
  </div>;
}
