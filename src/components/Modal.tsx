import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Evita cerrar mientras hay una operación en curso. */
  busy?: boolean;
}

export function Modal({ title, onClose, children, footer, size = 'md', busy = false }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const first = dialogRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not(.modal__close)');
    first?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, busy]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div ref={dialogRef} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="modal__close" aria-label="Cerrar" onClick={onClose} disabled={busy}>
            ×
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>
  );
}
