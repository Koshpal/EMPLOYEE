import { axiosInstance } from './api';
import type { TransactionStreamEvent } from '../types/finance.types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export type StreamStatus = 'connecting' | 'live' | 'reconnecting' | 'offline';

interface StreamHandlers {
  onEvent: (event: TransactionStreamEvent) => void;
  onStatusChange?: (status: StreamStatus) => void;
}

const EVENT_NAMES = [
  'transaction.created',
  'transaction.updated',
  'transaction.deleted',
  'transaction.resync',
];

/**
 * Thin wrapper around `EventSource` for the transaction change feed.
 *
 * - Auth rides on the httpOnly cookie (`withCredentials: true`).
 * - The server closes the stream every ~10 min; that surfaces as `onerror`,
 *   which we treat as a normal reconnect (with one silent token refresh first,
 *   in case the access token expired).
 * - Exponential backoff, capped at 30s. After a few failures we report
 *   `offline` but keep trying — the hook's REST catch-up fills any gap once we
 *   reconnect.
 */
export class TransactionStream {
  private es: EventSource | null = null;
  private closed = false;
  private attempt = 0;
  private refreshedThisCycle = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handlers: StreamHandlers;

  constructor(handlers: StreamHandlers) {
    this.handlers = handlers;
  }

  start(): void {
    this.closed = false;
    this.connect();
  }

  stop(): void {
    this.closed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.es?.close();
    this.es = null;
  }

  private setStatus(status: StreamStatus): void {
    this.handlers.onStatusChange?.(status);
  }

  private connect(): void {
    if (this.closed) return;
    this.setStatus(this.attempt === 0 ? 'connecting' : 'reconnecting');

    const es = new EventSource(`${BASE_URL}/transactions/stream`, {
      withCredentials: true,
    });
    this.es = es;

    const handleMessage = (e: MessageEvent) => {
      this.attempt = 0;
      this.refreshedThisCycle = false;
      this.setStatus('live');
      try {
        this.handlers.onEvent(JSON.parse(e.data) as TransactionStreamEvent);
      } catch {
        /* ignore malformed frame */
      }
    };

    EVENT_NAMES.forEach((name) =>
      es.addEventListener(name, handleMessage as EventListener),
    );

    es.onopen = () => {
      this.attempt = 0;
      this.setStatus('live');
    };

    es.onerror = async () => {
      es.close();
      this.es = null;
      if (this.closed) return;

      // The access token may have expired mid-stream — try one silent refresh
      // before backing off so a routine token rotation doesn't look like an
      // outage.
      if (!this.refreshedThisCycle) {
        this.refreshedThisCycle = true;
        try {
          await axiosInstance.post('/auth/refresh', {});
        } catch {
          /* refresh failed — the 401 handler elsewhere will redirect if needed */
        }
      }

      const delay = Math.min(1000 * 2 ** this.attempt, 30_000);
      this.attempt += 1;
      this.setStatus(this.attempt > 3 ? 'offline' : 'reconnecting');
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };
  }
}
