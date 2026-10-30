import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Kind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: Kind;
  message: string;
}

const ToastContext = createContext<(kind: Kind, message: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setItems((all) => all.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (kind: Kind, message: string) => {
      const id = nextId.current++;
      setItems((all) => [...all.slice(-3), { id, kind, message }]);
      window.setTimeout(() => dismiss(id), kind === 'error' ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`}>
            <span>{t.message}</span>
            <button type="button" className="toast__close" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
