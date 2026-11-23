import {
  Receipt, Banknote, UtensilsCrossed, Ticket, PieChart, Heart, LayoutGrid,
  ShoppingCart, Store, Plane, Home, Zap, Wifi, Phone, Wrench, Coffee, Sandwich,
  Beer, Car, Hotel, Shirt, Laptop, Film, CreditCard, Wallet, ArrowLeftRight,
  RefreshCcw, Video, MessageCircle, Droplets, Bell, Apple, Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** "0xFFC45100" / "0xC45100" / "#C45100" -> "#C45100" */
export function argbToHex(v: string): string {
  if (!v) return '#334eac';
  let s = v.trim().replace(/^#/, '').replace(/^0x/i, '');
  if (s.length === 8) s = s.slice(2); // drop leading alpha (FF…)
  return `#${s.toUpperCase()}`;
}

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

// ── Goal icon-key set (mirrors mobile `availableCategoryIcons`) ────────────
// Financial goals reuse the same icon-key vocabulary as categories; "none"
// is a valid, deliberate choice (renders as "no icon"), not a missing value.
export const GOAL_ICON_KEYS = [
  'none', 'category', 'receipt', 'money', 'shopping_cart', 'restaurant', 'fast_food',
  'local_cafe', 'local_bar', 'home', 'bolt', 'wifi', 'phone', 'build', 'directions_car',
  'flight', 'hotel', 'checkroom', 'devices', 'credit_card', 'payments', 'swap_horiz',
  'subscriptions', 'video_library', 'chat', 'confirmation', 'pie_chart', 'favorite_border',
  'grid_view',
] as const;

export const GOAL_ICON_LABELS: Record<string, string> = {
  none: 'No icon', category: 'General', receipt: 'Bills', money: 'Savings',
  shopping_cart: 'Groceries', restaurant: 'Food', fast_food: 'Fast food', local_cafe: 'Cafe',
  local_bar: 'Bar', home: 'Home', bolt: 'Electricity', wifi: 'Internet', phone: 'Phone',
  build: 'Maintenance', directions_car: 'Car', flight: 'Travel', hotel: 'Hotel',
  checkroom: 'Clothing', devices: 'Gadget', credit_card: 'Card', payments: 'Investment',
  swap_horiz: 'Transfer', subscriptions: 'Subscription', video_library: 'Entertainment',
  chat: 'Chat', confirmation: 'Tickets', pie_chart: 'Budget', favorite_border: 'Wishlist',
  grid_view: 'Other',
};

/**
 * Resolve a goal icon key to a lucide component — mirrors the mobile
 * `String.toDrawableResId()` (Category.kt) exactly: "none" and any
 * unrecognized key resolve to `null` (no icon), unlike `iconFor` above,
 * which falls back to a generic glyph.
 */
export const goalIconFor = (key?: string | null): LucideIcon | null => {
  if (!key) return null;
  const k = key.toLowerCase();
  return k === 'none' ? null : ICON_MAP[k] ?? null;
};
