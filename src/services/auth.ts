import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logout() {
  await signOut(auth);
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(auth, email.trim());
}

/** Comprueba si el usuario está en la lista de usuarios autorizados. */
export async function isAllowedUser(uid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'allowedUsers', uid));
  return snap.exists();
}
