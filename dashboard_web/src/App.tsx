import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchActiveSessions,
  fetchInfractions,
  fetchReports,
  fetchScans,
  registrarInfraccion,
  type Infraction,
  type LPRScan,
  type ParkingSession,
  type ReportPeriod,
  type ReportsResponse,
} from './api'
import './App.css'

const POLL_MS = 4000

const REPORT_PERIODS: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'day', label: 'Día' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
  { value: '', label: 'Histórico' },
]

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatMoney(value: string | number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(Number(value))
}

export default function App() {
  const [sessions, setSessions] = useState<ParkingSession[]>([])
  const [infractions, setInfractions] = useState<
    Array<Infraction & { patente: string }>
  >([])
  const [scans, setScans] = useState<LPRScan[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('day')
  const [report, setReport] = useState<ReportsResponse | null>(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState<string | null>(null)

  const loadReports = useCallback(async (period: ReportPeriod) => {
    setReportLoading(true)
    setReportError(null)
    try {
      setReport(await fetchReports(period))
    } catch (err) {
      setReport(null)
      setReportError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los reportes',
      )
    } finally {
      setReportLoading(false)
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const [active, infracciones, lecturas] = await Promise.all([
        fetchActiveSessions(),
        fetchInfractions(),
        fetchScans(),
      ])
      setSessions(active)
      setInfractions(infracciones)
      setScans(lecturas)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con la API Django',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => {
      void load()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  useEffect(() => {
    void loadReports(reportPeriod)
  }, [reportPeriod, loadReports])

  const filteredSessions = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return sessions
    return sessions.filter((s) => s.patente.includes(q))
  }, [sessions, query])

  const filteredInfractions = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return infractions
    return infractions.filter((i) => i.patente.includes(q))
  }, [infractions, query])

  const filteredScans = useMemo(() => {
    const q = query.trim().toUpperCase()
    if (!q) return scans.slice(0, 8)
    return scans.filter((s) => s.patente_leida.includes(q)).slice(0, 8)
  }, [scans, query])

  const onRegister = async () => {
    const patente = query.trim().toUpperCase()
    if (!patente) {
      setActionMessage('Ingresá una patente para registrar la infracción.')
      return
    }
    setRegistering(true)
    setActionMessage(null)
    try {
      const result = await registrarInfraccion(patente)
      setActionMessage(
        `${result.mensaje} ${result.patente} · ${formatMoney(result.monto_multa)}` +
          (result.tenia_sesion_activa ? ' (tenía sesión activa)' : ''),
      )
      setQuery('')
      await load()
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'No se pudo registrar')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Municipalidad de Casilda</p>
          <h1>Casilda Conecta · Fiscalización</h1>
        </div>
        <div className="header-meta">
          <span className={`dot ${error ? 'offline' : 'online'}`} />
          <span>
            {error
              ? 'API offline'
              : `En vivo · actualiza cada ${POLL_MS / 1000}s`}
          </span>
          {lastUpdate ? (
            <small>Última: {formatDate(lastUpdate.toISOString())}</small>
          ) : null}
        </div>
      </header>

      <section className="search-panel">
        <label htmlFor="lpr-search">Buscador rápido por patente (LPR)</label>
        <div className="search-row">
          <input
            id="lpr-search"
            value={query}
            onChange={(e) => setQuery(e.target.value.toUpperCase())}
            placeholder="Ej: AB123CD"
            maxLength={10}
          />
          <button
            type="button"
            className="btn-primary"
            disabled={registering}
            onClick={() => void onRegister()}
          >
            {registering ? 'Registrando…' : 'Registrar infracción'}
          </button>
        </div>
        <p className="field-hint">Formatos válidos: ABC123, AB123CD</p>
        {actionMessage ? <p className="action-msg">{actionMessage}</p> : null}
      </section>

      <section className="metrics">
        <article className="metric">
          <span>Sesiones activas</span>
          <strong>{sessions.length}</strong>
        </article>
        <article className="metric danger">
          <span>Infracciones</span>
          <strong>{infractions.length}</strong>
        </article>
        <article className="metric">
          <span>Escaneos LPR</span>
          <strong>{scans.length}</strong>
        </article>
      </section>

      <section className="reports-panel">
        <div className="reports-header">
          <div>
            <h2>Reportes estadísticos</h2>
            <p>Indicadores de recaudación e infracciones por período</p>
          </div>
          <div className="period-selector" role="group" aria-label="Período del reporte">
            {REPORT_PERIODS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`period-btn ${reportPeriod === item.value ? 'active' : ''}`}
                onClick={() => setReportPeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {reportError ? <p className="banner-error">{reportError}</p> : null}
        {reportLoading ? <p className="muted">Cargando reportes…</p> : null}

        {!reportLoading && report ? (
          <div className="report-metrics">
            <article className="report-card">
              <span>Vehículos estacionados</span>
              <strong>{report.vehiculos_estacionados}</strong>
            </article>
            <article className="report-card">
              <span>Monto recaudado</span>
              <strong>{formatMoney(report.monto_recaudado)}</strong>
            </article>
            <article className="report-card danger">
              <span>Cantidad de infracciones</span>
              <strong>{report.cantidad_infracciones}</strong>
            </article>
            <article className="report-card danger">
              <span>Monto infracciones</span>
              <strong>{formatMoney(report.monto_infracciones)}</strong>
            </article>
          </div>
        ) : null}
      </section>

      {error ? <p className="banner-error">{error}</p> : null}
      {loading ? <p className="muted">Cargando panel…</p> : null}

      <section className="grid">
        <div className="panel">
          <h2>Sesiones activas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patente</th>
                  <th>Usuario</th>
                  <th>Inicio</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      No hay sesiones activas
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session.id}>
                      <td>{session.id}</td>
                      <td className="plate">{session.patente}</td>
                      <td>#{session.user_id}</td>
                      <td>{formatDate(session.inicio)}</td>
                      <td>
                        <span className="badge ok">VIGENTE</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Infracciones</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patente</th>
                  <th>Monto</th>
                  <th>Emisión</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredInfractions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty">
                      No hay infracciones registradas
                    </td>
                  </tr>
                ) : (
                  filteredInfractions.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td className="plate">{item.patente}</td>
                      <td>{formatMoney(item.monto_multa)}</td>
                      <td>{formatDate(item.fecha_emision)}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.estado === 'PENDIENTE' ? 'bad' : 'ok'
                          }`}
                        >
                          {item.estado === 'PENDIENTE'
                            ? 'EN INFRACCIÓN'
                            : item.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2>Últimos escaneos</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Patente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      Sin lecturas LPR
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((scan) => {
                    const vigente = Boolean(scan.parking_session)
                    return (
                      <tr key={scan.id}>
                        <td className="plate">{scan.patente_leida}</td>
                        <td>{formatDate(scan.fecha_hora)}</td>
                        <td>
                          <span className={`badge ${vigente ? 'ok' : 'bad'}`}>
                            {vigente ? 'VIGENTE' : 'SIN PAGO'}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-small"
                            onClick={() => {
                              setQuery(scan.patente_leida)
                            }}
                          >
                            Usar patente
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="footer">© 2026 Municipalidad de Casilda</footer>
    </div>
  )
}
