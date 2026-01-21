import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const emailSchema = z.string().email('Invalid email address');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        setError(e.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success(
          language === 'ru'
            ? 'Письмо для сброса пароля отправлено'
            : 'Password reset email sent'
        );
      }
    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Произошла ошибка'
          : 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to="/" className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold hover:scale-105 transition-transform">
          <span className="text-xl font-bold text-primary-foreground">U</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="buttons" className="scale-90" />
          <LanguageSwitcher size="sm" />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? 'Проверьте почту' : 'Check your email'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ru'
                  ? `Мы отправили инструкции для сброса пароля на ${email}`
                  : `We've sent password reset instructions to ${email}`}
              </p>
              <Link to="/auth">
                <PremiumButton variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {language === 'ru' ? 'Вернуться к входу' : 'Back to login'}
                </PremiumButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold text-gradient-gold">
                  {language === 'ru' ? 'Забыли пароль?' : 'Forgot password?'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'ru'
                    ? 'Введите email для получения ссылки сброса пароля'
                    : 'Enter your email to receive a password reset link'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={cn(
                        "w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                        error ? "border-destructive" : "border-border"
                      )}
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>

                <PremiumButton
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {language === 'ru' ? 'Отправить ссылку' : 'Send reset link'}
                </PremiumButton>
              </form>

              <div className="text-center">
                <Link to="/auth" className="text-primary font-medium hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'ru' ? 'Вернуться к входу' : 'Back to login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>myUNO SuperApp</p>
      </footer>
    </div>
  );
}
