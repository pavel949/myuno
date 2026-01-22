import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutDashboard, Calendar, DollarSign, MessageSquare, Building2,
  FileCheck, Home, Bed, FileText, Image, CheckCircle2, Clock, Play,
  Users, Brush, Wrench, ClipboardList, Zap, CircleDollarSign
} from 'lucide-react';

const dashboardBlocks = [
  { icon: Calendar, labelRu: 'Сегодня', labelEn: 'Today', descRu: 'Задачи на сегодня', descEn: 'Today\'s tasks' },
  { icon: Zap, labelRu: 'Риски', labelEn: 'Risks', descRu: 'Проблемы и просрочки', descEn: 'Issues & overdue' },
  { icon: DollarSign, labelRu: 'Деньги', labelEn: 'Money', descRu: 'Доход/расход', descEn: 'Income/expense' },
  { icon: MessageSquare, labelRu: 'Сообщения', labelEn: 'Messages', descRu: 'Чаты с гостями', descEn: 'Guest chats' },
  { icon: Building2, labelRu: 'Объекты', labelEn: 'Properties', descRu: 'Ваши объекты', descEn: 'Your properties' },
];

const wizardSteps = [
  { icon: FileCheck, labelRu: 'Право собственности', labelEn: 'Ownership' },
  { icon: Home, labelRu: 'Тип и название', labelEn: 'Type & name' },
  { icon: Bed, labelRu: 'Характеристики', labelEn: 'Details' },
  { icon: FileText, labelRu: 'Описание', labelEn: 'Description' },
  { icon: CheckCircle2, labelRu: 'Удобства', labelEn: 'Amenities' },
  { icon: Image, labelRu: 'Фотографии', labelEn: 'Photos' },
];

const taskTypes = [
  { icon: Users, labelRu: 'Check-in', labelEn: 'Check-in', color: 'text-green-500' },
  { icon: Users, labelRu: 'Check-out', labelEn: 'Check-out', color: 'text-red-500' },
  { icon: Brush, labelRu: 'Уборка', labelEn: 'Cleaning', color: 'text-blue-500' },
  { icon: Wrench, labelRu: 'Ремонт', labelEn: 'Maintenance', color: 'text-orange-500' },
  { icon: ClipboardList, labelRu: 'Инспекция', labelEn: 'Inspection', color: 'text-purple-500' },
  { icon: Zap, labelRu: 'Счётчики', labelEn: 'Meters', color: 'text-yellow-500' },
];

const taskStatuses = [
  { icon: Clock, labelRu: 'Ожидает', labelEn: 'Pending', color: 'bg-muted' },
  { icon: Play, labelRu: 'В работе', labelEn: 'In Progress', color: 'bg-blue-500/20' },
  { icon: CheckCircle2, labelRu: 'Выполнено', labelEn: 'Completed', color: 'bg-green-500/20' },
];

const expenseCategories = [
  'Уборка', 'Ремонт', 'Коммунальные', 'Интернет', 'CAM fees',
  'Бассейн', 'Сад', 'Pest control', 'AC сервис', 'Страховка',
  'Налоги', 'Комиссии'
];

export function GuidePropertyCare() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="p-8 print:p-12 space-y-12">
      {/* Property Care Intro */}
      <section id="property-care" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'UNO Property Care' : 'UNO Property Care'}
        </h2>
        
        <p className="text-lg text-muted-foreground mb-6">
          {isRu 
            ? 'Комплексная система управления недвижимостью для собственников и управляющих компаний.'
            : 'A comprehensive property management system for owners and management companies.'
          }
        </p>

        <Card className="bg-primary/5 border-primary/20 mb-6">
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-2">
              {isRu ? 'Что решает система:' : 'What the system solves:'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✅ {isRu ? 'Единый личный кабинет для всех объектов' : 'Single dashboard for all properties'}</li>
              <li>✅ {isRu ? 'Автоматизация операций (check-in, уборка, ремонт)' : 'Operations automation (check-in, cleaning, repairs)'}</li>
              <li>✅ {isRu ? 'Прозрачный финансовый учёт' : 'Transparent financial accounting'}</li>
              <li>✅ {isRu ? 'Синхронизация с Airbnb, Booking.com, VRBO' : 'Sync with Airbnb, Booking.com, VRBO'}</li>
              <li>✅ {isRu ? 'Команда на месте для решения задач' : 'On-ground team for task resolution'}</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* Dashboard */}
      <section id="dashboard" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Личный кабинет владельца' : 'Owner Dashboard'}
        </h2>

        <p className="text-muted-foreground mb-6">
          {isRu 
            ? 'Главный экран показывает всё важное одним взглядом:'
            : 'The main screen shows everything important at a glance:'
          }
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {dashboardBlocks.map((block) => (
            <Card key={block.labelEn} className="bg-card border-border">
              <CardContent className="p-3 text-center">
                <block.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <h4 className="font-medium text-sm text-foreground">
                  {isRu ? block.labelRu : block.labelEn}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? block.descRu : block.descEn}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Screenshot placeholder */}
        <div className="rounded-xl border border-border bg-secondary/20 p-8 text-center">
          <LayoutDashboard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Скриншот панели управления' : 'Dashboard Screenshot'}
          </p>
        </div>
      </section>

      {/* Add Property */}
      <section id="add-property" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Добавление объекта' : 'Adding a Property'}
        </h2>

        <p className="text-muted-foreground mb-6">
          {isRu ? '6 простых шагов для регистрации объекта:' : '6 simple steps to register a property:'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {wizardSteps.map((step, index) => (
            <div key={step.labelEn} className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 relative">
                <step.icon className="w-5 h-5 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {isRu ? step.labelRu : step.labelEn}
              </span>
            </div>
          ))}
        </div>

        <Card className="mt-6 bg-secondary/30 border-border">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              💡 {isRu 
                ? 'После отправки объект проходит модерацию (24-48 часов). Система автоматически переведёт описание на второй язык.'
                : 'After submission, the property undergoes moderation (24-48 hours). The system automatically translates the description.'
              }
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Operations */}
      <section id="operations" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Операционное управление' : 'Operations Management'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Task Types */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Типы задач' : 'Task Types'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {taskTypes.map((task) => (
                  <div key={task.labelEn} className="flex items-center gap-2 text-sm">
                    <task.icon className={`w-4 h-4 ${task.color}`} />
                    <span className="text-muted-foreground">
                      {isRu ? task.labelRu : task.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Statuses */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {isRu ? 'Статусы задач' : 'Task Statuses'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {taskStatuses.map((status) => (
                  <div key={status.labelEn} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${status.color} flex items-center justify-center`}>
                      <status.icon className="w-4 h-4 text-foreground" />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {isRu ? status.labelRu : status.labelEn}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              🤖 {isRu 
                ? 'Система автоматически создаёт задачи при подтверждении бронирования: check-in, check-out и уборка.'
                : 'The system automatically creates tasks when a booking is confirmed: check-in, check-out, and cleaning.'
              }
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Financials */}
      <section id="financials" className="print-break-before">
        <h2 className="text-2xl font-bold mb-6 text-foreground">
          {isRu ? 'Финансовый учёт' : 'Financial Management'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <CircleDollarSign className="w-8 h-8 text-green-500 mb-3" />
              <h4 className="font-semibold text-foreground mb-2">
                {isRu ? 'Доходы' : 'Income'}
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• {isRu ? 'Аренда' : 'Rental income'}</li>
                <li>• {isRu ? 'Дополнительные услуги' : 'Additional services'}</li>
                <li>• {isRu ? 'Коммунальные компенсации' : 'Utility reimbursements'}</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <CircleDollarSign className="w-8 h-8 text-red-500 mb-3" />
              <h4 className="font-semibold text-foreground mb-2">
                {isRu ? 'Расходы (22+ категорий)' : 'Expenses (22+ categories)'}
              </h4>
              <div className="flex flex-wrap gap-1">
                {expenseCategories.slice(0, 8).map((cat) => (
                  <span key={cat} className="text-xs bg-secondary px-2 py-0.5 rounded">
                    {cat}
                  </span>
                ))}
                <span className="text-xs text-muted-foreground">...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
