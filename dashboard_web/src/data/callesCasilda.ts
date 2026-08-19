/**
 * Catálogo fijo de calles de la zona medido (testing).
 * Solo testing — no usar en gestión/producción.
 */
export const CALLES_CASILDA = [
  'ESPAÑA',
  'REMEDIOS DE ESCALADA',
  'MITRE',
  'SAN MARTIN',
  'BELGRANO',
  'SARMIENTO',
  'RIVADAVIA',
  '9 DE JULIO',
  'INDEPENDENCIA',
  'BUENOS AIRES',
] as const

export const TARIFA_HORA_TESTING = 100

/**
 * Clasifica calle + altura en sección de cuadra (tramos de 100).
 * ESPAÑA 1250 → ESPAÑA 1200-1300
 */
export function buildSeccion(calle: string, altura: number): string {
  const nombre = calle.trim().toUpperCase()
  if (!nombre || !Number.isFinite(altura) || altura < 0) {
    return ''
  }
  const base = Math.floor(altura / 100) * 100
  return `${nombre} ${base}-${base + 100}`
}

/** Secciones sugeridas (calles × tramos habituales) para el selector de ronda. */
export function seccionesSugeridas(
  maxAltura = 3000,
): string[] {
  const list: string[] = []
  for (const calle of CALLES_CASILDA) {
    for (let base = 0; base < maxAltura; base += 100) {
      list.push(`${calle} ${base}-${base + 100}`)
    }
  }
  return list
}
