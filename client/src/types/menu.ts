export type FoodType = 'veg' | 'non-veg' | 'egg';

export interface MenuItem {
  id: string;
  name: string;
  originalName?: string;
  categoryId: string;
  category: string;
  subcategory?: string;
  price: number;
  type: FoodType;
  availability: boolean;
  description?: string;
  imageUrl?: string;
  displayOrder?: number;
  sourceCard?: string;
  needsVerification?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  displayOrder: number;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  phones: string[];
  address: string;
  viewOnlyNotice: string;
  currencySymbol: string;
}

export interface MenuApiResponse {
  success: boolean;
  restaurant: RestaurantInfo;
  categories: Category[];
  items: MenuItem[];
  count: number;
  lastUpdated: string;
}

export interface NetworkInfoResponse {
  success: boolean;
  currentIp: string;
  port: number;
  menuUrl: string;
  qrDataUrl: string;
  availableIps: { name: string; address: string }[];
}

export interface SelectedOrderItem {
  item: MenuItem;
  quantity: number;
}

