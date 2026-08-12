import { useChatsStore } from '@/store/chats';
import { useAuthStore } from '@/store/auth';
import styles from './TypingIndicator.module.css';

export function TypingIndicator({ chatId }: { chatId: string }) {
  const typing = useChatsStore((s) => s.typing[chatId] ?? new Set<string>());
  const users = useChatsStore((s) => s.users);
  const current = useAuthStore((s) => s.user);
  const names = [...typing].filter((id) => id !== current?.id).map((id) => users[id]?.displayName ?? 'Кто-то');
  if (!names.length) return null;
  return <div className={styles.typing}><span className={styles.dots}><i/><i/><i/></span>{names.join(', ')} печатает{names.length > 1 ? 'ют' : ''}...</div>;
}
