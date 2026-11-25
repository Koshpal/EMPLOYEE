import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/common/Layout';
import { apiMessage, coachingOpsService, type ActionItemRow, type CoachingOverview, type HomeworkItem, type RoadmapSession, type SharedResult, type WorksheetField } from '../../services/coachingOps.service';

type Tab = 'overview' | 'actions' | 'shared' | 'homework' | 'reminders';
const fmtWhen = (iso: string) => new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const human = (k: string) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());
const TITLES: Record<string, string> = { EMERGENCY_FUND: 'Emergency fund', DEBT_PAYOFF: 'Debt payoff plan', EMI: 'Loan EMI', SIP: 'SIP growth', GOAL_SAVING: 'Goal saving', NET_WORTH: 'Net worth', BUDGET_SPLIT: 'Budget split', INSURANCE_COVER: 'Life cover estimate', TAX_COMPARE: 'Tax regime comparison' };

const Values = ({ value }: { value: unknown }) => {
  if (Array.isArray(value)) return <ul className="flex flex-col gap-1">{value.map((v, i) => <li key={i} className="rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2"><Values value={v} /></li>)}</ul>;
  if (value && typeof value === 'object') return <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">{Object.entries(value).map(([k, v]) => <div key={k} className="contents"><dt className="text-sm text-[var(--color-text-tertiary)]">{human(k)}</dt><dd className="text-sm font-medium text-[var(--color-text-primary)]"><Values value={v} /></dd></div>)}</dl>;
  return <span>{typeof value === 'number' ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : value == null ? '—' : String(value)}</span>;
};


const card = 'rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-sm';

/** The programme at a glance: what each session is for and the one thing to do between sessions. Never shows the coach's script. */
function Roadmap({ sessions }: { sessions: RoadmapSession[] }) {
  if (!sessions.length) return null;
  const badge = (st: RoadmapSession['state']) => st === 'DONE'
    ? <span className="rounded-full bg-[var(--color-success-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-success-darkest)]">Done</span>
    : st === 'NEXT' ? <span className="rounded-full bg-[var(--color-info-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">Up next</span>
    : <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">Coming up</span>;
  return (
    <section className={card} aria-label="Your programme">
      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Your programme</h3>
      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Each session is about {sessions[0].minutes} minutes, with one small task to do afterwards.</p>
      <ol className="mt-3 flex flex-col gap-3">
        {sessions.map((s) => (
          <li key={s.sessionNumber} className={`rounded-xl border p-4 ${s.state === 'NEXT' ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-primary)]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Session {s.sessionNumber} · {s.title}</p>{badge(s.state)}
            </div>
            {s.theme && <p className="mt-1 text-sm italic text-[var(--color-text-secondary)]">“{s.theme}”</p>}
            {s.summary && <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{s.summary}</p>}
            {s.homework && <p className="mt-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text-primary)]"><strong>After this session:</strong> {s.homework}</p>}
          </li>))}
      </ol>
      <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">What you share with your coach stays private. Your company only sees overall usage numbers, never your details.</p>
    </section>
  );
}

function Overview({ data, error, go }: { data: CoachingOverview | null; error: string | null; go: (t: Tab) => void }) {
  if (!data) return error ? <p role="alert" className="text-sm text-[var(--color-error-dark)]">{error}</p> : <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />;
  if (!data.enrolled || !data.coach) {
    return <section className={card}><h3 className="text-base font-semibold text-[var(--color-text-primary)]">Coaching programme</h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">You are not on a coaching programme yet. Once your organisation assigns you a coach, your progress, sessions and action plan will appear here.</p>
      <Link to="/coaches" className="mt-4 inline-block rounded-lg border border-[var(--color-border-primary)] px-4 py-2 text-sm font-medium">Browse coaches</Link></section>;
  }
  const p = data.program;
  const pct = p && p.totalSessions ? Math.min(100, Math.round((p.sessionsCompleted / p.totalSessions) * 100)) : 0;
  const t = data.todo;
  const todo = ([
    { n: t.overdueActionItems, text: 'overdue action item', tab: 'actions' },
    { n: t.openActionItems - t.overdueActionItems, text: 'action item to do', tab: 'actions' },
    { n: t.homework, text: 'homework worksheet to complete', tab: 'homework' },
    { n: t.resultsToConfirm, text: 'calculation to confirm', tab: 'shared' },
  ] as { n: number; text: string; tab: Tab }[]).filter((x) => x.n > 0);
  return (
    <div className="flex flex-col gap-4">
      {!data.consentActive && (
        <div role="alert" className="rounded-2xl border border-[var(--color-warning)] bg-[var(--color-warning-bg,transparent)] p-4 text-sm text-[var(--color-text-primary)]">
          <strong>Coaching consent is needed.</strong> Your coach cannot start a session or see your information until you accept it. <Link className="font-semibold text-[var(--color-primary)] underline" to="/coaching-consent">Review consent</Link>
        </div>)}
      <section className={card}>
        <div className="flex items-center gap-4">
          {data.coach.photo ? <img src={data.coach.photo} alt="" className="h-14 w-14 rounded-full object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-lightest)] text-lg font-bold text-[var(--color-primary)]">{data.coach.name.charAt(0).toUpperCase()}</div>}
          <div className="min-w-0 flex-1"><p className="text-xs uppercase tracking-wide text-[var(--color-text-tertiary)]">Your coach</p><p className="truncate text-base font-semibold text-[var(--color-text-primary)]">{data.coach.name}</p></div>
        </div>
        {p && <div className="mt-4"><div className="mb-1 flex justify-between text-sm text-[var(--color-text-secondary)]"><span>{p.name}</span><span>{p.status === 'COMPLETED' ? 'Completed' : `${p.sessionsCompleted} of ${p.totalSessions || '?'} sessions done`}</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-tertiary)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="h-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} /></div></div>}
      </section>
      <section className={card}>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Next session</h3>
        {data.nextBooking ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--color-text-primary)]">{p?.nextSessionNumber ? `Session ${p.nextSessionNumber} · ` : ''}{fmtWhen(data.nextBooking.slotStart)} IST</p>
            <div className="flex gap-2">{data.nextBooking.meetingLink && <a href={data.nextBooking.meetingLink} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Join link</a>}<Link to="/sessions" className="rounded-lg border border-[var(--color-border-primary)] px-4 py-2 text-sm font-medium">Manage</Link></div></div>
        ) : data.needsToBook ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-[var(--color-text-secondary)]">{p?.nextSessionNumber ? `Session ${p.nextSessionNumber} is not booked yet.` : 'No session is booked.'}</p><Link to={`/coaches?coach=${data.coach.id}`} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Book with {data.coach.name.split(' ')[0]}</Link></div>
        ) : <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{p?.status === 'COMPLETED' ? 'You have completed every session of the programme.' : 'Nothing booked.'}</p>}
        {data.lastSession?.completedAt && <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Last completed: session {data.lastSession.sessionNumber}, {fmtDate(data.lastSession.completedAt)}</p>}
      </section>
      <section className={card}>
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">What needs you</h3>
        {!todo.length ? <p className="mt-2 text-sm text-[var(--color-text-secondary)]">You are all caught up.</p> : (
          <ul className="mt-2 flex flex-col gap-1">{todo.map((x) => <li key={x.text}><button onClick={() => go(x.tab)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-secondary)]"><span><strong>{x.n}</strong> {x.text}{x.n > 1 ? 's' : ''}</span><span aria-hidden className="text-[var(--color-text-tertiary)]">›</span></button></li>)}</ul>)}
      </section>
      {p && <Roadmap sessions={p.roadmap ?? []} />}
    </div>
  );
}

function ActionPlan({ onChanged, next }: { onChanged: () => void; next: CoachingOverview['nextBooking'] | undefined }) {
  const [items, setItems] = useState<ActionItemRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => coachingOpsService.actionItems().then((r) => { setItems(r); setError(null); }).catch((e) => setError(apiMessage(e))), []);
  useEffect(() => { void load(); }, [load]);
  const toggle = async (i: ActionItemRow) => {
    setBusy(i.id);
    try { await coachingOpsService.setActionItemDone(i.id, i.status !== 'COMPLETED'); await load(); onChanged(); } catch (e) { setError(apiMessage(e)); } finally { setBusy(null); }
  };
  if (!items) return error ? <p role="alert" className="text-sm text-[var(--color-error-dark)]">{error}</p> : <div className="h-32 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" />;
  if (!items.length) return <p className={`${card} text-sm text-[var(--color-text-secondary)]`}>Your coach will record the steps you agree on after each session, and they will appear here.</p>;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-[var(--color-text-secondary)]">{next ? <>Our next session: <strong className="text-[var(--color-text-primary)]">{fmtWhen(next.slotStart)} IST</strong></> : 'Our next session: not booked yet.'} Tick a step when you have done it.</p>
      {error && <p role="alert" className="rounded-xl bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error-dark)]">{error}</p>}
      <ul className="flex flex-col gap-3">
        {items.map((i) => (
          <li key={i.id} className={`${card} flex items-start gap-3`}>
            {i.canUpdate ? <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" aria-label={`Mark "${i.title}" ${i.status === 'COMPLETED' ? 'not done' : 'done'}`} checked={i.status === 'COMPLETED'} disabled={busy === i.id} onChange={() => toggle(i)} /> : <span aria-hidden className="mt-1 h-5 w-5 shrink-0 rounded-full border border-[var(--color-border-primary)]" />}
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-medium ${i.status === 'COMPLETED' ? 'text-[var(--color-text-tertiary)] line-through' : 'text-[var(--color-text-primary)]'}`}>{i.title}</p>
              {i.description && <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">{i.description}</p>}
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                <span>Session {i.sessionNumber}</span>
                {i.ownerType === 'COACH' && <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5">Your coach is doing this</span>}
                {i.dueDate && <span className={i.overdue ? 'font-semibold text-[var(--color-error-dark)]' : ''}>{i.overdue ? 'Overdue · ' : 'Due '}{fmtDate(i.dueDate)}</span>}
                {i.status === 'COMPLETED' && i.completedAt && <span>Done {fmtDate(i.completedAt)}</span>}
                {i.status === 'NOT_COMPLETED' && <span>Marked not done by your coach</span>}
              </p>
            </div>
          </li>))}
      </ul>
    </div>
  );
}

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
    try { await coachingOpsService.confirm(r.id, r.version); await load(true); } catch (e) { setError(apiMessage(e)); const status = (e as { response?: { status?: number } })?.response?.status; if (status === 409 || status === 404) await load(true); } finally { setBusy(null); }
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

/** One worksheet question. Choice and scale questions are tap-to-answer buttons (quick on a phone); the rest are text inputs. */
function Question({ f, value, locked, onChange }: { f: WorksheetField; value: string; locked: boolean; onChange: (v: string) => void }) {
  const title = <span className="font-medium text-[var(--color-text-primary)]">{f.label}{f.required ? ' *' : ''}</span>;
  const help = f.help ? <span className="text-xs text-[var(--color-text-tertiary)]">{f.help}</span> : null;
  const field = 'rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] px-3 py-2 disabled:bg-[var(--color-bg-secondary)]';
  if (f.type === 'choice' || f.type === 'scale') {
    const options = f.type === 'scale' ? ['1', '2', '3', '4', '5'] : f.options ?? [];
    return (
      <div role="group" aria-label={f.label} className="flex flex-col gap-1.5 text-sm">{title}{help}
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button key={o} type="button" disabled={locked} aria-pressed={value === o} onClick={() => onChange(value === o ? '' : o)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:cursor-default ${f.type === 'scale' ? 'min-w-[44px]' : ''} ${value === o ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-border-primary)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)] disabled:hover:border-[var(--color-border-primary)]'}`}>{o}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <label className="flex flex-col gap-1.5 text-sm">{title}{help}
      {f.type === 'longtext'
        ? <textarea disabled={locked} rows={4} maxLength={4000} value={value} onChange={(e) => onChange(e.target.value)} className={field} />
        : <input disabled={locked} inputMode={f.type === 'number' ? 'decimal' : undefined} maxLength={300} value={value} onChange={(e) => onChange(e.target.value)} className={field} />}
    </label>
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
  const answered = hw.template.fields.filter((f) => vals[f.key]?.trim()).length;

  return (
    <section className="worksheet rounded-2xl bg-[var(--color-bg-card)] p-5 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2"><h3 className="text-base font-semibold text-[var(--color-text-primary)]">{hw.template.title}</h3>
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-secondary)]">{hw.status === 'REVIEWED' ? 'Reviewed' : hw.status === 'SUBMITTED' ? 'Submitted' : hw.dueDate ? `Due ${fmtDate(hw.dueDate)}` : 'No due date'}</span></div>
      {hw.template.description && <p className="text-sm text-[var(--color-text-secondary)]">{hw.template.description}</p>}
      {hw.instructions && <p className="mt-2 rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2 text-sm">{hw.instructions}</p>}
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{hw.template.estimatedMinutes ? `About ${hw.template.estimatedMinutes} min · ` : ''}{answered} of {hw.template.fields.length} answered</p>
      <div className="mt-4 flex flex-col gap-5">
        {hw.template.fields.map((f) => <Question key={f.key} f={f} value={vals[f.key] ?? ''} locked={locked} onChange={(v) => set(f.key, v)} />)}
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
  const [params, setParams] = useSearchParams();
  const initial = (params.get('tab') as Tab | null) ?? 'overview';
  const [tab, setTabState] = useState<Tab>(['overview', 'actions', 'shared', 'homework', 'reminders'].includes(initial) ? initial : 'overview');
  const [overview, setOverview] = useState<CoachingOverview | null>(null);
  const [ovError, setOvError] = useState<string | null>(null);
  const loadOverview = useCallback(() => coachingOpsService.overview().then((o) => { setOverview(o); setOvError(null); }).catch((e) => setOvError(apiMessage(e))), []);
  useEffect(() => { void loadOverview(); }, [loadOverview]);
  const setTab = (t: Tab) => { setTabState(t); setParams(t === 'overview' ? {} : { tab: t }, { replace: true }); if (t === 'overview') void loadOverview(); };

  const count = (n?: number) => (n ? ` (${n})` : '');
  const todo = overview?.todo;
  const tabs: [Tab, string][] = [
    ['overview', 'Overview'], ['actions', `Action plan${count(todo?.openActionItems)}`], ['shared', `Shared with you${count(todo?.resultsToConfirm)}`],
    ['homework', `Homework${count(todo?.homework)}`], ['reminders', 'Reminders'],
  ];
  return (
    <Layout title="My coaching">
      <style>{`@media print { .no-print, aside, header, nav { display: none !important; } .worksheet { box-shadow: none !important; break-inside: avoid; } }`}</style>
      <div className="mx-auto flex max-w-3xl flex-col gap-5 py-6">
        <div role="tablist" className="no-print flex gap-1 overflow-x-auto rounded-xl bg-[var(--color-bg-tertiary)] p-1">
          {tabs.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${tab === k ? 'bg-[var(--color-bg-card)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-secondary)]'}`}>{l}</button>)}
        </div>
        {tab === 'overview' ? <Overview data={overview} error={ovError} go={setTab} /> : tab === 'actions' ? <ActionPlan onChanged={loadOverview} next={overview?.nextBooking} /> : tab === 'shared' ? <Shared /> : tab === 'homework' ? <Homework /> : <Reminders />}
      </div>
    </Layout>
  );
}
