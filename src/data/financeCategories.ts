import {
  Receipt, Banknote, UtensilsCrossed, Ticket, PieChart, Heart, LayoutGrid,
  ShoppingCart, Store, Plane, Home, Zap, Wifi, Phone, Wrench, Coffee, Sandwich,
  Beer, Car, Hotel, Shirt, Laptop, Film, CreditCard, Wallet, ArrowLeftRight,
  RefreshCcw, Video, MessageCircle, Droplets, Bell, Apple, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: string;   // icon key (mirrors the mobile app's category set)
  color: string;  // "#RRGGBB"
}

export interface SubCategory {
  id: string;
  name: string;
  icon: string;
  parentId: string;
}

/** "0xFFC45100" / "0xC45100" / "#C45100" -> "#C45100" */
export function argbToHex(v: string): string {
  if (!v) return '#334eac';
  let s = v.trim().replace(/^#/, '').replace(/^0x/i, '');
  if (s.length === 8) s = s.slice(2); // drop leading alpha (FF…)
  return `#${s.toUpperCase()}`;
}

// ── Default categories (ported from the mobile app) ────────────────────────
export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Bills', icon: 'receipt', color: argbToHex('0xFFC45100') },
  { id: '2', name: 'Cash', icon: 'money', color: argbToHex('0xFF2E7D32') },
  { id: '3', name: 'Eating out', icon: 'restaurant', color: argbToHex('0xFF2A52BE') },
  { id: '4', name: 'Entertainment', icon: 'confirmation', color: argbToHex('0xFF00796B') },
  { id: '5', name: 'Expenses', icon: 'pie_chart', color: argbToHex('0xFF0277BD') },
  { id: '6', name: 'Family', icon: 'favorite_border', color: argbToHex('0xFFC2185B') },
  { id: '7', name: 'General', icon: 'grid_view', color: argbToHex('0xFF455A64') },
  { id: '8', name: 'Groceries', icon: 'shopping_cart', color: argbToHex('0xFFD32F2F') },
  { id: '9', name: 'Shopping', icon: 'storefront', color: argbToHex('0xFF00695C') },
  { id: '10', name: 'Travel', icon: 'flight', color: argbToHex('0xFFE65100') },
];

// ── Default sub-categories ────────────────────────────────────────────────
export const DEFAULT_SUBCATEGORIES: SubCategory[] = [
  { id: 'sub_1', name: 'Rent', icon: 'home', parentId: '1' },
  { id: 'sub_2', name: 'Electricity', icon: 'bolt', parentId: '1' },
  { id: 'sub_3', name: 'Internet', icon: 'wifi', parentId: '1' },
  { id: 'sub_4', name: 'Telephone', icon: 'phone', parentId: '1' },
  { id: 'sub_5', name: 'Maintenance', icon: 'build', parentId: '1' },
  { id: 'sub_6', name: 'Cafe & Coffee', icon: 'local_cafe', parentId: '3' },
  { id: 'sub_7', name: 'Fast Food', icon: 'fastfood', parentId: '3' },
  { id: 'sub_8', name: 'Bars & Drinks', icon: 'local_bar', parentId: '3' },
  { id: 'sub_9', name: 'Supermarket', icon: 'shopping_cart', parentId: '8' },
  { id: 'sub_10', name: 'Fruits & Veggies', icon: 'restaurant', parentId: '8' },
  { id: 'sub_11', name: 'Cabs & Transit', icon: 'directions_car', parentId: '10' },
  { id: 'sub_12', name: 'Hotels & Stays', icon: 'hotel', parentId: '10' },
  { id: 'sub_13', name: 'Flights', icon: 'flight', parentId: '10' },
  { id: 'sub_14', name: 'Clothes & Apparel', icon: 'checkroom', parentId: '9' },
  { id: 'sub_15', name: 'Electronics', icon: 'devices', parentId: '9' },
  { id: 'sub_16', name: 'Movies & Cinema', icon: 'movie', parentId: '4' },
  { id: 'sub_17', name: 'Streaming Services', icon: 'devices', parentId: '4' },
];

export const subCategoriesOf = (categoryId: string): SubCategory[] =>
  DEFAULT_SUBCATEGORIES.filter((s) => s.parentId === categoryId);

export const categoryByName = (name?: string | null): Category | undefined =>
  name ? DEFAULT_CATEGORIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) : undefined;

// ── Icon-key -> lucide component (mirrors the mobile `toDrawableResId`) ──────
const ICON_MAP: Record<string, LucideIcon> = {
  none: Tag,
  cart: ShoppingCart, shopping_cart: ShoppingCart, shopping: ShoppingCart, supermarket: ShoppingCart,
  ramen_dining: UtensilsCrossed,
  apartment: Home,
  storefront: Store,
  flight: Plane, flights: Plane,
  movie: Film,
  money: Banknote, cash: Banknote,
  category: LayoutGrid, grid_view: LayoutGrid, general: LayoutGrid,
  restaurant: UtensilsCrossed, 'eating out': UtensilsCrossed, eating_out: UtensilsCrossed, food: UtensilsCrossed,
  confirmation: Ticket, confirmation_number: Ticket, entertainment: Ticket,
  pie_chart: PieChart, expenses: PieChart,
  favorite_border: Heart, favorite: Heart, family: Heart,
  bolt: Zap, electricity: Zap,
  wifi: Wifi, internet: Wifi, language: Wifi,
  phone: Phone, telephone: Phone,
  build: Wrench, maintenance: Wrench,
  local_cafe: Coffee,
  fast_food: Sandwich, fastfood: Sandwich,
  local_bar: Beer,
  directions_car: Car,
  hotel: Hotel,
  checkroom: Shirt,
  devices: Laptop, electronics: Laptop,
  credit_card: CreditCard,
  payments: Wallet, salary: Wallet,
  swap_horiz: ArrowLeftRight, money_transfer: ArrowLeftRight,
  subscriptions: RefreshCcw, subscription: RefreshCcw,
  video_library: Video,
  chat: MessageCircle,
  water_drop: Droplets, water: Droplets,
  notifications: Bell,
  home: Home, rent: Home,
  receipt: Receipt, bill: Receipt, bills: Receipt,
  'fruits & veggies': Apple,
};

/** Resolve a category/sub-category icon key to a lucide component. */
export const iconFor = (key?: string | null): LucideIcon =>
  key ? ICON_MAP[key.toLowerCase()] ?? Tag : Tag;
