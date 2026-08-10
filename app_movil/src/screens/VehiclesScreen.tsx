import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  createVehicle,
  deleteVehicle,
  getVehicles,
  updateVehicle,
} from '../api/client';
import type { FavoriteVehicle } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export function VehiclesScreen() {
  const { userId } = useAuth();
  const [vehicles, setVehicles] = useState<FavoriteVehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [patente, setPatente] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setVehicles(await getVehicles(userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vehículos');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const resetForm = () => {
    setPatente('');
    setAlias('');
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setPatente('');
    setAlias('');
    setShowForm(true);
    setOkMessage(null);
    setError(null);
  };

  const openEdit = (vehicle: FavoriteVehicle) => {
    setEditingId(vehicle.id);
    setPatente(vehicle.patente);
    setAlias(vehicle.alias ?? '');
    setShowForm(true);
    setOkMessage(null);
    setError(null);
  };

  const onSave = async () => {
    if (!userId) return;
    if (!patente.trim()) {
      setError('La patente es obligatoria');
      return;
    }
    setSaving(true);
    setError(null);
    setOkMessage(null);
    try {
      if (editingId) {
        await updateVehicle(editingId, {
          patente: patente.trim().toUpperCase(),
          alias: alias.trim() || null,
        });
        setOkMessage('Vehículo actualizado');
      } else {
        await createVehicle(userId, patente, alias);
        setOkMessage('Vehículo registrado');
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const removeVehicle = async (vehicle: FavoriteVehicle) => {
    try {
      await deleteVehicle(vehicle.id);
      setOkMessage(`Se eliminó ${vehicle.patente}`);
      if (editingId === vehicle.id) resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  const onDelete = (vehicle: FavoriteVehicle) => {
    if (Platform.OS === 'web') {
      const ok =
        typeof window !== 'undefined' &&
        window.confirm(`¿Borrar ${vehicle.patente}?`);
      if (ok) void removeVehicle(vehicle);
      return;
    }

    Alert.alert('Eliminar vehículo', `¿Borrar ${vehicle.patente}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void removeVehicle(vehicle);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Mis vehículos" subtitle="Registrar y gestionar patentes" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.primaryBtn} onPress={openCreate}>
          <Text style={styles.primaryBtnText}>+ Registrar nuevo vehículo</Text>
        </Pressable>

        {showForm ? (
          <View style={styles.form}>
            <Text style={styles.formTitle}>
              {editingId ? 'Editar vehículo' : 'Nuevo vehículo'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Patente (ej: AB123CD)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              value={patente}
              onChangeText={setPatente}
            />
            <TextInput
              style={styles.input}
              placeholder="Alias (ej: Auto principal)"
              placeholderTextColor={colors.textMuted}
              value={alias}
              onChangeText={setAlias}
            />
            <View style={styles.formActions}>
              <Pressable style={styles.secondaryBtn} onPress={resetForm}>
                <Text style={styles.secondaryBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.cta}
                disabled={saving}
                onPress={() => void onSave()}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.ctaText}>
                    {editingId ? 'Guardar cambios' : 'Registrar vehículo'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : null}

        <Text style={styles.section}>Vehículos registrados</Text>
        {loading ? <ActivityIndicator color={colors.green} /> : null}
        {okMessage ? <Text style={styles.ok}>{okMessage}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!loading && vehicles.length === 0 ? (
          <Text style={styles.hint}>
            Todavía no hay patentes. Usá el botón de arriba para registrar una.
          </Text>
        ) : null}

        {vehicles.map((vehicle) => (
          <View key={vehicle.id} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.plate}>{vehicle.patente}</Text>
              <Text style={styles.label}>{vehicle.alias || 'Sin alias'}</Text>
            </View>
            <Pressable style={styles.smallBtn} onPress={() => openEdit(vehicle)}>
              <Text style={styles.smallBtnText}>Editar</Text>
            </Pressable>
            <Pressable
              style={[styles.smallBtn, styles.dangerBtn]}
              onPress={() => onDelete(vehicle)}
            >
              <Text style={[styles.smallBtnText, styles.dangerText]}>Borrar</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  primaryBtn: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
  },
  form: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  formTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  formActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.textMuted,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  cta: {
    flex: 1.4,
    backgroundColor: colors.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontWeight: '800',
  },
  section: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  plate: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  label: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  smallBtnText: {
    color: colors.green,
    fontWeight: '700',
    fontSize: 12,
  },
  dangerBtn: {
    borderColor: '#DC2626',
  },
  dangerText: {
    color: '#DC2626',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
  },
  error: {
    color: '#DC2626',
    fontSize: 13,
  },
  ok: {
    color: colors.green,
    fontWeight: '600',
    fontSize: 13,
  },
});
