export type UserRole = 'VECINO' | 'INSPECTOR' | 'EMPLEADO';

export type UserRoleResponse = {
  user_id: number;
  rol: UserRole;
};

export type UserWallet = {
  user_id: number;
  saldo_actual: string;
  ultima_actualizacion: string;
};

export type FavoriteVehicle = {
  id: number;
  user_id: number;
  patente: string;
  alias: string | null;
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  color: string | null;
};

export type VehiclePayload = {
  patente: string;
  alias?: string | null;
  marca?: string | null;
  modelo?: string | null;
  anio?: number | null;
  color?: string | null;
};

export type ParkingSession = {
  id: number;
  user_id: number;
  patente: string;
  inicio: string;
  fin: string | null;
  estado: 'ACTIVO' | 'FINALIZADO';
  costo_total: string;
  calle?: string | null;
  altura?: number | null;
  seccion?: string | null;
  duracion_minutos?: number | null;
  medio_pago?: string | null;
  marca?: string | null;
  modelo?: string | null;
};

export type IniciarParkingPayload = {
  patente: string;
  calle: string;
  altura: number;
  duracion_minutos: number;
  medio_pago: string;
};

export type IniciarParkingResponse = {
  mensaje: string;
  sesion_id: number;
  seccion?: string;
  costo_cobrado?: number;
  saldo_actual: string | number;
  duracion_minutos?: number;
};

export type FinalizarParkingResponse = {
  mensaje: string;
  minutos_transcurridos: number;
  costo_cobrado: number;
  saldo_restante: number;
};

export type RecargarResponse = {
  mensaje: string;
  monto_acreditado: number;
  saldo_actual: number;
};

export type ScanResult = {
  id: number;
  patente_leida: string;
  latitud: number;
  longitud: number;
  fecha_hora: string;
  parking_session: number | null;
  url_foto: string | null;
  estado: 'VIGENTE' | 'EN_INFRACCION';
  infraction_id: number | null;
};
