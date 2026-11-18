import { Link } from 'react-router-dom';
import { Compass, Building2, HandHelping, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const catalogs = [
  {
    id: 'experiences', icon: Compass,
    title: ['Впечатления', 'Experiences'],
    description: ['Парки, экскурсии, море, активный отдых и другие способы провести время.', 'Parks, tours, sea trips, activities and more ways to spend your time.'],
    action: ['Редактировать предложения', 'Edit experiences'], to: '/admin/experiences',
    links: [
      { label: ['Категории впечатлений', 'Experience categories'], to: '/admin/experience-categories' },
      { label: ['Яхты и морские прогулки', 'Yachts and sea trips'], to: '/admin/yachts' },
      { label: ['События', 'Events'], to: '/admin/events' },
    ],
  },
  {
    id: 'services', icon: HandHelping,
    title: ['Сервисы', 'Services'],
    description: ['Повседневная помощь и услуги. Существующие категории и предложения сохраняются.', 'Everyday help and services. Existing categories and offerings stay in place.'],
    action: ['Редактировать услуги', 'Edit services'], to: '/admin/catalog?tab=services',
    links: [
      { label: ['Категории сервисов', 'Service categories'], to: '/admin/catalog?tab=categories' },
      { label: ['Поставщики', 'Providers'], to: '/admin/providers' },
      { label: ['Салоны и процедуры', 'Salons and treatments'], to: '/admin/salons' },
      { label: ['Трансферы', 'Transfers'], to: '/admin/transfers' },
    ],
  },
  {
    id: 'property', icon: Building2,
    title: ['Недвижимость', 'Real estate'],
    description: ['Застройщик → проект → объект. Аренда и продажа относятся к одному объекту, без дублирования.', 'Developer → project → property. Rental and sale belong to the same property, without duplicates.'],
    action: ['Редактировать объекты', 'Edit properties'], to: '/admin/properties',
    links: [
      { label: ['Застройщики', 'Developers'], to: '/admin/developers' },
      { label: ['Проекты и комплексы', 'Projects and residences'], to: '/admin/projects' },
      { label: ['Предложения новостроек', 'Newbuild offerings'], to: '/admin/newbuilds' },
    ],
  },
];

/** Navigation only: canonical editors and their existing authorization remain the owners. */
export function AdminCatalogHub() {
  const { language } = useLanguage();
  const locale = language === 'ru' ? 0 : 1;
  return (
    <div className="space-y-6 py-4">
      <div className="grid gap-4 lg:grid-cols-3">
        {catalogs.map(({ id, icon: Icon, title, description, action, to, links }) => (
          <Card key={id} className="flex min-w-0 flex-col gap-4 p-5">
            <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
            <div className="space-y-2 lg:min-h-28">
              <h2 className="text-xl font-semibold">{title[locale]}</h2>
              <p className="text-sm text-muted-foreground">{description[locale]}</p>
            </div>
            <Button asChild className="h-auto min-h-11 whitespace-normal text-center">
              <Link to={to}>{action[locale]}<ArrowRight className="ml-2 h-4 w-4 shrink-0" aria-hidden="true" /></Link>
            </Button>
            <ul className="border-t pt-2">
              {links.map(link => (
                <li key={link.to}><Link to={link.to} className="flex min-h-11 items-center rounded-md px-1 text-sm text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring">{link.label[locale]}</Link></li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <section className="rounded-lg border bg-muted/30 p-5" aria-labelledby="catalog-publishing-help">
        <h2 id="catalog-publishing-help" className="font-semibold">{locale === 0 ? 'От данных к карточке для клиента' : 'From content to the customer card'}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{locale === 0
          ? 'Выберите каталог, откройте нужное предложение и заполните описание, фотографии, характеристики и условия. Перед публикацией проверьте точку на карте и то, что увидит клиент. Черновик категории не означает, что предложение уже доступно для бронирования.'
          : 'Choose a catalog, open an offering and add its description, photos, details and terms. Before publishing, check its map location and customer view. A draft category does not mean an offering is available to book.'}</p>
      </section>
    </div>
  );
}
