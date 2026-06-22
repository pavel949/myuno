import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Helmet } from 'react-helmet-async';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search, HelpCircle, Shield, LayoutDashboard, Building2, Users, CreditCard,
  CalendarDays, DollarSign, BarChart3, ClipboardList, MessageSquare, BookOpen,
  Lock, Globe, Database, RefreshCw, Send, Bot, User, Loader2, Sparkles,
  ChevronRight, FileText, Zap, Star, Phone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-support-chat`;

// ═══════════════════════════════════════════
// HELP CONTENT DATA
// ═══════════════════════════════════════════

interface FAQItem {
  q: { en: string; ru: string; th: string };
  a: { en: string; ru: string; th: string };
}

interface FeatureSection {
  id: string;
  icon: React.ElementType;
  title: { en: string; ru: string; th: string };
  description: { en: string; ru: string; th: string };
  features: { en: string; ru: string; th: string }[];
}

const FAQ_ITEMS: FAQItem[] = [
  {
    q: { en: 'MC CRM vs Capital — where do I work deals?', ru: 'MC CRM и Capital — где что вести?', th: 'MC CRM กับ Capital — ทำดีลที่ไหน?' },
    a: {
      en: 'Use MC (/mc/…) for day-to-day operations: rentals, property management, owners, and service-related pipeline. Use Capital (/capital/…) for off-plan, viewing requests, mandates, and the investor pipeline. The same person can exist in both; open the banner on a contact card to jump between pipelines.',
      ru: 'MC (/mc/…) — повседневные операции: аренда, управление объектами, собственники и сервисная воронка. Capital (/capital/…) — newbuild, запросы на показы, мандаты и инвестиционный пайплайн. Один человек может быть в обеих CRM — на карточке контакта откройте баннер, чтобы перейти в другую воронку.',
      th: 'ใช้ MC (/mc/…) สำหรับงานประจำวัน เช่น การเช่า การบริหารทรัพย์สิน เจ้าของ และไปป์ไลน์งานบริการ ใช้ Capital (/capital/…) สำหรับโครงการ off-plan คำขอเข้าชม สัญญาฝากขาย และไปป์ไลน์นักลงทุน บุคคลเดียวกันสามารถอยู่ได้ทั้งสองระบบ เปิดแบนเนอร์บนการ์ดผู้ติดต่อเพื่อสลับระหว่างไปป์ไลน์',
    },
  },
  {
    q: { en: 'How do I add a new property?', ru: 'Как добавить новый объект?', th: 'จะเพิ่มทรัพย์สินใหม่อย่างไร?' },
    a: { en: 'Go to Properties → click "Add Property". Fill in the details, upload photos, and save. Once saved, activate the property slot in the Subscription section to enable PMS features (calendar, bookings, finances).', ru: 'Перейдите в Объекты → нажмите «Добавить объект». Заполните информацию, загрузите фото и сохраните. После сохранения активируйте слот объекта в разделе Подписка, чтобы включить PMS-функции (календарь, бронирования, финансы).', th: 'ไปที่ ทรัพย์สิน → คลิก "เพิ่มทรัพย์สิน" กรอกรายละเอียด อัปโหลดรูปภาพ และบันทึก เมื่อบันทึกแล้ว ให้เปิดใช้งานสล็อตทรัพย์สินในส่วนการสมัครสมาชิกเพื่อเปิดใช้ฟีเจอร์ PMS (ปฏิทิน การจอง การเงิน)' },
  },
  {
    q: { en: 'How does the subscription work?', ru: 'Как работает подписка?', th: 'การสมัครสมาชิกทำงานอย่างไร?' },
    a: { en: 'You pay $25/month per active property slot. Choose a plan (Basic, Starter, Professional, Enterprise) or set a custom quantity. Pay online via Stripe or contact us on WhatsApp for offline payment. You can activate/deactivate properties at any time — billing adjusts automatically.', ru: 'Вы платите $25/мес за каждый активный слот объекта. Выберите план (Базовый, Стартовый, Профессиональный, Корпоративный) или укажите своё количество. Оплата онлайн через Stripe или оффлайн через WhatsApp. Вы можете включать/отключать объекты в любой момент — стоимость пересчитывается автоматически.', th: 'คุณจ่าย $25/เดือน ต่อสล็อตทรัพย์สินที่ใช้งาน เลือกแพ็กเกจ (Basic, Starter, Professional, Enterprise) หรือกำหนดจำนวนเอง ชำระออนไลน์ผ่าน Stripe หรือติดต่อเราทาง WhatsApp สำหรับการชำระแบบออฟไลน์ คุณสามารถเปิด/ปิดการใช้งานทรัพย์สินได้ตลอดเวลา — ค่าใช้จ่ายจะปรับโดยอัตโนมัติ' },
  },
  {
    q: { en: 'Can I invite team members?', ru: 'Могу ли я пригласить сотрудников?', th: 'ฉันสามารถเชิญสมาชิกในทีมได้หรือไม่?' },
    a: { en: 'Yes! Go to Staff & Access → Invite. Enter their email and select a role (Admin, Manager, Staff, Cleaner, Maintenance). They will receive an email with login credentials. You can configure module-level permissions for each team member.', ru: 'Да! Перейдите в Сотрудники → Пригласить. Введите email и выберите роль (Администратор, Менеджер, Сотрудник, Уборщик, Техник). Им придёт письмо с данными для входа. Вы можете настроить доступ к модулям для каждого сотрудника.', th: 'ได้! ไปที่ พนักงานและสิทธิ์การเข้าถึง → เชิญ กรอกอีเมลและเลือกบทบาท (แอดมิน ผู้จัดการ พนักงาน แม่บ้าน ช่างซ่อมบำรุง) พวกเขาจะได้รับอีเมลพร้อมข้อมูลเข้าสู่ระบบ คุณสามารถกำหนดสิทธิ์ระดับโมดูลให้สมาชิกแต่ละคนได้' },
  },
  {
    q: { en: 'How do I manage bookings?', ru: 'Как управлять бронированиями?', th: 'จะจัดการการจองอย่างไร?' },
    a: { en: 'Use the Calendar module to view all bookings across properties. You can create manual bookings, sync with external channels (Airbnb, Booking.com) via Channel Manager, and manage check-in/check-out operations.', ru: 'Используйте модуль Календарь для просмотра всех бронирований по объектам. Вы можете создавать бронирования вручную, синхронизировать с внешними каналами (Airbnb, Booking.com) через Менеджер каналов и управлять заселением/выселением.', th: 'ใช้โมดูลปฏิทินเพื่อดูการจองทั้งหมดของทุกทรัพย์สิน คุณสามารถสร้างการจองด้วยตนเอง ซิงค์กับช่องทางภายนอก (Airbnb, Booking.com) ผ่าน Channel Manager และจัดการการเช็คอิน/เช็คเอาต์' },
  },
  {
    q: { en: 'Can I export my data?', ru: 'Могу ли я экспортировать данные?', th: 'ฉันสามารถส่งออกข้อมูลได้หรือไม่?' },
    a: { en: 'Yes. Go to Settings → Data tab. You can export Properties, CRM contacts, Financial data, and Reports in JSON or CSV format. You can also set up automated weekly or monthly backups.', ru: 'Да. Перейдите в Настройки → вкладка Данные. Можно экспортировать Объекты, CRM-контакты, Финансовые данные и Отчёты в формате JSON или CSV. Также можно настроить автоматический бэкап еженедельно или ежемесячно.', th: 'ได้ ไปที่ การตั้งค่า → แท็บข้อมูล คุณสามารถส่งออกทรัพย์สิน ผู้ติดต่อ CRM ข้อมูลการเงิน และรายงานในรูปแบบ JSON หรือ CSV และยังสามารถตั้งค่าการสำรองข้อมูลอัตโนมัติรายสัปดาห์หรือรายเดือนได้' },
  },
  {
    q: { en: 'What happens if I deactivate a property?', ru: 'Что произойдёт при деактивации объекта?', th: 'จะเกิดอะไรขึ้นหากฉันปิดการใช้งานทรัพย์สิน?' },
    a: { en: 'The property data is preserved, but PMS features (calendar, bookings, finances, tasks) become unavailable. You stop paying for that slot. You can reactivate at any time.', ru: 'Данные объекта сохраняются, но PMS-функции (календарь, бронирования, финансы, задачи) станут недоступны. Оплата за этот слот прекращается. Вы можете активировать объект снова в любой момент.', th: 'ข้อมูลทรัพย์สินจะถูกเก็บไว้ แต่ฟีเจอร์ PMS (ปฏิทิน การจอง การเงิน งาน) จะใช้งานไม่ได้ คุณจะหยุดจ่ายค่าสล็อตนั้น และสามารถเปิดใช้งานใหม่ได้ตลอดเวลา' },
  },
  {
    q: { en: 'How do owner reports work?', ru: 'Как работают отчёты для собственников?', th: 'รายงานสำหรับเจ้าของทำงานอย่างไร?' },
    a: { en: 'The Finance → Reports section generates monthly statements for property owners showing income, expenses, occupancy rate, and net profit. Reports can be sent automatically to owners via email.', ru: 'Раздел Финансы → Отчёты формирует ежемесячные выписки для собственников с доходами, расходами, загрузкой и чистой прибылью. Отчёты можно отправлять автоматически собственникам по email.', th: 'ส่วน การเงิน → รายงาน จะสร้างรายงานประจำเดือนสำหรับเจ้าของทรัพย์สิน แสดงรายรับ รายจ่าย อัตราการเข้าพัก และกำไรสุทธิ รายงานสามารถส่งถึงเจ้าของทางอีเมลโดยอัตโนมัติได้' },
  },
  {
    q: { en: 'How do I connect to Airbnb / Booking.com?', ru: 'Как подключить Airbnb / Booking.com?', th: 'จะเชื่อมต่อกับ Airbnb / Booking.com อย่างไร?' },
    a: { en: 'Go to Operations → Channel Manager. Add an iCal link from your Airbnb/Booking.com listing. The calendar syncs automatically every few hours to prevent double bookings.', ru: 'Перейдите в Операции → Менеджер каналов. Добавьте iCal-ссылку от вашего объявления на Airbnb/Booking.com. Календарь синхронизируется автоматически каждые несколько часов для предотвращения двойных бронирований.', th: 'ไปที่ ปฏิบัติการ → Channel Manager เพิ่มลิงก์ iCal จากประกาศ Airbnb/Booking.com ของคุณ ปฏิทินจะซิงค์โดยอัตโนมัติทุก ๆ ไม่กี่ชั่วโมงเพื่อป้องกันการจองซ้ำซ้อน' },
  },
  {
    q: { en: 'Can I customize financial categories?', ru: 'Могу ли я настроить категории расходов?', th: 'ฉันสามารถปรับแต่งหมวดหมู่การเงินได้หรือไม่?' },
    a: { en: 'Yes. Go to Settings → Finance tab. You can show/hide 22+ default expense/income categories and create custom ones specific to your business.', ru: 'Да. Перейдите в Настройки → вкладка Финансы. Можно показать/скрыть 22+ стандартных категорий расходов/доходов и создать свои, специфичные для вашего бизнеса.', th: 'ได้ ไปที่ การตั้งค่า → แท็บการเงิน คุณสามารถแสดง/ซ่อนหมวดหมู่รายจ่าย/รายรับเริ่มต้น 22+ หมวด และสร้างหมวดหมู่เฉพาะสำหรับธุรกิจของคุณได้' },
  },
  {
    q: { en: 'What is the CRM module for?', ru: 'Для чего нужен модуль CRM?', th: 'โมดูล CRM มีไว้เพื่ออะไร?' },
    a: { en: 'The CRM helps you manage leads, contacts, and sales pipeline. Track potential property owners, send emails, create quotes, manage deals through customizable stages, and automate follow-ups.', ru: 'CRM помогает управлять лидами, контактами и воронкой продаж. Отслеживайте потенциальных собственников, отправляйте email, создавайте коммерческие предложения, ведите сделки по настраиваемым этапам и автоматизируйте напоминания.', th: 'CRM ช่วยให้คุณจัดการลีด ผู้ติดต่อ และไปป์ไลน์การขาย ติดตามเจ้าของทรัพย์สินที่มีศักยภาพ ส่งอีเมล สร้างใบเสนอราคา จัดการดีลผ่านขั้นตอนที่ปรับแต่งได้ และทำการติดตามผลอัตโนมัติ' },
  },
];

const FEATURE_SECTIONS: FeatureSection[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: { en: 'Dashboard', ru: 'Панель управления', th: 'แดชบอร์ด' },
    description: { en: 'Central overview of your management company operations', ru: 'Центральный обзор операций вашей управляющей компании', th: 'ภาพรวมส่วนกลางของการดำเนินงานบริษัทบริหารจัดการของคุณ' },
    features: [
      { en: 'Real-time KPIs: occupancy, revenue, upcoming check-ins', ru: 'KPI в реальном времени: загрузка, доход, предстоящие заселения', th: 'KPI แบบเรียลไทม์: อัตราการเข้าพัก รายได้ การเช็คอินที่กำลังจะมาถึง' },
      { en: 'Quick action buttons for common tasks', ru: 'Кнопки быстрых действий для частых задач', th: 'ปุ่มดำเนินการด่วนสำหรับงานทั่วไป' },
      { en: 'Activity feed with recent events', ru: 'Лента активности с последними событиями', th: 'ฟีดกิจกรรมพร้อมเหตุการณ์ล่าสุด' },
      { en: 'Portfolio overview across all properties', ru: 'Обзор портфолио по всем объектам', th: 'ภาพรวมพอร์ตโฟลิโอของทรัพย์สินทั้งหมด' },
    ],
  },
  {
    id: 'properties',
    icon: Building2,
    title: { en: 'Properties', ru: 'Объекты', th: 'ทรัพย์สิน' },
    description: { en: 'Full property lifecycle management', ru: 'Полное управление жизненным циклом объектов', th: 'การจัดการวงจรชีวิตทรัพย์สินอย่างครบถ้วน' },
    features: [
      { en: 'Add unlimited properties with rich media (photos, descriptions, amenities)', ru: 'Добавление неограниченного количества объектов с медиа (фото, описания, удобства)', th: 'เพิ่มทรัพย์สินได้ไม่จำกัดพร้อมสื่อครบถ้วน (รูปภาพ คำอธิบาย สิ่งอำนวยความสะดวก)' },
      { en: 'Property grouping by complexes', ru: 'Группировка объектов по комплексам', th: 'จัดกลุ่มทรัพย์สินตามโครงการ' },
      { en: 'Inventory tracking (furniture, appliances, documents)', ru: 'Учёт инвентаря (мебель, техника, документы)', th: 'ติดตามรายการทรัพย์สิน (เฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า เอกสาร)' },
      { en: 'Utility meter readings and billing', ru: 'Показания счётчиков и выставление счетов', th: 'การอ่านมิเตอร์สาธารณูปโภคและการเรียกเก็บเงิน' },
      { en: 'Property guidebooks for guests', ru: 'Гайдбуки объектов для гостей', th: 'คู่มือทรัพย์สินสำหรับผู้เข้าพัก' },
    ],
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: { en: 'Calendar & Bookings', ru: 'Календарь и бронирования', th: 'ปฏิทินและการจอง' },
    description: { en: 'Unified booking management across all channels', ru: 'Единое управление бронированиями по всем каналам', th: 'การจัดการการจองแบบรวมศูนย์ในทุกช่องทาง' },
    features: [
      { en: 'Multi-property calendar view (month/week/day)', ru: 'Календарь нескольких объектов (месяц/неделя/день)', th: 'มุมมองปฏิทินหลายทรัพย์สิน (เดือน/สัปดาห์/วัน)' },
      { en: 'iCal sync with Airbnb, Booking.com, and other OTAs', ru: 'iCal-синхронизация с Airbnb, Booking.com и другими OTA', th: 'ซิงค์ iCal กับ Airbnb, Booking.com และ OTA อื่น ๆ' },
      { en: 'Manual booking creation with guest details', ru: 'Создание бронирований вручную с данными гостей', th: 'สร้างการจองด้วยตนเองพร้อมข้อมูลผู้เข้าพัก' },
      { en: 'Check-in / check-out operations with photo reports', ru: 'Операции заселения/выселения с фотоотчётами', th: 'การเช็คอิน/เช็คเอาต์พร้อมรายงานภาพถ่าย' },
      { en: 'Deposit management and damage reporting', ru: 'Управление залогами и отчёты о повреждениях', th: 'การจัดการเงินมัดจำและการรายงานความเสียหาย' },
    ],
  },
  {
    id: 'crm',
    icon: Users,
    title: { en: 'CRM & Sales', ru: 'CRM и продажи', th: 'CRM และการขาย' },
    description: {
      en: 'Lead management in MC. For newbuild and investor deals, switch to Capital — see FAQ «MC CRM vs Capital».',
      ru: 'Управление лидами в MC. Сделки по newbuild и инвестициям — в Capital; см. FAQ «MC CRM и Capital».',
      th: 'การจัดการลีดใน MC สำหรับดีลโครงการใหม่และนักลงทุน ให้สลับไปที่ Capital — ดู FAQ «MC CRM กับ Capital»',
    },
    features: [
      { en: 'Contact database with segmentation and tags', ru: 'База контактов с сегментацией и тегами', th: 'ฐานข้อมูลผู้ติดต่อพร้อมการแบ่งกลุ่มและแท็ก' },
      { en: 'Customizable sales pipelines with drag-and-drop stages', ru: 'Настраиваемые воронки продаж с перетаскиванием этапов', th: 'ไปป์ไลน์การขายที่ปรับแต่งได้พร้อมขั้นตอนแบบลากและวาง' },
      { en: 'Email campaigns and sequences', ru: 'Email-рассылки и автоматические цепочки', th: 'แคมเปญอีเมลและลำดับอีเมลอัตโนมัติ' },
      { en: 'Web forms for lead capture', ru: 'Веб-формы для сбора лидов', th: 'แบบฟอร์มเว็บสำหรับเก็บลีด' },
      { en: 'Quote/proposal generation', ru: 'Генерация коммерческих предложений', th: 'การสร้างใบเสนอราคา/ข้อเสนอ' },
      { en: 'Duplicate detection and contact merging', ru: 'Обнаружение дубликатов и объединение контактов', th: 'การตรวจจับข้อมูลซ้ำและการรวมผู้ติดต่อ' },
    ],
  },
  {
    id: 'finance',
    icon: DollarSign,
    title: { en: 'Finance', ru: 'Финансы', th: 'การเงิน' },
    description: { en: 'Revenue tracking, expense management, and reporting', ru: 'Учёт доходов, управление расходами и отчётность', th: 'การติดตามรายได้ การจัดการรายจ่าย และการรายงาน' },
    features: [
      { en: 'Income and expense tracking per property', ru: 'Учёт доходов и расходов по каждому объекту', th: 'การติดตามรายรับและรายจ่ายของแต่ละทรัพย์สิน' },
      { en: 'Monthly owner financial statements', ru: 'Ежемесячные финансовые отчёты для собственников', th: 'รายงานการเงินรายเดือนสำหรับเจ้าของ' },
      { en: 'Budget planning and variance analysis', ru: 'Планирование бюджета и анализ отклонений', th: 'การวางแผนงบประมาณและการวิเคราะห์ความแตกต่าง' },
      { en: 'Invoice generation and payment tracking', ru: 'Генерация счетов и отслеживание оплат', th: 'การสร้างใบแจ้งหนี้และการติดตามการชำระเงิน' },
      { en: 'Multi-currency support for global operations', ru: 'Мультивалютная поддержка для международных операций', th: 'รองรับหลายสกุลเงินสำหรับการดำเนินงานทั่วโลก' },
      { en: 'Customizable financial categories', ru: 'Настраиваемые финансовые категории', th: 'หมวดหมู่การเงินที่ปรับแต่งได้' },
    ],
  },
  {
    id: 'tasks',
    icon: ClipboardList,
    title: { en: 'Tasks & Operations', ru: 'Задачи и операции', th: 'งานและปฏิบัติการ' },
    description: { en: 'Task management for your team', ru: 'Управление задачами для вашей команды', th: 'การจัดการงานสำหรับทีมของคุณ' },
    features: [
      { en: 'Create and assign tasks to team members', ru: 'Создание и назначение задач сотрудникам', th: 'สร้างและมอบหมายงานให้สมาชิกในทีม' },
      { en: 'Task templates for recurring operations', ru: 'Шаблоны задач для повторяющихся операций', th: 'เทมเพลตงานสำหรับงานที่ทำซ้ำเป็นประจำ' },
      { en: 'Priority levels and due dates', ru: 'Уровни приоритета и сроки выполнения', th: 'ระดับความสำคัญและกำหนดส่ง' },
      { en: 'Kanban board and list views', ru: 'Канбан-доска и список задач', th: 'มุมมองบอร์ด Kanban และรายการ' },
      { en: 'Vendor coordination for maintenance', ru: 'Координация поставщиков для обслуживания', th: 'การประสานงานผู้ให้บริการสำหรับงานบำรุงรักษา' },
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: { en: 'Team Management', ru: 'Управление командой', th: 'การจัดการทีม' },
    description: { en: 'Staff hierarchy and access control', ru: 'Иерархия сотрудников и контроль доступа', th: 'ลำดับชั้นพนักงานและการควบคุมการเข้าถึง' },
    features: [
      { en: 'Role-based access: Director → Admin → Manager → Staff', ru: 'Ролевой доступ: Директор → Администратор → Менеджер → Сотрудник', th: 'การเข้าถึงตามบทบาท: ผู้อำนวยการ → แอดมิน → ผู้จัดการ → พนักงาน' },
      { en: 'Module-level permissions (CRM, Finance, Bookings, etc.)', ru: 'Права на уровне модулей (CRM, Финансы, Бронирования и т.д.)', th: 'สิทธิ์ระดับโมดูล (CRM, การเงิน, การจอง ฯลฯ)' },
      { en: 'Property assignment per team member', ru: 'Назначение объектов каждому сотруднику', th: 'การมอบหมายทรัพย์สินให้สมาชิกแต่ละคน' },
      { en: 'Email invitations with auto-generated credentials', ru: 'Email-приглашения с автоматически сгенерированными учётными данными', th: 'คำเชิญทางอีเมลพร้อมข้อมูลเข้าสู่ระบบที่สร้างอัตโนมัติ' },
      { en: 'Activity audit trail', ru: 'Журнал аудита действий', th: 'บันทึกการตรวจสอบกิจกรรม' },
    ],
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: { en: 'Reports & Analytics', ru: 'Отчёты и аналитика', th: 'รายงานและการวิเคราะห์' },
    description: { en: 'Data-driven insights for your business', ru: 'Аналитика для принятия решений', th: 'ข้อมูลเชิงลึกที่ขับเคลื่อนด้วยข้อมูลสำหรับธุรกิจของคุณ' },
    features: [
      { en: 'Occupancy rate analytics', ru: 'Аналитика загрузки объектов', th: 'การวิเคราะห์อัตราการเข้าพัก' },
      { en: 'Revenue trends and forecasting', ru: 'Тренды дохода и прогнозирование', th: 'แนวโน้มรายได้และการคาดการณ์' },
      { en: 'Owner monthly statements with auto-send', ru: 'Ежемесячные отчёты собственникам с авторассылкой', th: 'รายงานรายเดือนสำหรับเจ้าของพร้อมการส่งอัตโนมัติ' },
      { en: 'Export to PDF and Excel', ru: 'Экспорт в PDF и Excel', th: 'ส่งออกเป็น PDF และ Excel' },
      { en: 'Comparative analysis across properties', ru: 'Сравнительный анализ между объектами', th: 'การวิเคราะห์เปรียบเทียบระหว่างทรัพย์สิน' },
    ],
  },
];

interface SecurityItem {
  icon: React.ElementType;
  title: { en: string; ru: string; th: string };
  description: { en: string; ru: string; th: string };
}

const SECURITY_ITEMS: SecurityItem[] = [
  {
    icon: Lock,
    title: { en: 'Data Encryption', ru: 'Шифрование данных', th: 'การเข้ารหัสข้อมูล' },
    description: { en: 'All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Your financial data, guest information, and business documents are fully protected.', ru: 'Все данные зашифрованы при передаче (TLS 1.3) и при хранении (AES-256). Ваши финансовые данные, информация о гостях и бизнес-документы полностью защищены.', th: 'ข้อมูลทั้งหมดถูกเข้ารหัสระหว่างการส่ง (TLS 1.3) และขณะจัดเก็บ (AES-256) ข้อมูลการเงิน ข้อมูลผู้เข้าพัก และเอกสารธุรกิจของคุณได้รับการปกป้องอย่างเต็มที่' },
  },
  {
    icon: Shield,
    title: { en: 'Role-Based Access Control', ru: 'Ролевой контроль доступа', th: 'การควบคุมการเข้าถึงตามบทบาท' },
    description: { en: 'Each team member gets access only to the modules they need. Directors see everything, managers see their properties, staff sees only their tasks. Permissions are enforced at database level.', ru: 'Каждый сотрудник получает доступ только к нужным модулям. Директоры видят всё, менеджеры — свои объекты, сотрудники — только свои задачи. Права применяются на уровне базы данных.', th: 'สมาชิกแต่ละคนเข้าถึงได้เฉพาะโมดูลที่จำเป็น ผู้อำนวยการเห็นทุกอย่าง ผู้จัดการเห็นทรัพย์สินของตน พนักงานเห็นเฉพาะงานของตน สิทธิ์ถูกบังคับใช้ในระดับฐานข้อมูล' },
  },
  {
    icon: Database,
    title: { en: 'Data Backup & Recovery', ru: 'Бэкап и восстановление данных', th: 'การสำรองและกู้คืนข้อมูล' },
    description: { en: 'Automatic daily backups with 30-day retention. You can also manually export all your data (properties, CRM, finances) at any time via Settings → Data.', ru: 'Автоматические ежедневные бэкапы с хранением 30 дней. Вы также можете вручную экспортировать все данные (объекты, CRM, финансы) в любой момент через Настройки → Данные.', th: 'การสำรองข้อมูลรายวันอัตโนมัติพร้อมเก็บรักษา 30 วัน คุณยังสามารถส่งออกข้อมูลทั้งหมด (ทรัพย์สิน CRM การเงิน) ด้วยตนเองได้ตลอดเวลาผ่าน การตั้งค่า → ข้อมูล' },
  },
  {
    icon: Globe,
    title: { en: 'GDPR & Privacy Compliance', ru: 'Соответствие GDPR и конфиденциальность', th: 'การปฏิบัติตาม GDPR และความเป็นส่วนตัว' },
    description: { en: 'Guest personal data is handled in accordance with GDPR principles. Data minimization, right to deletion, and consent management are built into the platform.', ru: 'Персональные данные гостей обрабатываются в соответствии с принципами GDPR. Минимизация данных, право на удаление и управление согласиями встроены в платформу.', th: 'ข้อมูลส่วนบุคคลของผู้เข้าพักได้รับการจัดการตามหลักการ GDPR การลดข้อมูลให้น้อยที่สุด สิทธิ์ในการลบ และการจัดการความยินยอมถูกผนวกไว้ในแพลตฟอร์ม' },
  },
  {
    icon: RefreshCw,
    title: { en: '99.9% Uptime SLA', ru: 'SLA доступности 99.9%', th: 'SLA เวลาทำงาน 99.9%' },
    description: { en: 'Our infrastructure runs on enterprise-grade cloud servers with automatic failover. Your data is replicated across multiple availability zones.', ru: 'Наша инфраструктура работает на корпоративных облачных серверах с автоматическим переключением. Ваши данные реплицируются в нескольких зонах доступности.', th: 'โครงสร้างพื้นฐานของเราทำงานบนเซิร์ฟเวอร์คลาวด์ระดับองค์กรพร้อมการสำรองอัตโนมัติ ข้อมูลของคุณถูกทำซ้ำในหลายโซนความพร้อมใช้งาน' },
  },
  {
    icon: FileText,
    title: { en: 'Audit Logging', ru: 'Журнал аудита', th: 'การบันทึกการตรวจสอบ' },
    description: { en: 'All critical actions (login, data changes, financial operations, team changes) are logged with timestamps and user IDs for full transparency and accountability.', ru: 'Все критические действия (вход, изменения данных, финансовые операции, изменения команды) логируются с метками времени и ID пользователей для полной прозрачности.', th: 'การกระทำที่สำคัญทั้งหมด (การเข้าสู่ระบบ การเปลี่ยนแปลงข้อมูล การดำเนินการทางการเงิน การเปลี่ยนแปลงทีม) ถูกบันทึกพร้อมการประทับเวลาและรหัสผู้ใช้เพื่อความโปร่งใสและความรับผิดชอบอย่างเต็มที่' },
  },
];

// ═══════════════════════════════════════════
// AI ASSISTANT COMPONENT (inline)
// ═══════════════════════════════════════════

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function HelpAIAssistant({ isRu, isTh }: { isRu: boolean; isTh: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const streamChat = async (msgs: ChatMessage[]) => {
    const resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: isRu
            ? 'Ты — помощник по использованию PMS-системы myUNO для управляющих компаний. Отвечай на вопросы о функционале системы, подписках, настройках, CRM, финансах, календаре, управлении командой. Отвечай кратко и по делу на русском языке.'
            : isTh
            ? 'คุณคือผู้ช่วยสำหรับการใช้งานระบบ PMS ของ myUNO สำหรับบริษัทบริหารจัดการทรัพย์สิน ตอบคำถามเกี่ยวกับฟีเจอร์ของระบบ การสมัครสมาชิก การตั้งค่า CRM การเงิน ปฏิทิน และการจัดการทีม ตอบให้กระชับและเป็นประโยชน์เป็นภาษาไทย'
            : 'You are a help assistant for the myUNO PMS system for property management companies. Answer questions about system features, subscriptions, settings, CRM, finance, calendar, team management. Be concise and helpful.' },
          ...msgs,
        ],
      }),
    });
    if (!resp.ok || !resp.body) throw new Error('Stream failed');

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant') {
                return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContent } : m);
              }
              return [...prev, { role: 'assistant', content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    try {
      await streamChat(newMessages);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: isRu ? 'Ошибка. Попробуйте позже.' : isTh ? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' : 'Error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQs = isRu
    ? ['Как добавить объект?', 'Как пригласить сотрудника?', 'Как работает подписка?', 'Как экспортировать данные?']
    : isTh
    ? ['จะเพิ่มทรัพย์สินอย่างไร?', 'จะเชิญสมาชิกในทีมอย่างไร?', 'การสมัครสมาชิกทำงานอย่างไร?', 'จะส่งออกข้อมูลอย่างไร?']
    : ['How to add a property?', 'How to invite a team member?', 'How does subscription work?', 'How to export data?'];

  return (
    <Card className="h-[500px] flex flex-col">
      <div className="p-4 border-b flex items-center gap-3 bg-primary/5">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">{isRu ? 'AI Помощник PMS' : isTh ? 'ผู้ช่วย AI ของ PMS' : 'PMS AI Assistant'}</p>
          <p className="text-xs text-muted-foreground">{isRu ? 'Спросите о любой функции системы' : isTh ? 'สอบถามเกี่ยวกับฟีเจอร์ใด ๆ ของระบบ' : 'Ask about any system feature'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Bot className="h-10 w-10 mx-auto mb-3 text-primary/40" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Задайте вопрос о системе' : isTh ? 'ถามคำถามเกี่ยวกับระบบ' : 'Ask a question about the system'}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickQs.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  className="text-left p-2.5 rounded-none bg-muted/50 hover:bg-muted text-xs transition-colors"
                >
                  <ChevronRight className="h-3 w-3 inline mr-1 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', msg.role === 'user' ? 'bg-primary' : 'bg-primary/10')}>
                  {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-primary-foreground" /> : <Bot className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className={cn('rounded-none px-3 py-2 max-w-[85%] text-sm', msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-none' : 'bg-muted rounded-none')}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="rounded-none bg-muted px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={isRu ? 'Спросите о системе...' : isTh ? 'สอบถามเกี่ยวกับระบบ...' : 'Ask about the system...'}
            disabled={isLoading}
            className="flex-1 h-9"
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="min-h-[44px] min-w-[44px] h-9 w-9" aria-label={isRu ? 'Отправить' : isTh ? 'ส่ง' : 'Send'}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════
// MAIN HELP PAGE
// ═══════════════════════════════════════════

export default function MCHelpPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const [search, setSearch] = useState('');

  const filteredFAQ = FAQ_ITEMS.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.q.en.toLowerCase().includes(q) ||
      item.q.ru.toLowerCase().includes(q) ||
      item.q.th.toLowerCase().includes(q) ||
      item.a.en.toLowerCase().includes(q) ||
      item.a.ru.toLowerCase().includes(q) ||
      item.a.th.toLowerCase().includes(q)
    );
  });

  const filteredFeatures = FEATURE_SECTIONS.filter(section => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      section.title.en.toLowerCase().includes(q) ||
      section.title.ru.toLowerCase().includes(q) ||
      section.title.th.toLowerCase().includes(q) ||
      section.features.some(f => f.en.toLowerCase().includes(q) || f.ru.toLowerCase().includes(q) || f.th.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Helmet>
        <title>{isRu ? 'Справочник — PMS' : isTh ? 'ศูนย์ช่วยเหลือ — PMS' : 'Help Center — PMS'}</title>
      </Helmet>

      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              {isRu ? 'Справочник системы' : isTh ? 'ศูนย์ช่วยเหลือ' : 'Help Center'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Руководство, FAQ и AI-помощник по работе с PMS' : isTh ? 'คู่มือ FAQ และผู้ช่วย AI สำหรับ PMS' : 'Guide, FAQ, and AI assistant for PMS'}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={isRu ? 'Поиск по справочнику...' : isTh ? 'ค้นหาความช่วยเหลือ...' : 'Search help...'}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="faq">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="faq" className="gap-1.5 text-xs">
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-1.5 text-xs">
              <Zap className="h-3.5 w-3.5" />
              {isRu ? 'Функционал' : isTh ? 'ฟีเจอร์' : 'Features'}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              {isRu ? 'Безопасность' : isTh ? 'ความปลอดภัย' : 'Security'}
            </TabsTrigger>
            <TabsTrigger value="assistant" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              {isRu ? 'AI Помощник' : isTh ? 'ผู้ช่วย AI' : 'AI Assistant'}
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  {filteredFAQ.map((item, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-b last:border-0">
                      <AccordionTrigger className="px-4 py-3 text-sm font-medium hover:no-underline text-left">
                        {isRu ? item.q.ru : isTh ? item.q.th : item.q.en}
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                        {isRu ? item.a.ru : isTh ? item.a.th : item.a.en}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {filteredFAQ.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      {isRu ? 'Ничего не найдено' : isTh ? 'ไม่พบผลลัพธ์' : 'No results found'}
                    </div>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="mt-4">
            <Accordion type="multiple" className="space-y-2">
              {filteredFeatures.map(section => {
                const Icon = section.icon;
                return (
                  <AccordionItem key={section.id} value={section.id} className="border rounded-none bg-card px-0">
                    <AccordionTrigger className="px-4 py-3 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isRu ? section.title.ru : isTh ? section.title.th : section.title.en}</p>
                          <p className="text-xs text-muted-foreground">{isRu ? section.description.ru : isTh ? section.description.th : section.description.en}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <ul className="space-y-2 ml-11">
                        {section.features.map((f, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Star className="h-3.5 w-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">{isRu ? f.ru : isTh ? f.th : f.en}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SECURITY_ITEMS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-none bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4.5 w-4.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold mb-1">{isRu ? item.title.ru : isTh ? item.title.th : item.title.en}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{isRu ? item.description.ru : isTh ? item.description.th : item.description.en}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Separator className="my-6" />

            {/* Contact support */}
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="flex flex-col sm:flex-row items-center gap-4 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium">{isRu ? 'Остались вопросы?' : isTh ? 'ยังมีคำถามอยู่ใช่ไหม?' : 'Still have questions?'}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Свяжитесь с нашей командой поддержки' : isTh ? 'ติดต่อทีมสนับสนุนของเรา' : 'Contact our support team'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="gap-2 shrink-0"
                  onClick={() => window.open('https://wa.me/66922407355', '_blank')}
                >
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="mt-4">
            <HelpAIAssistant isRu={isRu} isTh={isTh} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
