// Comprueba las reglas de seguridad DESPLEGADAS en Firebase usando el SDK web,
// exactamente igual que lo haría un navegador (sin privilegios de administrador).
//
//   E2E_EMAIL=... E2E_PASSWORD=... node e2e/rules-check.mjs
//
// E2E_EMAIL debe estar en allowedUsers. El script crea además una cuenta nueva
// NO autorizada (si el registro está habilitado en Auth) para verificar que
// una cuenta cualquiera no puede leer ni escribir.
import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, getDocs, getFirestore, serverTimestamp, setDoc, Timestamp, updateDoc,
} from 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyAf66NE1Jhf7VUyE6XP8IEEykepMZkdCYE',
  authDomain: 'gestioncaballos.firebaseapp.com',
  projectId: 'gestioncaballos',
  appId: '1:326296813927:web:9dd86c234fa39523926fc2',
};
const { E2E_EMAIL, E2E_PASSWORD } = process.env;
if (!E2E_EMAIL || !E2E_PASSWORD) throw new Error('Faltan E2E_EMAIL / E2E_PASSWORD');

let pass = 0, fail = 0;
async function expectResult(label, shouldSucceed, fn) {
  try {
    await fn();
    if (shouldSucceed) { pass++; console.log(`  ✔ ${label}`); }
    else { fail++; console.log(`  ✘ ${label} — se permitió y debía denegarse`); }
  } catch (e) {
    if (!shouldSucceed && e.code === 'permission-denied') { pass++; console.log(`  ✔ ${label} (permission-denied)`); }
    else { fail++; console.log(`  ✘ ${label} — ${e.code ?? e.message}`); }
  }
}

const app = initializeApp(config, 'rules-check');
const auth = getAuth(app);
const db = getFirestore(app);
const now = serverTimestamp();
const validService = { name: 'ZZ rules test', description: '', price: 1234, status: 'active', createdAt: now, updatedAt: now };
const validHorse = (svcId) => ({
  name: 'ZZ rules horse', clientName: 'Test', location: '', registrationDate: '2026-10-30', status: 'active',
  services: [{ serviceId: svcId, name: 'ZZ rules test', price: 1234 }], serviceIds: [svcId], totalPrice: 1234,
  createdAt: now, updatedAt: now,
});

console.log('\n1) Sin autenticar');
await expectResult('leer horses', false, () => getDocs(collection(db, 'horses')));
await expectResult('leer services', false, () => getDocs(collection(db, 'services')));
await expectResult('crear service', false, () => addDoc(collection(db, 'services'), validService));
await expectResult('leer allowedUsers', false, () => getDocs(collection(db, 'allowedUsers')));

console.log('\n2) Cuenta autenticada pero NO autorizada');
const strangerEmail = `zz-stranger-${Date.now()}@example.com`;
let stranger = null;
try {
  stranger = (await createUserWithEmailAndPassword(auth, strangerEmail, 'Strang3r-pass!')).user;
} catch (e) {
  console.log(`  (registro deshabilitado: ${e.code}) — se omite esta parte, que es lo más seguro`);
}
if (stranger) {
  await expectResult('leer horses', false, () => getDocs(collection(db, 'horses')));
  await expectResult('crear service', false, () => addDoc(collection(db, 'services'), validService));
  await expectResult('auto-añadirse a allowedUsers', false, () =>
    setDoc(doc(db, 'allowedUsers', stranger.uid), { email: strangerEmail }));
  await deleteUser(stranger);
}

console.log('\n3) Usuario autorizado');
await signInWithEmailAndPassword(auth, E2E_EMAIL, E2E_PASSWORD);
await expectResult('leer horses', true, () => getDocs(collection(db, 'horses')));
let svcId;
await expectResult('crear service válido', true, async () => { svcId = (await addDoc(collection(db, 'services'), validService)).id; });
await expectResult('service con precio decimal (no céntimos)', false, () => addDoc(collection(db, 'services'), { ...validService, price: 12.34 }));
await expectResult('service con precio negativo', false, () => addDoc(collection(db, 'services'), { ...validService, price: -1 }));
await expectResult('service sin nombre', false, () => addDoc(collection(db, 'services'), { ...validService, name: '' }));
await expectResult('service con campo extra', false, () => addDoc(collection(db, 'services'), { ...validService, admin: true }));
await expectResult('service con estado inválido', false, () => addDoc(collection(db, 'services'), { ...validService, status: 'x' }));
await expectResult('service con createdAt falso', false, () => addDoc(collection(db, 'services'), { ...validService, createdAt: Timestamp.fromDate(new Date(2000, 0, 1)) }));
let horseId;
await expectResult('crear horse válido', true, async () => { horseId = (await addDoc(collection(db, 'horses'), validHorse(svcId))).id; });
await expectResult('horse sin cliente', false, () => addDoc(collection(db, 'horses'), { ...validHorse(svcId), clientName: '' }));
await expectResult('horse con total incoherente', false, () => addDoc(collection(db, 'horses'), { ...validHorse(svcId), totalPrice: 1 }));
await expectResult('horse sin servicios con total > 0', false, () => addDoc(collection(db, 'horses'), { ...validHorse(svcId), services: [], serviceIds: [], totalPrice: 500 }));
await expectResult('horse con fecha inválida', false, () => addDoc(collection(db, 'horses'), { ...validHorse(svcId), registrationDate: '30/10/2026' }));
await expectResult('modificar createdAt de horse', false, () => updateDoc(doc(db, 'horses', horseId), { createdAt: Timestamp.fromDate(new Date(2000, 0, 1)), updatedAt: now }));
await expectResult('actualizar estado de horse', true, () => updateDoc(doc(db, 'horses', horseId), { status: 'inactive', updatedAt: now }));
await expectResult('escribir en colección no prevista', false, () => addDoc(collection(db, 'other'), { a: 1 }));
await expectResult('auto-añadirse a allowedUsers', false, () => setDoc(doc(db, 'allowedUsers', auth.currentUser.uid), { email: E2E_EMAIL }));
await expectResult('borrar horse', true, () => deleteDoc(doc(db, 'horses', horseId)));
await expectResult('borrar service', true, () => deleteDoc(doc(db, 'services', svcId)));
await signOut(auth);
await deleteApp(app);

console.log(`\nResultado: ${pass} OK, ${fail} fallos`);
process.exit(fail ? 1 : 0);
