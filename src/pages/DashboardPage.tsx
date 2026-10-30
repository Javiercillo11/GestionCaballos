import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, Spinner } from '../components/ui';
import { useData } from '../context/DataContext';
import { formatCents } from '../lib/money';
import { summarize } from '../lib/stats';

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function DashboardPage() {
  const { horses } = useData();
  const s = useMemo(() => summarize(horses.items), [horses.items]);
  const billable = s.pending + s.earned;
  const earnedPct = percent(s.earned, billable);

  return (
    <section className="page">
      <header className="page__header">
        <div>
          <h1>Resumen</h1>
          <p className="page__subtitle">Situación de los caballos y de los importes según su estado.</p>
        </div>
      </header>

      {horses.loading ? (
        <div className="card">
          <Spinner label="Calculando resumen…" />
        </div>
      ) : horses.error ? (
        <div className="card">
          <ErrorState message={horses.error} />
        </div>
      ) : s.total === 0 ? (
        <div className="card">
          <EmptyState
            title="Aún no hay datos que resumir"
            text="Cuando des de alta caballos verás aquí el dinero ganado y el pendiente."
            action={
              <Link to="/caballos" className="btn btn--primary">
                Ir a Caballos
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div className="kpis">
            <article className="kpi" data-testid="kpi-total">
              <p className="kpi__label">Total de caballos</p>
              <p className="kpi__value">{s.total}</p>
              <p className="kpi__meta">
                {s.inProgress} en curso · {s.finished} terminado{s.finished === 1 ? '' : 's'}
              </p>
            </article>
            <article className="kpi" data-testid="kpi-pending">
              <p className="kpi__label">
                <span className="swatch swatch--pending" aria-hidden="true" />
                Dinero por ganar
              </p>
              <p className="kpi__value">{formatCents(s.pending)}</p>
              <p className="kpi__meta">
                {s.inProgress} caballo{s.inProgress === 1 ? '' : 's'} en curso
              </p>
            </article>
            <article className="kpi" data-testid="kpi-earned">
              <p className="kpi__label">
                <span className="swatch swatch--earned" aria-hidden="true" />
                Dinero ganado
              </p>
              <p className="kpi__value">{formatCents(s.earned)}</p>
              <p className="kpi__meta">
                {s.finished} caballo{s.finished === 1 ? '' : 's'} terminado{s.finished === 1 ? '' : 's'}
              </p>
            </article>
          </div>

          <div className="card card--pad">
            <div className="split__head">
              <h2 className="section-title">Ganado frente a pendiente</h2>
              <p className="muted">Total: {formatCents(billable)}</p>
            </div>
            {billable === 0 ? (
              <p className="muted">Los caballos registrados no tienen servicios con importe.</p>
            ) : (
              <>
                <div
                  className="split"
                  role="img"
                  aria-label={`Ganado ${formatCents(s.earned)} (${earnedPct} %), por ganar ${formatCents(s.pending)} (${100 - earnedPct} %)`}
                >
                  {s.earned > 0 && (
                    <div
                      className="split__seg split__seg--earned"
                      style={{ flexGrow: s.earned }}
                      title={`Ganado: ${formatCents(s.earned)} (${earnedPct} %)`}
                    />
                  )}
                  {s.pending > 0 && (
                    <div
                      className="split__seg split__seg--pending"
                      style={{ flexGrow: s.pending }}
                      title={`Por ganar: ${formatCents(s.pending)} (${100 - earnedPct} %)`}
                    />
                  )}
                </div>
                <ul className="legend">
                  <li>
                    <span className="swatch swatch--earned" aria-hidden="true" />
                    Ganado <strong>{formatCents(s.earned)}</strong> <span className="muted">{earnedPct} %</span>
                  </li>
                  <li>
                    <span className="swatch swatch--pending" aria-hidden="true" />
                    Por ganar <strong>{formatCents(s.pending)}</strong>{' '}
                    <span className="muted">{100 - earnedPct} %</span>
                  </li>
                </ul>
              </>
            )}
          </div>

          <div className="card">
            <h2 className="section-title card__title">Por cliente</h2>
            <div className="table-wrap">
              <table className="table table--responsive">
                <thead>
                  <tr>
                    <th scope="col">Cliente</th>
                    <th scope="col" className="num">
                      Caballos
                    </th>
                    <th scope="col" className="num">
                      Por ganar
                    </th>
                    <th scope="col" className="num">
                      Ganado
                    </th>
                    <th scope="col" className="num">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {s.byClient.map((c) => (
                    <tr key={c.clientName}>
                      <td data-label="Cliente" className="cell-strong">
                        {c.clientName}
                      </td>
                      <td data-label="Caballos" className="num">
                        {c.horses}
                      </td>
                      <td data-label="Por ganar" className="num">
                        {formatCents(c.pending)}
                      </td>
                      <td data-label="Ganado" className="num">
                        {formatCents(c.earned)}
                      </td>
                      <td data-label="Total" className="num cell-strong">
                        {formatCents(c.pending + c.earned)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td data-label="Caballos" className="num">
                      {s.total}
                    </td>
                    <td data-label="Por ganar" className="num">
                      {formatCents(s.pending)}
                    </td>
                    <td data-label="Ganado" className="num">
                      {formatCents(s.earned)}
                    </td>
                    <td data-label="Total" className="num cell-strong">
                      {formatCents(billable)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
