import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

export const app = initializeApp(firebaseConfig);

// La sesión se conserva en el navegador (persistencia local por defecto)
// hasta que el usuario cierra sesión.
export const auth = getAuth(app);
auth.languageCode = 'es';

export const db = getFirestore(app);
