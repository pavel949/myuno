import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Language = 'ru' | 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isLoadingTranslations: boolean;
}

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.discover': 'Каталог',
    'nav.map': 'Карта',
    'nav.support': 'Чат',
    'nav.bookings': 'Брони',
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
    'category.beauty-spa': 'Красота',
    'category.restaurants': 'Еда',
    'category.flowers': 'Цветы',
    'category.fitness': 'Фитнес',
    'category.medical': 'Медицина',
    'category.kids-education': 'Обучение',
    'category.real-estate': 'Жильё',
    'category.transport': 'Транспорт',
    'category.events': 'События',
    'category.shopping': 'Покупки',
    'category.services': 'Услуги',
    'category.legal': 'Бизнес',
    'category.tours': 'Туры',
    'category.water': 'Водный спорт',
    'category.pharmacy': 'Аптеки',
    'category.insurance': 'Страхование',
    'category.market': 'Магазины',
    
    // Hero section
    'home.heroTitle': 'Дом там, где myUNO',
    'home.heroSubtitle': 'Всё для комфортной жизни за рубежом — проверенные сервисы, надёжные партнёры, прозрачные цены',
    'home.trustBadge': 'Надёжная инфраструктура',
    'home.forOwners': 'Для владельцев',
    'home.listProperty': 'Разместите и управляйте объектом',
    'home.listPropertyDesc': 'Бронирования, сервис, аналитика — всё в одном месте',
    'home.allServices': 'Все сервисы',
    'home.verifiedPartners': 'Проверенные партнёры',
    'home.realReviews': 'Реальные отзывы',
    'home.quickListing': 'Разместить объявление',
    'home.quickListingTitle': 'Предложите свою услугу',
    'home.quickListingDesc': 'Разместите объявление за 2 минуты — бесплатно!',
    'home.quickListingBadge': 'Быстрое размещение',
    
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
    'tours.notFound': 'Тур не найден',
    'tours.description': 'Описание',
    'tours.perPerson': '/чел',
    'tours.booking': 'Бронирование тура',
    'tours.name': 'Имя',
    'tours.phone': 'Телефон',
    'tours.total': 'Итого',
    'tours.fillAllFields': 'Заполните все поля',
    'tours.bookingSent': 'Заявка отправлена',
    'tours.bookingFailed': 'Не удалось забронировать',
    
    // Water Activities
    'water.title': 'Водный спорт',
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
    'water.notFound': 'Активность не найдена',
    'water.goBack': 'Назад',
    'water.description': 'Описание',
    'water.whatsIncluded': 'Что включено',
    'water.requirements': 'Требования',
    'water.safety': 'Безопасность',
    'water.safetyRequired': 'Обязательный инструктаж по безопасности',
    'water.minAge': 'Минимальный возраст',
    'water.years': 'лет',
    'water.meetingPoint': 'Место встречи',
    'water.availableTimes': 'Доступное время',
    'water.bookNow': 'Забронировать',
    'water.pricePer': 'Цена за',
    'water.upTo': 'до',
    'water.max': 'макс',
    
    // Pharmacy
    'pharmacy.title': 'Аптеки',
    'pharmacy.subtitle': 'Лекарства и товары для здоровья',
    'pharmacy.24h': 'Круглосуточно',
    'pharmacy.delivery': 'Доставка',
    'pharmacy.fastDelivery': 'Быстрая доставка',
    'pharmacy.fromMinutes': 'От 30 минут',
    'pharmacy.pharmacist': 'Консультация фармацевта',
    'pharmacy.pharmacistAvailable': 'Есть фармацевт',
    'pharmacy.prescription': 'По рецепту',
    'pharmacy.products': 'Товары',
    'pharmacy.general': 'Общие',
    'pharmacy.vitamins': 'Витамины',
    'pharmacy.firstAid': 'Первая помощь',
    'pharmacy.skincare': 'Уход за кожей',
    'pharmacy.personalCare': 'Личная гигиена',
    'pharmacy.addToCart': 'В корзину',
    'pharmacy.addedToCart': 'Добавлено в корзину',
    'pharmacy.cart': 'Корзина',
    'pharmacy.minOrder': 'Минимальный заказ',
    'pharmacy.deliveryFee': 'Стоимость доставки',
    'pharmacy.deliveryFrom': 'Доставка от',
    'pharmacy.notFound': 'Аптека не найдена',
    'pharmacy.noProducts': 'Товары не найдены',
    'pharmacy.verified': 'Проверено',
    'pharmacy.all': 'Все',
    
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
    'home.welcome': 'Добро пожаловать в myUNO',
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
    
    // Home Services
    'services.homeTitle': 'Домашние услуги',
    'services.professionals': 'мастеров',
    'services.heroTitle': 'Мастера на все руки',
    'services.heroSubtitle': 'Сантехники, электрики, уборка и многое другое',
    'services.searchPlaceholder': 'Найти услугу или мастера...',
    'services.notFound': 'Мастера не найдены',
    
    // Legal Services
    'legal.businessTitle': 'Бизнес-услуги',
    'legal.providers': 'компаний',
    'legal.heroTitle': 'Юридические и бизнес-услуги',
    'legal.heroSubtitle': 'Проверенные специалисты для вашего бизнеса в Таиланде',
    'legal.searchPlaceholder': 'Найти услугу или компанию...',
    'legal.notFound': 'Компании не найдены',
    'legal.tax': 'Налоги',
    'legal.business': 'Бизнес',
    
    // Education
    'education.heroTitle': 'Образование',
    'education.heroSubtitle': 'Курсы и репетиторы для детей и взрослых',
    'education.searchPlaceholder': 'Поиск курсов и репетиторов...',
    'education.tutor': 'Репетитор',
    'education.school': 'Школа',
    'education.notFound': 'Ничего не найдено',
    'education.tutorsNotFound': 'Репетиторы не найдены',
    'education.aboutTutor': 'О репетиторе',
    'education.teachingLanguages': 'Языки преподавания',
    'education.perHour': 'час',
    
    // SOS
    'sos.offlineMode': 'Вы офлайн — данные из кеша',
    'sos.savedOffline': 'Страница SOS сохранена для офлайн-доступа',
    'sos.saveFailed': 'Не удалось сохранить. Попробуйте обновить страницу.',
    'sos.saveError': 'Ошибка сохранения',
    'sos.unoAlert': 'Личная безопасность и помощь в экстремальных ситуациях. 24/7.',
    'sos.callUs': 'Позвонить',
    'sos.saveOffline': 'Сохранить офлайн',
    'sos.saved': 'Сохранено',
    'sos.quickActions': 'Срочные контакты',
    'sos.contacts': 'Контакты',
    'sos.urgentServices': 'Срочные услуги',
    'sos.survivalTips': 'Советы по выживанию',
    
    // VIP Concierge
    'vip.title': 'VIP Консьерж',
    'vip.subtitle': 'Люкс консьерж сервис',
    'vip.description': 'Эксклюзивные услуги премиум-класса для взыскательных клиентов. Вертолёты, частные самолёты, персональные повара, яхты, люксовые автомобили и полный спектр VIP-сервисов.',
    'vip.callUs': 'Позвонить',
    'vip.whyVip': 'Почему UNO VIP?',
    'vip.support247': 'Круглосуточная поддержка 24/7',
    'vip.personalManager': 'Персональный менеджер',
    'vip.exclusiveAccess': 'Эксклюзивный доступ',
    'vip.confidentiality': 'Конфиденциальность',
    'vip.ourServices': 'Наши услуги',
    'vip.readyForVip': 'Готовы к VIP опыту?',
    'vip.contactUs': 'Свяжитесь с нами для персонального предложения',
    'vip.messageWhatsApp': 'Написать в WhatsApp',
    
    // Common booking
    'booking.total': 'Итого',
    'booking.maxPeople': 'Максимум {max} человек',
    'booking.unavailable': 'Недоступно',
    'booking.expires': 'Истекает:',
    'booking.allCategories': 'Все категории',
    'booking.noBookings': 'Нет бронирований',
    'booking.noBookingsDesc': 'Начните изучать услуги, чтобы сделать первое бронирование',
    'booking.results': 'Результаты',
    'booking.found': 'найдено',
    
    // Wallet
    'wallet.title': 'Кошелёк',
    'wallet.toppedUp': 'Кошелёк успешно пополнен на {amount}',
    'wallet.paymentCanceled': 'Оплата отменена',
    
    // Quick services
    'home.quickServices': 'Быстрые услуги',
    'badge.top': 'ТОП',
    'badge.hot': 'HOT',
    'badge.certified': 'Сертифицировано',
    'badge.featured': 'Рекомендуем',
    
    // Education tabs
    'education.all': 'Все',
    'education.tutors': 'Репетиторы',
    'education.schools': 'Школы',
    'education.schoolsNotFound': 'Школы не найдены',
    'education.subjects': 'Предметы',
    'education.studentAges': 'Возраст учеников',
    'education.kids': 'Дети',
    'education.adults': 'Взрослые',
    'education.bookLesson': 'Записаться',
    'education.verified': 'Проверено',
    
    // Tours extras
    'tours.noToursFound': 'Туры не найдены',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.discover': 'Discover',
    'nav.map': 'Map',
    'nav.support': 'Chat',
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
    
    // Categories (short names)
    'category.beauty-spa': 'Beauty',
    'category.restaurants': 'Food',
    'category.flowers': 'Flowers',
    'category.fitness': 'Fitness',
    'category.medical': 'Medical',
    'category.kids-education': 'Education',
    'category.real-estate': 'Housing',
    'category.transport': 'Transport',
    'category.events': 'Events',
    'category.shopping': 'Shopping',
    'category.services': 'Services',
    'category.legal': 'Business',
    'category.tours': 'Tours',
    'category.water': 'Water Sports',
    'category.pharmacy': 'Pharmacy',
    'category.insurance': 'Insurance',
    'category.market': 'Shops',
    
    // Hero section
    'home.heroTitle': 'Home is where myUNO is',
    'home.heroSubtitle': 'Everything for comfortable life abroad — verified services, trusted partners, transparent prices',
    'home.trustBadge': 'Trusted Infrastructure',
    'home.forOwners': 'For Owners',
    'home.listProperty': 'List & Manage Your Property',
    'home.listPropertyDesc': 'Bookings, service, analytics — all in one place',
    'home.allServices': 'All Services',
    'home.verifiedPartners': 'Verified partners',
    'home.realReviews': 'Real reviews',
    'home.quickListing': 'List Now',
    'home.quickListingTitle': 'Offer Your Service',
    'home.quickListingDesc': 'List in 2 minutes — free!',
    'home.quickListingBadge': 'Quick Listing',
    
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
    'tours.notFound': 'Tour not found',
    'tours.description': 'Description',
    'tours.perPerson': '/person',
    'tours.booking': 'Book Tour',
    'tours.name': 'Name',
    'tours.phone': 'Phone',
    'tours.total': 'Total',
    'tours.fillAllFields': 'Fill all fields',
    'tours.bookingSent': 'Booking sent',
    'tours.bookingFailed': 'Booking failed',
    
    // Water Activities
    'water.title': 'Water Sports',
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
    'water.notFound': 'Activity not found',
    'water.goBack': 'Go Back',
    'water.description': 'Description',
    'water.whatsIncluded': "What's Included",
    'water.requirements': 'Requirements',
    'water.safety': 'Safety',
    'water.safetyRequired': 'Safety briefing required',
    'water.minAge': 'Minimum age',
    'water.years': 'years',
    'water.meetingPoint': 'Meeting Point',
    'water.availableTimes': 'Available Times',
    'water.bookNow': 'Book Now',
    'water.pricePer': 'Price per',
    'water.upTo': 'up to',
    'water.max': 'max',
    
    // Pharmacy
    'pharmacy.title': 'Pharmacies',
    'pharmacy.subtitle': 'Medicine and health products',
    'pharmacy.24h': '24/7',
    'pharmacy.delivery': 'Delivery',
    'pharmacy.fastDelivery': 'Fast Delivery',
    'pharmacy.fromMinutes': 'From 30 min',
    'pharmacy.pharmacist': 'Pharmacist Consultation',
    'pharmacy.pharmacistAvailable': 'Pharmacist available',
    'pharmacy.prescription': 'Prescription Required',
    'pharmacy.products': 'Products',
    'pharmacy.general': 'General',
    'pharmacy.vitamins': 'Vitamins',
    'pharmacy.firstAid': 'First Aid',
    'pharmacy.skincare': 'Skincare',
    'pharmacy.personalCare': 'Personal Care',
    'pharmacy.addToCart': 'Add to Cart',
    'pharmacy.addedToCart': 'Added to cart',
    'pharmacy.cart': 'Cart',
    'pharmacy.minOrder': 'Minimum Order',
    'pharmacy.deliveryFee': 'Delivery Fee',
    'pharmacy.deliveryFrom': 'Delivery from',
    'pharmacy.notFound': 'Pharmacy not found',
    'pharmacy.noProducts': 'No products found',
    'pharmacy.verified': 'Verified',
    'pharmacy.all': 'All',
    
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
    'home.welcome': 'Welcome to myUNO',
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
    
    // Home Services
    'services.homeTitle': 'Home Services',
    'services.professionals': 'professionals',
    'services.heroTitle': 'Professional Services',
    'services.heroSubtitle': 'Plumbers, electricians, cleaning and more',
    'services.searchPlaceholder': 'Find service or professional...',
    'services.notFound': 'No providers found',
    
    // Legal Services
    'legal.businessTitle': 'Business Services',
    'legal.providers': 'providers',
    'legal.heroTitle': 'Legal & Business Services',
    'legal.heroSubtitle': 'Verified professionals for your business in Thailand',
    'legal.searchPlaceholder': 'Find service or company...',
    'legal.notFound': 'No providers found',
    'legal.tax': 'Tax',
    'legal.business': 'Business',
    
    // Education
    'education.heroTitle': 'Education',
    'education.heroSubtitle': 'Courses and tutors for kids and adults',
    'education.searchPlaceholder': 'Search courses and tutors...',
    'education.tutor': 'Tutor',
    'education.school': 'School',
    'education.notFound': 'Nothing found',
    'education.tutorsNotFound': 'No tutors found',
    'education.aboutTutor': 'About Tutor',
    'education.teachingLanguages': 'Teaching Languages',
    'education.perHour': 'hr',
    
    // SOS
    'sos.offlineMode': 'You are offline — using cached data',
    'sos.savedOffline': 'SOS page saved for offline access',
    'sos.saveFailed': 'Could not save. Try refreshing the page.',
    'sos.saveError': 'Save failed',
    'sos.unoAlert': 'Personal safety and emergency assistance. 24/7.',
    'sos.callUs': 'Call Us',
    'sos.saveOffline': 'Save Offline',
    'sos.saved': 'Saved',
    'sos.quickActions': 'Quick Contacts',
    'sos.contacts': 'Contacts',
    'sos.urgentServices': 'Urgent Services',
    'sos.survivalTips': 'Survival Tips',
    
    // VIP Concierge
    'vip.title': 'VIP Concierge',
    'vip.subtitle': 'Luxury Concierge Service',
    'vip.description': 'Exclusive premium services for discerning clients. Helicopters, private jets, personal chefs, yachts, luxury cars and full range of VIP services.',
    'vip.callUs': 'Call Us',
    'vip.whyVip': 'Why UNO VIP?',
    'vip.support247': '24/7 support around the clock',
    'vip.personalManager': 'Personal manager',
    'vip.exclusiveAccess': 'Exclusive access',
    'vip.confidentiality': 'Confidentiality',
    'vip.ourServices': 'Our Services',
    'vip.readyForVip': 'Ready for VIP Experience?',
    'vip.contactUs': 'Contact us for a personalized offer',
    'vip.messageWhatsApp': 'Message on WhatsApp',
    
    // Common booking
    'booking.total': 'Total',
    'booking.maxPeople': 'Maximum {max} people',
    'booking.unavailable': 'Unavailable',
    'booking.expires': 'Expires:',
    'booking.allCategories': 'All categories',
    'booking.noBookings': 'No bookings yet',
    'booking.noBookingsDesc': 'Start exploring services to make your first booking',
    'booking.results': 'Results',
    'booking.found': 'found',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.toppedUp': 'Wallet topped up with {amount}',
    'wallet.paymentCanceled': 'Payment canceled',
    
    // Quick services
    'home.quickServices': 'Quick Services',
    'badge.top': 'TOP',
    'badge.hot': 'HOT',
    'badge.certified': 'Certified',
    'badge.featured': 'Featured',
    
    // Education tabs
    'education.all': 'All',
    'education.tutors': 'Tutors',
    'education.schools': 'Schools',
    'education.schoolsNotFound': 'No schools found',
    'education.subjects': 'Subjects',
    'education.studentAges': 'Student Ages',
    'education.kids': 'Kids',
    'education.adults': 'Adults',
    'education.bookLesson': 'Book Lesson',
    'education.verified': 'Verified',
    
    // Tours extras
    'tours.noToursFound': 'No tours found',
  },
  th: {
    // Navigation
    'nav.home': 'หน้าแรก',
    'nav.discover': 'ค้นหา',
    'nav.map': 'แผนที่',
    'nav.support': 'แชท',
    'nav.bookings': 'การจอง',
    'nav.profile': 'โปรไฟล์',
    
    // Auth
    'auth.login': 'เข้าสู่ระบบ',
    'auth.signup': 'สมัครสมาชิก',
    'auth.logout': 'ออกจากระบบ',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.fullName': 'ชื่อเต็ม',
    'auth.forgotPassword': 'ลืมรหัสผ่าน?',
    'auth.noAccount': 'ยังไม่มีบัญชี?',
    'auth.hasAccount': 'มีบัญชีอยู่แล้ว?',
    'auth.createAccount': 'สร้างบัญชี',
    'auth.welcomeBack': 'ยินดีต้อนรับกลับ!',
    'auth.getStarted': 'เริ่มต้นใช้งาน',
    
    // Common actions
    'action.book': 'จองเลย',
    'action.cancel': 'ยกเลิก',
    'action.confirm': 'ยืนยัน',
    'action.save': 'บันทึก',
    'action.edit': 'แก้ไข',
    'action.delete': 'ลบ',
    'action.view': 'ดู',
    'action.viewAll': 'ดูทั้งหมด',
    'action.search': 'ค้นหา',
    'action.filter': 'กรอง',
    'action.sort': 'เรียงลำดับ',
    'action.apply': 'ใช้งาน',
    'action.clear': 'ล้าง',
    'action.back': 'กลับ',
    'action.next': 'ถัดไป',
    'action.submit': 'ส่ง',
    
    // Booking statuses
    'status.draft': 'ฉบับร่าง',
    'status.submitted': 'ส่งแล้ว',
    'status.confirmed': 'ยืนยันแล้ว',
    'status.in_progress': 'กำลังดำเนินการ',
    'status.completed': 'เสร็จสิ้น',
    'status.cancelled_by_user': 'ยกเลิกโดยคุณ',
    'status.cancelled_by_provider': 'ยกเลิกโดยผู้ให้บริการ',
    'status.expired': 'หมดอายุ',
    
    // Categories
    'category.beauty-spa': 'ความงาม',
    'category.restaurants': 'อาหาร',
    'category.flowers': 'ดอกไม้',
    'category.fitness': 'ฟิตเนส',
    'category.medical': 'การแพทย์',
    'category.kids-education': 'การศึกษา',
    'category.real-estate': 'ที่พัก',
    'category.transport': 'ขนส่ง',
    'category.events': 'กิจกรรม',
    'category.shopping': 'ช้อปปิ้ง',
    'category.services': 'บริการ',
    'category.legal': 'ธุรกิจ',
    'category.tours': 'ทัวร์',
    'category.water': 'กิจกรรมทางน้ำ',
    'category.pharmacy': 'ร้านขายยา',
    'category.insurance': 'ประกันภัย',
    'category.market': 'ร้านค้า',
    
    // Hero section
    'home.heroTitle': 'บ้านอยู่ที่ไหน myUNO อยู่ที่นั่น',
    'home.heroSubtitle': 'ทุกอย่างเพื่อชีวิตที่สะดวกสบายในต่างแดน — บริการที่ยืนยัน พันธมิตรที่เชื่อถือได้ ราคาโปร่งใส',
    'home.trustBadge': 'โครงสร้างที่เชื่อถือได้',
    'home.forOwners': 'สำหรับเจ้าของ',
    'home.listProperty': 'ลงประกาศที่พักของคุณ',
    'home.listPropertyDesc': 'การจัดการ บริการ การจอง — ทุกอย่างในที่เดียว',
    'home.allServices': 'บริการทั้งหมด',
    'home.verifiedPartners': 'พันธมิตรที่ยืนยัน',
    'home.realReviews': 'รีวิวจริง',
    
    // Tours
    'tours.title': 'ทัวร์และทริป',
    'tours.subtitle': 'ค้นพบภูเก็ต',
    'tours.featured': 'ทัวร์ยอดนิยม',
    'tours.duration': 'ระยะเวลา',
    'tours.includes': 'รวม',
    'tours.itinerary': 'กำหนดการ',
    'tours.meetingPoint': 'จุดนัดพบ',
    'tours.maxParticipants': 'ผู้เข้าร่วมสูงสุด',
    'tours.difficulty': 'ระดับความยาก',
    'tours.highlights': 'ไฮไลท์',
    'tours.bookNow': 'จองทัวร์',
    'tours.selectDate': 'เลือกวันที่',
    'tours.selectTime': 'เลือกเวลา',
    'tours.participants': 'ผู้เข้าร่วม',
    'tours.contactDetails': 'ข้อมูลติดต่อ',
    'tours.confirmBooking': 'ยืนยันการจอง',
    'tours.bookingSuccess': 'จองทัวร์สำเร็จ!',
    'tours.notFound': 'ไม่พบทัวร์',
    'tours.description': 'รายละเอียด',
    'tours.perPerson': '/คน',
    'tours.booking': 'จองทัวร์',
    'tours.name': 'ชื่อ',
    'tours.phone': 'โทรศัพท์',
    'tours.total': 'รวม',
    'tours.fillAllFields': 'กรุณากรอกข้อมูลให้ครบ',
    'tours.bookingSent': 'ส่งการจองแล้ว',
    'tours.bookingFailed': 'การจองล้มเหลว',
    
    // Water Activities
    'water.title': 'กิจกรรมทางน้ำ',
    'water.subtitle': 'ดำน้ำ สน็อกเกิล เรือยอร์ช และอื่นๆ',
    'water.featured': 'กิจกรรมยอดนิยม',
    'water.diving': 'ดำน้ำ',
    'water.snorkeling': 'สน็อกเกิล',
    'water.jetski': 'เจ็ตสกี',
    'water.yacht': 'เรือยอร์ช',
    'water.surfing': 'เซิร์ฟ',
    'water.kayaking': 'พายเรือ',
    'water.fishing': 'ตกปลา',
    'water.parasailing': 'ร่มร่อน',
    'water.certified': 'ได้รับการรับรอง',
    'water.equipmentIncluded': 'รวมอุปกรณ์',
    'water.safetyBriefing': 'บรรยายสรุปความปลอดภัย',
    'water.ageRestriction': 'อายุขั้นต่ำ',
    'water.difficulty.easy': 'ง่าย',
    'water.difficulty.moderate': 'ปานกลาง',
    'water.difficulty.challenging': 'ท้าทาย',
    'water.difficulty.expert': 'ผู้เชี่ยวชาญ',
    'water.notFound': 'ไม่พบกิจกรรม',
    'water.goBack': 'กลับ',
    'water.description': 'รายละเอียด',
    'water.whatsIncluded': 'รวมอะไรบ้าง',
    'water.requirements': 'ข้อกำหนด',
    'water.safety': 'ความปลอดภัย',
    'water.safetyRequired': 'ต้องมีการบรรยายสรุปความปลอดภัย',
    'water.minAge': 'อายุขั้นต่ำ',
    'water.years': 'ปี',
    'water.meetingPoint': 'จุดนัดพบ',
    'water.availableTimes': 'เวลาที่เปิดให้บริการ',
    'water.bookNow': 'จองเลย',
    'water.pricePer': 'ราคาต่อ',
    'water.upTo': 'สูงสุด',
    'water.max': 'สูงสุด',
    
    // Pharmacy
    'pharmacy.title': 'ร้านขายยา',
    'pharmacy.subtitle': 'ยาและผลิตภัณฑ์สุขภาพ',
    'pharmacy.24h': '24 ชม.',
    'pharmacy.delivery': 'จัดส่ง',
    'pharmacy.fastDelivery': 'จัดส่งด่วน',
    'pharmacy.fromMinutes': 'ภายใน 30 นาที',
    'pharmacy.pharmacist': 'ปรึกษาเภสัชกร',
    'pharmacy.pharmacistAvailable': 'มีเภสัชกร',
    'pharmacy.prescription': 'ต้องมีใบสั่งยา',
    'pharmacy.products': 'สินค้า',
    'pharmacy.general': 'ทั่วไป',
    'pharmacy.vitamins': 'วิตามิน',
    'pharmacy.firstAid': 'ปฐมพยาบาล',
    'pharmacy.skincare': 'ดูแลผิว',
    'pharmacy.personalCare': 'ของใช้ส่วนตัว',
    'pharmacy.addToCart': 'เพิ่มในตะกร้า',
    'pharmacy.addedToCart': 'เพิ่มในตะกร้าแล้ว',
    'pharmacy.cart': 'ตะกร้า',
    'pharmacy.minOrder': 'สั่งขั้นต่ำ',
    'pharmacy.deliveryFee': 'ค่าจัดส่ง',
    'pharmacy.deliveryFrom': 'จัดส่งจาก',
    'pharmacy.notFound': 'ไม่พบร้านขายยา',
    'pharmacy.noProducts': 'ไม่พบสินค้า',
    'pharmacy.verified': 'ยืนยันแล้ว',
    'pharmacy.all': 'ทั้งหมด',
    
    // User types
    'userType.tourist': 'นักท่องเที่ยว',
    'userType.resident': 'ผู้พักอาศัย',
    
    // Common labels
    'label.price': 'ราคา',
    'label.duration': 'ระยะเวลา',
    'label.rating': 'คะแนน',
    'label.reviews': 'รีวิว',
    'label.location': 'สถานที่',
    'label.date': 'วันที่',
    'label.time': 'เวลา',
    'label.from': 'จาก',
    'label.perHour': '/ชม.',
    'label.perDay': '/วัน',
    'label.perNight': '/คืน',
    'label.verified': 'ยืนยันแล้ว',
    'label.popular': 'ยอดนิยม',
    'label.new': 'ใหม่',
    'label.featured': 'แนะนำ',
    
    // Messages
    'message.noResults': 'ไม่พบผลลัพธ์',
    'message.loading': 'กำลังโหลด...',
    'message.error': 'เกิดข้อผิดพลาด',
    'message.success': 'สำเร็จ!',
    'message.loginRequired': 'กรุณาเข้าสู่ระบบ',
    
    // Home page
    'home.welcome': 'ยินดีต้อนรับสู่ UNO',
    'home.subtitle': 'ไกด์ส่วนตัวของคุณในภูเก็ต',
    'home.featuredServices': 'บริการยอดนิยม',
    'home.categories': 'หมวดหมู่',
    'home.nearYou': 'ใกล้คุณ',
    
    // Beauty & Spa
    'beauty.title': 'ความงามและสปา',
    'beauty.salons': 'ร้าน',
    'beauty.services': 'บริการ',
    'beauty.selectServices': 'เลือกบริการ',
    'beauty.popularServices': 'บริการยอดนิยม',
    'beauty.nearbySalons': 'ร้านใกล้เคียง',
    'beauty.searchSalons': 'ค้นหาร้าน...',
    'beauty.searchServices': 'ค้นหาบริการ...',
    'beauty.bookAppointment': 'นัดหมาย',
    'beauty.selectDate': 'เลือกวันที่',
    'beauty.selectTime': 'เลือกเวลา',
    'beauty.contactInfo': 'ข้อมูลติดต่อ',
    'beauty.confirmBooking': 'ยืนยันการจอง',
    'beauty.bookingSuccess': 'จองสำเร็จ!',
    
    // Restaurants
    'restaurants.title': 'ร้านอาหาร',
    'restaurants.subtitle': 'อาหารและเครื่องดื่ม',
    'restaurants.cuisine': 'ประเภทอาหาร',
    'restaurants.reservation': 'จองโต๊ะ',
    'restaurants.delivery': 'จัดส่ง',
    'restaurants.takeaway': 'สั่งกลับบ้าน',
    'restaurants.menu': 'เมนู',
    'restaurants.openNow': 'เปิดอยู่',
    'restaurants.closedNow': 'ปิดอยู่',
    'restaurants.priceRange': 'ช่วงราคา',
    
    // Transport
    'transport.title': 'ขนส่ง',
    'transport.subtitle': 'รถเช่าและบริการรับส่ง',
    'transport.carRental': 'รถเช่า',
    'transport.bikeRental': 'รถมอเตอร์ไซค์เช่า',
    'transport.taxi': 'แท็กซี่',
    'transport.airport': 'รับส่งสนามบิน',
    'transport.driver': 'พร้อมคนขับ',
    'transport.pickup': 'รับ',
    'transport.dropoff': 'ส่ง',
    'transport.passengers': 'ผู้โดยสาร',
    'transport.luggage': 'กระเป๋า',
    
    // Property
    'property.title': 'อสังหาริมทรัพย์',
    'property.subtitle': 'คอนโด บ้าน วิลล่า',
    'property.forRent': 'ให้เช่า',
    'property.forSale': 'ขาย',
    'property.bedrooms': 'ห้องนอน',
    'property.bathrooms': 'ห้องน้ำ',
    'property.area': 'พื้นที่',
    'property.sqm': 'ตร.ม.',
    'property.amenities': 'สิ่งอำนวยความสะดวก',
    'property.location': 'ที่ตั้ง',
    'property.inquiry': 'สอบถาม',
    'property.monthlyRent': 'ค่าเช่า/เดือน',
    'property.deposit': 'มัดจำ',
    
    // Medical
    'medical.title': 'การแพทย์',
    'medical.subtitle': 'คลินิกและโรงพยาบาล',
    'medical.clinics': 'คลินิก',
    'medical.hospitals': 'โรงพยาบาล',
    'medical.dental': 'ทันตกรรม',
    'medical.pharmacy': 'ร้านขายยา',
    'medical.emergency': 'ฉุกเฉิน',
    'medical.appointment': 'นัดหมาย',
    'medical.doctors': 'แพทย์',
    'medical.specialties': 'ความเชี่ยวชาญ',
    'medical.consultation': 'ปรึกษาแพทย์',
    'medical.languages': 'ภาษา',
    
    // Fitness
    'fitness.title': 'ฟิตเนส',
    'fitness.subtitle': 'ยิมและศูนย์ออกกำลังกาย',
    'fitness.gyms': 'ยิม',
    'fitness.yoga': 'โยคะ',
    'fitness.muayThai': 'มวยไทย',
    'fitness.swimming': 'ว่ายน้ำ',
    'fitness.personalTrainer': 'เทรนเนอร์ส่วนตัว',
    'fitness.dayPass': 'บัตรรายวัน',
    'fitness.weekPass': 'บัตรรายสัปดาห์',
    'fitness.monthPass': 'บัตรรายเดือน',
    'fitness.classes': 'คลาส',
    'fitness.equipment': 'อุปกรณ์',
    
    // Education
    'education.title': 'การศึกษา',
    'education.subtitle': 'หลักสูตรและติวเตอร์',
    'education.courses': 'หลักสูตร',
    'education.tutors': 'ติวเตอร์',
    'education.schools': 'โรงเรียน',
    'education.languages': 'ภาษา',
    'education.online': 'ออนไลน์',
    'education.inPerson': 'ตัวต่อตัว',
    'education.hourlyRate': 'ราคา/ชม.',
    'education.experience': 'ประสบการณ์',
    'education.subjects': 'วิชา',
    
    // Events
    'events.title': 'กิจกรรม',
    'events.subtitle': 'ปาร์ตี้และกิจกรรมพิเศษ',
    'events.upcoming': 'กิจกรรมที่จะมาถึง',
    'events.today': 'วันนี้',
    'events.thisWeek': 'สัปดาห์นี้',
    'events.tickets': 'ตั๋ว',
    'events.spotsLeft': 'ที่ว่างเหลือ',
    'events.soldOut': 'ขายหมดแล้ว',
    'events.free': 'ฟรี',
    'events.getTickets': 'ซื้อตั๋ว',
    
    // Services
    'services.title': 'บริการ',
    'services.subtitle': 'บริการทำความสะอาดและซ่อมบำรุง',
    'services.cleaning': 'ทำความสะอาด',
    'services.laundry': 'ซักรีด',
    'services.repair': 'ซ่อมบำรุง',
    'services.plumber': 'ช่างประปา',
    'services.electrician': 'ช่างไฟฟ้า',
    'services.aircon': 'แอร์',
    'services.moving': 'ขนย้าย',
    'services.hourlyRate': 'ราคา/ชม.',
    'services.fixedPrice': 'ราคาคงที่',
    
    // Legal
    'legal.title': 'บริการทางธุรกิจ',
    'legal.subtitle': 'วีซ่าและบริการทางกฎหมาย',
    'legal.visa': 'วีซ่า',
    'legal.workPermit': 'ใบอนุญาตทำงาน',
    'legal.company': 'จดทะเบียนบริษัท',
    'legal.accounting': 'บัญชี',
    'legal.consultation': 'ปรึกษาทางกฎหมาย',
    'legal.notary': 'โนตารี',
    'legal.translation': 'แปลเอกสาร',
    
    // Insurance
    'insurance.title': 'ประกันภัย',
    'insurance.subtitle': 'ประกันสุขภาพและประกันภัย',
    'insurance.health': 'ประกันสุขภาพ',
    'insurance.travel': 'ประกันการเดินทาง',
    'insurance.vehicle': 'ประกันรถยนต์',
    'insurance.property': 'ประกันทรัพย์สิน',
    'insurance.life': 'ประกันชีวิต',
    'insurance.coverage': 'ความคุ้มครอง',
    'insurance.premium': 'เบี้ยประกัน',
    'insurance.getQuote': 'ขอใบเสนอราคา',
    
    // Pets
    'pets.title': 'สัตว์เลี้ยง',
    'pets.subtitle': 'บริการดูแลสัตว์เลี้ยง',
    'pets.grooming': 'ตัดแต่งขน',
    'pets.vet': 'สัตวแพทย์',
    'pets.boarding': 'รับฝาก',
    'pets.walking': 'พาเดินเล่น',
    'pets.transport': 'รับส่ง',
    'pets.training': 'ฝึกสอน',
    
    // Yachts
    'yachts.title': 'เรือยอร์ช',
    'yachts.subtitle': 'เช่าเรือยอร์ชและเรือ',
    'yachts.charter': 'เช่าเรือ',
    'yachts.dayTrip': 'ทริปวันเดียว',
    'yachts.overnight': 'ค้างคืน',
    'yachts.crew': 'ลูกเรือ',
    'yachts.capacity': 'ความจุ',
    'yachts.length': 'ความยาว',
    'yachts.cabins': 'ห้องนอน',
    
    // Flowers
    'flowers.title': 'ดอกไม้',
    'flowers.subtitle': 'ช่อดอกไม้และจัดส่ง',
    'flowers.bouquets': 'ช่อดอกไม้',
    'flowers.arrangements': 'จัดดอกไม้',
    'flowers.sameDay': 'จัดส่งวันเดียวกัน',
    'flowers.schedule': 'จัดส่งตามกำหนด',
    'flowers.message': 'ข้อความ',
    
    // Market
    'market.title': 'ซูเปอร์มาร์เก็ต',
    'market.subtitle': 'ของชำและของใช้ในบ้าน',
    'market.grocery': 'ของชำ',
    'market.organic': 'ออร์แกนิก',
    'market.imported': 'นำเข้า',
    'market.delivery': 'จัดส่ง',
    'market.pickup': 'รับเอง',
    
    // Cleaning
    'cleaning.title': 'ทำความสะอาด',
    'cleaning.subtitle': 'บริการทำความสะอาดมืออาชีพ',
    'cleaning.deepClean': 'ทำความสะอาดแบบล้ำลึก',
    'cleaning.regular': 'ทำความสะอาดปกติ',
    'cleaning.moveIn': 'ทำความสะอาดก่อนย้ายเข้า',
    'cleaning.moveOut': 'ทำความสะอาดหลังย้ายออก',
    'cleaning.airbnb': 'ทำความสะอาด Airbnb',
    'cleaning.office': 'ทำความสะอาดสำนักงาน',
    
    // Babysitter
    'babysitter.title': 'พี่เลี้ยงเด็ก',
    'babysitter.subtitle': 'บริการดูแลเด็ก',
    'babysitter.experience': 'ประสบการณ์',
    'babysitter.languages': 'ภาษา',
    'babysitter.ageGroups': 'กลุ่มอายุ',
    'babysitter.certified': 'มีใบรับรอง',
    'babysitter.firstAid': 'ปฐมพยาบาล',
    'babysitter.canDrive': 'มีใบขับขี่',
    'babysitter.canCook': 'ทำอาหารได้',
    
    // Bookings
    'bookings.title': 'การจองของฉัน',
    'bookings.upcoming': 'กำลังจะมาถึง',
    'bookings.past': 'ที่ผ่านมา',
    'bookings.noBookings': 'ยังไม่มีการจอง',
    'bookings.viewDetails': 'ดูรายละเอียด',
    'bookings.cancelBooking': 'ยกเลิกการจอง',
    'bookings.reschedule': 'เลื่อนนัด',
    
    // Profile
    'profile.title': 'โปรไฟล์',
    'profile.editProfile': 'แก้ไขโปรไฟล์',
    'profile.settings': 'ตั้งค่า',
    'profile.language': 'ภาษา',
    'profile.currency': 'สกุลเงิน',
    'profile.notifications': 'การแจ้งเตือน',
    'profile.favorites': 'รายการโปรด',
    'profile.wallet': 'กระเป๋าเงิน',
    'profile.referral': 'แนะนำเพื่อน',
    'profile.support': 'ช่วยเหลือ',
    'profile.about': 'เกี่ยวกับ',
    'profile.terms': 'ข้อกำหนด',
    'profile.privacy': 'ความเป็นส่วนตัว',
    
    // Wallet
    'wallet.title': 'กระเป๋าเงิน',
    'wallet.balance': 'ยอดเงินคงเหลือ',
    'wallet.cashback': 'เงินคืน',
    'wallet.history': 'ประวัติ',
    'wallet.topUp': 'เติมเงิน',
    'wallet.withdraw': 'ถอนเงิน',
    
    // Notifications
    'notifications.title': 'การแจ้งเตือน',
    'notifications.all': 'ทั้งหมด',
    'notifications.unread': 'ยังไม่อ่าน',
    'notifications.markAllRead': 'ทำเครื่องหมายว่าอ่านแล้ว',
    'notifications.noNotifications': 'ไม่มีการแจ้งเตือน',
    
    // Cart
    'cart.title': 'ตะกร้าสินค้า',
    'cart.empty': 'ตะกร้าว่างเปล่า',
    'cart.checkout': 'ชำระเงิน',
    'cart.subtotal': 'รวม',
    'cart.total': 'รวมทั้งหมด',
    'cart.remove': 'ลบ',
    'cart.continueShopping': 'ช้อปต่อ',
    
    // Search
    'search.placeholder': 'ค้นหาบริการ ร้าน...',
    'search.recentSearches': 'ค้นหาล่าสุด',
    'search.popular': 'ยอดนิยม',
    'search.noResults': 'ไม่พบผลลัพธ์',
    
    // Filters
    'filter.priceRange': 'ช่วงราคา',
    'filter.distance': 'ระยะทาง',
    'filter.rating': 'คะแนน',
    'filter.sortBy': 'เรียงตาม',
    'filter.reset': 'รีเซ็ต',
    
    // Booking form
    'booking.selectDate': 'เลือกวันที่',
    'booking.selectTime': 'เลือกเวลา',
    'booking.guests': 'จำนวนคน',
    'booking.contactInfo': 'ข้อมูลติดต่อ',
    'booking.paymentMethod': 'วิธีชำระเงิน',
    'booking.specialRequests': 'คำขอพิเศษ',
    'booking.confirm': 'ยืนยันการจอง',
    'booking.success': 'จองสำเร็จ!',
    'booking.failed': 'การจองล้มเหลว',
    
    // Payment
    'payment.card': 'บัตรเครดิต/เดบิต',
    'payment.cash': 'เงินสด',
    'payment.wallet': 'กระเป๋า UNO',
    'payment.promptpay': 'พร้อมเพย์',
    'payment.processing': 'กำลังดำเนินการ...',
    'payment.success': 'ชำระเงินสำเร็จ',
    'payment.failed': 'การชำระเงินล้มเหลว',
    
    // Reviews
    'reviews.title': 'รีวิว',
    'reviews.writeReview': 'เขียนรีวิว',
    'reviews.rating': 'คะแนน',
    'reviews.comment': 'ความคิดเห็น',
    'reviews.submit': 'ส่งรีวิว',
    'reviews.thankYou': 'ขอบคุณสำหรับรีวิว!',
    
    // Owner portal
    'owner.dashboard': 'แดชบอร์ด',
    'owner.properties': 'อสังหาริมทรัพย์',
    'owner.bookings': 'การจอง',
    'owner.calendar': 'ปฏิทิน',
    'owner.earnings': 'รายได้',
    'owner.messages': 'ข้อความ',
    'owner.addProperty': 'เพิ่มอสังหาริมทรัพย์',
    
    // Vendor portal
    'vendor.dashboard': 'แดชบอร์ด',
    'vendor.services': 'บริการ',
    'vendor.bookings': 'การจอง',
    'vendor.analytics': 'สถิติ',
    'vendor.payouts': 'การจ่ายเงิน',
    'vendor.settings': 'ตั้งค่า',
    
    // SOS
    'sos.title': 'ฉุกเฉิน',
    'sos.police': 'ตำรวจ',
    'sos.ambulance': 'รถพยาบาล',
    'sos.fire': 'ดับเพลิง',
    'sos.tourist': 'ตำรวจท่องเที่ยว',
    'sos.embassy': 'สถานทูต',
    
    // Time
    'time.hours': 'ชั่วโมง',
    'time.minutes': 'นาที',
    'time.days': 'วัน',
    'time.weeks': 'สัปดาห์',
    'time.months': 'เดือน',
    'time.today': 'วันนี้',
    'time.tomorrow': 'พรุ่งนี้',
    'time.yesterday': 'เมื่อวาน',
    
    // Home Services
    'services.homeTitle': 'บริการบ้าน',
    'services.professionals': 'ผู้เชี่ยวชาญ',
    'services.heroTitle': 'บริการมืออาชีพ',
    'services.heroSubtitle': 'ช่างประปา ช่างไฟฟ้า ทำความสะอาด และอื่นๆ',
    'services.searchPlaceholder': 'ค้นหาบริการหรือช่าง...',
    'services.notFound': 'ไม่พบผู้ให้บริการ',
    
    // Legal Services
    'legal.businessTitle': 'บริการธุรกิจ',
    'legal.providers': 'ผู้ให้บริการ',
    'legal.heroTitle': 'บริการทางกฎหมายและธุรกิจ',
    'legal.heroSubtitle': 'ผู้เชี่ยวชาญที่ได้รับการยืนยันสำหรับธุรกิจของคุณในประเทศไทย',
    'legal.searchPlaceholder': 'ค้นหาบริการหรือบริษัท...',
    'legal.notFound': 'ไม่พบผู้ให้บริการ',
    'legal.tax': 'ภาษี',
    'legal.business': 'ธุรกิจ',
    
    // Education extras
    'education.heroTitle': 'การศึกษา',
    'education.heroSubtitle': 'หลักสูตรและติวเตอร์สำหรับเด็กและผู้ใหญ่',
    'education.searchPlaceholder': 'ค้นหาหลักสูตรและติวเตอร์...',
    'education.tutor': 'ติวเตอร์',
    'education.school': 'โรงเรียน',
    'education.notFound': 'ไม่พบสิ่งที่ค้นหา',
    'education.tutorsNotFound': 'ไม่พบติวเตอร์',
    'education.aboutTutor': 'เกี่ยวกับติวเตอร์',
    'education.teachingLanguages': 'ภาษาที่สอน',
    'education.perHour': 'ชม.',
    'education.all': 'ทั้งหมด',
    'education.schoolsNotFound': 'ไม่พบโรงเรียน',
    'education.studentAges': 'อายุนักเรียน',
    'education.kids': 'เด็ก',
    'education.adults': 'ผู้ใหญ่',
    'education.bookLesson': 'จองบทเรียน',
    'education.verified': 'ยืนยันแล้ว',
    
    // SOS extras
    'sos.offlineMode': 'คุณออฟไลน์อยู่ — ใช้ข้อมูลแคช',
    'sos.savedOffline': 'หน้า SOS ถูกบันทึกสำหรับการเข้าถึงแบบออฟไลน์',
    'sos.saveFailed': 'บันทึกไม่ได้ ลองรีเฟรชหน้า',
    'sos.saveError': 'บันทึกล้มเหลว',
    'sos.unoAlert': 'ความปลอดภัยส่วนบุคคลและความช่วยเหลือฉุกเฉิน 24/7',
    'sos.callUs': 'โทรหาเรา',
    'sos.saveOffline': 'บันทึกออฟไลน์',
    'sos.saved': 'บันทึกแล้ว',
    'sos.quickActions': 'ติดต่อด่วน',
    'sos.contacts': 'รายชื่อติดต่อ',
    'sos.urgentServices': 'บริการเร่งด่วน',
    'sos.survivalTips': 'เคล็ดลับการเอาตัวรอด',
    
    // VIP Concierge
    'vip.title': 'VIP คอนเซียร์จ',
    'vip.subtitle': 'บริการคอนเซียร์จระดับลักซ์ชัวรี่',
    'vip.description': 'บริการระดับพรีเมียมพิเศษสำหรับลูกค้าพิถีพิถัน เฮลิคอปเตอร์ เครื่องบินส่วนตัว เชฟส่วนตัว เรือยอร์ช รถหรู และบริการ VIP ครบวงจร',
    'vip.callUs': 'โทรหาเรา',
    'vip.whyVip': 'ทำไมต้อง UNO VIP?',
    'vip.support247': 'สนับสนุน 24/7 ตลอดเวลา',
    'vip.personalManager': 'ผู้จัดการส่วนตัว',
    'vip.exclusiveAccess': 'การเข้าถึงพิเศษ',
    'vip.confidentiality': 'ความลับ',
    'vip.ourServices': 'บริการของเรา',
    'vip.readyForVip': 'พร้อมสำหรับประสบการณ์ VIP?',
    'vip.contactUs': 'ติดต่อเราสำหรับข้อเสนอส่วนตัว',
    'vip.messageWhatsApp': 'ส่งข้อความทาง WhatsApp',
    
    // Common booking extras
    'booking.total': 'รวม',
    'booking.maxPeople': 'สูงสุด {max} คน',
    'booking.unavailable': 'ไม่พร้อมให้บริการ',
    'booking.expires': 'หมดอายุ:',
    'booking.allCategories': 'ทุกหมวดหมู่',
    'booking.noBookings': 'ยังไม่มีการจอง',
    'booking.noBookingsDesc': 'เริ่มสำรวจบริการเพื่อทำการจองครั้งแรก',
    'booking.results': 'ผลลัพธ์',
    'booking.found': 'พบ',
    
    // Wallet extras
    'wallet.toppedUp': 'เติมเงินกระเป๋าสตังค์ {amount} สำเร็จ',
    'wallet.paymentCanceled': 'ยกเลิกการชำระเงินแล้ว',
    
    // Quick services
    'home.quickServices': 'บริการด่วน',
    'home.quickListing': 'ลงประกาศเลย',
    'home.quickListingTitle': 'เสนอบริการของคุณ',
    'home.quickListingDesc': 'ลงประกาศใน 2 นาที — ฟรี!',
    'home.quickListingBadge': 'ลงประกาศด่วน',
    'badge.top': 'ยอดนิยม',
    'badge.hot': 'ฮอต',
    'badge.certified': 'ได้รับการรับรอง',
    'badge.featured': 'แนะนำ',
    
    // Tours extras
    'tours.noToursFound': 'ไม่พบทัวร์',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Cache key and duration
const TRANSLATIONS_CACHE_KEY = 'myuno-translations-cache';
const TRANSLATIONS_CACHE_TIMESTAMP = 'myuno-translations-timestamp';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface CachedTranslations {
  [key: string]: { ru: string; en: string; th: string | null };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('myuno-language');
    return (saved as Language) || 'ru';
  });
  const [customTranslations, setCustomTranslations] = useState<CachedTranslations>({});
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('myuno-language', lang);
  };

  // Load translations from DB with caching
  useEffect(() => {
    const loadTranslations = async () => {
      // Check cache first
      const cachedTimestamp = localStorage.getItem(TRANSLATIONS_CACHE_TIMESTAMP);
      const cachedData = localStorage.getItem(TRANSLATIONS_CACHE_KEY);
      
      if (cachedTimestamp && cachedData) {
        const timestamp = parseInt(cachedTimestamp, 10);
        if (Date.now() - timestamp < CACHE_DURATION) {
          try {
            setCustomTranslations(JSON.parse(cachedData));
            setIsLoadingTranslations(false);
            return;
          } catch (e) {
            // Invalid cache, continue to fetch
          }
        }
      }

      try {
        const { data, error } = await supabase
          .from('translations')
          .select('key, value_ru, value_en, value_th');

        if (error) throw error;

        const map: CachedTranslations = {};
        data?.forEach(row => {
          map[row.key] = {
            ru: row.value_ru,
            en: row.value_en,
            th: row.value_th,
          };
        });

        setCustomTranslations(map);
        
        // Cache the results
        localStorage.setItem(TRANSLATIONS_CACHE_KEY, JSON.stringify(map));
        localStorage.setItem(TRANSLATIONS_CACHE_TIMESTAMP, Date.now().toString());
      } catch (err) {
        console.error('Failed to load translations from DB:', err);
        // Fallback to static translations (already in the component)
      } finally {
        setIsLoadingTranslations(false);
      }
    };

    loadTranslations();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('translations_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'translations' },
        () => {
          // Invalidate cache and reload
          localStorage.removeItem(TRANSLATIONS_CACHE_KEY);
          localStorage.removeItem(TRANSLATIONS_CACHE_TIMESTAMP);
          loadTranslations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback((key: string): string => {
    // Priority: DB translations -> static translations -> fallback to English -> key
    const custom = customTranslations[key];
    if (custom) {
      const value = custom[language];
      if (value) return value;
    }
    return translations[language][key] || translations['en'][key] || key;
  }, [language, customTranslations]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoadingTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
