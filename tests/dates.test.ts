import { describe, expect, it } from 'vitest';
import { formatDate, isValidISODate, todayISO } from '../src/lib/dates';

describe('fechas', () => {
  it('todayISO tiene formato YYYY-MM-DD', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(isValidISODate(todayISO())).toBe(true);
  });
  it('valida fechas reales', () => {
    expect(isValidISODate('2024-02-29')).toBe(true);
    expect(isValidISODate('2023-02-29')).toBe(false);
    expect(isValidISODate('2024-13-01')).toBe(false);
    expect(isValidISODate('')).toBe(false);
  });
  it('formatea dd/mm/aaaa', () => {
    expect(formatDate('2026-10-30')).toBe('30/10/2026');
  });
});
