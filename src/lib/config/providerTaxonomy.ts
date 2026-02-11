/**
 * Provider Taxonomy Categories - Sample category tree for canonical listing wizard
 * 
 * NOTE: For vertical-specific schemas, use verticalCategorySchemas.ts instead.
 * This file retains the legacy "services + products" tree for backward compatibility.
 */
import { CategoryNode } from '@/components/vendor/wizard';
export { VERTICAL_CATEGORY_MAP, getCategoriesForVertical, getSupportedVerticals } from './verticalCategorySchemas';

export const PROVIDER_CATEGORY_TREE: CategoryNode[] = [
  {
    id: 'services',
    name_en: 'Services',
    name_ru: 'Услуги',
    icon: '🛠️',
    children: [
      {
        id: 'cleaning',
        name_en: 'Cleaning',
        name_ru: 'Уборка',
        icon: '🧹',
        schema: {
          fields: [
            { key: 'service_area', labelEn: 'Service Area', labelRu: 'Зона обслуживания', type: 'text', required: true },
            { key: 'team_size', labelEn: 'Team Size', labelRu: 'Размер команды', type: 'number', min: 1 },
            { key: 'equipment_included', labelEn: 'Equipment Included', labelRu: 'Оборудование включено', type: 'switch' },
          ],
          pricingModels: ['fixed', 'per_hour'],
          availabilityTypes: ['instant', 'request'],
          minImages: 3,
          maxImages: 10,
        },
      },
      {
        id: 'repair',
        name_en: 'Repair & Maintenance',
        name_ru: 'Ремонт и обслуживание',
        icon: '🔧',
        children: [
          {
            id: 'plumbing',
            name_en: 'Plumbing',
            name_ru: 'Сантехника',
            icon: '🚿',
            schema: {
              fields: [
                { key: 'emergency_available', labelEn: 'Emergency Service', labelRu: 'Экстренный вызов', type: 'switch' },
                { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
              ],
              pricingModels: ['fixed', 'per_hour'],
              availabilityTypes: ['instant', 'request', 'scheduled'],
              minImages: 2,
              maxImages: 8,
            },
          },
          {
            id: 'electrical',
            name_en: 'Electrical',
            name_ru: 'Электрика',
            icon: '⚡',
            schema: {
              fields: [
                { key: 'licensed', labelEn: 'Licensed Electrician', labelRu: 'Лицензированный электрик', type: 'switch', required: true },
                { key: 'warranty_days', labelEn: 'Warranty (days)', labelRu: 'Гарантия (дни)', type: 'number', min: 0, max: 365 },
              ],
              pricingModels: ['fixed', 'per_hour'],
              availabilityTypes: ['request', 'scheduled'],
              minImages: 2,
              maxImages: 8,
              requiredLicenses: ['electrical_license'],
            },
          },
        ],
      },
      {
        id: 'beauty',
        name_en: 'Beauty & Wellness',
        name_ru: 'Красота и здоровье',
        icon: '💅',
        schema: {
          fields: [
            { key: 'duration_minutes', labelEn: 'Duration (min)', labelRu: 'Длительность (мин)', type: 'number', required: true, min: 15, max: 480 },
            { key: 'home_service', labelEn: 'Home Service Available', labelRu: 'Выезд на дом', type: 'switch' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['scheduled'],
          minImages: 3,
          maxImages: 12,
        },
      },
    ],
  },
  {
    id: 'products',
    name_en: 'Products',
    name_ru: 'Товары',
    icon: '📦',
    children: [
      {
        id: 'food',
        name_en: 'Food & Groceries',
        name_ru: 'Еда и продукты',
        icon: '🍎',
        schema: {
          fields: [
            { key: 'shelf_life_days', labelEn: 'Shelf Life (days)', labelRu: 'Срок годности (дни)', type: 'number', min: 1 },
            { key: 'organic', labelEn: 'Organic', labelRu: 'Органический', type: 'switch' },
            { key: 'storage_temp', labelEn: 'Storage Temperature', labelRu: 'Температура хранения', type: 'select', options: [
              { value: 'room', labelEn: 'Room Temperature', labelRu: 'Комнатная' },
              { value: 'refrigerated', labelEn: 'Refrigerated', labelRu: 'Холодильник' },
              { value: 'frozen', labelEn: 'Frozen', labelRu: 'Замороженный' },
            ]},
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['instant'],
          minImages: 2,
          maxImages: 6,
        },
      },
      {
        id: 'household',
        name_en: 'Household',
        name_ru: 'Для дома',
        icon: '🏠',
        schema: {
          fields: [
            { key: 'material', labelEn: 'Material', labelRu: 'Материал', type: 'text' },
            { key: 'dimensions', labelEn: 'Dimensions', labelRu: 'Размеры', type: 'text' },
          ],
          pricingModels: ['fixed'],
          availabilityTypes: ['instant', 'request'],
          minImages: 3,
          maxImages: 10,
        },
      },
    ],
  },
];

/**
 * Flatten category tree to get all leaf categories
 */
export function getLeafCategories(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  
  const traverse = (node: CategoryNode) => {
    if (!node.children || node.children.length === 0) {
      result.push(node);
    } else {
      node.children.forEach(traverse);
    }
  };
  
  nodes.forEach(traverse);
  return result;
}

/**
 * Find category by ID in tree
 */
export function findCategoryById(nodes: CategoryNode[], id: string): CategoryNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findCategoryById(node.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Get breadcrumb path for a category
 */
export function getCategoryBreadcrumb(nodes: CategoryNode[], targetId: string): CategoryNode[] {
  const path: CategoryNode[] = [];
  
  const find = (currentNodes: CategoryNode[], currentPath: CategoryNode[]): boolean => {
    for (const node of currentNodes) {
      const newPath = [...currentPath, node];
      if (node.id === targetId) {
        path.push(...newPath);
        return true;
      }
      if (node.children && find(node.children, newPath)) {
        return true;
      }
    }
    return false;
  };
  
  find(nodes, []);
  return path;
}
