import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { KrugLogo } from '@/components/brand/KrugLogo';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(form.email, form.password);
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
          <p className={styles.subtitle}>Войдите в семейный мессенджер</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
              placeholder="Ваш пароль"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Войти
          </Button>
        </form>

        <p className={styles.hint}>
          Нет аккаунта?{' '}
          <Link to="/register">Зарегистрироваться по приглашению</Link>
        </p>
      </div>
    </div>
  );
}
