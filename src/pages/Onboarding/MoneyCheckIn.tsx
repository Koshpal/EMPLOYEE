import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import {
  saveOnboarding,
  type AgeGroup,
  type MonthlySalaryRange,
  type ImprovementGoal,
  type MoneyChallenge,
  type MoneyManagementStyle,
  type HelpNeeded,
  type UpdateOnboardingPayload,
} from '../../services/onboarding.service';
import { useToast } from '../../context/ToastContext';

type Opt<T extends string> = { value: T; label: string };

const AGE: Opt<AgeGroup>[] = [
  { value: 'AGE_22_25', label: '22–25' },
  { value: 'AGE_26_30', label: '26–30' },
  { value: 'AGE_31_35', label: '31–35' },
  { value: 'AGE_36_40', label: '36–40' },
  { value: 'AGE_41_45', label: '41–45' },
  { value: 'AGE_45_PLUS', label: '45+' },
];
const SALARY: Opt<MonthlySalaryRange>[] = [
  { value: 'UNDER_30K', label: 'Under ₹30k' },
  { value: 'RANGE_30K_50K', label: '₹30k–50k' },
  { value: 'RANGE_50K_75K', label: '₹50k–75k' },
  { value: 'RANGE_75K_1L', label: '₹75k–1L' },
  { value: 'RANGE_1L_1_5L', label: '₹1L–1.5L' },
  { value: 'ABOVE_1_5L', label: 'Above ₹1.5L' },
];
const GOALS: Opt<ImprovementGoal>[] = [
  { value: 'SAVE_MORE', label: 'Save more' },
  { value: 'TRACK_SPENDING', label: 'Track my spending' },
  { value: 'SET_GOALS', label: 'Set & hit money goals' },
  { value: 'MANAGE_EMIS', label: 'Manage my EMIs' },
  { value: 'INVEST_BETTER', label: 'Invest better' },
  { value: 'GET_GUIDANCE', label: 'Get expert guidance' },
];
const CHALLENGES: Opt<MoneyChallenge>[] = [
  { value: 'OVERSPENDING', label: 'Overspending' },
  { value: 'LOW_SAVINGS', label: 'Not saving enough' },
  { value: 'TOO_MANY_EMIS', label: 'Too many EMIs' },
  { value: 'NO_TRACKING', label: "I don't track anything" },
  { value: 'INVESTING', label: 'Not sure how to invest' },
  { value: 'FINANCIAL_STRESS', label: 'Money stress' },
];
const STYLES: Opt<MoneyManagementStyle>[] = [
  { value: 'TRACK_REGULARLY', label: 'I track it regularly' },
  { value: 'CHECK_APPS', label: 'I check my bank app' },
  { value: 'EXCEL_SHEETS', label: 'I use a spreadsheet' },
  { value: 'FINANCE_APPS', label: 'I use a finance app' },
  { value: "DONT_TRACK", label: "I don't really track it" },
];
const HELP: Opt<HelpNeeded>[] = [
  { value: 'SPENDING', label: 'Understanding spending' },
  { value: 'BUDGETING', label: 'Budgeting' },
  { value: 'BILLS_AND_EMIS', label: 'Bills & EMIs' },
  { value: 'FINANCIAL_HEALTH', label: 'Overall financial health' },
  { value: 'GOALS', label: 'Reaching goals' },
  { value: 'COACHING', label: '1-on-1 coaching' },
];

interface Answers {
  ageGroup?: AgeGroup;
  monthlySalaryRange?: MonthlySalaryRange;
  improvementGoals: ImprovementGoal[];
  moneyChallenges: MoneyChallenge[];
  moneyManagementStyles: MoneyManagementStyle[];
  helpNeeded: HelpNeeded[];
}

const STEP_META = [
  { title: 'How old are you?', hint: 'Helps us benchmark against people like you.' },
  { title: "What's your monthly take-home?", hint: 'Kept private — used only to tailor advice.' },
  { title: 'What would you like to improve?', hint: 'Pick all that apply.' },
  { title: "What's hardest about money right now?", hint: 'Pick all that apply.' },
  { title: 'How do you manage money today?', hint: 'Pick all that apply.' },
  { title: 'Where could you use help?', hint: 'Pick all that apply.' },
];

export default function MoneyCheckIn() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [a, setA] = useState<Answers>({
    improvementGoals: [],
    moneyChallenges: [],
    moneyManagementStyles: [],
    helpNeeded: [],
  });

  const total = STEP_META.length;

  const toggle = <T extends string>(list: T[], v: T): T[] =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const canAdvance = (() => {
    switch (step) {
      case 0: return !!a.ageGroup;
      case 1: return !!a.monthlySalaryRange;
      case 2: return a.improvementGoals.length > 0;
      case 3: return a.moneyChallenges.length > 0;
      case 4: return a.moneyManagementStyles.length > 0;
      case 5: return a.helpNeeded.length > 0;
      default: return false;
    }
  })();

  const submit = async () => {
    setSaving(true);
    try {
      const payload: UpdateOnboardingPayload = {
        ageGroup: a.ageGroup,
        monthlySalaryRange: a.monthlySalaryRange,
        improvementGoals: a.improvementGoals,
        moneyChallenges: a.moneyChallenges,
        moneyManagementStyles: a.moneyManagementStyles,
        helpNeeded: a.helpNeeded,
      };
      await saveOnboarding(payload);
      toast.success('Thanks — your check-in is saved.');
      navigate('/dashboard');
    } catch {
      toast.error('Could not save your answers. Please try again.');
      setSaving(false);
    }
  };

  const next = () => (step === total - 1 ? submit() : setStep((s) => s + 1));

  const Chips = <T extends string>({
    options,
    selected,
    onPick,
    multi,
  }: {
    options: Opt<T>[];
    selected: T[];
    onPick: (v: T) => void;
    multi: boolean;
  }) => (
    <div className="flex flex-wrap gap-2.5">
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onPick(o.value)}
            aria-pressed={on}
            className={`rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition-all ${
              on
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'border-[var(--color-border-primary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]/40'
            }`}
          >
            {on && multi && <Check className="mr-1.5 inline h-3.5 w-3.5" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-secondary)] p-4">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] p-8 shadow-xl">
        {/* header */}
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="font-heading text-sm font-bold text-[var(--color-text-primary)]">Money check-in</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Step {step + 1} of {total}</p>
          </div>
        </div>

        {/* dot progress */}
        <div className="mb-8 flex items-center gap-1.5">
          {STEP_META.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i < step
                  ? 'w-4 bg-[var(--color-primary)]'
                  : i === step
                    ? 'w-8 bg-[var(--color-primary)]'
                    : 'w-4 bg-[var(--color-bg-tertiary)]'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
              {STEP_META[step].title}
            </h1>
            <p className="mb-6 mt-1 text-sm text-[var(--color-text-secondary)]">{STEP_META[step].hint}</p>

            {step === 0 && (
              <Chips options={AGE} selected={a.ageGroup ? [a.ageGroup] : []} multi={false}
                onPick={(v) => setA({ ...a, ageGroup: v })} />
            )}
            {step === 1 && (
              <Chips options={SALARY} selected={a.monthlySalaryRange ? [a.monthlySalaryRange] : []} multi={false}
                onPick={(v) => setA({ ...a, monthlySalaryRange: v })} />
            )}
            {step === 2 && (
              <Chips options={GOALS} selected={a.improvementGoals} multi
                onPick={(v) => setA({ ...a, improvementGoals: toggle(a.improvementGoals, v) })} />
            )}
            {step === 3 && (
              <Chips options={CHALLENGES} selected={a.moneyChallenges} multi
                onPick={(v) => setA({ ...a, moneyChallenges: toggle(a.moneyChallenges, v) })} />
            )}
            {step === 4 && (
              <Chips options={STYLES} selected={a.moneyManagementStyles} multi
                onPick={(v) => setA({ ...a, moneyManagementStyles: toggle(a.moneyManagementStyles, v) })} />
            )}
            {step === 5 && (
              <Chips options={HELP} selected={a.helpNeeded} multi
                onPick={(v) => setA({ ...a, helpNeeded: toggle(a.helpNeeded, v) })} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* nav */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => (step === 0 ? navigate('/dashboard') : setStep((s) => s - 1))}
            className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 0 ? 'Skip for now' : 'Back'}
          </button>
          <button
            onClick={next}
            disabled={!canAdvance || saving}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : step === total - 1 ? 'Finish' : 'Next'}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
