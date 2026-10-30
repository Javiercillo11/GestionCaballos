import { useCallback, useMemo, useState } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { RowMenu } from '../components/RowMenu';
import { EmptyState, ErrorState, HorseStatusBadge, Pagination, SortHeader, Spinner } from '../components/ui';
import { useData } from '../context/DataContext';
import { formatDate } from '../lib/dates';
import { assertOnline, errorMessage } from '../lib/errors';
import { formatCents } from '../lib/money';
import type { Horse, HorseStatus } from '../lib/types';
import { normalize, PAGE_SIZE, useTable } from '../lib/useTable';
import { deleteHorse, setHorseStatus } from '../services/horses';
import { HorseDetail } from './HorseDetail';
import { HorseForm } from './HorseForm';

type SortKey = 'name' | 'clientName' | 'totalPrice' | 'location' | 'registrationDate' | 'status';
type Filter = 'all' | HorseStatus;

const sortValue = (h: Horse, key: SortKey): string | number => h[key];

export function HorsesPage() {
  const { horses } = useData();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<Horse | 'new' | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Horse | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const inProgress = horses.items.filter((h) => h.status === 'in_progress').length;
    return { all: horses.items.length, inProgress, finished: horses.items.length - inProgress };
  }, [horses.items]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return horses.items.filter(
      (h) =>
        (filter === 'all' || h.status === filter) &&
        (!q || normalize(h.name).includes(q) || normalize(h.clientName).includes(q)),
    );
  }, [horses.items, search, filter]);

  const getValue = useCallback(sortValue, []);
  const table = useTable<Horse, SortKey>(filtered, getValue, 'name');
  const viewing = viewingId ? horses.items.find((h) => h.id === viewingId) ?? null : null;

  async function toggleStatus(h: Horse) {
    if (togglingId) return;
    const next: HorseStatus = h.status === 'in_progress' ? 'finished' : 'in_progress';
    setTogglingId(h.id);
    try {
      assertOnline();
      await setHorseStatus(h.id, next);
      toast('success', `«${h.name}» marcado como ${next === 'finished' ? 'terminado' : 'en curso'}.`);
    } catch (err) {
      toast('error', errorMessage(err, 'No se ha podido cambiar el estado.'));
    } finally {
      setTogglingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      assertOnline();
      await deleteHorse(deleting.id);
      toast('success', `Caballo «${deleting.name}» eliminado.`);
      setDeleting(null);
    } catch (err) {
      toast('error', errorMessage(err, 'No se ha podido eliminar el caballo.'));
    }
  }

  function changeFilter(f: Filter) {
    setFilter(f);
    table.setPage(1);
  }

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Caballos</h1>
          <p className="page__subtitle">
            {counts.all} registrados · {counts.inProgress} en curso · {counts.finished} terminados
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
          + Nuevo caballo
        </button>
      </header>

      <div className="toolbar">
        <input
          type="search"
          className="toolbar__search"
          placeholder="Buscar por caballo o cliente…"
          aria-label="Buscar por nombre del caballo o del cliente"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            table.setPage(1);
          }}
        />
        <div className="segmented" role="group" aria-label="Filtrar por estado">
          {(
            [
              ['all', `Todos (${counts.all})`],
              ['in_progress', `En curso (${counts.inProgress})`],
              ['finished', `Terminados (${counts.finished})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`segmented__opt ${filter === value ? 'is-on' : ''}`}
              aria-pressed={filter === value}
              onClick={() => changeFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        {horses.loading ? (
          <Spinner label="Cargando caballos…" />
        ) : horses.error ? (
          <ErrorState message={horses.error} />
        ) : horses.items.length === 0 ? (
          <EmptyState
            title="Todavía no hay caballos registrados"
            text="Da de alta el primer caballo para empezar a gestionar sus servicios."
            action={
              <button type="button" className="btn btn--primary" onClick={() => setEditing('new')}>
                + Nuevo caballo
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Sin resultados" text="Ningún caballo coincide con la búsqueda o el filtro aplicado." />
        ) : (
          <>
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <SortHeader label="Caballo" field="name" {...table} />
                    <SortHeader label="Cliente" field="clientName" {...table} />
                    <th scope="col">Servicios</th>
                    <SortHeader label="Precio total" field="totalPrice" align="right" {...table} />
                    <SortHeader label="Ubicación" field="location" {...table} />
                    <SortHeader label="Fecha de alta" field="registrationDate" {...table} />
                    <SortHeader label="Estado" field="status" {...table} />
                    <th scope="col" className="actions-col">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.pageRows.map((h) => (
                    <tr
                      key={h.id}
                      className={`row-link ${h.status === 'finished' ? 'is-finished' : ''}`}
                      tabIndex={0}
                      aria-label={`Ver ${h.name}`}
                      onClick={() => setViewingId(h.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setViewingId(h.id);
                        }
                      }}
                    >
                      <td data-label="Caballo" className="cell-strong">
                        {h.name}
                      </td>
                      <td data-label="Cliente">{h.clientName}</td>
                      <td data-label="Servicios">
                        {h.services.length === 0 ? (
                          <span className="muted">—</span>
                        ) : (
                          <ul className="chips">
                            {h.services.map((s) => (
                              <li key={s.serviceId} className="chip" title={formatCents(s.price)}>
                                {s.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td data-label="Precio total" className="num cell-strong">
                        {formatCents(h.totalPrice)}
                      </td>
                      <td data-label="Ubicación">{h.location || <span className="muted">—</span>}</td>
                      <td data-label="Fecha de alta">{formatDate(h.registrationDate)}</td>
                      <td data-label="Estado">
                        <HorseStatusBadge status={h.status} />
                      </td>
                      <td data-label="Acciones" className="actions-col">
                        <RowMenu
                          label={`Acciones de ${h.name}`}
                          items={[
                            { label: 'Editar', onSelect: () => setEditing(h) },
                            { label: 'Eliminar', onSelect: () => setDeleting(h), danger: true },
                          ]}
                        />
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

      {editing && <HorseForm horse={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {viewing && (
        <HorseDetail
          horse={viewing}
          onClose={() => setViewingId(null)}
          onToggleStatus={() => toggleStatus(viewing)}
          toggling={togglingId === viewing.id}
          onEdit={() => {
            setViewingId(null);
            setEditing(viewing);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Eliminar caballo"
          message={
            <>
              ¿Seguro que quieres eliminar a <strong>{deleting.name}</strong> (cliente {deleting.clientName})? Esta
              acción no se puede deshacer.
            </>
          }
          confirmLabel="Eliminar"
          danger
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  );
}
