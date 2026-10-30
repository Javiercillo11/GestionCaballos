import { describe, expect, it } from 'vitest';
import { buildAssignedServices, centsToInput, formatCents, parseEurosToCents, sumCents } from '../src/lib/money';
import type { Service } from '../src/lib/types';

const svc = (id: string, name: string, price: number, status: Service['status'] = 'active'): Service => ({
  id,
  name,
  description: '',
  price,
  status,
  createdAt: null,
  updatedAt: null,
});

describe('parseEurosToCents', () => {
  it.each([
    ['45', 4500],
    ['45,5', 4550],
    ['45,50', 4550],
    ['45.50', 4550],
    ['0,10', 10],
    ['0.29', 29],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    [' 12,30 € ', 1230],
    ['0', 0],
  ])('%s → %i céntimos', (raw, cents) => {
    expect(parseEurosToCents(raw)).toBe(cents);
  });

  it.each(['', 'abc', '-5', '12,345', '1,2,3', '12.']) ('rechaza %j', (raw) => {
    expect(parseEurosToCents(raw)).toBeNull();
  });
});

describe('formato', () => {
  it('formatea con dos decimales y euro', () => {
    expect(formatCents(123456)).toMatch(/^1\.?234,56\s€$/);
    expect(formatCents(5)).toMatch(/^0,05\s€$/);
    expect(formatCents(4550)).toMatch(/^45,50\s€$/);
  });
  it('centsToInput', () => {
    expect(centsToInput(4550)).toBe('45,50');
    expect(centsToInput(7)).toBe('0,07');
  });
});

describe('sumCents', () => {
  it('suma sin errores de coma flotante (0,10 + 0,20 = 0,30)', () => {
    expect(sumCents([{ price: 10 }, { price: 20 }])).toBe(30);
    // En coma flotante 0.1 + 0.2 !== 0.3; en céntimos sí cuadra.
    expect(sumCents([{ price: 1999 }, { price: 1 }, { price: 33333 }])).toBe(35333);
  });
});

describe('buildAssignedServices (política de precios)', () => {
  const catalog = [svc('a', 'Pupilaje', 30000), svc('b', 'Herraje', 6550), svc('c', 'Doma', 12000)];

  it('copia id, nombre y precio del catálogo al asignar', () => {
    expect(buildAssignedServices(['a', 'b'], [], catalog)).toEqual([
      { serviceId: 'a', name: 'Pupilaje', price: 30000 },
      { serviceId: 'b', name: 'Herraje', price: 6550 },
    ]);
  });

  it('conserva el precio histórico de servicios ya asignados aunque cambie el catálogo', () => {
    const previous = [{ serviceId: 'a', name: 'Pupilaje', price: 25000 }];
    const result = buildAssignedServices(['a', 'c'], previous, catalog);
    expect(result).toEqual([
      { serviceId: 'a', name: 'Pupilaje', price: 25000 },
      { serviceId: 'c', name: 'Doma', price: 12000 },
    ]);
    expect(sumCents(result)).toBe(37000);
  });

  it('mantiene asignaciones de servicios que ya no existen en el catálogo', () => {
    const previous = [{ serviceId: 'zzz', name: 'Antiguo', price: 1000 }];
    expect(buildAssignedServices(['zzz'], previous, catalog)).toEqual(previous);
  });

  it('deseleccionar elimina el servicio y su importe', () => {
    const previous = buildAssignedServices(['a', 'b'], [], catalog);
    const result = buildAssignedServices(['b'], previous, catalog);
    expect(sumCents(result)).toBe(6550);
  });
});
