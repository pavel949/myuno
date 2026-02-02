import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamLayout } from '@/components/team/TeamLayout';
import { TeamChat } from '@/components/team/chat/TeamChat';

export default function TeamChatPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <TeamLayout title={isRu ? 'Чат команды' : 'Team Chat'}>
      <div className="py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {isRu ? 'Чат команды' : 'Team Chat'}
          </h1>
          <p className="text-muted-foreground">
            {isRu 
              ? 'Общайтесь с коллегами в реальном времени' 
              : 'Communicate with your teammates in real-time'}
          </p>
        </div>

        <TeamChat className="h-[calc(100vh-250px)]" />
      </div>
    </TeamLayout>
  );
}
