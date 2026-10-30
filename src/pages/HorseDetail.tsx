import { Modal } from '../components/Modal';
import { HorseStatusBadge } from '../components/ui';
import { formatDate } from '../lib/dates';
import { formatCents } from '../lib/money';
import type { Horse } from '../lib/types';

function formatTimestamp(ts: Horse['createdAt']) {
  return ts ? ts.toDate().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : '—';
}

interface Props {
  horse: Horse;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  toggling: boolean;
}

export function HorseDetail({ horse, onClose, onEdit, onToggleStatus, toggling }: Props) {
  return (
    <Modal
      title={horse.name}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn--ghost" onClick={onToggleStatus} disabled={toggling}>
            {horse.status === 'in_progress' ? 'Marcar terminado' : 'Reabrir'}
          </button>
          <button type="button" className="btn btn--primary" onClick={onEdit}>
            Editar
          </button>
        </>
      }
    >
      <dl className="detail-grid">
        <dt>Cliente</dt>
        <dd>{horse.clientName}</dd>
        <dt>Ubicación</dt>
        <dd>{horse.location || '—'}</dd>
        <dt>Fecha de alta</dt>
        <dd>{formatDate(horse.registrationDate)}</dd>
        <dt>Estado</dt>
        <dd>
          <HorseStatusBadge status={horse.status} />
        </dd>
      </dl>
      <h3 className="section-title">Servicios contratados</h3>
      {horse.services.length === 0 ? (
        <p className="muted">Sin servicios asignados.</p>
      ) : (
        <table className="mini-table">
          <tbody>
            {horse.services.map((s) => (
              <tr key={s.serviceId}>
                <td>{s.name}</td>
                <td className="num">{formatCents(s.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">Total</th>
              <td className="num">
                <strong>{formatCents(horse.totalPrice)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
      <p className="meta">
        Creado: {formatTimestamp(horse.createdAt)} · Última modificación: {formatTimestamp(horse.updatedAt)}
      </p>
    </Modal>
  );
}
