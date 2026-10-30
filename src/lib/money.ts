import type { AssignedService, Cents, Service } from './types';

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCents(cents: Cents): string {
  return formatter.format(cents / 100);
}

/** Céntimos → texto editable en un input ("12,50"). */
export function centsToInput(cents: Cents): string {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Convierte un importe escrito por el usuario ("12", "12,5", "12.50",
 * "1.234,56") a céntimos enteros SIN pasar por coma flotante.
 * Devuelve null si el texto no es un importe válido no negativo.
 */
export function parseEurosToCents(raw: string): Cents | null {
  let s = raw.trim().replace(/\s|€/g, '');
  if (!s) return null;
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // El último separador es el decimal; el otro, de miles.
    const decimalSep = lastComma > lastDot ? ',' : '.';
    const thousandsSep = decimalSep === ',' ? '.' : ',';
    s = s.split(thousandsSep).join('').replace(decimalSep, '.');
  } else if (lastComma !== -1) {
    s = s.replace(',', '.');
  }
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!match) return null;
  const euros = Number(match[1]);
  const cents = Number((match[2] ?? '').padEnd(2, '0'));
  const total = euros * 100 + cents;
  return Number.isSafeInteger(total) ? total : null;
}

export function sumCents(items: { price: Cents }[]): Cents {
  return items.reduce((acc, item) => acc + item.price, 0);
}

/**
 * Calcula la nueva lista de servicios de un caballo al editar la selección.
 * Política de precios: los servicios que ya estaban asignados conservan el
 * nombre y precio guardados en su momento; solo los servicios NUEVOS toman el
 * nombre y precio actuales del catálogo.
 */
export function buildAssignedServices(
  selectedIds: string[],
  previous: AssignedService[],
  catalog: Service[],
): AssignedService[] {
  const prevById = new Map(previous.map((s) => [s.serviceId, s]));
  const catalogById = new Map(catalog.map((s) => [s.id, s]));
  const result: AssignedService[] = [];
  for (const id of selectedIds) {
    const prev = prevById.get(id);
    if (prev) {
      result.push(prev);
      continue;
    }
    const svc = catalogById.get(id);
    if (svc) result.push({ serviceId: svc.id, name: svc.name, price: svc.price });
  }
  return result;
}
