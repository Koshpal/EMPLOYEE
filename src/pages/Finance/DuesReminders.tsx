import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../../components/common/Layout';
import { SummarySection, DuesReminderCard } from '../../components/dashboard/widgets';
import { SUMMARY_STYLES } from '../../components/dashboard/helpers';
import { IconBell, IconSettings2 } from '../../components/icons/figma';
import { FinanceTabs } from '../../components/finance/FinanceTabs';
import { getReminders, type Reminder } from '../../services/reminder.service';

const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

const iconBtn =
  'flex h-10 items-center justify-center rounded-[8px] border border-[var(--color-border-primary)] px-2.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors';

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function DuesReminders() {
  // The full reminder list here is only for the Summary tiles — the list itself
  // (add/complete/delete) is the existing DuesReminderCard widget, which loads
  // and manages its own state.
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getReminders()
      .then((list) => { if (!cancelled) setItems(list); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const total = items.length;
    const completed = items.filter((i) => i.isDone).length;
    const overdue = items.filter((i) => !i.isDone && i.dueDate && new Date(i.dueDate) < now && !isSameDay(new Date(i.dueDate), now)).length;
    const dueToday = items.filter((i) => !i.isDone && i.dueDate && isSameDay(new Date(i.dueDate), now)).length;
    return { total, completed, overdue, dueToday };
  }, [items]);

  const headerActions = (
    <>
      <button className={iconBtn} aria-label="Notifications"><IconBell size={20} /></button>
      <button className={iconBtn} aria-label="Settings"><IconSettings2 size={20} /></button>
    </>
  );

  const headerBelow = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <FinanceTabs active="Dues & Reminders" />
    </div>
  );

  const summaryTiles = [
    { label: 'COMPLETED', value: String(stats.completed), suffix: `/${stats.total}`, note: `${stats.total} total`, noteIcon: 'same' as const, ...SUMMARY_STYLES.spendings },
    { label: 'TOTAL REMINDERS', value: String(stats.total), note: 'This month', noteIcon: 'trend' as const, ...SUMMARY_STYLES.budget },
    { label: 'OVERDUE', value: String(stats.overdue), note: stats.overdue ? 'Needs attention' : 'All caught up', noteIcon: 'trend' as const, ...SUMMARY_STYLES.sessions },
    { label: 'DUE TODAY', value: String(stats.dueToday), note: 'This month', noteIcon: 'trend' as const, ...SUMMARY_STYLES.savings },
  ];

  return (
    <Layout title="Dues & Reminders" headerActions={headerActions} headerBelow={headerBelow}>
      <div className="flex flex-col gap-6 pb-8">
        <motion.div {...fadeUp}>
          <SummarySection tiles={summaryTiles} loading={loading} />
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="max-w-2xl">
          <DuesReminderCard />
        </motion.div>
      </div>
    </Layout>
  );
}
