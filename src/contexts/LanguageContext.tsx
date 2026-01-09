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
    'category.tours': 'Экскурсии',
    'category.water': 'Водные активности',
    'category.pharmacy': 'Аптеки',
    
    // Tours
    'tours.title': 'Экскурсии и туры',
    'tours.subtitle': 'Откройте для себя Пхукет',
    'tours.featured': 'Популярные туры',
    'tours.duration': 'Длительность',
    'tours.includes': 'Включено',
    'tours.itinerary': 'Маршрут',
    'tours.meetingPoint': 'Место встречи',
    'tours.maxParticipants': 'Макс. участников',
    'tours.difficulty': 'Сложность',
    'tours.highlights': 'Особенности',
    'tours.bookNow': 'Забронировать тур',
    'tours.selectDate': 'Выберите дату',
    'tours.selectTime': 'Выберите время',
    'tours.participants': 'Участники',
    'tours.contactDetails': 'Контактные данные',
    'tours.confirmBooking': 'Подтвердить бронирование',
    'tours.bookingSuccess': 'Тур забронирован!',
    
    // Water Activities
    'water.title': 'Водные активности',
    'water.subtitle': 'Дайвинг, снорклинг, яхты и многое другое',
    'water.featured': 'Популярные активности',
    'water.diving': 'Дайвинг',
    'water.snorkeling': 'Снорклинг',
    'water.jetski': 'Гидроцикл',
    'water.yacht': 'Яхты',
    'water.surfing': 'Серфинг',
    'water.kayaking': 'Каякинг',
    'water.fishing': 'Рыбалка',
    'water.parasailing': 'Парасейлинг',
    'water.certified': 'Сертифицировано',
    'water.equipmentIncluded': 'Снаряжение включено',
    'water.safetyBriefing': 'Инструктаж по безопасности',
    'water.ageRestriction': 'Минимальный возраст',
    'water.difficulty.easy': 'Легкий',
    'water.difficulty.moderate': 'Средний',
    'water.difficulty.challenging': 'Сложный',
    'water.difficulty.expert': 'Эксперт',
    
    // Pharmacy
    'pharmacy.title': 'Аптеки',
    'pharmacy.subtitle': 'Лекарства и товары для здоровья',
    'pharmacy.24h': 'Круглосуточно',
    'pharmacy.delivery': 'Доставка',
    'pharmacy.fastDelivery': 'Быстрая доставка',
    'pharmacy.fromMinutes': 'От 30 минут',
    'pharmacy.pharmacist': 'Консультация фармацевта',
    'pharmacy.prescription': 'По рецепту',
    'pharmacy.products': 'Товары',
    'pharmacy.general': 'Общие',
    'pharmacy.vitamins': 'Витамины',
    'pharmacy.firstAid': 'Первая помощь',
    'pharmacy.skincare': 'Уход за кожей',
    'pharmacy.personalCare': 'Личная гигиена',
    'pharmacy.addToCart': 'В корзину',
    'pharmacy.cart': 'Корзина',
    'pharmacy.minOrder': 'Минимальный заказ',
    'pharmacy.deliveryFee': 'Стоимость доставки',
    
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
    'category.tours': 'Tours',
    'category.water': 'Water Activities',
    'category.pharmacy': 'Pharmacy',
    
    // Tours
    'tours.title': 'Tours & Excursions',
    'tours.subtitle': 'Discover Phuket',
    'tours.featured': 'Featured Tours',
    'tours.duration': 'Duration',
    'tours.includes': 'Includes',
    'tours.itinerary': 'Itinerary',
    'tours.meetingPoint': 'Meeting Point',
    'tours.maxParticipants': 'Max Participants',
    'tours.difficulty': 'Difficulty',
    'tours.highlights': 'Highlights',
    'tours.bookNow': 'Book Tour',
    'tours.selectDate': 'Select Date',
    'tours.selectTime': 'Select Time',
    'tours.participants': 'Participants',
    'tours.contactDetails': 'Contact Details',
    'tours.confirmBooking': 'Confirm Booking',
    'tours.bookingSuccess': 'Tour Booked!',
    
    // Water Activities
    'water.title': 'Water Activities',
    'water.subtitle': 'Diving, snorkeling, yachts and more',
    'water.featured': 'Featured Activities',
    'water.diving': 'Diving',
    'water.snorkeling': 'Snorkeling',
    'water.jetski': 'Jet Ski',
    'water.yacht': 'Yachts',
    'water.surfing': 'Surfing',
    'water.kayaking': 'Kayaking',
    'water.fishing': 'Fishing',
    'water.parasailing': 'Parasailing',
    'water.certified': 'Certified',
    'water.equipmentIncluded': 'Equipment Included',
    'water.safetyBriefing': 'Safety Briefing',
    'water.ageRestriction': 'Minimum Age',
    'water.difficulty.easy': 'Easy',
    'water.difficulty.moderate': 'Moderate',
    'water.difficulty.challenging': 'Challenging',
    'water.difficulty.expert': 'Expert',
    
    // Pharmacy
    'pharmacy.title': 'Pharmacies',
    'pharmacy.subtitle': 'Medicine and health products',
    'pharmacy.24h': '24/7',
    'pharmacy.delivery': 'Delivery',
    'pharmacy.fastDelivery': 'Fast Delivery',
    'pharmacy.fromMinutes': 'From 30 min',
    'pharmacy.pharmacist': 'Pharmacist Consultation',
    'pharmacy.prescription': 'Prescription Required',
    'pharmacy.products': 'Products',
    'pharmacy.general': 'General',
    'pharmacy.vitamins': 'Vitamins',
    'pharmacy.firstAid': 'First Aid',
    'pharmacy.skincare': 'Skincare',
    'pharmacy.personalCare': 'Personal Care',
    'pharmacy.addToCart': 'Add to Cart',
    'pharmacy.cart': 'Cart',
    'pharmacy.minOrder': 'Minimum Order',
    'pharmacy.deliveryFee': 'Delivery Fee',
    
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
