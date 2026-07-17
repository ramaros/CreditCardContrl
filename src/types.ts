export type CardBrand = 'visa' | 'mastercard' | 'elo' | 'amex' | 'other';

export interface Card {
  id: string;
  name: string;
  brand: CardBrand;
  closingDay?: number;
  dueDay: number;
  limit?: number;
  color: string; // Tailwind gradient or color key
}

export interface Purchase {
  id: string;
  description: string;
  totalValue: number;
  installmentsCount: number;
  startMonth: string; // Format: "YYYY-MM"
  cardId: string;
  category?: string;
  createdAt: string;
  paidInstallments?: number[]; // Installment numbers (1-indexed) that are marked as paid
}

export interface InstallmentInfo {
  purchaseId: string;
  purchaseDescription: string;
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  month: string; // Format: "YYYY-MM"
  cardId: string;
  category?: string;
  isPaid?: boolean;
}

export interface AppData {
  cards: Card[];
  purchases: Purchase[];
}

export const CATEGORIES = [
  { name: 'Alimentação', color: '#f59e0b', icon: 'Utensils' },
  { name: 'Tecnologia', color: '#3b82f6', icon: 'Laptop' },
  { name: 'Eletrodomésticos', color: '#ef4444', icon: 'Tv' },
  { name: 'Lazer & Viagem', color: '#10b981', icon: 'Palmtree' },
  { name: 'Vestuário', color: '#ec4899', icon: 'Shirt' },
  { name: 'Transporte', color: '#6366f1', icon: 'Car' },
  { name: 'Serviços/Assinaturas', color: '#8b5cf6', icon: 'CreditCard' },
  { name: 'Saúde', color: '#14b8a6', icon: 'Activity' },
  { name: 'Outros', color: '#64748b', icon: 'HelpCircle' },
];

export const CARD_COLORS = [
  { name: 'Nubank Roxo', class: 'from-purple-600 to-indigo-700', bg: '#820ad1' },
  { name: 'Inter Laranja', class: 'from-orange-500 to-amber-600', bg: '#ff7a00' },
  { name: 'Black Grafite', class: 'from-neutral-800 to-neutral-950', bg: '#1c1c1c' },
  { name: 'Azul Premium', class: 'from-blue-600 to-cyan-700', bg: '#0284c7' },
  { name: 'Verde Esmeralda', class: 'from-emerald-600 to-teal-700', bg: '#0d9488' },
  { name: 'Rosa Magenta', class: 'from-pink-500 to-rose-600', bg: '#db2777' },
  { name: 'Gold Real', class: 'from-yellow-500 to-amber-600', bg: '#d97706' },
];
