// Migra el estado de los caballos del modelo antiguo (active/inactive) al
// actual (in_progress/finished): active → in_progress, inactive → finished.
// Se ejecuta con un usuario autorizado (pasa por las reglas de seguridad):
//
//   E2E_EMAIL=... E2E_PASSWORD=... node scripts/migrate-horse-status.mjs
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, getFirestore, serverTimestamp, updateDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyAf66NE1Jhf7VUyE6XP8IEEykepMZkdCYE',
  authDomain: 'gestioncaballos.firebaseapp.com',
  projectId: 'gestioncaballos',
  appId: '1:326296813927:web:9dd86c234fa39523926fc2',
});
await signInWithEmailAndPassword(getAuth(app), process.env.E2E_EMAIL, process.env.E2E_PASSWORD);
const db = getFirestore(app);
const MAP = { active: 'in_progress', inactive: 'finished' };
let migrated = 0;
for (const d of (await getDocs(collection(db, 'horses'))).docs) {
  const next = MAP[d.data().status];
  if (!next) continue;
  await updateDoc(d.ref, { status: next, updatedAt: serverTimestamp() });
  console.log(`${d.data().name}: ${d.data().status} → ${next}`);
  migrated++;
}
console.log(`Migrados: ${migrated}`);
process.exit(0);
