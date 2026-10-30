import { FirebaseError } from 'firebase/app';

const AUTH_MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/wrong-password': 'Correo o contraseña incorrectos.',
  'auth/user-not-found': 'Correo o contraseña incorrectos.',
  'auth/invalid-email': 'El correo electrónico no tiene un formato válido.',
  'auth/missing-email': 'Introduce tu correo electrónico.',
  'auth/missing-password': 'Introduce tu contraseña.',
  'auth/user-disabled': 'Esta cuenta está deshabilitada. Contacta con el administrador.',
  'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  'auth/network-request-failed': 'No hay conexión con el servidor. Revisa tu conexión a internet.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Authentication.',
};

const FIRESTORE_MESSAGES: Record<string, string> = {
  'permission-denied': 'No tienes permiso para realizar esta operación.',
  unavailable: 'Sin conexión con la base de datos. Los cambios se sincronizarán al recuperarla.',
  'deadline-exceeded': 'La operación ha tardado demasiado. Inténtalo de nuevo.',
  'not-found': 'El registro ya no existe.',
  'invalid-argument': 'Los datos enviados no son válidos.',
  'failed-precondition': 'La operación no se puede completar en el estado actual.',
};

export function errorMessage(err: unknown, fallback = 'Se ha producido un error inesperado.'): string {
  if (err instanceof FirebaseError) {
    return AUTH_MESSAGES[err.code] ?? FIRESTORE_MESSAGES[err.code] ?? `${fallback} (${err.code})`;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/** Las escrituras de Firestore sin conexión no se confirman hasta reconectar: se bloquean antes. */
export function assertOnline() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('No hay conexión a internet. No se puede guardar hasta recuperarla.');
  }
}
