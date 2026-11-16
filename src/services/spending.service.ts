import { axiosInstance } from './api';
import { rangeParams } from '../utils/range';
import type {
  BudgetDetailInsight,
  BudgetsInsight,
  CategoriesInsight,
  CategoryDetailInsight,
  CategoryType,
  Granularity,
  ObservationsResponse,
  OverviewInsight,
  RangeSelection,
  TrendsInsight,
} from '../types/spending.types';

/** Spending insights. Every figure shown in the UI comes from these endpoints — never recomputed client-side. */

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v);
  return p.toString();
};

export const getOverviewInsight = async (sel: RangeSelection) =>
  (await axiosInstance.get<OverviewInsight>(`/insights/overview?${qs(rangeParams(sel))}`)).data;

export const getCategoriesInsight = async (sel: RangeSelection, type: CategoryType = 'EXPENSE') =>
  (await axiosInstance.get<CategoriesInsight>(`/insights/categories?${qs({ ...rangeParams(sel), type })}`)).data;

export const getCategoryDetailInsight = async (id: string, sel: RangeSelection) =>
  (await axiosInstance.get<CategoryDetailInsight>(`/insights/categories/${id}?${qs(rangeParams(sel))}`)).data;

export const getBudgetsInsight = async () => (await axiosInstance.get<BudgetsInsight>('/insights/budgets')).data;

export const getBudgetDetailInsight = async (id: string) =>
  (await axiosInstance.get<BudgetDetailInsight>(`/insights/budgets/${id}`)).data;

export const getTrendsInsight = async (
  sel: RangeSelection,
  opts: { granularity: Granularity; categoryId?: string; subCategoryId?: string; groupBy?: 'none' | 'category'; type?: CategoryType },
) =>
  (
    await axiosInstance.get<TrendsInsight>(
      `/insights/trends?${qs({
        ...rangeParams(sel),
        granularity: opts.granularity,
        categoryId: opts.categoryId,
        subCategoryId: opts.subCategoryId,
        groupBy: opts.groupBy,
        type: opts.type,
      })}`,
    )
  ).data;

export const getObservations = async (sel: RangeSelection) =>
  (await axiosInstance.get<ObservationsResponse>(`/insights/ai?${qs(rangeParams(sel))}`)).data;
