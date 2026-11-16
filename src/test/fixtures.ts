import type { Category } from '../types/spending.types';
import type { Budget } from '../types/finance.types';

export const cat = (over: Partial<Category> & Pick<Category, 'id' | 'name'>): Category => ({
  type: 'EXPENSE', icon: 'tag', color: '#334EAC', isDefault: false, isActive: true, sortOrder: 0, templateId: null,
  subCategoryCount: 0, subCategories: [], ...over,
});

export const sub = (categoryId: string, id: string, name: string, isActive = true) => ({ id, categoryId, name, icon: null, isActive, sortOrder: 0, templateId: null });

export const FOOD = cat({ id: 'c-food', name: 'Food & Dining', sortOrder: 1, subCategories: [sub('c-food', 's-groc', 'Groceries'), sub('c-food', 's-out', 'Eating out')] });
export const TRAVEL = cat({ id: 'c-travel', name: 'Transport', sortOrder: 2, subCategories: [sub('c-travel', 's-fuel', 'Fuel')] });
export const OLD = cat({ id: 'c-old', name: 'Gym', isActive: false, sortOrder: 3 });
export const SALARY = cat({ id: 'c-sal', name: 'Salary', type: 'INCOME' });

const iso = (d: string) => new Date(`${d}T00:00:00`).toISOString();
export const FOOD_BUDGET: Budget = {
  id: 'b-food', title: 'Food plan', amount: 10000, period: 'MONTHLY', startDate: iso('2020-01-01'), endDate: null, budgetType: 'RECURRING', isActive: true,
  categories: [{ id: 'bl-food', name: 'Food & Dining', iconResId: null, colorHex: '#f60', parentCategoryId: null, allottedAmount: 10000, categoryId: 'c-food', scopedToSubCategories: false }],
};

export const MULTI_BUDGET: Budget = {
  id: 'b-multi', title: 'Monthly Budget', amount: 20000, period: 'MONTHLY', startDate: iso('2020-01-01'), endDate: null, budgetType: 'RECURRING', isActive: true,
  categories: [
    { id: 'bl-m-food', name: 'Food & Dining', iconResId: null, colorHex: '#f60', parentCategoryId: null, allottedAmount: 10000, categoryId: 'c-food', scopedToSubCategories: false },
    { id: 'bl-m-home', name: 'Housing', iconResId: null, colorHex: '#06f', parentCategoryId: null, allottedAmount: 10000, categoryId: 'c-home', scopedToSubCategories: false },
  ],
};
