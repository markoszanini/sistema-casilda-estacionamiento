/**
 * URL base del backend Django.
 * - Web / emulador local: http://127.0.0.1:8000
 * - Celular físico: http://IP-DE-TU-PC:8000 (misma WiFi)
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';

/** Usuario demo de Casilda Conecta para la Fase demo */
export const DEMO_USER_ID = 1;
export const DEMO_PATENTE = 'AB123CD';
