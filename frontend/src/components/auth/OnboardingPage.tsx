import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { KrugLogo } from '@/components/brand/KrugLogo';
import styles from './AuthPage.module.css';

export function OnboardingPage() {
  const navigate = useNavigate();
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [form, setForm] = useState({ email: '', password: '', displayName: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await bootstrap(form.email, form.password, form.displayName);
      navigate('/');
    } catch {
      // error shown via store
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <KrugLogo size={64} />
          <h1 className={styles.appName}>Круг</h1>
          <p className={styles.subtitle}>Первый запуск — создайте аккаунт владельца</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Имя
            <input
              type="text"
              placeholder="Ваше имя"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              required
              minLength={1}
              maxLength={80}
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </label>
          <label className={styles.label}>
            Пароль
            <input
              type="password"
              placeholder="Минимум 10 символов"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={10}
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Создать аккаунт
          </Button>
        </form>

        <p className={styles.hint}>
          Уже есть аккаунт?{' '}
          <a href="/login">Войти</a>
        </p>
      </div>
    </div>
  );
}
