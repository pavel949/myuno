import { Home, MapPin, Upload, DollarSign } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  titleRu: string;
  icon: React.ReactNode;
  description?: string;
  descriptionRu?: string;
}

/**
 * Streamlined 4-step wizard (reduced from 7)
 * Combines: ownership+basic+management → basic, pricing+description → pricing
 */
export const propertyWizardSteps: WizardStep[] = [
  {
    id: 'basic',
    title: 'Basic Info',
    titleRu: 'Основное',
    icon: <Home className="h-4 w-4" />,
    description: 'Type, specs & ownership',
    descriptionRu: 'Тип, характеристики и владение',
  },
  {
    id: 'location',
    title: 'Location',
    titleRu: 'Адрес',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Address and map',
    descriptionRu: 'Адрес на карте',
  },
  {
    id: 'photos',
    title: 'Photos',
    titleRu: 'Фото',
    icon: <Upload className="h-4 w-4" />,
    description: 'Upload images',
    descriptionRu: 'Загрузите снимки',
  },
  {
    id: 'pricing',
    title: 'Pricing & Submit',
    titleRu: 'Цены и отправка',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Rates, terms & description',
    descriptionRu: 'Тарифы, условия и описание',
  },
];
