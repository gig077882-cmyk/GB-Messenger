import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { search } from '@/lib/api';
import { formatMessageTime } from '@/lib/format';
import type { Message } from '@/types/api';
import styles from './SearchModal.module.css';

export function SearchModal({ open, onClose, chatId }: { open: boolean; onClose: () => void; chatId: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const runSearch = async () => { if (query.trim().length < 2) return; setLoading(true); try { setResults(await search.messages(query, chatId)); } finally { setLoading(false); } };
  return <Modal open={open} onClose={onClose} title="Поиск в чате"><div className={styles.search}><input autoFocus placeholder="Минимум 2 символа" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void runSearch(); }}/><button onClick={() => void runSearch()}>{loading ? '...' : 'Найти'}</button></div><div className={styles.results}>{results.map((m) => <div key={m.id} className={styles.result}><p>{m.text ?? 'Вложение'}</p><time>{formatMessageTime(m.created_at)}</time></div>)}{query.length >= 2 && !loading && results.length === 0 && <p className={styles.empty}>Нет результатов</p>}</div></Modal>;
}
