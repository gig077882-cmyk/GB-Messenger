import clsx from 'clsx';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  active: 'chats' | 'messages' | 'profile';
  onChange: (v: 'chats' | 'messages' | 'profile') => void;
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className={styles.nav}>
      <button
        className={clsx(styles.item, active === 'chats' && styles.active)}
        onClick={() => onChange('chats')}
        aria-label="Чаты"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" fill="currentColor"/>
        </svg>
        <span>Чаты</span>
      </button>
      <button
        className={clsx(styles.item, active === 'profile' && styles.active)}
        onClick={() => onChange('profile')}
        aria-label="Профиль"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" fill="currentColor"/>
        </svg>
        <span>Профиль</span>
      </button>
    </div>
  );
}
