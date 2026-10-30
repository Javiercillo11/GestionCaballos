import type { FirestoreError, Unsubscribe } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { errorMessage } from './errors';

/** Suscripción en tiempo real a una colección con estados de carga y error. */
export function useCollection<T>(
  subscribe: (onData: (items: T[]) => void, onError: (e: FirestoreError) => void) => Unsubscribe,
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribe(
      (data) => {
        setItems(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(errorMessage(err));
        setLoading(false);
      },
    );
  }, [subscribe]);

  return { items, loading, error };
}
