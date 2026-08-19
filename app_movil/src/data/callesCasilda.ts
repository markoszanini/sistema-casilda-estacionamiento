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
] as const;

export type CalleCasilda = (typeof CALLES_CASILDA)[number];

/** Tarifa horaria de testing (ARS). */
export const TARIFA_HORA_TESTING = 100;

export const DURACION_MIN = 30;
export const DURACION_MAX = 180;
export const DURACION_STEP = 30;

/**
 * Clasifica calle + altura en sección de cuadra (tramos de 100).
 * ESPAÑA 1250 → ESPAÑA 1200-1300
 */
export function buildSeccion(calle: string, altura: number): string {
  const nombre = calle.trim().toUpperCase();
  if (!nombre || !Number.isFinite(altura) || altura < 0) {
    return '';
  }
  const base = Math.floor(altura / 100) * 100;
  return `${nombre} ${base}-${base + 100}`;
}

export function costoPorMinutos(minutos: number, tarifaHora = TARIFA_HORA_TESTING): number {
  return Math.round((minutos / 60) * tarifaHora * 100) / 100;
}
