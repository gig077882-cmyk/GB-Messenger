import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useChatsStore } from '@/store/chats';
import { chats as chatsApi } from '@/lib/api';
import type { User } from '@/types/api';
import styles from './NewChatModal.module.css';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const navigate = useNavigate();
  const users = useChatsStore((s) => s.users);
  const loadChats = useChatsStore((s) => s.loadChats);

  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [groupTitle, setGroupTitle] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const userList = Object.values(users) as User[];

  const toggleUser = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (tab === 'direct' && selected.length === 1) {
        const chat = await chatsApi.createDirect(selected[0]);
        await loadChats();
        navigate(`/chat/${chat.id}`);
        onClose();
      } else if (tab === 'group' && groupTitle && selected.length > 0) {
        const chat = await chatsApi.createGroup(groupTitle, selected);
        await loadChats();
        navigate(`/chat/${chat.id}`);
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Новый чат">
      <div className={styles.tabs}>
        <button
          className={tab === 'direct' ? styles.tabActive : styles.tab}
          onClick={() => setTab('direct')}
        >
          Личный
        </button>
        <button
          className={tab === 'group' ? styles.tabActive : styles.tab}
          onClick={() => setTab('group')}
        >
          Группа
        </button>
      </div>

      {tab === 'group' && (
        <input
          placeholder="Название группы"
          value={groupTitle}
          onChange={(e) => setGroupTitle(e.target.value)}
          className={styles.input}
          maxLength={120}
        />
      )}

      <div className={styles.userList}>
        {userList.map((u) => (
          <button
            key={u.id}
            className={styles.userItem}
            onClick={() => {
              if (tab === 'direct') setSelected([u.id]);
              else toggleUser(u.id);
            }}
          >
            <Avatar name={u.displayName} src={u.avatarUrl} size="sm" />
            <span className={styles.userName}>{u.displayName}</span>
            <span className={styles.check}>
              {selected.includes(u.id) ? '✓' : ''}
            </span>
          </button>
        ))}
        {userList.length === 0 && (
          <p className={styles.empty}>Нет других пользователей</p>
        )}
      </div>

      <Button
        onClick={handleCreate}
        loading={loading}
        disabled={
          tab === 'direct' ? selected.length !== 1 : !groupTitle || selected.length === 0
        }
        style={{ width: '100%', marginTop: 16 }}
      >
        Создать
      </Button>
    </Modal>
  );
}
