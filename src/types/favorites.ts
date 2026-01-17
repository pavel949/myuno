/**
 * Favorites-related type definitions
 */

export interface FavoriteItem {
  id: string;
  user_id?: string;
  item_id: string;
  item_type: string;
  item_data?: FavoriteItemData | null;
  created_at: string;
}

export interface FavoriteItemData {
  name_en?: string;
  name_ru?: string;
  title_en?: string;
  title_ru?: string;
  cover_image?: string;
  image?: string;
  price?: number;
  rating?: number;
  address?: string;
  district?: string;
}

export interface FavoriteCollection {
  id: string;
  name: string;
  icon: string;
  color: string;
  count: number;
}
