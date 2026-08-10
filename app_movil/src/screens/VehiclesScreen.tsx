import { StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

const PLACEHOLDER_VEHICLES = [
  { plate: 'AB123CD', label: 'Auto principal' },
  { plate: 'AE987FG', label: 'Secundario' },
];

export function VehiclesScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Mis vehículos" subtitle="Patentes registradas" />
      <View style={styles.content}>
        {PLACEHOLDER_VEHICLES.map((vehicle) => (
          <View key={vehicle.plate} style={styles.card}>
            <Text style={styles.plate}>{vehicle.plate}</Text>
            <Text style={styles.label}>{vehicle.label}</Text>
          </View>
        ))}
        <Text style={styles.hint}>
          Datos de ejemplo. Luego se consumirán desde la API.
        </Text>
      </View>
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
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  plate: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  label: {
    color: colors.textMuted,
    marginTop: 4,
    fontSize: 14,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 8,
  },
});
