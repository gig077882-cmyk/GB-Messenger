import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/Button';
import { KrugLogo } from '@/components/brand/KrugLogo';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const register = useAuthStore((s) => s.register);
  const error = useAuthStore((s) => s.error);
  const isLoading = useAuthStore((s) => s.isLoading);
  const clearError = useAuthStore((s) => s.clearError);

  const [form, setForm] = useState({
    email: '',
    password: '',
    displayName: '',
    inviteToken: searchParams.get('invite') ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(form.email, form.password, form.displayName, form.inviteToken);
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
          <p className={styles.subtitle}>Регистрация по приглашению</p>
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
          <label className={styles.label}>
            Код приглашения
            <input
              type="text"
              placeholder="Вставьте токен приглашения"
              value={form.inviteToken}
              onChange={(e) => setForm({ ...form, inviteToken: e.target.value })}
              required
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={isLoading} size="lg" style={{ width: '100%' }}>
            Зарегистрироваться
          </Button>
        </form>

        <p className={styles.hint}>
          Уже есть аккаунт?{' '}
          <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}
