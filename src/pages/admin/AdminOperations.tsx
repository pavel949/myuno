import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, ShieldCheck, MessageSquare, Users } from 'lucide-react';
import { OperationsBookingsTab } from '@/components/admin/operations/OperationsBookingsTab';
import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { OperationsLeadsTab } from '@/components/admin/operations/OperationsLeadsTab';
import { OperationsInquiriesTab } from '@/components/admin/operations/OperationsInquiriesTab';

export default function AdminOperations() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('bookings');

  const tabs = [
    { id: 'bookings', label: isRussian ? 'Бронирования' : 'Bookings', icon: ClipboardList },
    { id: 'moderation', label: isRussian ? 'Модерация' : 'Moderation', icon: ShieldCheck },
    { id: 'leads', label: isRussian ? 'Лиды' : 'Leads', icon: Users },
    { id: 'inquiries', label: isRussian ? 'Заявки' : 'Inquiries', icon: MessageSquare },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          {isRussian ? 'Операции' : 'Operations'}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isRussian ? 'Бронирования, модерация, лиды и заявки' : 'Bookings, moderation, leads and inquiries'}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 data-[state=active]:bg-background"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="bookings" className="mt-4">
          <OperationsBookingsTab />
        </TabsContent>

        <TabsContent value="moderation" className="mt-4">
          <OperationsModerationTab />
        </TabsContent>

        <TabsContent value="leads" className="mt-4">
          <OperationsLeadsTab />
        </TabsContent>

        <TabsContent value="inquiries" className="mt-4">
          <OperationsInquiriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
