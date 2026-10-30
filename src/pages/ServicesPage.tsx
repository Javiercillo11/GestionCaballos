import { useCallback, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Modal } from '../components/Modal';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorState, Pagination, SortHeader, Spinner, StatusBadge } from '../components/ui';
import { useData } from '../context/DataContext';
import { assertOnline, errorMessage } from '../lib/errors';
import { formatCents } from '../lib/money';
import type { Service, Status } from '../lib/types';
import { normalize, PAGE_SIZE, useTable } from '../lib/useTable';
import { deleteServiceSafely, ServiceInUseError, setServiceStatus } from '../services/catalog';
import { ServiceForm } from './ServiceForm';

type SortKey = 'name' | 'price' | 'status';
type Filter = 'all' | Status;

const sortValue = (s: Service, key: SortKey): string | number => s[key];

export function ServicesPage() {
  const { services, horses } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Service | 'new' | null>(null);
  const [viewing, setViewing] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [blocked, setBlocked] = useState<{ service: Service; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Uso de cada servicio según los caballos cargados (informativo; la
  // eliminación vuelve a comprobarlo contra Firestore).
  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const h of horses.items) for (const id of h.serviceIds) map.set(id, (map.get(id) ?? 0) + 1);
    return map;
  }, [horses.items]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return services.items.filter(
      (s) =>
        (filter === 'all' || s.status === filter) &&
        (!q || normalize(s.name).includes(q) || normalize(s.description).includes(q)),
    );
  }, [services.items, search, filter]);

  const getValue = useCallback(sortValue, []);
  const table = useTable<Service, SortKey>(filtered, getValue, 'name');

  async function toggleStatus(s: Service) {
    if (togglingId) return;
    const next: Status = s.status === 'active' ? 'inactive' : 'active';
    setTogglingId(s.id);
    try {
      assertOnline();
      await setServiceStatus(s.id, next);
      toast('success', `Servicio «${s.name}» ${next === 'active' ? 'activado' : 'desactivado'}.`);
    } catch (err) {
      toast('error', errorMessage(err, 'No se ha podido cambiar el estado.'));
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    try {
      assertOnline();
      await deleteServiceSafely(target.id);
      toast('success', `Servicio «${target.name}» eliminado.`);
      setDeleting(null);
    } catch (err) {
      setDeleting(null);
      if (err instanceof ServiceInUseError) setBlocked({ service: target, message: err.message });
      else toast('error', errorMessage(err, 'No se ha podido eliminar el servicio.'));
    }
  }

  function requestDelete(s: Service) {
    const used = usage.get(s.id) ?? 0;
    if (used > 0) {
      setBlocked({ service: s, message: new ServiceInUseError(used).message });
    } else {
      setDeleting(s);
    }
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Servicios</h1>
          <p className="page__subtitle">Catálogo de servicios que se pueden asignar a los caballos.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Nuevo servicio
        </button>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Buscar servicio…"
          aria-label="Buscar servicio"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            table.setPage(1);
          }}
        />
        <div className="segmented" role="group" aria-label="Filtrar por estado">
          {(
            [
              ['all', 'Todos'],
              ['active', 'Activos'],
              ['inactive', 'Inactivos'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`segmented__opt ${filter === value ? 'is-on' : ''}`}
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                table.setPage(1);
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {services.loading ? (
          <Spinner label="Cargando servicios…" />
        ) : services.error ? (
          <ErrorState message={services.error} />
        ) : services.items.length === 0 ? (
          <EmptyState
            title="El catálogo está vacío"
            text="Crea los servicios que ofreces (pupilaje, herraje, doma…) para poder asignarlos a los caballos."
            action={
              <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                + Nuevo servicio
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin resultados" text="Ningún servicio coincide con la búsqueda o el filtro aplicado." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <SortHeader label="Servicio" field="name" {...table} />
                    <th scope="col">Descripción</th>
                    <SortHeader label="Precio" field="price" align="right" {...table} />
                    <th scope="col" className="num">
                      Caballos
                    </th>
                    <SortHeader label="Estado" field="status" {...table} />
                    <th scope="col" className="actions-col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.pageRows.map((s) => (
                    <tr key={s.id} className={s.status === 'inactive' ? 'is-inactive' : undefined}>
                      <td data-label="Servicio" className="cell-strong">
                        <button type="button" className="link-btn link-btn--inline" onClick={() => setViewing(s)}>
                          {s.name}
                        </button>
                      </td>
                      <td data-label="Descripción" className="cell-desc">
                        {s.description || <span className="muted">—</span>}
                      </td>
                      <td data-label="Precio" className="num cell-strong">
                        {formatCents(s.price)}
                      </td>
                      <td data-label="Caballos" className="num">
                        {usage.get(s.id) ?? 0}
                      </td>
                      <td data-label="Estado">
                        <StatusBadge status={s.status} />
                      </td>
                      <td data-label="Acciones" className="actions-col">
                        <div className="row-actions">
                          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setEditing(s)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm"
                            onClick={() => toggleStatus(s)}
                            disabled={togglingId === s.id}
                          >
                            {s.status === 'active' ? 'Desactivar' : 'Activar'}
                          </button>
                          <button
                            type="button"
                            className="btn btn--ghost btn--sm btn--danger-text"
                            onClick={() => requestDelete(s)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={table.page}
              pageCount={table.pageCount}
              total={table.total}
              pageSize={PAGE_SIZE}
              onPage={table.setPage}
            />
          </>
        )}
      </div>

      {editing && <ServiceForm service={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {viewing && (
        <Modal
          title={viewing.name}
          onClose={() => setViewing(null)}
          footer={
            <>
              <button type="button" className="btn btn--ghost" onClick={() => setViewing(null)}>
                Cerrar
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => {
                  setEditing(viewing);
                  setViewing(null);
                }}
              >
                Editar
              </button>
            </>
          }
        >
          <dl className="detail-grid">
            <dt>Descripción</dt>
            <dd>{viewing.description || '—'}</dd>
            <dt>Precio actual</dt>
            <dd>{formatCents(viewing.price)}</dd>
            <dt>Estado</dt>
            <dd>
              <StatusBadge status={viewing.status} />
            </dd>
            <dt>Asignado a</dt>
            <dd>
              {usage.get(viewing.id) ?? 0} caballo{(usage.get(viewing.id) ?? 0) === 1 ? '' : 's'}
            </dd>
          </dl>
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title="Eliminar servicio"
          message={
            <>
              ¿Seguro que quieres eliminar el servicio <strong>{deleting.name}</strong>? No está asignado a ningún
              caballo. Esta acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
      {blocked && (
        <ConfirmDialog
          title="No se puede eliminar"
          message={<p>{blocked.message}</p>}
          confirmLabel={blocked.service.status === 'active' ? 'Desactivar servicio' : 'Entendido'}
          onConfirm={async () => {
            if (blocked.service.status === 'active') await toggleStatus(blocked.service);
            setBlocked(null);
          }}
          onClose={() => setBlocked(null)}
        />
      )}
    </section>
  );
}
