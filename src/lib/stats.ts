import { sumCents } from './money';
import type { Cents, Horse } from './types';

export interface ClientSummary {
  clientName: string;
  horses: number;
  pending: Cents;
  earned: Cents;
}

export interface Summary {
  total: number;
  inProgress: number;
  finished: number;
  /** Dinero por ganar: suma de los totales de caballos en curso. */
  pending: Cents;
  /** Dinero ganado: suma de los totales de caballos terminados. */
  earned: Cents;
  byClient: ClientSummary[];
}

export function summarize(horses: Horse[]): Summary {
  const inProgress = horses.filter((h) => h.status === 'in_progress');
  const finished = horses.filter((h) => h.status === 'finished');

  const clients = new Map<string, ClientSummary>();
  for (const h of horses) {
    const key = h.clientName.trim().toLocaleLowerCase('es');
    const c = clients.get(key) ?? { clientName: h.clientName.trim(), horses: 0, pending: 0, earned: 0 };
    c.horses += 1;
    if (h.status === 'finished') c.earned += h.totalPrice;
    else c.pending += h.totalPrice;
    clients.set(key, c);
  }

  return {
    total: horses.length,
    inProgress: inProgress.length,
    finished: finished.length,
    pending: sumCents(inProgress.map((h) => ({ price: h.totalPrice }))),
    earned: sumCents(finished.map((h) => ({ price: h.totalPrice }))),
    byClient: [...clients.values()].sort((a, b) => b.pending + b.earned - (a.pending + a.earned)),
  };
}
