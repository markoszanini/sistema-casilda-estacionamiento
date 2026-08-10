import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { colors } from '../theme/colors';

export function WalletScreen() {
  return (
    <View style={styles.container}>
      <AppHeader title="Billetera" subtitle="Saldo disponible" />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Crédito</Text>
          <Text style={styles.balance}>$ 0,00</Text>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>Cargar saldo</Text>
          </Pressable>
        </View>
        <Text style={styles.hint}>
          Próximo paso: conectar con la API Django (`/api/wallets/`).
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
    gap: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
  },
  balance: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 20,
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
