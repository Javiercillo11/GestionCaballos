import { createContext, useContext, type ReactNode } from 'react';
import type { Horse, Service } from '../lib/types';
import { useCollection } from '../lib/useCollection';
import { subscribeServices } from '../services/catalog';
import { subscribeHorses } from '../services/horses';

interface CollectionState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
}

interface DataState {
  horses: CollectionState<Horse>;
  services: CollectionState<Service>;
}

const DataContext = createContext<DataState | null>(null);

/** Mantiene suscripciones en tiempo real a caballos y servicios mientras hay sesión. */
export function DataProvider({ children }: { children: ReactNode }) {
  const horses = useCollection(subscribeHorses);
  const services = useCollection(subscribeServices);
  return <DataContext.Provider value={{ horses, services }}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData debe usarse dentro de DataProvider');
  return ctx;
}
