import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  type FirestoreError,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sumCents } from '../lib/money';
import type { Horse, HorseInput, Status } from '../lib/types';

const horsesCol = collection(db, 'horses');

export function subscribeHorses(
  onData: (horses: Horse[]) => void,
  onError: (err: FirestoreError) => void,
) {
  return onSnapshot(
    horsesCol,
    (snap) =>
      onData(
        snap.docs.map((d) => {
          const data = d.data({ serverTimestamps: 'estimate' }) as Omit<Horse, 'id'>;
          return { id: d.id, ...data, services: data.services ?? [], serviceIds: data.serviceIds ?? [] };
        }),
      ),
    onError,
  );
}

/** Normaliza la entrada y deriva los campos calculados (total e índice de ids). */
function toDocData(input: HorseInput) {
  const services = input.services.map((s) => ({ serviceId: s.serviceId, name: s.name, price: s.price }));
  return {
    name: input.name.trim(),
    clientName: input.clientName.trim(),
    services,
    serviceIds: services.map((s) => s.serviceId),
    totalPrice: sumCents(services),
    location: input.location.trim(),
    registrationDate: input.registrationDate,
    status: input.status,
  };
}

export async function createHorse(input: HorseInput) {
  const ref = await addDoc(horsesCol, {
    ...toDocData(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHorse(id: string, input: HorseInput) {
  await updateDoc(doc(db, 'horses', id), { ...toDocData(input), updatedAt: serverTimestamp() });
}

export async function setHorseStatus(id: string, status: Status) {
  await updateDoc(doc(db, 'horses', id), { status, updatedAt: serverTimestamp() });
}

export async function deleteHorse(id: string) {
  await deleteDoc(doc(db, 'horses', id));
}
