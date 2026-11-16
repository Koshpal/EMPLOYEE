import React from 'react';
import {
  Apple, Award, Baby, Banknote, Bike, Book, BookOpen, Briefcase, Brush, Bus, Car, CarTaxiFront,
  CandlestickChart, CircleEllipsis, CircleParking, Clapperboard, Coffee, Coins, Cookie, CreditCard,
  Droplet, Droplets, Dumbbell, Film, Flame, Fuel, Gamepad2, Gift, GraduationCap, HandHeart, Heart,
  HeartPulse, CircleHelp, Home, Hospital, Landmark, Hotel, Laptop, LifeBuoy, Microscope, Palette, PawPrint,
  Percent, Pill, PiggyBank, Plane, Receipt, Repeat, School, Scissors, ShieldCheck, Shirt, ShoppingBag,
  ShoppingCart, Smile, Sofa, Sparkles, Stethoscope, Store, Tag, Ticket, TrainFront, TreePalm,
  TrendingUp, Trophy, Tv, Undo2, Users, Utensils, Vault, Wallet, Watch, Wifi, Wrench, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { iconFor as legacyIconFor } from './financeCategories';

/**
 * Icon keys stored on a personal category are lucide icon names in kebab-case ("paw-print").
 * Anything unknown (including the mobile app's older keys like "restaurant") falls back through the
 * legacy map and finally to a generic tag, so a category can never render as a blank square.
 */
const REGISTRY: Record<string, LucideIcon> = {
  utensils: Utensils, 'shopping-cart': ShoppingCart, bike: Bike, coffee: Coffee, cookie: Cookie,
  fuel: Fuel, bus: Bus, 'car-taxi-front': CarTaxiFront, car: Car, wrench: Wrench,
  'circle-parking': CircleParking, home: Home, zap: Zap, droplets: Droplets, flame: Flame, wifi: Wifi,
  shirt: Shirt, laptop: Laptop, sofa: Sofa, watch: Watch, 'shopping-bag': ShoppingBag, pill: Pill,
  stethoscope: Stethoscope, hospital: Hospital, microscope: Microscope, smile: Smile, dumbbell: Dumbbell,
  'heart-pulse': HeartPulse, heart: Heart, clapperboard: Clapperboard, tv: Tv, 'gamepad-2': Gamepad2,
  ticket: Ticket, palette: Palette, film: Film, 'graduation-cap': GraduationCap, 'book-open': BookOpen,
  book: Book, award: Award, school: School, plane: Plane, hotel: Hotel, 'train-front': TrainFront,
  palmtree: TreePalm, scissors: Scissors, sparkles: Sparkles, droplet: Droplet, brush: Brush,
  landmark: Landmark, 'credit-card': CreditCard, 'shield-check': ShieldCheck, receipt: Receipt,
  percent: Percent, 'piggy-bank': PiggyBank, 'trending-up': TrendingUp, 'candlestick-chart': CandlestickChart,
  vault: Vault, repeat: Repeat, 'life-buoy': LifeBuoy, users: Users, gift: Gift, 'hand-heart': HandHeart,
  baby: Baby, 'paw-print': PawPrint, 'circle-ellipsis': CircleEllipsis, 'help-circle': CircleHelp,
  banknote: Banknote, trophy: Trophy, briefcase: Briefcase, store: Store, coins: Coins, 'undo-2': Undo2,
  wallet: Wallet, tag: Tag, apple: Apple,
};

export function categoryIcon(key?: string | null): LucideIcon {
  if (!key) return Tag;
  const k = key.toLowerCase();
  return REGISTRY[k] ?? legacyIconFor(k);
}

/** What the icon picker offers (a curated, recognisable subset). */
export const ICON_CHOICES: string[] = [
  'utensils', 'shopping-cart', 'coffee', 'car', 'bus', 'fuel', 'home', 'zap', 'wifi', 'shopping-bag',
  'shirt', 'laptop', 'heart-pulse', 'pill', 'dumbbell', 'film', 'tv', 'gamepad-2', 'graduation-cap',
  'book-open', 'plane', 'hotel', 'sparkles', 'scissors', 'credit-card', 'shield-check', 'piggy-bank',
  'trending-up', 'users', 'gift', 'baby', 'paw-print', 'briefcase', 'banknote', 'wallet', 'store',
  'coins', 'receipt', 'ticket', 'palette', 'wrench', 'droplets', 'flame', 'tag',
];

export const COLOR_CHOICES: string[] = [
  '#F97316', '#EF4444', '#EC4899', '#D946EF', '#8B5CF6', '#6366F1', '#3B82F6', '#0EA5E9',
  '#14B8A6', '#10B981', '#16A34A', '#84CC16', '#F59E0B', '#64748B', '#94A3B8', '#334EAC',
];

export const DEFAULT_CATEGORY_COLOR = '#334EAC';

interface CategoryIconProps {
  icon?: string | null;
  color?: string | null;
  /** px size of the whole tile */
  size?: number;
  className?: string;
  title?: string;
}

/** A category's icon on a tinted rounded tile — the one rendering used everywhere a category appears. */
export const CategoryIcon: React.FC<CategoryIconProps> = ({ icon, color, size = 40, className = '', title }) => {
  const c = color || DEFAULT_CATEGORY_COLOR;
  return (
    <span
      aria-hidden="true"
      title={title}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl ${className}`}
      style={{ width: size, height: size, backgroundColor: `${c}1F`, color: c }}
    >
      {React.createElement(categoryIcon(icon), { style: { width: size * 0.5, height: size * 0.5 } })}
    </span>
  );
};
