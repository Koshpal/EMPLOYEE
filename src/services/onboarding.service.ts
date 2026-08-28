import { axiosInstance } from './api';

export type AgeGroup =
  | 'AGE_22_25' | 'AGE_26_30' | 'AGE_31_35' | 'AGE_36_40' | 'AGE_41_45' | 'AGE_45_PLUS';
export type MonthlySalaryRange =
  | 'UNDER_30K' | 'RANGE_30K_50K' | 'RANGE_50K_75K' | 'RANGE_75K_1L' | 'RANGE_1L_1_5L' | 'ABOVE_1_5L';
export type ImprovementGoal =
  | 'SAVE_MORE' | 'TRACK_SPENDING' | 'SET_GOALS' | 'MANAGE_EMIS' | 'INVEST_BETTER' | 'GET_GUIDANCE';
export type MoneyChallenge =
  | 'OVERSPENDING' | 'LOW_SAVINGS' | 'TOO_MANY_EMIS' | 'NO_TRACKING' | 'INVESTING' | 'FINANCIAL_STRESS';
export type MoneyManagementStyle =
  | 'TRACK_REGULARLY' | 'CHECK_APPS' | 'EXCEL_SHEETS' | 'FINANCE_APPS' | 'DONT_TRACK';
export type HelpNeeded =
  | 'SPENDING' | 'BUDGETING' | 'BILLS_AND_EMIS' | 'FINANCIAL_HEALTH' | 'GOALS' | 'COACHING';

export interface OnboardingProfile {
  userId: string;
  ageGroup: AgeGroup | null;
  monthlySalaryRange: MonthlySalaryRange | null;
  improvementGoals: ImprovementGoal[];
  moneyChallenges: MoneyChallenge[];
  moneyManagementStyles: MoneyManagementStyle[];
  helpNeeded: HelpNeeded[];
  isComplete: boolean;
  completedAt: string | null;
}

export interface UpdateOnboardingPayload {
  ageGroup?: AgeGroup;
  monthlySalaryRange?: MonthlySalaryRange;
  improvementGoals?: ImprovementGoal[];
  moneyChallenges?: MoneyChallenge[];
  moneyManagementStyles?: MoneyManagementStyle[];
  helpNeeded?: HelpNeeded[];
}

export const getOnboarding = async (): Promise<OnboardingProfile> => {
  const res = await axiosInstance.get('/onboarding');
  return res.data;
};

export const saveOnboarding = async (
  payload: UpdateOnboardingPayload,
): Promise<OnboardingProfile> => {
  const res = await axiosInstance.put('/onboarding', payload);
  return res.data;
};
