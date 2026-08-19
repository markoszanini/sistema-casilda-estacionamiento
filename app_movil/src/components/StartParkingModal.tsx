import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { FavoriteVehicle } from '../api/types';
import {
  CALLES_CASILDA,
  DURACION_MAX,
  DURACION_MIN,
  DURACION_STEP,
  buildSeccion,
  costoPorMinutos,
} from '../data/callesCasilda';
import { colors } from '../theme/colors';
import { formatARS } from '../utils/money';

type Props = {
  visible: boolean;
  vehicles: FavoriteVehicle[];
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (payload: {
    patente: string;
    calle: string;
    altura: number;
    duracion_minutos: number;
    medio_pago: string;
  }) => void;
};

const MEDIOS = ['Billetera', 'MercadoPago (mock)'] as const;

export function StartParkingModal({
  visible,
  vehicles,
  loading,
  onCancel,
  onConfirm,
}: Props) {
  const [patente, setPatente] = useState(vehicles[0]?.patente ?? '');
  const [calle, setCalle] = useState<string>(CALLES_CASILDA[0]);
  const [alturaText, setAlturaText] = useState('');
  const [minutos, setMinutos] = useState(60);
  const [medioPago, setMedioPago] = useState<string>(MEDIOS[0]);
  const [localError, setLocalError] = useState<string | null>(null);

  const altura = Number(alturaText);
  const seccion = useMemo(
    () => (Number.isFinite(altura) && alturaText ? buildSeccion(calle, altura) : ''),
    [calle, altura, alturaText],
  );
  const costo = costoPorMinutos(minutos);

  const bumpDuration = (delta: number) => {
    setMinutos((prev) => {
      const next = prev + delta;
      if (next < DURACION_MIN) return DURACION_MIN;
      if (next > DURACION_MAX) return DURACION_MAX;
      return next;
    });
  };

  const submit = () => {
    setLocalError(null);
    if (!patente) {
      setLocalError('Seleccioná un vehículo');
      return;
    }
    if (!calle) {
      setLocalError('Seleccioná la calle');
      return;
    }
    if (!alturaText || !Number.isFinite(altura) || altura < 0) {
      setLocalError('Ingresá una altura válida');
      return;
    }
    onConfirm({
      patente,
      calle,
      altura,
      duracion_minutos: minutos,
      medio_pago: medioPago,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.headerIcon}>🚗</Text>
            <Text style={styles.headerTitle}>Iniciar Estacionamiento</Text>
            <Pressable onPress={onCancel} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Seleccionar Patente</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {vehicles.length === 0 ? (
                <Text style={styles.hint}>No hay vehículos. Registrate uno en Vehículos.</Text>
              ) : (
                vehicles.map((v) => (
                  <Pressable
                    key={v.id}
                    style={[styles.chip, patente === v.patente && styles.chipActive]}
                    onPress={() => setPatente(v.patente)}
                  >
                    <Text
                      style={[styles.chipText, patente === v.patente && styles.chipTextActive]}
                    >
                      {v.patente}
                      {v.alias ? ` · ${v.alias}` : ''}
                    </Text>
                  </Pressable>
                ))
              )}
            </ScrollView>

            <Text style={styles.label}>Calle</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {CALLES_CASILDA.map((c) => (
                <Pressable
                  key={c}
                  style={[styles.chip, calle === c && styles.chipActive]}
                  onPress={() => setCalle(c)}
                >
                  <Text style={[styles.chipText, calle === c && styles.chipTextActive]}>{c}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.label}>Altura</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              placeholder="Ej: 1200"
              placeholderTextColor={colors.textMuted}
              value={alturaText}
              onChangeText={setAlturaText}
            />
            {seccion ? (
              <Text style={styles.seccionPreview}>Sección: {seccion}</Text>
            ) : (
              <Text style={styles.hint}>La sección se calcula al ingresar la altura</Text>
            )}

            <Text style={styles.label}>Tiempo de estacionamiento</Text>
            <View style={styles.sliderRow}>
              <Pressable style={styles.stepBtn} onPress={() => bumpDuration(-DURACION_STEP)}>
                <Text style={styles.stepBtnText}>−30</Text>
              </Pressable>
              <View style={styles.sliderTrack}>
                <View
                  style={[
                    styles.sliderFill,
                    {
                      width: `${((minutos - DURACION_MIN) / (DURACION_MAX - DURACION_MIN)) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Pressable style={styles.stepBtn} onPress={() => bumpDuration(DURACION_STEP)}>
                <Text style={styles.stepBtnText}>+30</Text>
              </Pressable>
            </View>
            <Text style={styles.durationValue}>
              {minutos} min · {formatARS(costo)}
            </Text>

            <Text style={styles.label}>Medio de pago</Text>
            <View style={styles.chipRowWrap}>
              {MEDIOS.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, medioPago === m && styles.chipActive]}
                  onPress={() => setMedioPago(m)}
                >
                  <Text style={[styles.chipText, medioPago === m && styles.chipTextActive]}>
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            {localError ? <Text style={styles.error}>{localError}</Text> : null}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmBtn, loading && styles.disabled]}
              onPress={submit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.confirmText}>Iniciar Estacionamiento</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  header: {
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headerIcon: { fontSize: 18 },
  headerTitle: {
    flex: 1,
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  close: { color: colors.white, fontSize: 18, fontWeight: '700' },
  body: { padding: 16, gap: 8, paddingBottom: 24 },
  label: {
    marginTop: 8,
    color: colors.textMuted,
    fontWeight: '700',
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 16,
  },
  chipRow: { flexGrow: 0, marginVertical: 4 },
  chipRowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  chipText: { color: colors.text, fontWeight: '600', fontSize: 12 },
  chipTextActive: { color: colors.white },
  seccionPreview: {
    color: colors.green,
    fontWeight: '700',
    marginTop: 4,
  },
  hint: { color: colors.textMuted, fontSize: 12 },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  stepBtn: {
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  stepBtnText: { fontWeight: '800', color: colors.text },
  sliderTrack: {
    flex: 1,
    height: 12,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colors.green,
    borderRadius: 999,
  },
  durationValue: {
    textAlign: 'center',
    fontWeight: '800',
    color: colors.text,
    marginTop: 6,
  },
  error: { color: '#DC2626', marginTop: 8 },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { color: colors.textMuted, fontWeight: '700' },
  confirmBtn: {
    flex: 1.4,
    borderRadius: 12,
    backgroundColor: colors.green,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  confirmText: { color: colors.white, fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
