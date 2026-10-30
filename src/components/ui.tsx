import type { ReactNode } from 'react';
import type { Status } from '../lib/types';

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`badge badge--${status}`}>
      <span className="badge__dot" aria-hidden="true" />
      {status === 'active' ? 'Activo' : 'Inactivo'}
    </span>
  );
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {text && <p className="empty__text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="empty empty--error" role="alert">
      <p className="empty__title">No se han podido cargar los datos</p>
      <p className="empty__text">{message}</p>
    </div>
  );
}

export type SortDir = 'asc' | 'desc';

export function SortHeader<K extends string>({
  label,
  field,
  sortKey,
  sortDir,
  onSort,
  align,
}: {
  label: string;
  field: K;
  sortKey: K;
  sortDir: SortDir;
  onSort: (field: K) => void;
  align?: 'right';
}) {
  const active = sortKey === field;
  return (
    <th
      scope="col"
      aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={align === 'right' ? 'num' : undefined}
    >
      <button type="button" className={`sort-btn ${active ? 'is-active' : ''}`} onClick={() => onSort(field)}>
        {label}
        <span className="sort-btn__icon" aria-hidden="true">
          {active ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </button>
    </th>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <nav className="pagination" aria-label="Paginación">
      <span className="pagination__info">
        {from}–{to} de {total}
      </span>
      {pageCount > 1 && (
        <div className="pagination__controls">
          <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
            ‹ Anterior
          </button>
          <span className="pagination__page">
            Página {page} de {pageCount}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            disabled={page >= pageCount}
            onClick={() => onPage(page + 1)}
          >
            Siguiente ›
          </button>
        </div>
      )}
    </nav>
  );
}
