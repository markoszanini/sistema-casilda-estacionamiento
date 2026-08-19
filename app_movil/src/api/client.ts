import { API_BASE_URL, SCANS_URL } from '../config';
import type {
  FavoriteVehicle,
  FinalizarParkingResponse,
  IniciarParkingPayload,
  IniciarParkingResponse,
  ParkingSession,
  RecargarResponse,
  ScanResult,
  UserRole,
  UserRoleResponse,
  UserWallet,
  VehiclePayload,
} from './types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof payload === 'object' &&
      payload &&
      'error' in payload &&
      typeof (payload as { error: unknown }).error === 'string'
        ? (payload as { error: string }).error
        : `Error HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  // DELETE suele responder 204 sin body
  if (response.status === 204 || text === '') {
    return undefined as T;
  }

  return payload as T;
}

function asList<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

export async function getUserRole(userId: number): Promise<UserRole> {
  try {
    const data = await request<UserRoleResponse>(`/api/roles/${userId}/`);
    return data.rol ?? 'VECINO';
  } catch {
    return 'VECINO';
  }
}

export async function ensureWallet(userId: number): Promise<UserWallet> {
  try {
    return await request<UserWallet>(`/api/wallets/${userId}/`);
  } catch {
    return request<UserWallet>('/api/wallets/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, saldo_actual: '500.00' }),
    });
  }
}

export async function getWallet(userId: number): Promise<UserWallet> {
  return request<UserWallet>(`/api/wallets/${userId}/`);
}

export async function recargarSaldo(
  userId: number,
  monto: number,
): Promise<RecargarResponse> {
  return request<RecargarResponse>(`/api/wallets/${userId}/recargar/`, {
    method: 'POST',
    body: JSON.stringify({ monto, metodo_pago: 'MercadoPago (demo)' }),
  });
}

export async function getVehicles(userId: number): Promise<FavoriteVehicle[]> {
  const data = await request<FavoriteVehicle[] | { results: FavoriteVehicle[] }>(
    '/api/vehicles/',
  );
  return asList(data).filter((item) => item.user_id === userId);
}

export async function createVehicle(
  userId: number,
  data: VehiclePayload,
): Promise<FavoriteVehicle> {
  return request<FavoriteVehicle>('/api/vehicles/', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      patente: data.patente.trim().toUpperCase(),
      alias: data.alias?.trim() || null,
      marca: data.marca?.trim() || null,
      modelo: data.modelo?.trim() || null,
      anio: data.anio ?? null,
      color: data.color?.trim() || null,
    }),
  });
}

export async function updateVehicle(
  id: number,
  data: Partial<VehiclePayload>,
): Promise<FavoriteVehicle> {
  return request<FavoriteVehicle>(`/api/vehicles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(data.patente
        ? { patente: data.patente.trim().toUpperCase() }
        : {}),
      ...(data.alias !== undefined ? { alias: data.alias } : {}),
      ...(data.marca !== undefined ? { marca: data.marca } : {}),
      ...(data.modelo !== undefined ? { modelo: data.modelo } : {}),
      ...(data.anio !== undefined ? { anio: data.anio } : {}),
      ...(data.color !== undefined ? { color: data.color } : {}),
    }),
  });
}

export async function deleteVehicle(id: number): Promise<void> {
  await request(`/api/vehicles/${id}/`, { method: 'DELETE' });
}

export async function getSessions(): Promise<ParkingSession[]> {
  const data = await request<ParkingSession[] | { results: ParkingSession[] }>(
    '/api/sessions/',
  );
  return asList(data);
}

export async function getActiveSessionForUser(
  userId: number,
): Promise<ParkingSession | null> {
  const sessions = await getSessions();
  return (
    sessions.find((s) => s.user_id === userId && s.estado === 'ACTIVO') ?? null
  );
}

export async function iniciarEstacionamiento(
  userId: number,
  payload: IniciarParkingPayload,
): Promise<IniciarParkingResponse> {
  return request<IniciarParkingResponse>('/api/sessions/iniciar/', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      patente: payload.patente.trim().toUpperCase(),
      calle: payload.calle.trim().toUpperCase(),
      altura: payload.altura,
      duracion_minutos: payload.duracion_minutos,
      medio_pago: payload.medio_pago,
    }),
  });
}

export async function finalizarEstacionamiento(
  sesionId: number,
): Promise<FinalizarParkingResponse> {
  return request<FinalizarParkingResponse>('/api/sessions/finalizar/', {
    method: 'POST',
    body: JSON.stringify({ sesion_id: sesionId }),
  });
}

function normalizeScanResult(
  payload: Record<string, unknown>,
  patenteFallback: string,
): ScanResult {
  const patente =
    typeof payload.patente_leida === 'string'
      ? payload.patente_leida
      : patenteFallback;

  const rawEstado =
    typeof payload.estado === 'string' ? payload.estado.toUpperCase() : '';

  let estado: ScanResult['estado'];
  if (
    rawEstado === 'VIGENTE' ||
    rawEstado === 'ACTIVO' ||
    rawEstado === 'OK' ||
    payload.parking_session != null
  ) {
    estado = 'VIGENTE';
  } else if (
    rawEstado === 'EN_INFRACCION' ||
    rawEstado === 'INFRACCION' ||
    rawEstado === 'IMPAGO' ||
    payload.infraction_id != null
  ) {
    estado = 'EN_INFRACCION';
  } else {
    // Si el backend no manda estado, asumimos infracción cuando no hay sesión
    estado = payload.parking_session ? 'VIGENTE' : 'EN_INFRACCION';
  }

  return {
    id: typeof payload.id === 'number' ? payload.id : 0,
    patente_leida: patente,
    latitud: typeof payload.latitud === 'number' ? payload.latitud : 0,
    longitud: typeof payload.longitud === 'number' ? payload.longitud : 0,
    fecha_hora:
      typeof payload.fecha_hora === 'string'
        ? payload.fecha_hora
        : new Date().toISOString(),
    parking_session:
      typeof payload.parking_session === 'number'
        ? payload.parking_session
        : null,
    url_foto: typeof payload.url_foto === 'string' ? payload.url_foto : null,
    estado,
    infraction_id:
      typeof payload.infraction_id === 'number' ? payload.infraction_id : null,
  };
}

/**
 * Envía un escaneo LPR al backend unificado de Casilda
 * (EXPO_PUBLIC_SCANS_URL / testing.casilda.gob.ar).
 */
export async function postScan(payload: {
  patente_leida: string;
  latitud: number;
  longitud: number;
  url_foto?: string | null;
}): Promise<ScanResult> {
  const patente = payload.patente_leida.trim().toUpperCase();
  const body = {
    patente_leida: patente,
    latitud: payload.latitud,
    longitud: payload.longitud,
    url_foto: payload.url_foto ?? null,
  };

  const response = await fetch(SCANS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let data: Record<string, unknown> = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text) as Record<string, unknown>;
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const errorMessage =
      typeof data.error === 'string'
        ? data.error
        : typeof data.detail === 'string'
          ? data.detail
          : `Error HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return normalizeScanResult(data, patente);
}
