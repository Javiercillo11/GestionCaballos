import type { FirebaseOptions } from 'firebase/app';

/**
 * Configuración web de Firebase.
 *
 * Estos valores son PÚBLICOS por diseño (van incluidos en el JavaScript que
 * descarga cualquier navegador). No son claves privadas: la seguridad de los
 * datos depende de Firebase Authentication + las reglas de Firestore.
 * Se pueden sobrescribir con variables VITE_FIREBASE_* (ver .env.example).
 */
const env = import.meta.env;

export const firebaseConfig: FirebaseOptions = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyAf66NE1Jhf7VUyE6XP8IEEykepMZkdCYE',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'gestioncaballos.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'gestioncaballos',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'gestioncaballos.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '326296813927',
  appId: env.VITE_FIREBASE_APP_ID || '1:326296813927:web:9dd86c234fa39523926fc2',
};
