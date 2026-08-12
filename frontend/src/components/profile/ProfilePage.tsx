import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { users as usersApi } from '@/lib/api';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saved, setSaved] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.dataset.theme === 'dark');
  if (!user) return null;
  const save = async () => { const updated = await usersApi.update({ displayName: name, bio: bio || null }); setUser(updated); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const toggleTheme = () => { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? 'dark' : 'light'; localStorage.setItem('krug-theme', next ? 'dark' : 'light'); };
  return <div className={styles.page}><header><h1>Профиль</h1></header><section className={styles.card}><Avatar name={user.displayName} src={user.avatarUrl} size="lg"/><p className={styles.role}>{user.role === 'owner' ? 'Владелец семьи' : user.role === 'admin' ? 'Администратор' : 'Участник'}</p><label>Имя<input value={name} onChange={(e)=>setName(e.target.value)} maxLength={80}/></label><label>О себе<input value={bio ?? ''} onChange={(e)=>setBio(e.target.value)} maxLength={500}/></label><Button onClick={()=>void save()}>{saved ? '✓ Сохранено' : 'Сохранить'}</Button></section><section className={styles.card}><h2>Оформление</h2><button className={styles.setting} onClick={toggleTheme}><span>Тёмная тема</span><span className={dark ? styles.switchOn : styles.switch}><i/></span></button></section><section className={styles.card}><h2>Приватность</h2><p>Настройки приватности появятся, когда сервер будет их поддерживать.</p></section><section className={styles.card}><h2>Уведомления</h2><p>Подготовка push-уведомлений для PWA.</p><Button variant="secondary" onClick={() => void Notification.requestPermission()}>Разрешить уведомления</Button></section></div>;
}
