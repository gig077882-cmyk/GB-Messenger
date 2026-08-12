import styles from './Avatar.module.css';
import clsx from 'clsx';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function colorFromName(name: string) {
  const colors = ['#6750A4', '#FF715B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, src, size = 'md', online, className }: AvatarProps) {
  return (
    <div className={clsx(styles.avatar, styles[size], className)}>
      {src ? (
        <img src={src} alt={name} className={styles.img} />
      ) : (
        <span className={styles.initials} style={{ background: colorFromName(name) }}>
          {initials(name)}
        </span>
      )}
      {online !== undefined && (
        <span className={clsx(styles.badge, online ? styles.online : styles.offline)} />
      )}
    </div>
  );
}
