import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createActa,
  fetchSessionsBySeccion,
  type SeccionSession,
} from '../api'
import { CALLES_CASILDA, buildSeccion } from '../data/callesCasilda'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function openActaPdf(opts: {
  patente: string
  seccion: string
  timestamp: string
  fotoDataUrl?: string | null
  observaciones?: string
}) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
  if (!win) return
  const fotoHtml = opts.fotoDataUrl
    ? `<img src="${opts.fotoDataUrl}" alt="Respaldo fotográfico" style="max-width:100%;margin-top:16px;border:1px solid #ccc"/>`
    : '<p><em>Sin foto adjunta</em></p>'
  win.document.write(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <title>Acta infracción · ${opts.patente}</title>
  <style>
    body { font-family: Segoe UI, sans-serif; padding: 32px; color: #1e293b; }
    h1 { color: #0a6847; margin-bottom: 4px; }
    .meta { color: #64748b; margin-bottom: 24px; }
    .box { border: 2px solid #0a6847; border-radius: 12px; padding: 16px; }
    .badge { display:inline-block; background:#fee2e2; color:#991b1b; font-weight:800; padding:4px 10px; border-radius:999px; }
    @media print { button { display:none; } }
  </style>
</head>
<body>
  <h1>Acta de infracción (TESTING)</h1>
  <p class="meta">Municipalidad de Casilda · Estacionamiento Medido · No válido en gestión</p>
  <div class="box">
    <p><span class="badge">SIN PAGO / NO REGISTRADO</span></p>
    <p><strong>Patente:</strong> ${opts.patente}</p>
    <p><strong>Sección:</strong> ${opts.seccion || '—'}</p>
    <p><strong>Timestamp:</strong> ${opts.timestamp}</p>
    <p><strong>Observaciones:</strong> ${opts.observaciones || 'Vehículo no figura con estacionamiento activo en la sección.'}</p>
    ${fotoHtml}
  </div>
  <p style="margin-top:24px"><button onclick="window.print()">Imprimir / Guardar PDF</button></p>
  <p style="color:#64748b;font-size:12px">Impresión física en dispositivo municipal: pendiente de definición.</p>
</body>
</html>`)
  win.document.close()
}

/** Secciones frecuentes: calles × tramos 0–2000 */
function buildSeccionOptions(): string[] {
  const out: string[] = []
  for (const calle of CALLES_CASILDA) {
    for (let base = 0; base <= 2000; base += 100) {
      out.push(`${calle} ${base}-${base + 100}`)
    }
  }
  return out
}

const SECCION_OPTIONS = buildSeccionOptions()

export function SectionRondaPanel() {
  const [seccion, setSeccion] = useState('ESPAÑA 1200-1300')
  const [rows, setRows] = useState<SeccionSession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plateFilter, setPlateFilter] = useState('')
  const [actaMsg, setActaMsg] = useState<string | null>(null)
  const [actaLoading, setActaLoading] = useState(false)
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null)

  const load = useCallback(async (sec: string) => {
    if (!sec.trim()) return
    setLoading(true)
    setError(null)
    try {
      setRows(await fetchSessionsBySeccion(sec))
    } catch (err) {
      setRows([])
      setError(err instanceof Error ? err.message : 'No se pudo cargar la sección')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(seccion)
  }, [seccion, load])

  const filtered = useMemo(() => {
    const q = plateFilter.trim().toUpperCase()
    if (!q) return rows
    return rows.filter((r) => r.patente.includes(q))
  }, [rows, plateFilter])

  const plateMissing =
    plateFilter.trim().length >= 5 &&
    !rows.some((r) => r.patente === plateFilter.trim().toUpperCase())

  const onFoto = (file: File | null) => {
    if (!file) {
      setFotoDataUrl(null)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFotoDataUrl(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.readAsDataURL(file)
  }

  const onLabrarActa = async () => {
    const patente = plateFilter.trim().toUpperCase()
    if (!patente) return
    setActaLoading(true)
    setActaMsg(null)
    try {
      const acta = await createActa({
        patente,
        seccion,
        url_foto: fotoDataUrl,
        observaciones: `Vehículo sin registro activo en sección ${seccion}`,
      })
      openActaPdf({
        patente: acta.patente,
        seccion: acta.seccion ?? seccion,
        timestamp: formatDate(acta.timestamp),
        fotoDataUrl,
        observaciones: acta.observaciones ?? undefined,
      })
      setActaMsg(acta.mensaje)
    } catch (err) {
      setActaMsg(err instanceof Error ? err.message : 'No se pudo generar el acta')
    } finally {
      setActaLoading(false)
    }
  }

  return (
    <section className="ronda-panel">
      <div className="reports-header">
        <div>
          <h2>Ronda por sección</h2>
          <p>Testing — vehículos activos en la cuadra que recorre el inspector</p>
        </div>
        <div className="ronda-controls">
          <label htmlFor="seccion-select">Sección</label>
          <select
            id="seccion-select"
            value={seccion}
            onChange={(e) => setSeccion(e.target.value)}
          >
            {SECCION_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="button" className="btn-small" onClick={() => void load(seccion)}>
            Actualizar
          </button>
        </div>
      </div>

      <div className="search-row" style={{ marginBottom: 12 }}>
        <input
          value={plateFilter}
          onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
          placeholder="Buscar patente en esta sección"
          maxLength={10}
        />
      </div>

      {error ? <p className="banner-error">{error}</p> : null}
      {loading ? <p className="muted">Cargando sección…</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Duración</th>
              <th>Fin estimado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty">
                  No hay vehículos registrados en esta sección
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td className="plate">{row.patente}</td>
                  <td>{row.marca || '—'}</td>
                  <td>{row.modelo || '—'}</td>
                  <td>{row.duracion_minutos ? `${row.duracion_minutos} min` : '—'}</td>
                  <td>
                    {row.fin_estimado ? formatDate(row.fin_estimado) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {plateMissing ? (
        <div className="acta-box">
          <p>
            La patente <strong>{plateFilter.trim().toUpperCase()}</strong> no figura
            con pago activo en <strong>{seccion}</strong>.
          </p>
          <label className="acta-foto">
            Respaldo fotográfico (timestamp al labrar)
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onFoto(e.target.files?.[0] ?? null)}
            />
          </label>
          {fotoDataUrl ? (
            <img src={fotoDataUrl} alt="Preview" className="acta-preview" />
          ) : null}
          <button
            type="button"
            className="btn-primary"
            disabled={actaLoading}
            onClick={() => void onLabrarActa()}
          >
            {actaLoading ? 'Generando…' : 'Labrar acta (PDF)'}
          </button>
          {actaMsg ? <p className="action-msg">{actaMsg}</p> : null}
        </div>
      ) : null}

      <p className="field-hint">
        Tip: ejemplo de sección desde altura — {buildSeccion('ESPAÑA', 1250)}
      </p>
    </section>
  )
}
