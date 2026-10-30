import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Service, ServiceInput, Status } from '../lib/types';

const servicesCol = collection(db, 'services');

export function subscribeServices(
  onData: (services: Service[]) => void,
  onError: (err: FirestoreError) => void,
) {
  return onSnapshot(
    query(servicesCol, orderBy('name')),
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...(d.data({ serverTimestamps: 'estimate' }) as Omit<Service, 'id'>) }))),
    onError,
  );
}

function clean(input: ServiceInput): ServiceInput {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    price: input.price,
    status: input.status,
  };
}

export async function createService(input: ServiceInput) {
  const ref = await addDoc(servicesCol, {
    ...clean(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Actualiza un servicio del catálogo. Los caballos guardan su propia copia
 * de nombre y precio, así que este cambio NO altera importes ya asignados.
 */
export async function updateService(id: string, input: ServiceInput) {
  await updateDoc(doc(db, 'services', id), { ...clean(input), updatedAt: serverTimestamp() });
}

export async function setServiceStatus(id: string, status: Status) {
  await updateDoc(doc(db, 'services', id), { status, updatedAt: serverTimestamp() });
}

/** Número de caballos (hasta `max`) que tienen asignado el servicio. */
export async function countHorsesUsingService(id: string, max = 50): Promise<number> {
  const snap = await getDocs(
    query(collection(db, 'horses'), where('serviceIds', 'array-contains', id), limit(max)),
  );
  return snap.size;
}

export class ServiceInUseError extends Error {
  constructor(public readonly count: number) {
    super(
      `No se puede eliminar: el servicio está asignado a ${count}${count >= 50 ? ' o más' : ''} caballo${count === 1 ? '' : 's'}. Desactívalo en su lugar.`,
    );
  }
}

/** Elimina un servicio solo si ningún caballo lo tiene asignado. */
export async function deleteServiceSafely(id: string) {
  const used = await countHorsesUsingService(id);
  if (used > 0) throw new ServiceInUseError(used);
  await deleteDoc(doc(db, 'services', id));
}
