import { Capacitor } from '@capacitor/core'

/**
 * En web (Vite) el proxy de /api alcanza a Django.
 * En Capacitor (dispositivo/emulador) hace falta una URL absoluta.
 * - Emulador Android: http://10.0.2.2:8000
 * - Celular físico: http://IP-DE-TU-PC:8000 (misma WiFi)
 * Override: VITE_API_URL
 */
const nativeFallback =
  Capacitor.getPlatform() === 'android'
    ? 'http://10.0.2.2:8000'
    : Capacitor.isNativePlatform()
      ? 'http://127.0.0.1:8000'
      : ''

export const API_BASE =
  import.meta.env.VITE_API_URL ??
  (Capacitor.isNativePlatform() ? nativeFallback : '')


export type ParkingSession = {
  id: number
  user_id: number
  patente: string
  inicio: string
  fin: string | null
  estado: 'ACTIVO' | 'FINALIZADO'
  costo_total: string
  calle?: string | null
  altura?: number | null
  seccion?: string | null
  duracion_minutos?: number | null
  medio_pago?: string | null
  marca?: string | null
  modelo?: string | null
}

export type SeccionSession = {
  id: number
  patente: string
  marca: string | null
  modelo: string | null
  calle: string | null
  altura: number | null
  seccion: string | null
  duracion_minutos: number | null
  inicio: string
  fin_estimado: string | null
  medio_pago: string | null
  user_id: number
}

export type ActaResponse = {
  id: number
  patente: string
  seccion: string | null
  url_foto: string | null
  observaciones: string | null
  timestamp: string
  mensaje: string
}

export type LPRScan = {
  id: number
  patente_leida: string
  latitud: number
  longitud: number
  fecha_hora: string
  parking_session: number | null
  url_foto: string | null
}

export type Infraction = {
  id: number
  scan: number
  monto_multa: string
  estado: 'PENDIENTE' | 'PAGADA' | 'ANULADA'
  fecha_emision: string
}

export type RegistrarInfractionResponse = {
  mensaje: string
  infraction_id: number
  scan_id: number
  patente: string
  tenia_sesion_activa: boolean
  monto_multa: number
}

export type ReportPeriod = 'day' | 'week' | 'month' | 'year' | ''

export type ReportsResponse = {
  period: string
  vehiculos_estacionados: number
  monto_recaudado: number
  cantidad_infracciones: number
  monto_infracciones: number
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} en ${path}`)
  }
  return response.json() as Promise<T>
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string'
        ? payload.error
        : `Error HTTP ${response.status}`,
    )
  }
  return payload as T
}

function asList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results
}

export async function fetchActiveSessions(): Promise<ParkingSession[]> {
  const data = await getJson<ParkingSession[] | { results: ParkingSession[] }>(
    '/api/sessions/',
  )
  return asList(data).filter((s) => s.estado === 'ACTIVO')
}

export async function fetchScans(): Promise<LPRScan[]> {
  const data = await getJson<LPRScan[] | { results: LPRScan[] }>('/api/scans/')
  return asList(data).sort(
    (a, b) =>
      new Date(b.fecha_hora).getTime() - new Date(a.fecha_hora).getTime(),
  )
}

export async function fetchInfractions(): Promise<
  Array<Infraction & { patente: string }>
> {
  const [infractionsData, scansData] = await Promise.all([
    getJson<Infraction[] | { results: Infraction[] }>('/api/infractions/'),
    getJson<LPRScan[] | { results: LPRScan[] }>('/api/scans/'),
  ])
  const infractions = asList(infractionsData)
  const scans = asList(scansData)
  const scanById = new Map(scans.map((scan) => [scan.id, scan]))

  return infractions.map((item) => ({
    ...item,
    patente: scanById.get(item.scan)?.patente_leida ?? '—',
  }))
}

export async function registrarInfraccion(
  patente: string,
  montoMulta = 1500,
): Promise<RegistrarInfractionResponse> {
  return postJson<RegistrarInfractionResponse>('/api/infractions/registrar/', {
    patente,
    monto_multa: montoMulta,
    latitud: -33.0444,
    longitud: -61.1681,
  })
}

export async function fetchReports(
  period: ReportPeriod = '',
): Promise<ReportsResponse> {
  const query = period ? `?period=${period}` : ''
  return getJson<ReportsResponse>(`/api/reports/${query}`)
}

export type UserRole = 'VECINO' | 'INSPECTOR' | 'EMPLEADO'

export type UserRoleResponse = {
  user_id: number
  rol: UserRole
}

export async function createInspectorRole(
  userId: number,
): Promise<UserRoleResponse> {
  return postJson<UserRoleResponse>('/api/roles/', {
    user_id: userId,
    rol: 'INSPECTOR',
  })
}

export async function fetchSessionsBySeccion(
  seccion: string,
): Promise<SeccionSession[]> {
  const q = encodeURIComponent(seccion.trim().toUpperCase())
  return getJson<SeccionSession[]>(`/api/sessions/por-seccion/?seccion=${q}`)
}

export async function createActa(payload: {
  patente: string
  seccion?: string
  url_foto?: string | null
  observaciones?: string
  generada_por?: number
}): Promise<ActaResponse> {
  return postJson<ActaResponse>('/api/actas/', {
    patente: payload.patente.trim().toUpperCase(),
    seccion: payload.seccion ?? null,
    url_foto: payload.url_foto ?? null,
    observaciones: payload.observaciones ?? null,
    generada_por: payload.generada_por ?? null,
  })
}

