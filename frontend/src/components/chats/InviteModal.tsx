import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { invites as invitesApi } from '@/lib/api';
import styles from './InviteModal.module.css';

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
}

export function InviteModal({ open, onClose }: InviteModalProps) {
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [hours, setHours] = useState(72);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await invitesApi.create(role, hours);
      setToken(res.inviteToken);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const link = `${location.origin}/register?invite=${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal open={open} onClose={onClose} title="Пригласить в Круг">
      <div className={styles.form}>
        <label className={styles.label}>
          Роль
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'member' | 'admin')}
            className={styles.select}
          >
            <option value="member">Участник</option>
            <option value="admin">Администратор</option>
          </select>
        </label>

        <label className={styles.label}>
          Срок действия (часов)
          <input
            type="number"
            min={1}
            max={720}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </label>

        <Button onClick={handleCreate} loading={loading} style={{ width: '100%' }}>
          Создать приглашение
        </Button>

        {token && (
          <div className={styles.tokenBox}>
            <p className={styles.tokenLabel}>Ссылка для приглашения:</p>
            <code className={styles.token}>{`${location.origin}/register?invite=${token}`}</code>
            <Button variant="secondary" onClick={handleCopy} style={{ width: '100%', marginTop: 8 }}>
              {copied ? '✓ Скопировано!' : 'Скопировать ссылку'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
