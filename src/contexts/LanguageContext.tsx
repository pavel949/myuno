import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.discover': 'Каталог',
    'nav.map': 'Карта',
    'nav.bookings': 'Бронирования',
    'nav.profile': 'Профиль',
    
    // Auth
    'auth.login': 'Войти',
    'auth.signup': 'Регистрация',
    'auth.logout': 'Выйти',
    'auth.email': 'Email',
    'auth.password': 'Пароль',
    'auth.fullName': 'Полное имя',
    'auth.forgotPassword': 'Забыли пароль?',
    'auth.noAccount': 'Нет аккаунта?',
    'auth.hasAccount': 'Уже есть аккаунт?',
    'auth.createAccount': 'Создать аккаунт',
    'auth.welcomeBack': 'С возвращением!',
    'auth.getStarted': 'Начните сейчас',
    
    // Common actions
    'action.book': 'Забронировать',
    'action.cancel': 'Отмена',
    'action.confirm': 'Подтвердить',
    'action.save': 'Сохранить',
    'action.edit': 'Редактировать',
    'action.delete': 'Удалить',
    'action.view': 'Смотреть',
    'action.viewAll': 'Смотреть все',
    'action.search': 'Поиск',
    'action.filter': 'Фильтр',
    'action.sort': 'Сортировка',
    'action.apply': 'Применить',
    'action.clear': 'Очистить',
    'action.back': 'Назад',
    'action.next': 'Далее',
    'action.submit': 'Отправить',
    
    // Booking statuses
    'status.draft': 'Черновик',
    'status.submitted': 'Отправлено',
    'status.confirmed': 'Подтверждено',
    'status.in_progress': 'В процессе',
    'status.completed': 'Завершено',
    'status.cancelled_by_user': 'Отменено вами',
    'status.cancelled_by_provider': 'Отменено исполнителем',
    'status.expired': 'Истекло',
    
    // Categories
    'category.beauty-spa': 'Красота и СПА',
    'category.restaurants': 'Рестораны',
    'category.flowers': 'Цветы',
    'category.fitness': 'Фитнес',
    'category.medical': 'Медицина',
    'category.kids-education': 'Дети и Образование',
    'category.real-estate': 'Недвижимость',
    'category.transport': 'Транспорт',
    'category.events': 'Мероприятия',
    'category.shopping': 'Покупки',
    'category.services': 'Услуги',
    
    // User types
    'userType.tourist': 'Турист',
    'userType.resident': 'Резидент',
    
    // Common labels
    'label.price': 'Цена',
    'label.duration': 'Длительность',
    'label.rating': 'Рейтинг',
    'label.reviews': 'отзывов',
    'label.location': 'Локация',
    'label.date': 'Дата',
    'label.time': 'Время',
    'label.from': 'от',
    'label.perHour': '/час',
    'label.perDay': '/день',
    'label.perNight': '/ночь',
    'label.verified': 'Проверено',
    'label.popular': 'Популярное',
    'label.new': 'Новое',
    'label.featured': 'Рекомендуем',
    
    // Messages
    'message.noResults': 'Ничего не найдено',
    'message.loading': 'Загрузка...',
    'message.error': 'Произошла ошибка',
    'message.success': 'Успешно!',
    'message.loginRequired': 'Требуется авторизация',
    
    // Home page
    'home.welcome': 'Добро пожаловать в UNO',
    'home.subtitle': 'Ваш персональный гид по Пхукету',
    'home.featuredServices': 'Популярные услуги',
    'home.categories': 'Категории',
    'home.nearYou': 'Рядом с вами',
    
    // Beauty & Spa
    'beauty.title': 'Красота и СПА',
    'beauty.salons': 'Салоны',
    'beauty.services': 'Услуги',
    'beauty.selectServices': 'Выберите услуги',
    'beauty.popularServices': 'Популярные услуги',
    'beauty.nearbySalons': 'Салоны рядом',
    'beauty.searchSalons': 'Поиск салонов...',
    'beauty.searchServices': 'Поиск услуг...',
    'beauty.bookAppointment': 'Записаться',
    'beauty.selectDate': 'Выберите дату',
    'beauty.selectTime': 'Выберите время',
    'beauty.contactInfo': 'Контактная информация',
    'beauty.confirmBooking': 'Подтвердить бронирование',
    'beauty.bookingSuccess': 'Бронирование создано!',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.map': 'Map',
    'nav.bookings': 'Bookings',
    'nav.profile': 'Profile',
    
    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.forgotPassword': 'Forgot password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.createAccount': 'Create Account',
    'auth.welcomeBack': 'Welcome Back!',
    'auth.getStarted': 'Get Started',
    
    // Common actions
    'action.book': 'Book Now',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.save': 'Save',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.view': 'View',
    'action.viewAll': 'View All',
    'action.search': 'Search',
    'action.filter': 'Filter',
    'action.sort': 'Sort',
    'action.apply': 'Apply',
    'action.clear': 'Clear',
    'action.back': 'Back',
    'action.next': 'Next',
    'action.submit': 'Submit',
    
    // Booking statuses
    'status.draft': 'Draft',
    'status.submitted': 'Submitted',
    'status.confirmed': 'Confirmed',
    'status.in_progress': 'In Progress',
    'status.completed': 'Completed',
    'status.cancelled_by_user': 'Cancelled by You',
    'status.cancelled_by_provider': 'Cancelled by Provider',
    'status.expired': 'Expired',
    
    // Categories
    'category.beauty-spa': 'Beauty & Spa',
    'category.restaurants': 'Restaurants',
    'category.flowers': 'Flowers',
    'category.fitness': 'Fitness',
    'category.medical': 'Medical',
    'category.kids-education': 'Kids & Education',
    'category.real-estate': 'Real Estate',
    'category.transport': 'Transport',
    'category.events': 'Events & Tickets',
    'category.shopping': 'Shopping',
    'category.services': 'Services',
    
    // User types
    'userType.tourist': 'Tourist',
    'userType.resident': 'Resident',
    
    // Common labels
    'label.price': 'Price',
    'label.duration': 'Duration',
    'label.rating': 'Rating',
    'label.reviews': 'reviews',
    'label.location': 'Location',
    'label.date': 'Date',
    'label.time': 'Time',
    'label.from': 'from',
    'label.perHour': '/hr',
    'label.perDay': '/day',
    'label.perNight': '/night',
    'label.verified': 'Verified',
    'label.popular': 'Popular',
    'label.new': 'New',
    'label.featured': 'Featured',
    
    // Messages
    'message.noResults': 'No results found',
    'message.loading': 'Loading...',
    'message.error': 'An error occurred',
    'message.success': 'Success!',
    'message.loginRequired': 'Login required',
    
    // Home page
    'home.welcome': 'Welcome to UNO',
    'home.subtitle': 'Your personal guide to Phuket',
    'home.featuredServices': 'Featured Services',
    'home.categories': 'Categories',
    'home.nearYou': 'Near You',
    
    // Beauty & Spa
    'beauty.title': 'Beauty & Spa',
    'beauty.salons': 'Salons',
    'beauty.services': 'Services',
    'beauty.selectServices': 'Select Services',
    'beauty.popularServices': 'Popular Services',
    'beauty.nearbySalons': 'Nearby Salons',
    'beauty.searchSalons': 'Search salons...',
    'beauty.searchServices': 'Search services...',
    'beauty.bookAppointment': 'Book Appointment',
    'beauty.selectDate': 'Select Date',
    'beauty.selectTime': 'Select Time',
    'beauty.contactInfo': 'Contact Information',
    'beauty.confirmBooking': 'Confirm Booking',
    'beauty.bookingSuccess': 'Booking Confirmed!',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('uno-language');
    return (saved as Language) || 'ru';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('uno-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
