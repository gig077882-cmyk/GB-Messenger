import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatPage } from '@/components/messages/ChatPage';
import { ProfilePage } from '@/components/profile/ProfilePage';
import { LoginPage } from '@/components/auth/LoginPage';
import { RegisterPage } from '@/components/auth/RegisterPage';
import { OnboardingPage } from '@/components/auth/OnboardingPage';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

function EmptyState() {
  return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-3)' }}>Выберите чат или создайте новый</div>;
}

function Protected() {
  const user = useAuthStore((s) => s.user);
  return user ? <AppLayout /> : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => { document.documentElement.dataset.theme = localStorage.getItem('krug-theme') ?? 'light'; }, []);
  return <Routes>
    <Route path="/onboarding" element={<OnboardingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/" element={<Protected />}>
      <Route index element={<EmptyState />} />
      <Route path="chat/:chatId" element={<ChatPage />} />
      <Route path="profile" element={<ProfilePage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
