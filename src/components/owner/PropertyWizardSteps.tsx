import { Home, MapPin, Upload, DollarSign, Settings, FileText, Users } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  titleRu: string;
  icon: React.ReactNode;
  description?: string;
  descriptionRu?: string;
}

export const propertyWizardSteps: WizardStep[] = [
  {
    id: 'ownership',
    title: 'Ownership',
    titleRu: 'Владение',
    icon: <Users className="h-4 w-4" />,
    description: 'Property ownership',
    descriptionRu: 'Тип владения',
  },
  {
    id: 'basic',
    title: 'Basic Info',
    titleRu: 'Основное',
    icon: <Home className="h-4 w-4" />,
    description: 'Property type and specs',
    descriptionRu: 'Тип и характеристики',
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
    title: 'Pricing',
    titleRu: 'Цены',
    icon: <DollarSign className="h-4 w-4" />,
    description: 'Rates and terms',
    descriptionRu: 'Тарифы и условия',
  },
  {
    id: 'management',
    title: 'Management',
    titleRu: 'Управление',
    icon: <Settings className="h-4 w-4" />,
    description: 'Service level',
    descriptionRu: 'Уровень сервиса',
  },
  {
    id: 'description',
    title: 'Description',
    titleRu: 'Описание',
    icon: <FileText className="h-4 w-4" />,
    description: 'Details & submit',
    descriptionRu: 'Детали и отправка',
  },
];
