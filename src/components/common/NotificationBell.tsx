import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationService, type NotificationList } from '../../services/notifications.service';

const when = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 24 * 60) return `${Math.round(mins / 60)} h ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
};

/** In-app inbox: session reminders, cancellations, homework and coach updates. Polls while the tab is visible. */
export const NotificationBell: React.FC<{ buttonClass: string }> = ({ buttonClass }) => {
  const [data, setData] = useState<NotificationList | null>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    notificationService.list().then((d) => { setData(d); setFailed(false); }, () => setFailed(true));
  }, []);
  useEffect(() => {
    load();
    const tick = () => { if (document.visibilityState === 'visible') load(); };
    const t = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const unread = data?.unreadCount ?? 0;
  const markOne = (id: string) => {
    setData((d) => (d ? { unreadCount: Math.max(0, d.unreadCount - (d.items.find((n) => n.id === id && !n.isRead) ? 1 : 0)), items: d.items.map((n) => (n.id === id ? { ...n, isRead: true } : n)) } : d));
    notificationService.read(id).catch(load);
  };
  const markAll = () => {
    setData((d) => (d ? { unreadCount: 0, items: d.items.map((n) => ({ ...n, isRead: true })) } : d));
    notificationService.readAll().catch(load);
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={`${buttonClass} relative`} aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((o) => !o)}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-[11px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[12px] border border-[var(--color-border-primary)] bg-[var(--color-bg-card)] shadow-[var(--shadow-soft)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border-primary)] px-4 py-3">
            <span className="font-heading text-[15px] font-semibold text-[var(--color-text-primary)]">Notifications</span>
            {unread > 0 && <button type="button" onClick={markAll} className="text-[13px] font-medium text-[var(--color-primary)] hover:underline">Mark all read</button>}
          </div>
          <div className="max-h-[22rem] overflow-y-auto">
            {failed && !data ? <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-tertiary)]">Could not load notifications.</p>
              : !data?.items.length ? <p className="px-4 py-6 text-center text-[13px] text-[var(--color-text-tertiary)]">You're all caught up.</p>
              : (
                <ul>
                  {data.items.map((n) => (
                    <li key={n.id}>
                      <button type="button" onClick={() => !n.isRead && markOne(n.id)} className={`flex w-full gap-3 border-b border-[var(--color-border-primary)] px-4 py-3 text-left last:border-b-0 hover:bg-[var(--color-bg-secondary)] ${n.isRead ? '' : 'bg-[var(--color-primary)]/5'}`}>
                        <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-[var(--color-primary)]'}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[14px] font-medium text-[var(--color-text-primary)]">{n.title}</span>
                          <span className="block text-[13px] text-[var(--color-text-secondary)]">{n.message}</span>
                          <span className="mt-1 block text-[12px] text-[var(--color-text-tertiary)]">{when(n.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
