import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useChatsStore } from '@/store/chats';
import { useWsEvents } from '@/hooks/useWsEvents';
import { ChatsSidebar } from '@/components/chats/ChatsSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { CallOverlay } from '@/components/calls/CallOverlay';
import { UploadQueue } from '@/components/ui/UploadQueue';
import styles from './AppLayout.module.css';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const loadChats = useChatsStore((s) => s.loadChats);
  const loadUsers = useChatsStore((s) => s.loadUsers);
  const [mobileView, setMobileView] = useState<'chats' | 'messages' | 'profile'>('chats');

  useWsEvents();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    void loadChats();
    void loadUsers();
  }, [user, navigate, loadChats, loadUsers]);

  if (!user) return null;

  return (
    <div className={styles.layout}>
      {/* Desktop: 3-column layout */}
      <aside className={styles.sidebar}>
        <ChatsSidebar />
      </aside>

      <main className={styles.main}>
        <Outlet context={{ mobileView, setMobileView }} />
      </main>

      {/* Mobile bottom nav */}
      <nav className={styles.bottomNav}>
        <BottomNav active={mobileView} onChange={setMobileView} />
      </nav>

      <CallOverlay />
      <UploadQueue />
    </div>
  );
}
