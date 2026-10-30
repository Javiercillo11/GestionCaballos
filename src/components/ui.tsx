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

const ICONS = {
  view: <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  edit: <path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" />,
  power: <path d="M12 3v8M6.3 6.3a8 8 0 1 0 11.4 0" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
};

/** Botón de acción compacto: icono en escritorio, icono + texto en móvil. */
export function IconButton({
  icon,
  label,
  onClick,
  disabled,
  variant,
}: {
  icon: keyof typeof ICONS;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'danger' | 'on';
}) {
  return (
    <button
      type="button"
      className={`icon-btn ${variant ? `icon-btn--${variant}` : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {ICONS[icon]}
      </svg>
      <span className="icon-btn__text" aria-hidden="true">
        {label}
      </span>
    </button>
  );
}
