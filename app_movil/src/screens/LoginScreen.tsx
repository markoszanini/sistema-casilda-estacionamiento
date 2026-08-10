import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { DEMO_USER_ID } from '../config';
import { colors } from '../theme/colors';

export function LoginScreen() {
  const { login } = useAuth();
  const [userIdInput, setUserIdInput] = useState(String(DEMO_USER_ID));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogin = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      await login(userId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión. ¿Está corriendo Django?',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../../assets/logomuni-negro.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Casilda Conecta</Text>
        <Text style={styles.subtitle}>Estacionamiento Medido</Text>

        <Text style={styles.label}>ID de usuario (Casilda Conecta)</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={userIdInput}
          onChangeText={setUserIdInput}
          placeholder="1"
          placeholderTextColor={colors.textMuted}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.cta}
          disabled={loading}
          onPress={() => {
            const parsed = Number(userIdInput);
            if (!parsed || parsed < 1) {
              setError('Ingresá un ID válido');
              return;
            }
            void onLogin(parsed);
          }}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.ctaText}>Ingresar</Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondary}
          disabled={loading}
          onPress={() => void onLogin(DEMO_USER_ID)}
        >
          <Text style={styles.secondaryText}>Entrar con usuario demo #{DEMO_USER_ID}</Text>
        </Pressable>
      </View>
      <Text style={styles.footer}>© 2026 Municipalidad de Casilda</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.green,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textMuted,
    marginBottom: 24,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  error: {
    color: '#DC2626',
    marginBottom: 10,
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  ctaText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 16,
  },
  secondary: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },
  secondaryText: {
    color: colors.green,
    fontWeight: '700',
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 20,
    fontSize: 12,
  },
});
