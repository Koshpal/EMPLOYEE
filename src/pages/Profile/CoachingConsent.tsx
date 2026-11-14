import { useEffect, useState } from 'react';
import { Layout } from '../../components/common/Layout';
import { coachingConsentService, type ConsentState } from '../../services/coachingConsent.service';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** The employee's own control over coaching consent: give it, read exactly what they agree to, withdraw it. */
export default function CoachingConsent() {
  const [state, setState] = useState<ConsentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const load = () => coachingConsentService.get().then(setState).catch(() => setError('Could not load your coaching consent. Please try again.'));
  useEffect(() => { void load(); }, []);

  const text = state?.currentText ?? null;
  const allAccepted = !!text && text.disclosures.every((d) => accepted[d.key]);

  const grant = async () => {
    if (!text) return;
    setBusy(true); setError(null);
    try { await coachingConsentService.grant(text.id, text.disclosures.map((d) => d.key)); setAccepted({}); await load(); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Could not save your consent.'); }
    finally { setBusy(false); }
  };
  const withdraw = async () => {
    setBusy(true); setError(null);
    try { await coachingConsentService.withdraw(); setConfirmWithdraw(false); await load(); }
    catch (e: any) { setError(e?.response?.data?.message ?? 'Could not withdraw your consent.'); }
    finally { setBusy(false); }
  };

  return (
    <Layout title="Coaching consent">
      <div className="mx-auto max-w-2xl py-8">
        {error && <div role="alert" className="mb-4 rounded-xl bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error-dark)]">{error}</div>}
        {!state ? <div className="h-40 animate-pulse rounded-2xl bg-[var(--color-bg-tertiary)]" aria-busy="true" /> : state.active ? (
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Coaching consent is active</h2>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Given on {fmt(state.activeConsent!.grantedAt)} (consent text version {state.activeConsent!.textVersion}). Your coach can see your intake answers and the notes from your sessions. Your employer cannot.</p>
            {!confirmWithdraw ? (
              <button onClick={() => setConfirmWithdraw(true)} className="mt-5 rounded-lg border border-[var(--color-error)] px-4 py-2 text-sm font-medium text-[var(--color-error-dark)]">Withdraw consent</button>
            ) : (
              <div className="mt-5 rounded-xl bg-[var(--color-error-bg)] p-4 text-sm">
                <p className="text-[var(--color-text-primary)]">Your coach will immediately lose access to your information and any session in progress cannot continue. Your past session records are kept. You can give consent again at any time.</p>
                <div className="mt-3 flex gap-2">
                  <button disabled={busy} onClick={withdraw} className="rounded-lg bg-[var(--color-error)] px-4 py-2 font-medium text-white disabled:opacity-50">Yes, withdraw</button>
                  <button onClick={() => setConfirmWithdraw(false)} className="rounded-lg border border-[var(--color-border-primary)] px-4 py-2">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ) : text ? (
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{text.title}</h2>
            {text.isPlaceholder && <p className="mt-2 rounded-lg bg-[var(--color-warning-bg)] px-3 py-2 text-xs text-[var(--color-warning-darkest)]">This wording is a placeholder awaiting approval.</p>}
            <p className="mt-3 whitespace-pre-line text-sm text-[var(--color-text-secondary)]">{text.body}</p>
            <fieldset className="mt-5 flex flex-col gap-3">
              <legend className="mb-1 text-sm font-semibold text-[var(--color-text-primary)]">Please confirm each point</legend>
              {text.disclosures.map((d) => (
                <label key={d.key} className="flex items-start gap-3 text-sm text-[var(--color-text-primary)]">
                  <input type="checkbox" className="mt-0.5 h-4 w-4" checked={!!accepted[d.key]} onChange={(e) => setAccepted({ ...accepted, [d.key]: e.target.checked })} />{d.text}
                </label>
              ))}
            </fieldset>
            <button disabled={!allAccepted || busy} onClick={grant} className="mt-6 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">I agree to coaching</button>
            {state.history.some((h) => h.status === 'WITHDRAWN') && <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">You previously withdrew consent on {fmt(state.history.find((h) => h.withdrawnAt)?.withdrawnAt ?? null)}.</p>}
          </div>
        ) : (
          <div className="rounded-2xl bg-[var(--color-bg-card)] p-6 text-sm text-[var(--color-text-secondary)]">Coaching consent is not available yet. Please check back soon.</div>
        )}
      </div>
    </Layout>
  );
}
