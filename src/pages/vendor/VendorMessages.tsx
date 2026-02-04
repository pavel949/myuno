import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Inbox } from 'lucide-react';

const VendorMessages = () => {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {isRussian ? 'Сообщения' : 'Messages'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">
              {isRussian ? 'Нет сообщений' : 'No messages yet'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {isRussian 
                ? 'Здесь будут отображаться сообщения от клиентов и администрации платформы.'
                : 'Messages from customers and platform admins will appear here.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default VendorMessages;
