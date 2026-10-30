// Prueba extremo a extremo contra Firebase REAL usando la interfaz.
//
//   E2E_URL=http://localhost:4173/GestionCaballos/ E2E_EMAIL=... E2E_PASSWORD=... node e2e/app.e2e.mjs
//
// Crea datos con prefijo "E2E-<timestamp>" y los elimina al terminar.
import { chromium, devices } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

const URL = process.env.E2E_URL ?? 'http://localhost:4173/GestionCaballos/';
const { E2E_EMAIL, E2E_PASSWORD } = process.env;
if (!E2E_EMAIL || !E2E_PASSWORD) throw new Error('Faltan E2E_EMAIL / E2E_PASSWORD');
const OUT = process.env.E2E_OUT ?? 'test-results';
mkdirSync(OUT, { recursive: true });

const tag = `E2E-${Date.now()}`;
const S1 = `${tag} Pupilaje`, S2 = `${tag} Herraje`, S3 = `${tag} Doma`;
const H1 = `${tag} Tornado`;
const euro = (s) => s.replace(/\s/g, ' ');

const results = [];
async function step(name, fn) {
  try {
    await fn();
    results.push([name, true]);
    console.log(`  ✔ ${name}`);
  } catch (e) {
    results.push([name, false]);
    console.log(`  ✘ ${name}\n    ${String(e.message).split('\n').slice(0, 4).join('\n    ')}`);
    throw e;
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'es-ES' });
const page = await ctx.newPage();
page.setDefaultTimeout(15000);

const toast = (text) => page.locator('.toast').filter({ hasText: text }).first();
const horseRow = (name) => page.locator('tbody tr').filter({ hasText: name });
const serviceRow = (name) => page.locator('tbody tr').filter({ hasText: name });

async function login(p, email, password) {
  await p.getByLabel('Correo electrónico').fill(email);
  await p.getByLabel('Contraseña').fill(password);
  await p.getByRole('button', { name: 'Iniciar sesión' }).click();
}

async function createService(name, price) {
  await page.getByRole('button', { name: '+ Nuevo servicio' }).first().click();
  await page.getByLabel('Nombre del servicio *').fill(name);
  await page.getByLabel('Descripción').fill('Servicio de prueba automática');
  await page.getByLabel('Precio (€) *').fill(price);
  await page.getByRole('button', { name: 'Crear servicio' }).click();
  await toast(`Servicio «${name}» creado.`).waitFor();
}

try {
  console.log(`\nApp: ${URL}\n`);

  await step('Usuario no autenticado no accede a la gestión (/#/caballos muestra login)', async () => {
    await page.goto(`${URL}#/caballos`);
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    assert.equal(await page.getByRole('heading', { name: 'Caballos' }).count(), 0);
  });

  await step('Login con contraseña incorrecta muestra error claro', async () => {
    await login(page, E2E_EMAIL, 'contraseña-incorrecta-123');
    await page.getByRole('alert').filter({ hasText: /incorrectos|Demasiados intentos/ }).waitFor();
  });

  await step('Login correcto', async () => {
    await login(page, E2E_EMAIL, E2E_PASSWORD);
    await page.getByRole('heading', { name: 'Caballos' }).waitFor();
  });

  await step('Crear servicios (precios con decimales)', async () => {
    await page.getByRole('link', { name: 'Servicios' }).click();
    await page.getByRole('heading', { name: 'Servicios' }).waitFor();
    await createService(S1, '350');
    await createService(S2, '65,55');
    await createService(S3, '0,10');
    await serviceRow(S2).getByText('65,55').waitFor();
  });

  await step('Validación: servicio sin nombre/precio no se guarda', async () => {
    await page.getByRole('button', { name: '+ Nuevo servicio' }).first().click();
    await page.getByRole('button', { name: 'Crear servicio' }).click();
    await page.getByText('El nombre del servicio es obligatorio.').waitFor();
    await page.getByText('El precio es obligatorio.').waitFor();
    await page.getByRole('button', { name: 'Cancelar' }).click();
  });

  await step('Editar servicio (descripción)', async () => {
    await serviceRow(S3).getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Descripción').fill('Descripción editada');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await toast(`Servicio «${S3}» actualizado.`).waitFor();
    await serviceRow(S3).getByText('Descripción editada').waitFor();
  });

  await step('Validación: caballo sin campos obligatorios no se guarda', async () => {
    await page.getByRole('link', { name: 'Caballos' }).click();
    await page.getByRole('button', { name: '+ Nuevo caballo' }).first().click();
    await page.getByRole('button', { name: 'Crear caballo' }).click();
    await page.getByText('El nombre del caballo es obligatorio.').waitFor();
    await page.getByText('El nombre del cliente es obligatorio.').waitFor();
  });

  await step('Crear caballo con varios servicios; total calculado en vivo (350 + 65,55 + 0,10 = 415,65 €)', async () => {
    const today = await page.getByLabel('Fecha de alta *').inputValue();
    assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
    await page.getByLabel('Nombre del caballo *').fill(H1);
    await page.getByLabel('Nombre del cliente *').fill(`${tag} Cliente Ana`);
    await page.getByLabel('Ubicación').fill('Box 7');
    const total = page.getByTestId('form-total');
    assert.equal(euro(await total.innerText()), '0,00 €');
    await page.locator('.service-option').filter({ hasText: S1 }).click();
    assert.equal(euro(await total.innerText()), '350,00 €');
    await page.locator('.service-option').filter({ hasText: S2 }).click();
    await page.locator('.service-option').filter({ hasText: S3 }).click();
    assert.equal(euro(await total.innerText()), '415,65 €');
    await page.locator('.service-option').filter({ hasText: S3 }).click(); // deseleccionar
    assert.equal(euro(await total.innerText()), '415,55 €');
    await page.locator('.service-option').filter({ hasText: S3 }).click();
    // Cambiar otro campo no pierde la selección
    await page.getByLabel('Ubicación').fill('Box 7 - Pista norte');
    assert.equal(euro(await total.innerText()), '415,65 €');
    await page.getByRole('button', { name: 'Crear caballo' }).click();
    await toast(`Caballo «${H1}» creado.`).waitFor();
    const row = horseRow(H1);
    await row.waitFor();
    assert.match(euro(await row.innerText()), /415,65 €/);
    for (const s of [S1, S2, S3]) await row.getByText(s).waitFor();
  });

  await step('Importes y servicios se conservan tras recargar (persistidos en Firestore)', async () => {
    await page.reload();
    const row = horseRow(H1);
    await row.waitFor();
    assert.match(euro(await row.innerText()), /415,65 €/);
    assert.match(await row.innerText(), /Box 7 - Pista norte/);
  });

  await step('Consultar ficha completa del caballo', async () => {
    await horseRow(H1).getByRole('button', { name: 'Ver' }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByText(`${tag} Cliente Ana`).waitFor();
    assert.match(euro(await dlg.innerText()), /65,55 €[\s\S]*415,65 €/);
    await dlg.getByRole('button', { name: 'Cerrar' }).first().click();
  });

  await step('Buscar por caballo y por cliente', async () => {
    const search = page.getByPlaceholder('Buscar por caballo o cliente…');
    await search.fill(`${tag} tornado`.toLowerCase());
    await horseRow(H1).waitFor();
    await search.fill(`${tag} cliente ana`);
    await horseRow(H1).waitFor();
    await search.fill(`${tag}-no-existe`);
    await page.getByText('Sin resultados').waitFor();
    await search.fill(tag);
  });

  await step('Desactivar caballo y filtrar por estado', async () => {
    await horseRow(H1).getByRole('button', { name: 'Desactivar' }).click();
    await toast(`«${H1}» ahora está inactivo.`).waitFor();
    await horseRow(H1).getByText('Inactivo').waitFor();
    await page.getByRole('button', { name: /^Activos/ }).click();
    await page.getByText('Sin resultados').waitFor();
    await page.getByRole('button', { name: /^Inactivos/ }).click();
    await horseRow(H1).waitFor();
    await horseRow(H1).getByRole('button', { name: 'Activar' }).click();
    await toast(`«${H1}» ahora está activo.`).waitFor();
    await page.getByRole('button', { name: /^Todos/ }).click();
    await horseRow(H1).getByText('Activo').waitFor();
  });

  await step('Cambiar precio del catálogo NO altera el importe histórico del caballo', async () => {
    await page.getByRole('link', { name: 'Servicios' }).click();
    await serviceRow(S1).getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Precio (€) *').fill('400');
    await page.getByText('El nuevo precio solo se aplicará a las próximas asignaciones').waitFor();
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await toast(`Servicio «${S1}» actualizado.`).waitFor();
    await serviceRow(S1).getByText('400,00').waitFor();
    await page.getByRole('link', { name: 'Caballos' }).click();
    await page.getByPlaceholder('Buscar por caballo o cliente…').fill(tag);
    assert.match(euro(await horseRow(H1).innerText()), /415,65 €/);
  });

  await step('Editar caballo conserva precios históricos y añade/quita servicios', async () => {
    await horseRow(H1).getByRole('button', { name: 'Editar' }).click();
    const total = page.getByTestId('form-total');
    assert.equal(euro(await total.innerText()), '415,65 €');
    await page.getByText('Precio asignado conservado').waitFor();
    await page.locator('.service-option').filter({ hasText: S3 }).click(); // quitar 0,10
    await page.getByLabel('Nombre del cliente *').fill(`${tag} Cliente Ana María`);
    assert.equal(euro(await total.innerText()), '415,55 €');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await toast(`Caballo «${H1}» actualizado.`).waitFor();
    const row = horseRow(H1);
    assert.match(euro(await row.innerText()), /415,55 €/);
    assert.match(await row.innerText(), /Cliente Ana María/);
    await page.reload();
    await page.getByPlaceholder('Buscar por caballo o cliente…').fill(tag);
    assert.match(euro(await horseRow(H1).innerText()), /415,55 €/);
  });

  await step('Renombrar servicio mantiene la relación por id (sigue contando 1 caballo)', async () => {
    await page.getByRole('link', { name: 'Servicios' }).click();
    await serviceRow(S2).getByRole('button', { name: 'Editar' }).click();
    await page.getByLabel('Nombre del servicio *').fill(`${S2} renombrado`);
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await toast('actualizado').waitFor();
    const cells = serviceRow(`${S2} renombrado`).locator('td');
    assert.equal((await cells.nth(3).innerText()).trim(), '1');
  });

  await step('No se puede eliminar un servicio asignado (se ofrece desactivar)', async () => {
    await serviceRow(S1).getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('heading', { name: 'No se puede eliminar' }).waitFor();
    await page.getByText(/asignado a 1 caballo/).waitFor();
    await page.getByRole('button', { name: 'Desactivar servicio' }).click();
    await serviceRow(S1).getByText('Inactivo').waitFor();
  });

  await step('Servicio inactivo no se ofrece en altas nuevas pero se mantiene en el caballo', async () => {
    await page.getByRole('link', { name: 'Caballos' }).click();
    await page.getByRole('button', { name: '+ Nuevo caballo' }).first().click();
    assert.equal(await page.locator('.service-option').filter({ hasText: S1 }).count(), 0);
    await page.getByRole('button', { name: 'Cancelar' }).click();
    await page.getByPlaceholder('Buscar por caballo o cliente…').fill(tag);
    await horseRow(H1).getByText(S1).waitFor();
  });

  await step('Escritorio (1280×720): la tabla cabe sin cortar columnas', async () => {
    const clipped = await page.evaluate(() => {
      const w = document.querySelector('.table-wrap');
      return w.scrollWidth - w.clientWidth;
    });
    assert.ok(clipped <= 1, `tabla desborda ${clipped}px`);
    await page.screenshot({ path: `${OUT}/desktop-caballos.png`, fullPage: true });
  });

  await step('Vista móvil (390×844): tabla en tarjetas y navegación visible', async () => {
    const m = await browser.newContext({ ...devices['iPhone 13'], locale: 'es-ES' });
    const mp = await m.newPage();
    await mp.goto(`${URL}#/caballos`);
    await login(mp, E2E_EMAIL, E2E_PASSWORD);
    await mp.getByRole('heading', { name: 'Caballos' }).waitFor();
    await mp.getByPlaceholder('Buscar por caballo o cliente…').fill(tag);
    await mp.locator('tbody tr').filter({ hasText: H1 }).waitFor();
    const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert.ok(overflow <= 1, `scroll horizontal de ${overflow}px`);
    assert.equal(await mp.locator('thead').isVisible(), false);
    await mp.screenshot({ path: `${OUT}/mobile-caballos.png`, fullPage: true });
    await mp.locator('tbody tr').filter({ hasText: H1 }).getByRole('button', { name: 'Editar' }).click();
    await mp.getByRole('dialog').waitFor();
    const formOverflow = await mp.evaluate(() => document.querySelector('.modal').getBoundingClientRect().right - document.documentElement.clientWidth);
    assert.ok(formOverflow <= 1, `formulario con scroll horizontal de ${formOverflow}px`);
    await mp.screenshot({ path: `${OUT}/mobile-form.png` });
    await m.close();
  });

  await step('Eliminar caballo con confirmación', async () => {
    await horseRow(H1).getByRole('button', { name: 'Eliminar' }).click();
    await page.getByRole('dialog').getByText('¿Seguro que quieres eliminar').waitFor();
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
    await toast(`Caballo «${H1}» eliminado.`).waitFor();
    assert.equal(await horseRow(H1).count(), 0);
  });

  await step('Servicios sin uso sí se pueden eliminar (limpieza)', async () => {
    await page.getByRole('link', { name: 'Servicios' }).click();
    for (const name of [S1, `${S2} renombrado`, S3]) {
      await serviceRow(name).getByRole('button', { name: 'Eliminar' }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Eliminar' }).click();
      await toast(`Servicio «${name}» eliminado.`).waitFor();
    }
  });

  await step('Cerrar sesión vuelve al login y bloquea la gestión', async () => {
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
    await page.goto(`${URL}#/servicios`);
    await page.reload();
    await page.getByRole('heading', { name: 'Iniciar sesión' }).waitFor();
  });
} catch {
  await page.screenshot({ path: `${OUT}/failure.png`, fullPage: true }).catch(() => {});
} finally {
  await browser.close();
  const failed = results.filter(([, ok]) => !ok).length;
  console.log(`\nResultado: ${results.length - failed}/${results.length} pasos OK${failed ? ' (se detuvo en el primer fallo)' : ''}`);
  process.exitCode = failed ? 1 : 0;
}
