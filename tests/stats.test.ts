import { describe, expect, it } from 'vitest';
import { normalizeHorseStatus } from '../src/lib/horseStatus';
import { summarize } from '../src/lib/stats';
import type { Horse } from '../src/lib/types';

const horse = (clientName: string, totalPrice: number, status: Horse['status']): Horse => ({
  id: Math.random().toString(36),
  name: 'x',
  clientName,
  services: [],
  serviceIds: [],
  totalPrice,
  location: '',
  registrationDate: '2026-10-30',
  status,
  createdAt: null,
  updatedAt: null,
});

describe('summarize', () => {
  it('separa dinero por ganar (en curso) y ganado (terminado)', () => {
    const s = summarize([
      horse('Ana', 41565, 'in_progress'),
      horse('Ana', 10, 'finished'),
      horse('Luis', 20, 'finished'),
      horse('Luis', 0, 'in_progress'),
    ]);
    expect(s).toMatchObject({ total: 4, inProgress: 2, finished: 2, pending: 41565, earned: 30 });
  });

  it('agrupa por cliente sin distinguir mayúsculas ni espacios', () => {
    const s = summarize([horse('Ana ', 100, 'in_progress'), horse('ana', 50, 'finished'), horse('Luis', 10, 'finished')]);
    expect(s.byClient).toEqual([
      { clientName: 'Ana', horses: 2, pending: 100, earned: 50 },
      { clientName: 'Luis', horses: 1, pending: 0, earned: 10 },
    ]);
  });

  it('sin caballos todo es cero', () => {
    expect(summarize([])).toMatchObject({ total: 0, pending: 0, earned: 0, byClient: [] });
  });
});

describe('normalizeHorseStatus (registros antiguos)', () => {
  it.each([
    ['in_progress', 'in_progress'],
    ['finished', 'finished'],
    ['active', 'in_progress'],
    ['inactive', 'finished'],
    [undefined, 'in_progress'],
  ])('%s → %s', (raw, expected) => {
    expect(normalizeHorseStatus(raw)).toBe(expected);
  });
});
