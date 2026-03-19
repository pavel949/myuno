/** Shared types for the MC sidebar navigation. */

export interface NavItem {
  title: string;
  titleRu: string;
  path: string;
  icon: React.ElementType;
  badgeKey?: 'tasks' | 'messages';
}

export interface NavGroup {
  label: string;
  labelRu: string;
  items: NavItem[];
  defaultOpen?: boolean;
}
