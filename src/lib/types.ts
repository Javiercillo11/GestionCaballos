import type { Timestamp } from 'firebase/firestore';

/** Estado de un servicio del catálogo. */
export type Status = 'active' | 'inactive';

/** Estado de un caballo: trabajo en curso (pendiente de cobro) o terminado (ganado). */
export type HorseStatus = 'in_progress' | 'finished';

/** Importe en céntimos de euro (entero). */
export type Cents = number;

export interface Service {
  id: string;
  name: string;
  description: string;
  price: Cents;
  status: Status;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/**
 * Servicio asignado a un caballo. Guarda una copia del nombre y del precio
 * aplicados en el momento de la asignación, además del id estable del
 * servicio del catálogo.
 */
export interface AssignedService {
  serviceId: string;
  name: string;
  price: Cents;
}

export interface Horse {
  id: string;
  name: string;
  clientName: string;
  services: AssignedService[];
  /** Ids de los servicios asignados (índice para consultas array-contains). */
  serviceIds: string[];
  totalPrice: Cents;
  location: string;
  /** Fecha de alta en formato YYYY-MM-DD. */
  registrationDate: string;
  status: HorseStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type ServiceInput = Pick<Service, 'name' | 'description' | 'price' | 'status'>;
export type HorseInput = Pick<
  Horse,
  'name' | 'clientName' | 'services' | 'location' | 'registrationDate' | 'status'
>;
