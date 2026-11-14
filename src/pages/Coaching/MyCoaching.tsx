import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout } from '../../components/common/Layout';
import { apiMessage, coachingOpsService, type HomeworkItem, type SharedResult } from '../../services/coachingOps.service';

type Tab = 'shared' | 'homework' | 'reminders';
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const TITLES: Record<string, string> = { EMERGENCY_FUND: 'Emergency fund', DEBT_PAYOFF: 'Debt payoff plan', EMI: 'Loan EMI', SIP: 'SIP growth', GOAL_SAVING: 'Goal saving', NET_WORTH: 'Net worth', BUDGET_SPLIT: 'Budget split', INSURANCE_COVER: 'Life cover estimate', TAX_COMPARE: 'Tax regime comparison' };

const Values = ({ value }: { value: any }) => {
  if (Array.isArray(value)) return <ul className="flex flex-col gap-1">{value.map((v, i) => <li key={i} className="rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2"><Values value={v} /></li>)}</ul>;
  if (value && typeof value === 'object') return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">{Object.entries(value).map(([k, v]) => <div key={k} className="contents"><dt className="text-sm text-[var(--color-text-tertiary)]">{human(k)}</dt><dd className="text-sm font-medium text-[var(--color-text-primary)]"><Values value={v} /></dd></div>)}</dl>;
  return <span>{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value == null ? '—' : String(value)}</span>;
};

function Shared() {
  const [items, setItems] = useState<SharedResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const since = useRef<string | undefined>(undefined);

  const load = useCallback(async (full = false) => {
    try {
      const r = await coachingOpsService.workspace(full ? undefined : since.current);
      since.current = r.serverTime;
      setItems((cur) => {
        if (full || !cur) return r.items;
        const byId = new Map(cur.map((i) => [i.id, i]));
        r.items.forEach((i) => byId.set(i.id, i));
        return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      });
      setError(null);
    } catch (e) { setError(apiMessage(e)); }
  }, []);
  // The coach can change numbers during a live session: poll lightly, only while the tab is visible.
  useEffect(() => { void load(true); const t = setInterval(() => { if (document.visibilityState === 'visible') void load(true); }, 8000); return () => clearInterval(t); }, [load]);

  const confirm = async (r: SharedResult) => {
    setBusy(r.id);
    try { await coachingOpsService.confirm(r.id, r.version); await load(true); } catch (e: any) { setError(apiMessage(e)); if (e?.response?.status === 409 || e?.response?.status === 404) await load(true); } finally { setBusy(null); }
  };
  if (!items) return error ? <p role="alert" className="text-sm text-[var(--color-error-dark)]">{error}</p> : <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />;
  return (
    <div className="flex flex-col gap-4">
      {error && <p role="alert" className="rounded-xl bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error-dark)]">{error}</p>}
      {!items.length ? <p className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-sm text-[var(--color-text-secondary)]">Calculations your coach shares during a session will appear here. Nothing is shared with anyone else.</p> : items.map((r) => (
        <section key={r.id} className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="text-base font-semibold text-[var(--color-text-primary)]">{TITLES[r.tool] ?? human(r.tool)}</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === 'CONFIRMED' ? 'bg-[var(--color-success-bg)] text-[var(--color-success-darkest)]' : 'bg-[var(--color-info-bg)] text-[var(--color-primary)]'}`}>{r.status === 'CONFIRMED' ? `Confirmed ${fmtDate(r.confirmedAt)}` : 'Waiting for your confirmation'}</span></div>
          <Values value={r.outputs} />
          <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">These are estimates to support your discussion, not financial, tax or legal advice.</p>
          {r.status === 'SHARED' && <button disabled={busy === r.id} onClick={() => confirm(r)} className="mt-3 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">These numbers look right</button>}
        </section>))}
    </div>
  );
}

function Worksheet({ hw, onChanged }: { hw: HomeworkItem; onChanged: () => void }) {
  const locked = hw.status === 'SUBMITTED' || hw.status === 'REVIEWED';
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(hw.template.fields.map((f) => [f.key, hw.answers[f.key] != null ? String(hw.answers[f.key]) : ''])));
  const [saved, setSaved] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dirty = useRef(false);

  // autosave a draft shortly after the last keystroke
  useEffect(() => {
    if (locked || !dirty.current) return;
    const t = setTimeout(() => { coachingOpsService.saveDraft(hw.id, vals).then(() => { setSaved(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })); setErr(null); }).catch((e) => setErr(apiMessage(e))); }, 1200);
    return () => clearTimeout(t);
  }, [vals, locked, hw.id]);
  const set = (k: string, v: string) => { dirty.current = true; setVals((s) => ({ ...s, [k]: v })); };
  const submit = async () => { setBusy(true); setErr(null); try { await coachingOpsService.submit(hw.id, vals); onChanged(); } catch (e) { setErr(apiMessage(e)); } finally { setBusy(false); } };
  const missing = hw.template.fields.filter((f) => f.required && !vals[f.key]?.trim());

  return (
    <section className="worksheet rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h3 className="text-base font-semibold text-[var(--color-text-primary)]">{hw.template.title}</h3>
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">{hw.status === 'REVIEWED' ? 'Reviewed' : hw.status === 'SUBMITTED' ? 'Submitted' : hw.dueDate ? `Due ${fmtDate(hw.dueDate)}` : 'No due date'}</span></div>
      {hw.template.description && <p className="text-sm text-[var(--color-text-secondary)]">{hw.template.description}</p>}
      {hw.instructions && <p className="mt-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">{hw.instructions}</p>}
      <div className="mt-4 flex flex-col gap-4">
        {hw.template.fields.map((f) => (
          <label key={f.key} className="flex flex-col gap-1.5 text-sm"><span className="font-medium text-[var(--color-text-primary)]">{f.label}{f.required ? ' *' : ''}</span>
            {f.type === 'longtext' ? <textarea disabled={locked} rows={4} maxLength={4000} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 disabled:bg-[var(--color-bg-secondary)]" />
              : <input disabled={locked} inputMode={f.type === 'number' ? 'decimal' : undefined} maxLength={300} value={vals[f.key]} onChange={(e) => set(f.key, e.target.value)} className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 disabled:bg-[var(--color-bg-secondary)]" />}</label>))}
      </div>
      {hw.reviewNote && <p className="mt-4 rounded-lg bg-[var(--color-success-bg)] px-3 py-2 text-sm text-[var(--color-success-darkest)]"><strong>Coach feedback:</strong> {hw.reviewNote}</p>}
      {err && <p role="alert" className="mt-3 text-sm text-[var(--color-error-dark)]">{err}</p>}
      <div className="no-print mt-4 flex flex-wrap items-center gap-3">
        {!locked && <button disabled={busy || missing.length > 0} onClick={submit} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Submit to my coach</button>}
        <button onClick={() => window.print()} className="rounded-lg border border-[var(--color-border-primary)] px-4 py-2 text-sm font-medium">Print</button>
        {!locked && <span className="text-xs text-[var(--color-text-tertiary)]">{saved ? `Draft saved ${saved}` : missing.length ? `${missing.length} required answer${missing.length > 1 ? 's' : ''} left` : 'Your answers save automatically'}</span>}
      </div>
    </section>
  );
}

function Homework() {
  const [items, setItems] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(() => coachingOpsService.homework().then((r) => { setItems(r); setError(null); }).catch((e) => setError(apiMessage(e))), []);
  useEffect(() => { void load(); }, [load]);
  if (!items) return error ? <p role="alert" className="text-sm text-[var(--color-error-dark)]">{error}</p> : <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />;
  if (!items.length) return <p className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-sm text-[var(--color-text-secondary)]">No homework right now. Your coach will assign worksheets after your sessions.</p>;
  return <div className="flex flex-col gap-4">{items.map((h) => <Worksheet key={h.id} hw={h} onChanged={load} />)}</div>;
}

function Reminders() {
  const [p, setP] = useState<{ homeworkReminders: boolean; sessionReminders: boolean } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { coachingOpsService.preferences().then(setP).catch((e) => setErr(apiMessage(e))); }, []);
  const toggle = async (k: 'homeworkReminders' | 'sessionReminders') => { if (!p) return; const next = { ...p, [k]: !p[k] }; setP(next); try { await coachingOpsService.setPreferences({ [k]: next[k] }); } catch (e) { setP(p); setErr(apiMessage(e)); } };
  return (
    <section className="rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-sm">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Reminders</h3>
      {err && <p role="alert" className="mt-2 text-sm text-[var(--color-error-dark)]">{err}</p>}
      {!p ? <div className="mt-3 h-16 animate-pulse rounded-lg bg-[var(--color-bg-tertiary)]" /> : (
        <div className="mt-3 flex flex-col gap-3">
          {([['homeworkReminders', 'Remind me about homework that is due'], ['sessionReminders', 'Remind me before my coaching sessions']] as const).map(([k, text]) => (
            <label key={k} className="flex items-center justify-between gap-4 text-sm text-[var(--color-text-primary)]">{text}<input type="checkbox" role="switch" className="h-5 w-5" checked={p[k]} onChange={() => toggle(k)} /></label>))}
        </div>)}
    </section>
  );
}

/** Everything coaching-related the employee can see or do, in one place. */
export default function MyCoaching() {
  const [tab, setTab] = useState<Tab>('shared');
  const tabs: [Tab, string][] = [['shared', 'Shared with you'], ['homework', 'Homework'], ['reminders', 'Reminders']];
  return (
    <Layout title="My coaching">
      <style>{`@media print { .no-print, aside, header, nav { display: none !important; } .worksheet { box-shadow: none !important; break-inside: avoid; } }`}</style>
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-6">
        <div role="tablist" className="no-print flex gap-1 rounded-xl bg-[var(--color-bg-tertiary)] p-1">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${tab === k ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>{l}</button>)}
        </div>
        {tab === 'shared' ? <Shared /> : tab === 'homework' ? <Homework /> : <Reminders />}
      </div>
    </Layout>
  );
}
