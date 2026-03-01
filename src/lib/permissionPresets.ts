export interface SubPermissionDef {
  key: string;
  labelEn: string;
  labelRu: string;
}

export interface ModuleSubPermissions {
  moduleKey: string;
  subs: SubPermissionDef[];
}

export const SUB_PERMISSIONS: ModuleSubPermissions[] = [
  {
    moduleKey: 'properties',
    subs: [
      { key: 'view_card', labelEn: 'View property card', labelRu: 'Просмотр карточки объекта' },
      { key: 'edit_description', labelEn: 'Edit description', labelRu: 'Редактирование описания' },
      { key: 'edit_prices', labelEn: 'Edit prices', labelRu: 'Редактирование цен' },
      { key: 'manage_photos', labelEn: 'Manage photos', labelRu: 'Управление фотографиями' },
      { key: 'view_finances', labelEn: 'View property finances', labelRu: 'Просмотр финансов объекта' },
    ],
  },
  {
    moduleKey: 'bookings',
    subs: [
      { key: 'view_bookings', labelEn: 'View bookings', labelRu: 'Просмотр бронирований' },
      { key: 'create_bookings', labelEn: 'Create bookings', labelRu: 'Создание бронирований' },
      { key: 'cancel_bookings', labelEn: 'Cancel bookings', labelRu: 'Отмена бронирований' },
      { key: 'edit_booking_prices', labelEn: 'Edit booking prices', labelRu: 'Редактирование цен бронирования' },
    ],
  },
  {
    moduleKey: 'finance',
    subs: [
      { key: 'view_reports', labelEn: 'View reports', labelRu: 'Просмотр отчётов' },
      { key: 'create_expenses', labelEn: 'Create expenses', labelRu: 'Создание расходов' },
      { key: 'confirm_payouts', labelEn: 'Confirm payouts', labelRu: 'Подтверждение выплат' },
    ],
  },
  {
    moduleKey: 'crm',
    subs: [
      { key: 'view_contacts', labelEn: 'View contacts', labelRu: 'Просмотр контактов' },
      { key: 'edit_contacts', labelEn: 'Edit contacts', labelRu: 'Редактирование контактов' },
      { key: 'view_phones', labelEn: 'View phone numbers (unmasked)', labelRu: 'Просмотр телефонов (без маскирования)' },
    ],
  },
  {
    moduleKey: 'tasks',
    subs: [
      { key: 'view_tasks', labelEn: 'View tasks', labelRu: 'Просмотр задач' },
      { key: 'create_tasks', labelEn: 'Create tasks', labelRu: 'Создание задач' },
      { key: 'assign_tasks', labelEn: 'Assign tasks to others', labelRu: 'Назначение задач другим' },
    ],
  },
  {
    moduleKey: 'staff',
    subs: [
      { key: 'view_staff', labelEn: 'View staff', labelRu: 'Просмотр сотрудников' },
      { key: 'edit_staff', labelEn: 'Edit staff', labelRu: 'Редактирование сотрудников' },
      { key: 'manage_permissions', labelEn: 'Manage permissions', labelRu: 'Управление правами' },
    ],
  },
  {
    moduleKey: 'reports',
    subs: [
      { key: 'view_reports', labelEn: 'View reports', labelRu: 'Просмотр отчётов' },
      { key: 'generate_reports', labelEn: 'Generate reports', labelRu: 'Генерация отчётов' },
    ],
  },
];

export type SubPermissionsMap = Record<string, boolean>;

export interface PermissionPreset {
  key: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  /** module -> { can_view, can_edit, sub_permissions } */
  modules: Record<string, { can_view: boolean; can_edit: boolean; can_export: boolean; sub_permissions: SubPermissionsMap }>;
}

function allSubsFor(moduleKey: string, value: boolean): SubPermissionsMap {
  const mod = SUB_PERMISSIONS.find(m => m.moduleKey === moduleKey);
  if (!mod) return {};
  return Object.fromEntries(mod.subs.map(s => [s.key, value]));
}

function fullModule(can_edit = true, can_export = false, moduleKey: string) {
  return { can_view: true, can_edit, can_export, sub_permissions: allSubsFor(moduleKey, true) };
}

function offModule(moduleKey: string) {
  return { can_view: false, can_edit: false, can_export: false, sub_permissions: allSubsFor(moduleKey, false) };
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    key: 'cleaner',
    labelEn: 'Cleaner',
    labelRu: 'Уборщик',
    descEn: 'View tasks & properties only',
    descRu: 'Только просмотр задач и объектов',
    modules: {
      properties: { can_view: true, can_edit: false, can_export: false, sub_permissions: { view_card: true, edit_description: false, edit_prices: false, manage_photos: false, view_finances: false } },
      bookings: offModule('bookings'),
      finance: offModule('finance'),
      crm: offModule('crm'),
      tasks: { can_view: true, can_edit: false, can_export: false, sub_permissions: { view_tasks: true, create_tasks: false, assign_tasks: false } },
      staff: offModule('staff'),
      reports: offModule('reports'),
    },
  },
  {
    key: 'manager',
    labelEn: 'Manager',
    labelRu: 'Управляющий',
    descEn: 'Everything except finance & export',
    descRu: 'Всё кроме финансов и экспорта',
    modules: {
      properties: { ...fullModule(true, false, 'properties'), sub_permissions: { ...allSubsFor('properties', true), view_finances: false } },
      bookings: fullModule(true, false, 'bookings'),
      finance: offModule('finance'),
      crm: fullModule(true, false, 'crm'),
      tasks: fullModule(true, false, 'tasks'),
      staff: { can_view: true, can_edit: true, can_export: false, sub_permissions: { view_staff: true, edit_staff: true, manage_permissions: false } },
      reports: { can_view: true, can_edit: false, can_export: false, sub_permissions: { view_reports: true, generate_reports: false } },
    },
  },
  {
    key: 'accountant',
    labelEn: 'Accountant',
    labelRu: 'Бухгалтер',
    descEn: 'Finance + reports + export',
    descRu: 'Финансы + отчёты + экспорт',
    modules: {
      properties: { can_view: true, can_edit: false, can_export: false, sub_permissions: { view_card: true, edit_description: false, edit_prices: false, manage_photos: false, view_finances: true } },
      bookings: { can_view: true, can_edit: false, can_export: true, sub_permissions: { view_bookings: true, create_bookings: false, cancel_bookings: false, edit_booking_prices: false } },
      finance: { ...fullModule(true, true, 'finance') },
      crm: offModule('crm'),
      tasks: offModule('tasks'),
      staff: offModule('staff'),
      reports: { can_view: true, can_edit: true, can_export: true, sub_permissions: allSubsFor('reports', true) },
    },
  },
  {
    key: 'full_access',
    labelEn: 'Full Access',
    labelRu: 'Полный доступ',
    descEn: 'All permissions enabled',
    descRu: 'Все права включены',
    modules: {
      properties: fullModule(true, true, 'properties'),
      bookings: fullModule(true, true, 'bookings'),
      finance: fullModule(true, true, 'finance'),
      crm: fullModule(true, true, 'crm'),
      tasks: fullModule(true, true, 'tasks'),
      staff: fullModule(true, true, 'staff'),
      reports: fullModule(true, true, 'reports'),
    },
  },
];
