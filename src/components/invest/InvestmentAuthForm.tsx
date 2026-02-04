import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Mail, Lock, User, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

interface InvestmentAuthFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export function InvestmentAuthForm({ onSuccess, onBack }: InvestmentAuthFormProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { signIn, signUp } = useAuth();
  const isRu = language === 'ru';
  
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  
  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast.error(isRu ? 'Ошибка входа' : 'Login failed', {
          description: error.message,
        });
      } else {
        toast.success(isRu ? 'Успешный вход!' : 'Welcome back!');
        onSuccess?.();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsLoading(true);
    try {
      const { error } = await signUp({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      });
      
      if (error) {
        toast.error(isRu ? 'Ошибка регистрации' : 'Registration failed', {
          description: error.message,
        });
      } else {
        setShowConfirmation(true);
        toast.success(isRu ? 'Проверьте почту!' : 'Check your email!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin + '/invest',
      });
      if (error) {
        toast.error(isRu ? 'Ошибка Google авторизации' : 'Google auth failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/');
    }
  };

  if (showConfirmation) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-bold text-lg">
          {isRu ? 'Подтвердите email' : 'Confirm your email'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isRu 
            ? 'Мы отправили письмо с ссылкой для подтверждения. Проверьте почту и вернитесь.'
            : 'We sent a confirmation link. Check your inbox and come back.'
          }
        </p>
        <Button variant="outline" onClick={() => setShowConfirmation(false)}>
          {isRu ? 'Назад к форме' : 'Back to form'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="gap-1.5 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {isRu ? 'На главную' : 'Back to home'}
      </Button>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            {isRu ? 'Вход' : 'Login'}
          </TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">
            {isRu ? 'Регистрация' : 'Sign up'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="space-y-4 mt-4">
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Email' : 'Email'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="you@example.com"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Пароль' : 'Password'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="••••••"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isRu ? 'Войти' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="signup" className="space-y-4 mt-4">
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-3">
              <FormField
                control={signupForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Имя' : 'Full name'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          placeholder={isRu ? 'Иван Петров' : 'John Doe'}
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Email' : 'Email'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="you@example.com"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isRu ? 'Пароль' : 'Password'}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          {...field} 
                          type="password" 
                          placeholder="••••••"
                          className="pl-10"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isRu ? 'Зарегистрироваться' : 'Create account'}
              </Button>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {isRu ? 'или' : 'or'}
          </span>
        </div>
      </div>

      {/* Google Auth */}
      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={handleGoogleAuth}
        disabled={isLoading}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isRu ? 'Продолжить с Google' : 'Continue with Google'}
      </Button>

      {/* Privacy note */}
      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" />
        {isRu 
          ? 'Данные защищены и не передаются третьим лицам'
          : 'Your data is secure and never shared'
        }
      </p>
    </div>
  );
}
