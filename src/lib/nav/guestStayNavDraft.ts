/**
 * In-stay / guest-stay navigation draft (NOT wired to `SIDEBAR_NAV`).
 *
 * Reserved for a future guest-stay shell or deep-link. Do not use in production
 * chrome until product attaches it to a `NavRoleKey` and layout.
 */
import {
  Home, CalendarCheck, MessageCircle, Sparkles, Car, ShoppingBag,
  BookOpen, MapPin, ClipboardList,
} from 'lucide-react';
import type { ComponentType } from 'react';

type NavIcon = ComponentType<{ className?: string }>;

type DraftGroup = {
  labelEn: string;
  labelRu: string;
  defaultOpen?: boolean;
  items: { path: string; labelEn: string; labelRu: string; icon: NavIcon }[];
};

export const GUEST_STAY_SIDEBAR_DRAFT: DraftGroup[] = [
  {
    labelEn: 'My Stay',
    labelRu: 'Мой визит',
    defaultOpen: true,
    items: [
      { path: '/my-stay', labelEn: 'Dashboard', labelRu: 'Обзор', icon: Home },
      { path: '/bookings', labelEn: 'My Bookings', labelRu: 'Мои бронирования', icon: CalendarCheck },
      { path: '/guest/messages', labelEn: 'Messages', labelRu: 'Сообщения', icon: MessageCircle },
    ],
  },
  {
    labelEn: 'Services',
    labelRu: 'Услуги',
    defaultOpen: true,
    items: [
      { path: '/cleaning', labelEn: 'Cleaning', labelRu: 'Уборка', icon: Sparkles },
      { path: '/transport', labelEn: 'Transport', labelRu: 'Транспорт', icon: Car },
      { path: '/delivery', labelEn: 'Delivery', labelRu: 'Доставка', icon: ShoppingBag },
    ],
  },
  {
    labelEn: 'Property',
    labelRu: 'Объект',
    items: [
      { path: '/guest/guidebook', labelEn: 'Guidebook', labelRu: 'Гайдбук', icon: BookOpen },
      { path: '/guest/area', labelEn: 'Area Guide', labelRu: 'Район', icon: MapPin },
      { path: '/guest/rules', labelEn: 'House Rules', labelRu: 'Правила', icon: ClipboardList },
    ],
  },
];
