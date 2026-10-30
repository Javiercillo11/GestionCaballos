import { useState, type ReactNode } from 'react';
import { Modal } from './Modal';

interface Props {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel, danger, onConfirm, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="sm"
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-message">{message}</div>
    </Modal>
  );
}
