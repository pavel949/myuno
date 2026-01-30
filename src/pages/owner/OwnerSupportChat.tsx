import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Phone } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { openWhatsApp, UNO_WHATSAPP } from '@/hooks/useChat';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OwnerAIAssistant } from '@/components/owner/OwnerAIAssistant';

export default function OwnerSupportChat() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Bot className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isRu ? 'AI-Ассистент' : 'AI Assistant'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRu ? 'Войдите для доступа к ассистенту' : 'Sign in to access the assistant'}
          </p>
          <Button onClick={() => navigate('/auth')}>
            {isRu ? 'Войти' : 'Sign In'}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex flex-col h-[calc(100vh-120px)]">
      <PageHeader
        title={isRu ? 'AI-Ассистент' : 'AI Assistant'}
        subtitle={isRu ? 'Помощь с управлением и вопросами' : 'Help with management and questions'}
        showBack
        fallbackPath="/owner/messages"
      />

      {/* Quick Actions - WhatsApp for live support */}
      <Card className="mb-4">
        <CardContent className="p-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => openWhatsApp(isRu ? 'Здравствуйте! Мне нужна помощь.' : 'Hello! I need help.')}
            >
              <Phone className="h-4 w-4 mr-2" />
              {isRu ? 'WhatsApp менеджера' : 'Manager WhatsApp'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`tel:${UNO_WHATSAPP}`)}
            >
              <Phone className="h-4 w-4 mr-2" />
              {isRu ? 'Позвонить' : 'Call'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {isRu ? 'Живая поддержка: 9:00-21:00 (Таиланд)' : 'Live support: 9:00-21:00 (Thailand)'}
          </p>
        </CardContent>
      </Card>

      {/* AI Assistant Chat */}
      <div className="flex-1 flex flex-col bg-background rounded-lg border min-h-0 overflow-hidden">
        <OwnerAIAssistant />
      </div>
    </PageContainer>
  );
}
