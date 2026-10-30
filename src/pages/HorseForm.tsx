import { useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { todayISO, isValidISODate } from '../lib/dates';
import { assertOnline, errorMessage } from '../lib/errors';
import { buildAssignedServices, formatCents, sumCents } from '../lib/money';
import { HORSE_STATUSES, HORSE_STATUS_LABEL } from '../lib/horseStatus';
import type { Horse, HorseStatus } from '../lib/types';
import { createHorse, updateHorse } from '../services/horses';

interface Props {
  horse: Horse | null;
  onClose: () => void;
}

type Errors = Partial<Record<'name' | 'clientName' | 'registrationDate', string>>;

export function HorseForm({ horse, onClose }: Props) {
  const { services } = useData();
  const toast = useToast();
  const [name, setName] = useState(horse?.name ?? '');
  const [clientName, setClientName] = useState(horse?.clientName ?? '');
  const [location, setLocation] = useState(horse?.location ?? '');
  const [registrationDate, setRegistrationDate] = useState(horse?.registrationDate ?? todayISO());
  const [status, setStatus] = useState<HorseStatus>(horse?.status ?? 'in_progress');
  const [selectedIds, setSelectedIds] = useState<string[]>(horse?.serviceIds ?? []);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const previous = horse?.services ?? [];
  const assigned = useMemo(
    () => buildAssignedServices(selectedIds, previous, services.items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, services.items],
  );
  const total = sumCents(assigned);

  // Opciones: servicios activos del catálogo + los ya asignados (aunque estén
  // inactivos o se hayan eliminado del catálogo), para no perderlos al editar.
  const options = useMemo(() => {
    const prevById = new Map(previous.map((s) => [s.serviceId, s]));
    const list = services.items
      .filter((s) => s.status === 'active' || prevById.has(s.id))
      .map((s) => {
        const prev = prevById.get(s.id);
        return {
          id: s.id,
          name: prev?.name ?? s.name,
          description: s.description,
          price: prev?.price ?? s.price,
          catalogPrice: s.price,
          inactive: s.status === 'inactive',
          kept: !!prev,
        };
      });
    for (const prev of previous) {
      if (!services.items.some((s) => s.id === prev.serviceId)) {
        list.push({
          id: prev.serviceId,
          name: prev.name,
          description: 'Ya no existe en el catálogo',
          price: prev.price,
          catalogPrice: prev.price,
          inactive: true,
          kept: true,
        });
      }
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services.items]);

  function toggle(id: string) {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!name.trim()) e.name = 'El nombre del caballo es obligatorio.';
    else if (name.trim().length > 100) e.name = 'Máximo 100 caracteres.';
    if (!clientName.trim()) e.clientName = 'El nombre del cliente es obligatorio.';
    else if (clientName.trim().length > 100) e.clientName = 'Máximo 100 caracteres.';
    if (!isValidISODate(registrationDate)) e.registrationDate = 'Indica una fecha de alta válida.';
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (saving) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    try {
      assertOnline();
      const input = { name, clientName, location, registrationDate, status, services: assigned };
      if (horse) await updateHorse(horse.id, input);
      else await createHorse(input);
      toast('success', horse ? `Caballo «${name.trim()}» actualizado.` : `Caballo «${name.trim()}» creado.`);
      onClose();
    } catch (err) {
      toast('error', errorMessage(err, 'No se ha podido guardar el caballo.'));
      setSaving(false);
    }
  }

  return (
    <Modal
      title={horse ? 'Editar caballo' : 'Nuevo caballo'}
      onClose={onClose}
      size="lg"
      busy={saving}
      footer={
        <>
          <div className="form-total">
            <span>Precio total</span>
            <strong data-testid="form-total">{formatCents(total)}</strong>
          </div>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="horse-form" className="btn btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : horse ? 'Guardar cambios' : 'Crear caballo'}
          </button>
        </>
      }
    >
      <form id="horse-form" onSubmit={handleSubmit} noValidate className="form-grid">
        <div className={`field ${errors.name ? 'has-error' : ''}`}>
          <label htmlFor="h-name">Nombre del caballo *</label>
          <input id="h-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          {errors.name && <p className="field__error">{errors.name}</p>}
        </div>
        <div className={`field ${errors.clientName ? 'has-error' : ''}`}>
          <label htmlFor="h-client">Nombre del cliente *</label>
          <input id="h-client" value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={100} />
          {errors.clientName && <p className="field__error">{errors.clientName}</p>}
        </div>
        <div className="field">
          <label htmlFor="h-location">Ubicación</label>
          <input
            id="h-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={200}
            placeholder="Ej.: Box 12, Pista norte, Finca El Prado…"
          />
        </div>
        <div className={`field ${errors.registrationDate ? 'has-error' : ''}`}>
          <label htmlFor="h-date">Fecha de alta *</label>
          <input id="h-date" type="date" value={registrationDate} onChange={(e) => setRegistrationDate(e.target.value)} />
          {errors.registrationDate && <p className="field__error">{errors.registrationDate}</p>}
        </div>
        <div className="field">
          <span className="field__label" id="h-status-label">Estado</span>
          <div className="segmented" role="radiogroup" aria-labelledby="h-status-label">
            {HORSE_STATUSES.map((s) => (
              <label key={s} className={`segmented__opt ${status === s ? 'is-on' : ''}`}>
                <input type="radio" name="status" value={s} checked={status === s} onChange={() => setStatus(s)} />
                {HORSE_STATUS_LABEL[s]}
              </label>
            ))}
          </div>
        </div>

        <fieldset className="field field--full services-picker">
          <legend>
            Servicios <span className="muted">({assigned.length} seleccionado{assigned.length === 1 ? '' : 's'})</span>
          </legend>
          {services.loading ? (
            <p className="muted">Cargando servicios…</p>
          ) : options.length === 0 ? (
            <p className="muted">No hay servicios activos. Créalos en la sección Servicios.</p>
          ) : (
            <div className="service-options">
              {options.map((o) => {
                const checked = selectedIds.includes(o.id);
                return (
                  <label key={o.id} className={`service-option ${checked ? 'is-checked' : ''}`}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(o.id)} />
                    <span className="service-option__body">
                      <span className="service-option__name">
                        {o.name}
                        {o.inactive && <span className="tag">inactivo</span>}
                      </span>
                      {o.description && <span className="service-option__desc">{o.description}</span>}
                      {o.kept && o.price !== o.catalogPrice && (
                        <span className="service-option__desc">
                          Precio asignado conservado · catálogo actual {formatCents(o.catalogPrice)}
                        </span>
                      )}
                    </span>
                    <span className="service-option__price">{formatCents(o.price)}</span>
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  );
}
