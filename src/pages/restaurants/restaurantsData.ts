// Shared restaurant data for the Restaurants mini-app

export interface MenuItem {
  id: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  price: number;
  image: string;
  isPopular?: boolean;
  isSpicy?: boolean;
}

export interface MenuCategory {
  category: string;
  categoryRu: string;
  items: MenuItem[];
}

export interface SetMenu {
  id: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  price: number;
  originalPrice?: number;
  image: string;
  includes: string[];
  includesRu: string[];
  duration: string;
  availableTimes: string[];
  maxGuests: number;
}

export interface Restaurant {
  id: string;
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  image: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  cuisineRu: string;
  location: string;
  locationRu: string;
  address: string;
  phone: string;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  isOpen: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  priceLevel: number;
  tags: string[];
  // Capabilities
  acceptsDelivery: boolean;
  acceptsReservations: boolean;
  hasSetMenus: boolean;
  // Reservation settings
  reservationSlots: string[];
  depositRequired: boolean;
  depositAmount: number;
  maxPartySize: number;
  // Menu
  menu: MenuCategory[];
  setMenus?: SetMenu[];
}

export const demoRestaurants: Restaurant[] = [
  {
    id: 'rest-1',
    nameEn: 'Thai Orchid Kitchen',
    nameRu: 'Тайская Орхидея',
    descriptionEn: 'Authentic Thai cuisine with fresh ingredients and traditional recipes. Our chefs bring the flavors of Thailand to your table.',
    descriptionRu: 'Аутентичная тайская кухня со свежими ингредиентами и традиционными рецептами. Наши повара приносят вкус Таиланда к вашему столу.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
    coverImage: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    rating: 4.8,
    reviewCount: 234,
    cuisine: 'Thai',
    cuisineRu: 'Тайская',
    location: 'Patong',
    locationRu: 'Патонг',
    address: '123 Beach Road, Patong',
    phone: '+66 76 123 456',
    deliveryTime: '25-35',
    deliveryFee: 40,
    minOrder: 200,
    isOpen: true,
    isFeatured: true,
    priceLevel: 2,
    tags: ['Thai', 'Seafood', 'Spicy'],
    acceptsDelivery: true,
    acceptsReservations: true,
    hasSetMenus: true,
    reservationSlots: ['11:00', '11:30', '12:00', '12:30', '13:00', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'],
    depositRequired: false,
    depositAmount: 0,
    maxPartySize: 12,
    menu: [
      {
        category: 'Popular',
        categoryRu: 'Популярное',
        items: [
          {
            id: 'dish-1',
            nameEn: 'Pad Thai',
            nameRu: 'Пад Тай',
            descriptionEn: 'Stir-fried rice noodles with shrimp, tofu, peanuts',
            descriptionRu: 'Жареная рисовая лапша с креветками, тофу, арахисом',
            price: 180,
            image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300',
            isPopular: true,
          },
          {
            id: 'dish-2',
            nameEn: 'Tom Yum Goong',
            nameRu: 'Том Ям Кунг',
            descriptionEn: 'Spicy shrimp soup with lemongrass and lime',
            descriptionRu: 'Острый суп с креветками, лемонграссом и лаймом',
            price: 220,
            image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=300',
            isPopular: true,
            isSpicy: true,
          },
        ],
      },
      {
        category: 'Main Dishes',
        categoryRu: 'Основные блюда',
        items: [
          {
            id: 'dish-3',
            nameEn: 'Green Curry Chicken',
            nameRu: 'Зелёный Карри с Курицей',
            descriptionEn: 'Creamy coconut curry with Thai basil',
            descriptionRu: 'Сливочный кокосовый карри с тайским базиликом',
            price: 200,
            image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300',
            isSpicy: true,
          },
          {
            id: 'dish-4',
            nameEn: 'Massaman Curry',
            nameRu: 'Массаман Карри',
            descriptionEn: 'Rich curry with potatoes and peanuts',
            descriptionRu: 'Насыщенный карри с картофелем и арахисом',
            price: 220,
            image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=300',
          },
        ],
      },
      {
        category: 'Appetizers',
        categoryRu: 'Закуски',
        items: [
          {
            id: 'dish-5',
            nameEn: 'Spring Rolls',
            nameRu: 'Спринг Роллы',
            descriptionEn: 'Crispy vegetable rolls with sweet chili sauce',
            descriptionRu: 'Хрустящие овощные роллы со сладким чили соусом',
            price: 120,
            image: 'https://images.unsplash.com/photo-1548507200-c56d450c71eb?w=300',
          },
          {
            id: 'dish-6',
            nameEn: 'Satay Skewers',
            nameRu: 'Сатай на шпажках',
            descriptionEn: 'Grilled chicken with peanut sauce',
            descriptionRu: 'Курица гриль с арахисовым соусом',
            price: 150,
            image: 'https://images.unsplash.com/photo-1529563021893-cc83c992d75d?w=300',
          },
        ],
      },
    ],
    setMenus: [
      {
        id: 'set-1',
        nameEn: 'Thai Brunch Experience',
        nameRu: 'Тайский Бранч',
        descriptionEn: 'A complete Thai brunch with appetizers, main courses, and desserts',
        descriptionRu: 'Полный тайский бранч с закусками, основными блюдами и десертами',
        price: 1200,
        originalPrice: 1500,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
        includes: ['Welcome drink', 'Appetizer selection', '2 Main courses', 'Thai dessert', 'Coffee/Tea'],
        includesRu: ['Приветственный напиток', 'Ассорти закусок', '2 Основных блюда', 'Тайский десерт', 'Кофе/Чай'],
        duration: '2 hours',
        availableTimes: ['11:00', '11:30', '12:00'],
        maxGuests: 8,
      },
      {
        id: 'set-2',
        nameEn: 'Romantic Dinner for Two',
        nameRu: 'Романтический Ужин на Двоих',
        descriptionEn: 'Special candlelit dinner with premium dishes and wine',
        descriptionRu: 'Особый ужин при свечах с премиальными блюдами и вином',
        price: 2500,
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
        includes: ['Champagne', '5-course menu', 'Wine pairing', 'Dessert for two', 'Flower decoration'],
        includesRu: ['Шампанское', 'Меню из 5 блюд', 'Вино к каждому блюду', 'Десерт на двоих', 'Цветочное оформление'],
        duration: '3 hours',
        availableTimes: ['18:00', '19:00', '20:00'],
        maxGuests: 2,
      },
    ],
  },
  {
    id: 'rest-2',
    nameEn: 'Sushi Master',
    nameRu: 'Суши Мастер',
    descriptionEn: 'Premium Japanese cuisine with the freshest fish flown in daily from Japan.',
    descriptionRu: 'Премиальная японская кухня со свежайшей рыбой, доставляемой ежедневно из Японии.',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
    coverImage: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    rating: 4.9,
    reviewCount: 189,
    cuisine: 'Japanese',
    cuisineRu: 'Японская',
    location: 'Kata',
    locationRu: 'Ката',
    address: '45 Kata Road, Kata Beach',
    phone: '+66 76 234 567',
    deliveryTime: '30-40',
    deliveryFee: 50,
    minOrder: 300,
    isOpen: true,
    isFeatured: true,
    priceLevel: 3,
    tags: ['Japanese', 'Sushi', 'Fresh'],
    acceptsDelivery: true,
    acceptsReservations: true,
    hasSetMenus: true,
    reservationSlots: ['12:00', '12:30', '13:00', '18:30', '19:00', '19:30', '20:00'],
    depositRequired: true,
    depositAmount: 500,
    maxPartySize: 8,
    menu: [
      {
        category: 'Sushi',
        categoryRu: 'Суши',
        items: [
          {
            id: 'sushi-1',
            nameEn: 'Salmon Nigiri (2 pcs)',
            nameRu: 'Нигири с Лососем (2 шт)',
            descriptionEn: 'Fresh Norwegian salmon on seasoned rice',
            descriptionRu: 'Свежий норвежский лосось на рисе',
            price: 180,
            image: 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=300',
            isPopular: true,
          },
          {
            id: 'sushi-2',
            nameEn: 'Dragon Roll (8 pcs)',
            nameRu: 'Дракон Ролл (8 шт)',
            descriptionEn: 'Shrimp tempura, avocado, eel, spicy mayo',
            descriptionRu: 'Креветка темпура, авокадо, угорь, острый майонез',
            price: 420,
            image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300',
            isPopular: true,
          },
        ],
      },
    ],
    setMenus: [
      {
        id: 'omakase-1',
        nameEn: 'Omakase Experience',
        nameRu: 'Омакасе',
        descriptionEn: 'Chef\'s selection of the finest seasonal fish',
        descriptionRu: 'Выбор шефа из лучшей сезонной рыбы',
        price: 3500,
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=600',
        includes: ['8-course omakase', 'Seasonal specials', 'Chef interaction', 'Green tea'],
        includesRu: ['8-блюд омакасе', 'Сезонные специалитеты', 'Общение с шефом', 'Зелёный чай'],
        duration: '2 hours',
        availableTimes: ['18:30', '19:00', '20:00'],
        maxGuests: 6,
      },
    ],
  },
  {
    id: 'rest-3',
    nameEn: 'Pizza Paradise',
    nameRu: 'Пицца Парадайз',
    descriptionEn: 'Authentic Italian pizzas baked in a wood-fired oven.',
    descriptionRu: 'Аутентичные итальянские пиццы, выпеченные в дровяной печи.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    rating: 4.6,
    reviewCount: 456,
    cuisine: 'Italian',
    cuisineRu: 'Итальянская',
    location: 'Rawai',
    locationRu: 'Равай',
    address: '78 Rawai Beach Road',
    phone: '+66 76 345 678',
    deliveryTime: '20-30',
    deliveryFee: 30,
    minOrder: 250,
    isOpen: true,
    isNew: true,
    priceLevel: 2,
    tags: ['Italian', 'Pizza', 'Pasta'],
    acceptsDelivery: true,
    acceptsReservations: true,
    hasSetMenus: false,
    reservationSlots: ['12:00', '13:00', '18:00', '19:00', '20:00', '21:00'],
    depositRequired: false,
    depositAmount: 0,
    maxPartySize: 20,
    menu: [
      {
        category: 'Pizza',
        categoryRu: 'Пицца',
        items: [
          {
            id: 'pizza-1',
            nameEn: 'Margherita',
            nameRu: 'Маргарита',
            descriptionEn: 'Tomato, mozzarella, fresh basil',
            descriptionRu: 'Томаты, моцарелла, свежий базилик',
            price: 280,
            image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300',
            isPopular: true,
          },
          {
            id: 'pizza-2',
            nameEn: 'Quattro Formaggi',
            nameRu: 'Четыре Сыра',
            descriptionEn: 'Mozzarella, gorgonzola, parmesan, ricotta',
            descriptionRu: 'Моцарелла, горгонзола, пармезан, рикотта',
            price: 380,
            image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300',
          },
        ],
      },
    ],
  },
  {
    id: 'rest-4',
    nameEn: 'Burger Joint',
    nameRu: 'Бургер Джоинт',
    descriptionEn: 'Gourmet burgers with premium beef and fresh ingredients.',
    descriptionRu: 'Гурме бургеры с премиальной говядиной и свежими ингредиентами.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600',
    coverImage: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
    rating: 4.5,
    reviewCount: 312,
    cuisine: 'American',
    cuisineRu: 'Американская',
    location: 'Kamala',
    locationRu: 'Камала',
    address: '12 Kamala Road',
    phone: '+66 76 456 789',
    deliveryTime: '15-25',
    deliveryFee: 35,
    minOrder: 150,
    isOpen: false,
    priceLevel: 1,
    tags: ['American', 'Burgers', 'Fast Food'],
    acceptsDelivery: true,
    acceptsReservations: false,
    hasSetMenus: false,
    reservationSlots: [],
    depositRequired: false,
    depositAmount: 0,
    maxPartySize: 0,
    menu: [
      {
        category: 'Burgers',
        categoryRu: 'Бургеры',
        items: [
          {
            id: 'burger-1',
            nameEn: 'Classic Cheeseburger',
            nameRu: 'Классический Чизбургер',
            descriptionEn: 'Beef patty, cheddar, lettuce, tomato, pickles',
            descriptionRu: 'Говяжья котлета, чеддер, салат, томат, соленья',
            price: 220,
            image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300',
            isPopular: true,
          },
        ],
      },
    ],
  },
  {
    id: 'rest-5',
    nameEn: 'Spice Garden',
    nameRu: 'Сад Специй',
    descriptionEn: 'Traditional Indian cuisine with rich spices and flavors.',
    descriptionRu: 'Традиционная индийская кухня с богатыми специями и вкусами.',
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
    coverImage: 'https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=800',
    rating: 4.7,
    reviewCount: 178,
    cuisine: 'Indian',
    cuisineRu: 'Индийская',
    location: 'Chalong',
    locationRu: 'Чалонг',
    address: '56 Chalong Circle',
    phone: '+66 76 567 890',
    deliveryTime: '30-45',
    deliveryFee: 45,
    minOrder: 300,
    isOpen: true,
    priceLevel: 2,
    tags: ['Indian', 'Curry', 'Vegetarian'],
    acceptsDelivery: true,
    acceptsReservations: true,
    hasSetMenus: true,
    reservationSlots: ['12:00', '12:30', '18:00', '18:30', '19:00', '19:30', '20:00'],
    depositRequired: false,
    depositAmount: 0,
    maxPartySize: 15,
    menu: [
      {
        category: 'Curry',
        categoryRu: 'Карри',
        items: [
          {
            id: 'curry-1',
            nameEn: 'Butter Chicken',
            nameRu: 'Баттер Чикен',
            descriptionEn: 'Creamy tomato curry with tender chicken',
            descriptionRu: 'Сливочный томатный карри с нежной курицей',
            price: 280,
            image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300',
            isPopular: true,
          },
        ],
      },
    ],
    setMenus: [
      {
        id: 'thali-1',
        nameEn: 'Grand Thali Experience',
        nameRu: 'Большой Тали',
        descriptionEn: 'Complete Indian meal with variety of dishes',
        descriptionRu: 'Полноценный индийский обед с разнообразием блюд',
        price: 800,
        image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600',
        includes: ['Rice', '3 Curries', 'Dal', 'Naan', 'Raita', 'Dessert'],
        includesRu: ['Рис', '3 Карри', 'Дал', 'Наан', 'Раита', 'Десерт'],
        duration: '1.5 hours',
        availableTimes: ['12:00', '12:30', '19:00', '19:30'],
        maxGuests: 10,
      },
    ],
  },
];

export const cuisineCategories = [
  { id: 'all', labelEn: 'All', labelRu: 'Все', icon: '🍽️' },
  { id: 'thai', labelEn: 'Thai', labelRu: 'Тайская', icon: '🥢' },
  { id: 'japanese', labelEn: 'Japanese', labelRu: 'Японская', icon: '🍣' },
  { id: 'italian', labelEn: 'Italian', labelRu: 'Итальянская', icon: '🍕' },
  { id: 'american', labelEn: 'American', labelRu: 'Американская', icon: '🍔' },
  { id: 'indian', labelEn: 'Indian', labelRu: 'Индийская', icon: '🍛' },
];

export const getRestaurantById = (id: string): Restaurant | undefined => {
  return demoRestaurants.find(r => r.id === id);
};
