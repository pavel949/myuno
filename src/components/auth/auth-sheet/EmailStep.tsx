/**
 * EmailStep — single-screen email + password (+ optional name on signup).
 * Auto-detects existing account: tries signInWithPassword first; if "Invalid credentials"
 * AND user toggles to signup mode, runs signUp.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';

interface EmailStepProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup';

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8, 'min8');

export function EmailStep({ onBack, onSuccess }: EmailStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) {
      toast.error(isRu ? 'Неверный email' : 'Invalid email');
      return;
    }
    const pwParse = passwordSchema.safeParse(password);
    if (!pwParse.success) {
      toast.error(isRu ? 'Пароль минимум 8 символов' : 'Password must be 8+ characters');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(isRu ? 'Неверный email или пароль' : 'Invalid email or password');
          return;
        }
        onSuccess();
      } else {
        const { error, data } = await signUp({ email, password, fullName });
        if (error) {
          toast.error(error.message || (isRu ? 'Не удалось создать аккаунт' : 'Sign-up failed'));
          return;
        }
        if (!data?.session) {
          toast.success(
            isRu
              ? 'Проверьте email — мы отправили ссылку для подтверждения'
              : 'Check your email — we sent a confirmation link',
          );
          onSuccess();
          return;
        }
        onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    const emailParse = emailSchema.safeParse(email);
    if (!emailParse.success) {
      toast.error(isRu ? 'Введите email сначала' : 'Enter your email first');
      return;
    }
    const { error } = await resetPassword(email);
    if (error) {
      toast.error(isRu ? 'Не удалось отправить' : 'Could not send');
      return;
    }
    toast.success(isRu ? 'Ссылка для сброса отправлена' : 'Reset link sent');
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {isRu ? 'Назад' : 'Back'}
      </button>

      <div className="space-y-2">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="auth-password">{isRu ? 'Пароль' : 'Password'}</Label>
        <Input
          id="auth-password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          placeholder={isRu ? 'Минимум 8 символов' : 'At least 8 characters'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>

      {mode === 'signup' && (
        <div className="space-y-2">
          <Label htmlFor="auth-name">{isRu ? 'Имя' : 'Full name'}</Label>
          <Input
            id="auth-name"
            type="text"
            autoComplete="name"
            placeholder={isRu ? 'Иван Иванов' : 'Jane Doe'}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {mode === 'signin'
          ? (isRu ? 'Войти' : 'Log in')
          : (isRu ? 'Создать аккаунт' : 'Create account')}
      </Button>

      <div className="flex items-center justify-between text-sm pt-1">
        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="text-primary hover:underline"
        >
          {mode === 'signin'
            ? (isRu ? 'Нет аккаунта? Регистрация' : "Don't have an account? Sign up")
            : (isRu ? 'Уже есть аккаунт? Войти' : 'Already have an account? Log in')}
        </button>
        {mode === 'signin' && (
          <button
            type="button"
            onClick={handleForgot}
            className="text-muted-foreground hover:text-foreground"
          >
            {isRu ? 'Забыли пароль?' : 'Forgot password?'}
          </button>
        )}
      </div>
    </form>
  );
}
