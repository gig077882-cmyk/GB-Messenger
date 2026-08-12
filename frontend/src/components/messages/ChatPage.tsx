import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatsStore } from '@/store/chats';
import { useAuthStore } from '@/store/auth';
import { messages as messagesApi } from '@/lib/api';
import { MessageBubble } from './MessageBubble';
import { MessageComposer } from './MessageComposer';
import { ChatHeader } from './ChatHeader';
import { TypingIndicator } from './TypingIndicator';
import type { Message } from '@/types/api';
import styles from './ChatPage.module.css';

export function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const chats = useChatsStore((s) => s.chats);
  const messages = useChatsStore((s) => s.messages);
  const users = useChatsStore((s) => s.users);
  const loadMessages = useChatsStore((s) => s.loadMessages);
  const setActiveChat = useChatsStore((s) => s.setActiveChat);

  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const chat = chats.find((c) => c.id === chatId);
  const chatMessages = chatId ? (messages[chatId] ?? []) : [];

  useEffect(() => {
    if (!chatId) return;
    setActiveChat(chatId);
    void loadMessages(chatId);
  }, [chatId, setActiveChat, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // Mark messages as read
  useEffect(() => {
    if (!chatId || !currentUser) return;
    const unread = chatMessages.filter(
      (m) => m.sender_id !== currentUser.id && !m.deleted_for_everyone_at,
    );
    unread.slice(-5).forEach((m) => {
      void messagesApi.receipt(m.id, 'read').catch(() => {});
    });
  }, [chatMessages, chatId, currentUser]);

  const loadMore = async () => {
    if (!chatId || isLoadingMore || chatMessages.length === 0) return;
    setIsLoadingMore(true);
    const oldest = chatMessages[0]?.created_at;
    await loadMessages(chatId, oldest);
    setIsLoadingMore(false);
  };

  const handleScroll = () => {
    const el = listRef.current;
    if (el && el.scrollTop < 80) void loadMore();
  };

  if (!chat) {
    return (
      <div className={styles.empty}>
        <p>Выберите чат</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <ChatHeader chat={chat} onBack={() => navigate('/')} />

      <div className={styles.messages} ref={listRef} onScroll={handleScroll}>
        {isLoadingMore && <div className={styles.loadingMore}>Загрузка...</div>}

        {chatMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.sender_id === currentUser?.id}
            sender={users[msg.sender_id]}
            replyTo={msg.reply_to_id ? chatMessages.find((m) => m.id === msg.reply_to_id) : undefined}
            onReply={() => setReplyTo(msg)}
          />
        ))}

        <TypingIndicator chatId={chatId!} />
        <div ref={bottomRef} />
      </div>

      <MessageComposer
        chatId={chatId!}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
