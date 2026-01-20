import { AppLayout } from '@/components/layout/AppLayout';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Cookie, BarChart3, Settings, Shield, ToggleRight, Info } from 'lucide-react';

export default function CookiePolicyPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const cookieTypes = [
    {
      icon: Shield,
      title: isRu ? 'Необходимые (Strictly Necessary)' : 'Strictly Necessary',
      description: isRu 
        ? 'Эти cookie необходимы для работы сайта и не могут быть отключены. Они устанавливаются в ответ на ваши действия: вход в аккаунт, заполнение форм, настройки конфиденциальности.'
        : 'These cookies are essential for the website to function and cannot be disabled. They are set in response to your actions: logging in, filling forms, privacy settings.',
      examples: 'session_id, csrf_token, auth_token',
      canDisable: false,
    },
    {
      icon: BarChart3,
      title: isRu ? 'Аналитические (Analytics)' : 'Analytics',
      description: isRu 
        ? 'Помогают понять, как посетители используют сайт: какие страницы популярны, откуда пришли пользователи. Все данные анонимизированы.'
        : 'Help us understand how visitors use the site: which pages are popular, where users came from. All data is anonymized.',
      examples: '_ga, _gid (Google Analytics)',
      canDisable: true,
    },
    {
      icon: Settings,
      title: isRu ? 'Функциональные (Functional)' : 'Functional',
      description: isRu 
        ? 'Запоминают ваши предпочтения: язык интерфейса, выбранную валюту, тему оформления. Улучшают пользовательский опыт.'
        : 'Remember your preferences: interface language, selected currency, theme. Improve user experience.',
      examples: 'language, currency, theme',
      canDisable: true,
    },
    {
      icon: ToggleRight,
      title: isRu ? 'Маркетинговые (Marketing)' : 'Marketing',
      description: isRu 
        ? 'Используются для показа релевантной рекламы. Мы не продаём ваши данные, но можем использовать cookie партнёров для ретаргетинга.'
        : 'Used to display relevant ads. We do not sell your data, but may use partner cookies for retargeting.',
      examples: '_fbp (Facebook Pixel)',
      canDisable: true,
    },
  ];

  const sections = [
    {
      title: isRu ? 'Что такое cookie?' : 'What are cookies?',
      content: isRu 
        ? 'Cookie — это небольшие текстовые файлы, которые сохраняются на вашем устройстве при посещении сайта. Они помогают сайту запоминать информацию о вас: предпочтения, статус входа, содержимое корзины.'
        : 'Cookies are small text files stored on your device when you visit a website. They help the site remember information about you: preferences, login status, cart contents.',
    },
    {
      title: isRu ? 'Как управлять cookie?' : 'How to manage cookies?',
      content: isRu 
        ? 'Вы можете управлять cookie через настройки браузера: блокировать все или отдельные типы, удалять существующие cookie. Обратите внимание: отключение необходимых cookie может нарушить работу сайта.'
        : 'You can manage cookies through browser settings: block all or specific types, delete existing cookies. Note: disabling necessary cookies may break site functionality.',
    },
    {
      title: isRu ? 'Срок хранения' : 'Retention period',
      content: isRu 
        ? 'Сессионные cookie удаляются при закрытии браузера. Постоянные cookie хранятся от 30 дней до 2 лет в зависимости от назначения. Аналитические cookie хранятся до 26 месяцев.'
        : 'Session cookies are deleted when you close the browser. Persistent cookies are stored from 30 days to 2 years depending on purpose. Analytics cookies are stored up to 26 months.',
    },
    {
      title: isRu ? 'Обновление политики' : 'Policy updates',
      content: isRu 
        ? 'Мы можем обновлять эту политику. При существенных изменениях вы увидите уведомление на сайте. Рекомендуем периодически проверять эту страницу.'
        : 'We may update this policy. For significant changes, you will see a notification on the site. We recommend checking this page periodically.',
    },
  ];

  return (
    <AppLayout>
      <PageContainer>
        <PageHeader 
          title={isRu ? 'Политика Cookie' : 'Cookie Policy'} 
          showBack 
        />

        {/* Intro */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Cookie className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {isRu 
                    ? 'Мы используем cookie для улучшения работы сервиса. Эта страница объясняет, какие cookie мы используем и зачем.'
                    : 'We use cookies to improve service. This page explains what cookies we use and why.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isRu ? 'Последнее обновление: Январь 2026' : 'Last updated: January 2026'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cookie Types */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Типы cookie' : 'Cookie Types'}
        </h2>
        <div className="space-y-4 mb-8">
          {cookieTypes.map((type, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <type.icon className="h-4 w-4 text-primary" />
                    {type.title}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    type.canDisable 
                      ? 'bg-muted text-muted-foreground' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {type.canDisable 
                      ? (isRu ? 'Можно отключить' : 'Can disable')
                      : (isRu ? 'Обязательные' : 'Required')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{type.description}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{isRu ? 'Примеры: ' : 'Examples: '}</span>
                  <code className="bg-muted px-1 py-0.5 rounded">{type.examples}</code>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <h2 className="text-lg font-semibold mb-4">
          {isRu ? 'Дополнительная информация' : 'Additional Information'}
        </h2>
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{section.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact */}
        <Card className="mt-8">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isRu 
                ? 'Вопросы о cookie? Свяжитесь с нами: privacy@uno.ae'
                : 'Questions about cookies? Contact us: privacy@uno.ae'}
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    </AppLayout>
  );
}
