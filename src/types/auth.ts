 /**
  * @module AuthTypes
  * @description Canonical authentication and authorization types
  * 
  * This is the SINGLE SOURCE OF TRUTH for role definitions.
  * Synchronized with public.app_role ENUM in database.
  */
 
 /**
  * Application roles synchronized with public.app_role ENUM
  * 
  * Hierarchy:
  * - guest: Unauthenticated visitor
  * - user: Basic authenticated user
  * - tourist/resident: User personas (can coexist with other roles)
  * - partner/owner/vendor: Business roles
  * - staff/uno_team: Platform operators
  * - admin/ombudsman: Administrative roles
  * - finance/support/sales/investor: Specialized platform roles
  */
export type AppRole =
  // Base roles
  | 'guest'
  | 'user'
  // User personas
  | 'tourist'
  | 'resident'
  // Business roles
  | 'partner'
  | 'owner'
  | 'property_owner'  // DB: app_role enum — full property owner with portal access
  | 'property_manager' // NOTE: not yet in DB app_role enum (property_manager_assignments table used instead)
  | 'broker'          // DB: app_role enum — RE broker role
  | 'vendor'
  // Platform operators
  | 'staff'
  | 'uno_team'
  // Administrative roles
  | 'admin'
  | 'ombudsman'
  // Specialized platform roles
  | 'finance'
  | 'support'
  | 'sales'
  | 'investor';
 
 /** Roles that grant administrative access */
 export const ADMIN_ROLES: AppRole[] = ['admin', 'ombudsman'];
 
 /** Roles that grant platform operator access */
 export const OPERATOR_ROLES: AppRole[] = ['staff', 'uno_team', 'admin', 'ombudsman'];
 
 /** Roles that can be self-activated by users */
 export const SELF_ACTIVATABLE_ROLES: AppRole[] = ['owner', 'vendor'];
 
 /** Roles that require admin approval */
 export const ADMIN_ONLY_ROLES: AppRole[] = ['admin', 'ombudsman', 'staff', 'uno_team', 'finance', 'support', 'sales'];
 
 /** Roles available for context switching in UI */
 export const SWITCHABLE_ROLES: AppRole[] = [
   'user',
   'vendor',
   'owner',
   'property_manager',
   'admin',
   'staff',
   'uno_team',
   'investor',
 ];
 
 /** Role metadata for UI display */
 export interface RoleMetadata {
   labelEn: string;
   labelRu: string;
   icon: string;
   color: string;
   /** Default path when switching to this role */
   defaultPath: string;
   descriptionEn?: string;
   descriptionRu?: string;
 }
 
 export const ROLE_METADATA: Record<AppRole, RoleMetadata> = {
   guest: {
     labelEn: 'Guest',
     labelRu: 'Гость',
     icon: 'User',
     color: 'from-gray-400 to-gray-500',
     defaultPath: '/',
   },
   user: {
     labelEn: 'Client',
     labelRu: 'Клиент',
     icon: 'User',
     color: 'from-primary to-primary',
     defaultPath: '/',
     descriptionEn: 'Browse services and make bookings',
     descriptionRu: 'Просматривайте услуги и делайте заказы',
   },
   tourist: {
     labelEn: 'Tourist',
     labelRu: 'Турист',
     icon: 'Plane',
     color: 'from-primary to-primary',
     defaultPath: '/',
   },
   resident: {
     labelEn: 'Resident',
     labelRu: 'Резидент',
     icon: 'Home',
     color: 'from-success to-success',
     defaultPath: '/',
   },
   partner: {
     labelEn: 'Partner',
     labelRu: 'Партнёр',
     icon: 'Handshake',
     color: 'from-primary to-primary',
     defaultPath: '/vendor',
   },
    owner: {
     labelEn: 'Property Owner',
     labelRu: 'Собственник',
     icon: 'Building2',
     color: 'from-success to-success',
     defaultPath: '/mc',
     descriptionEn: 'Manage your property and order services',
     descriptionRu: 'Управляйте своим объектом и заказывайте сервисы',
   },
    property_manager: {
       labelEn: 'Property Management (MC)',
       labelRu: 'Управляющая компания (УК)',
       icon: 'UserCog',
       color: 'from-success to-primary',
       defaultPath: '/owner',
       descriptionEn: 'Professional property management for owners',
       descriptionRu: 'Профессиональное управление объектами собственников',
    },
   property_owner: {
     labelEn: 'Property Owner',
     labelRu: 'Владелец недвижимости',
     icon: 'Building2',
     color: 'from-success to-success',
     defaultPath: '/my-property',
     descriptionEn: 'Track properties managed on your behalf',
     descriptionRu: 'Портал собственника — объекты под управлением УК',
   },
   broker: {
     labelEn: 'Broker',
     labelRu: 'Брокер',
     icon: 'Briefcase',
     color: 'from-primary to-primary',
     defaultPath: '/admin/sales',
     descriptionEn: 'Real estate broker with deal pipeline access',
     descriptionRu: 'Брокер по недвижимости с доступом к сделкам',
   },
    vendor: {
     labelEn: 'Service Provider',
     labelRu: 'Поставщик услуг',
     icon: 'Store',
     color: 'from-primary to-primary',
     defaultPath: '/vendor',
     descriptionEn: 'Offer tours, activities, and services',
     descriptionRu: 'Предлагайте туры, впечатления и услуги',
   },
   staff: {
     labelEn: 'Staff',
     labelRu: 'Сотрудник',
     icon: 'UserCog',
     color: 'from-accent to-accent',
     defaultPath: '/admin',
   },
   uno_team: {
     labelEn: 'myUNO Team',
     labelRu: 'Команда myUNO',
     icon: 'Headphones',
     color: 'from-success to-success',
     defaultPath: '/team',
     descriptionEn: 'Process leads, contact clients, coordinate with providers',
     descriptionRu: 'Обработка заявок, связь с клиентами, координация с поставщиками',
   },
   admin: {
     labelEn: 'Admin',
     labelRu: 'Администратор',
     icon: 'Shield',
     color: 'from-red-400 to-red-500',
     defaultPath: '/admin',
   },
   ombudsman: {
     labelEn: 'Ombudsman',
     labelRu: 'Омбудсмен',
     icon: 'Scale',
     color: 'from-slate-400 to-slate-500',
     defaultPath: '/admin',
   },
   finance: {
     labelEn: 'Finance',
     labelRu: 'Финансы',
     icon: 'Wallet',
     color: 'from-success to-success',
     defaultPath: '/admin/finance',
   },
   support: {
     labelEn: 'Support',
     labelRu: 'Поддержка',
     icon: 'HeadphonesIcon',
     color: 'from-primary to-primary',
     defaultPath: '/admin/support',
   },
   sales: {
     labelEn: 'Sales',
     labelRu: 'Продажи',
     icon: 'TrendingUp',
     color: 'from-success to-success',
     defaultPath: '/admin/sales',
   },
   investor: {
     labelEn: 'Investor',
     labelRu: 'Инвестор',
     icon: 'LineChart',
     color: 'from-accent to-accent',
     defaultPath: '/investor',
   },
 };
 
 // Helper functions
 export function isAdminRole(role: AppRole): boolean {
   return ADMIN_ROLES.includes(role);
 }
 
 export function isOperatorRole(role: AppRole): boolean {
   return OPERATOR_ROLES.includes(role);
 }
 
 export function canSelfActivate(role: AppRole): boolean {
   return SELF_ACTIVATABLE_ROLES.includes(role);
 }
 
 export function getRoleMetadata(role: AppRole): RoleMetadata {
   return ROLE_METADATA[role] || ROLE_METADATA.guest;
 }