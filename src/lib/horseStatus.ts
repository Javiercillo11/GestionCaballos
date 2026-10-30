import type { HorseStatus } from './types';

export const HORSE_STATUSES: HorseStatus[] = ['in_progress', 'finished'];

export const HORSE_STATUS_LABEL: Record<HorseStatus, string> = {
  in_progress: 'En curso',
  finished: 'Terminado',
};

/**
 * Convierte el estado guardado a los valores actuales. Los registros antiguos
 * usaban active/inactive: active → en curso, inactive → terminado.
 */
export function normalizeHorseStatus(raw: unknown): HorseStatus {
  if (raw === 'finished' || raw === 'inactive') return 'finished';
  return 'in_progress';
}
