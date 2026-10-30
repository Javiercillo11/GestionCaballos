import { useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { assertOnline, errorMessage } from '../lib/errors';
import { centsToInput, formatCents, parseEurosToCents } from '../lib/money';
import type { Service, Status } from '../lib/types';
import { createService, updateService } from '../services/catalog';

export const MAX_PRICE_CENTS = 10_000_000; // 100.000,00 €

type Errors = Partial<Record<'name' | 'price', string>>;

export function ServiceForm({ service, onClose }: { service: Service | null; onClose: () => void }) {
  const toast = useToast();
  const [name, setName] = useState(service?.name ?? '');
  const [description, setDescription] = useState(service?.description ?? '');
  const [priceText, setPriceText] = useState(service ? centsToInput(service.price) : '');
  const [status, setStatus] = useState<Status>(service?.status ?? 'active');
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const parsed = parseEurosToCents(priceText);

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = 'El nombre del servicio es obligatorio.';
    else if (name.trim().length > 100) e.name = 'Máximo 100 caracteres.';
    if (!priceText.trim()) e.price = 'El precio es obligatorio.';
    else if (parsed === null) e.price = 'Introduce un importe válido, por ejemplo 45 o 45,50.';
    else if (parsed > MAX_PRICE_CENTS) e.price = `El precio no puede superar ${formatCents(MAX_PRICE_CENTS)}.`;
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length || parsed === null) return;
    setSaving(true);
    try {
      assertOnline();
      const input = { name, description, price: parsed, status };
      if (service) await updateService(service.id, input);
      else await createService(input);
      toast('success', service ? `Servicio «${name.trim()}» actualizado.` : `Servicio «${name.trim()}» creado.`);
      onClose();
    } catch (err) {
      toast('error', errorMessage(err, 'No se ha podido guardar el servicio.'));
      setSaving(false);
    }
  }

  const priceChanged = service && parsed !== null && parsed !== service.price;

  return (
    <Modal
      title={service ? 'Editar servicio' : 'Nuevo servicio'}
      onClose={onClose}
      busy={saving}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="service-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : service ? 'Guardar cambios' : 'Crear servicio'}
          </button>
        </>
      }
    >
      <form id="service-form" onSubmit={handleSubmit} noValidate className="form-grid">
        <div className={`field field--full ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="s-name">Nombre del servicio *</label>
          <input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          {errors.name && <p className="field__error">{errors.name}</p>}
        </div>
        <div className="field field--full">
          <label htmlFor="s-desc">Descripción</label>
          <textarea
            id="s-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
        </div>
        <div className={`field ${errors.price ? 'has-error' : ''}`}>
          <label htmlFor="s-price">Precio (€) *</label>
          <input
            id="s-price"
            inputMode="decimal"
            placeholder="0,00"
            value={priceText}
            onChange={(e) => setPriceText(e.target.value)}
            onBlur={() => parsed !== null && setPriceText(centsToInput(parsed))}
          />
          {errors.price ? (
            <p className="field__error">{errors.price}</p>
          ) : (
            parsed !== null && <p className="field__hint">{formatCents(parsed)}</p>
          )}
        </div>
        <div className="field">
          <span className="field__label" id="s-status-label">Estado</span>
          <div className="segmented" role="radiogroup" aria-labelledby="s-status-label">
            {(['active', 'inactive'] as const).map((s) => (
              <label key={s} className={`segmented__opt ${status === s ? 'is-on' : ''}`}>
                <input type="radio" name="s-status" value={s} checked={status === s} onChange={() => setStatus(s)} />
                {s === 'active' ? 'Activo' : 'Inactivo'}
              </label>
            ))}
          </div>
        </div>
        {priceChanged && (
          <p className="alert alert--info field--full">
            El nuevo precio solo se aplicará a las próximas asignaciones. Los caballos que ya tienen este servicio
            conservan el precio con el que se les asignó.
          </p>
        )}
      </form>
    </Modal>
  );
}
