import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatsStore } from '@/store/chats';
import { useAuthStore } from '@/store/auth';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { KrugLogo } from '@/components/brand/KrugLogo';
import { NewChatModal } from '@/components/chats/NewChatModal';
import { InviteModal } from '@/components/chats/InviteModal';
import { formatChatTime } from '@/lib/format';
import clsx from 'clsx';
import styles from './ChatsSidebar.module.css';

export function ChatsSidebar() {
  const navigate = useNavigate();
  const chats = useChatsStore((s) => s.chats);
  const users = useChatsStore((s) => s.users);
  const onlineUsers = useChatsStore((s) => s.onlineUsers);
  const activeChatId = useChatsStore((s) => s.activeChatId);
  const setActiveChat = useChatsStore((s) => s.setActiveChat);
  const currentUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const filtered = chats.filter((c) => {
    const isArchived = !!c.archived_at;
    if (!showArchived && isArchived) return false;
    if (showArchived && !isArchived) return false;
    if (!search) return true;
    const title = getChatTitle(c, users, currentUser?.id ?? '');
    return title.toLowerCase().includes(search.toLowerCase());
  });

  function getChatTitle(chat: typeof chats[0], usersMap: typeof users, myId: string) {
    if (chat.type === 'group') return chat.title ?? 'Группа';
    if (!chat.direct_key) return 'Чат';
    const otherId = chat.direct_key.split(':').find((id) => id !== myId);
    return otherId ? (usersMap[otherId]?.displayName ?? 'Пользователь') : 'Чат';
  }

  function getChatAvatar(chat: typeof chats[0], usersMap: typeof users, myId: string) {
    if (chat.type === 'group') return null;
    if (!chat.direct_key) return null;
    const otherId = chat.direct_key.split(':').find((id) => id !== myId);
    return otherId ? usersMap[otherId] : null;
  }

  const handleChatClick = (chatId: string) => {
    setActiveChat(chatId);
    navigate(`/chat/${chatId}`);
  };

  return (
    <div className={styles.sidebar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.brand}>
          <KrugLogo size={32} />
          <span className={styles.brandName}>Круг</span>
        </div>
        <div className={styles.actions}>
          {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
            <IconButton label="Пригласить" size="sm" onClick={() => setShowInvite(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z" fill="currentColor"/>
              </svg>
            </IconButton>
          )}
          <IconButton label="Новый чат" size="sm" onClick={() => setShowNewChat(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" fill="currentColor"/>
            </svg>
          </IconButton>
          <IconButton label="Выйти" size="sm" onClick={() => { void logout(); navigate('/login'); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M17 7l-1.4 1.4L18.2 11H8v2h10.2l-2.6 2.6L17 17l5-5-5-5zM4 5h8V3H4C2.9 3 2 3.9 2 5v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
            </svg>
          </IconButton>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchWrap}>
        <input
          className={styles.search}
          type="search"
          placeholder="Поиск чатов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Archive toggle */}
      <button
        className={clsx(styles.archiveToggle, showArchived && styles.archiveActive)}
        onClick={() => setShowArchived(!showArchived)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20.5 3l-.16-.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" fill="currentColor"/>
        </svg>
        {showArchived ? 'Активные чаты' : 'Архив'}
      </button>

      {/* Chat list */}
      <div className={styles.list}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            {search ? 'Ничего не найдено' : showArchived ? 'Архив пуст' : 'Нет чатов'}
          </div>
        )}
        {filtered.map((chat) => {
          const title = getChatTitle(chat, users, currentUser?.id ?? '');
          const otherUser = getChatAvatar(chat, users, currentUser?.id ?? '');
          const isOnline = otherUser ? onlineUsers.has(otherUser.id) : false;
          const isPinned = !!chat.pinned_at;

          return (
            <button
              key={chat.id}
              className={clsx(styles.chatItem, activeChatId === chat.id && styles.active)}
              onClick={() => handleChatClick(chat.id)}
            >
              {chat.type === 'group' ? (
                <Avatar name={title} size="md" />
              ) : (
                <Avatar
                  name={otherUser?.displayName ?? title}
                  src={otherUser?.avatarUrl}
                  size="md"
                  online={isOnline}
                />
              )}
              <div className={styles.chatInfo}>
                <div className={styles.chatTop}>
                  <span className={styles.chatTitle}>{title}</span>
                  <span className={styles.chatTime}>{formatChatTime(chat.updated_at)}</span>
                </div>
                <div className={styles.chatBottom}>
                  <span className={styles.chatPreview}>
                    {chat.type === 'group' ? '👥 Группа' : ''}
                  </span>
                  {isPinned && <span className={styles.pin}>📌</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <NewChatModal open={showNewChat} onClose={() => setShowNewChat(false)} />
      <InviteModal open={showInvite} onClose={() => setShowInvite(false)} />
    </div>
  );
}
