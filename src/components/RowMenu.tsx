import { useEffect, useRef, useState } from 'react';

export interface RowMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * Menú de acciones de una fila (botón «⋮»). El desplegable usa posición fija
 * para no quedar recortado por el scroll horizontal de la tabla.
 */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = pos !== null;

  useEffect(() => {
    if (!open) return;
    const close = () => setPos(null);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        btnRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (open) return setPos(null);
    const r = btnRef.current!.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: Math.max(8, window.innerWidth - r.right) });
  }

  function onMenuKey(e: React.KeyboardEvent) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const els = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = els.indexOf(document.activeElement as HTMLElement);
    els[(i + (e.key === 'ArrowDown' ? 1 : -1) + els.length) % els.length]?.focus();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`kebab ${open ? 'is-open' : ''}`}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="5" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="12" cy="19" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          ref={menuRef}
          className="menu"
          role="menu"
          style={{ top: pos.top, right: pos.right }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onMenuKey}
        >
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              className={`menu__item ${it.danger ? 'menu__item--danger' : ''}`}
              onClick={() => {
                setPos(null);
                it.onSelect();
              }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
