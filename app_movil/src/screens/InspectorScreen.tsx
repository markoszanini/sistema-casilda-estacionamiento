import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { postScan } from '../api/client';
import { recognizePlateFromPhoto } from '../api/plateRecognizer';
import type { ScanResult } from '../api/types';
import { AppHeader } from '../components/AppHeader';
import { useAuth } from '../context/AuthContext';
import { PLATERECOGNIZER_TOKEN } from '../config';
import { colors } from '../theme/colors';

type ScanStatus = 'idle' | 'processing' | 'done' | 'error';

export function InspectorScreen() {
  const { role } = useAuth();
  const cameraAllowed = role === 'INSPECTOR';
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState(
    cameraAllowed
      ? 'Apuntá a la patente y tocá escanear'
      : 'Ingresá la patente manualmente',
  );
  const [manualPlate, setManualPlate] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastPlate, setLastPlate] = useState<string | null>(null);

  const cameraAvailable =
    cameraAllowed && Platform.OS !== 'web' && Boolean(permission?.granted);

  useEffect(() => {
    if (
      cameraAllowed &&
      Platform.OS !== 'web' &&
      permission &&
      !permission.granted
    ) {
      void requestPermission();
    }
  }, [cameraAllowed, permission, requestPermission]);

  const getCoords = async () => {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== 'granted') {
      // Casilda fallback
      return { latitude: -33.0444, longitude: -61.1681 };
    }
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
    } catch {
      return { latitude: -33.0444, longitude: -61.1681 };
    }
  };

  const processPlate = async (patente: string, photoUri?: string) => {
    setStatus('processing');
    setResult(null);
    setMessage(`Leyendo ${patente}… enviando a Casilda`);
    try {
      const coords = await getCoords();
      const scan = await postScan({
        patente_leida: patente,
        latitud: coords.latitude,
        longitud: coords.longitude,
        url_foto: photoUri ?? null,
      });
      setResult(scan);
      setLastPlate(scan.patente_leida);
      setStatus('done');
      setMessage(
        scan.estado === 'VIGENTE'
          ? 'Vehículo con estacionamiento vigente'
          : 'Vehículo en infracción / sin pago',
      );
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error al registrar escaneo');
    }
  };

  const onScanCamera = async () => {
    if (!cameraAllowed || !cameraRef.current) {
      setStatus('error');
      setMessage('Cámara no disponible');
      return;
    }
    setStatus('processing');
    setResult(null);
    setMessage('Capturando foto…');
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      if (!photo?.uri) {
        throw new Error('No se pudo capturar la foto');
      }

      setMessage('Enviando a PlateRecognizer…');
      let plate: string;
      if (PLATERECOGNIZER_TOKEN) {
        plate = await recognizePlateFromPhoto(photo.uri);
      } else if (manualPlate.trim()) {
        plate = manualPlate.trim().toUpperCase();
      } else {
        throw new Error(
          'Sin token PlateRecognizer. Ingresá la patente manualmente o configurá EXPO_PUBLIC_PLATERECOGNIZER_TOKEN.',
        );
      }
      setLastPlate(plate);
      await processPlate(plate, photo.uri);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error en el escaneo');
    }
  };

  const onManualScan = async () => {
    if (!manualPlate.trim()) {
      setStatus('error');
      setMessage('Ingresá una patente para escanear');
      return;
    }
    await processPlate(manualPlate.trim().toUpperCase());
  };

  const resultColor =
    result?.estado === 'VIGENTE'
      ? '#166534'
      : result?.estado === 'EN_INFRACCION'
        ? '#991B1B'
        : colors.green;

  const resultBg =
    result?.estado === 'VIGENTE'
      ? '#DCFCE7'
      : result?.estado === 'EN_INFRACCION'
        ? '#FEE2E2'
        : '#F3F4F6';

  return (
    <View style={styles.container}>
      <AppHeader title="Modo Inspector" subtitle="Control y Fiscalización LPR" />

      <View style={styles.body}>
        {cameraAllowed ? (
          Platform.OS !== 'web' ? (
            !permission ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={colors.yellow} />
              </View>
            ) : !permission.granted ? (
              <View style={styles.centerBox}>
                <Text style={styles.info}>Necesitamos permiso de cámara</Text>
                <Pressable style={styles.cta} onPress={() => void requestPermission()}>
                  <Text style={styles.ctaText}>Permitir cámara</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cameraWrap}>
                <CameraView ref={cameraRef} style={styles.camera} facing="back" />
                <View style={styles.overlay}>
                  <View style={styles.frame} />
                  <Text style={styles.overlayText}>Encuadrá la patente</Text>
                </View>
              </View>
            )
          ) : (
            <View style={styles.centerBox}>
              <Text style={styles.info}>
                En web usá carga manual. En dispositivo nativo se activa la cámara.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.centerBox}>
            <Text style={styles.info}>
              La cámara del Inspector está deshabilitada para tu rol (VECINO).
              Usá la carga manual de patente.
            </Text>
          </View>
        )}

        <View style={styles.panel}>
          <Text style={styles.label}>Patente (manual / respaldo)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: AB123CD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            value={manualPlate}
            onChangeText={setManualPlate}
          />
          <Text style={styles.hint}>Formatos válidos: ABC123, AB123CD</Text>

          <Pressable
            style={[styles.cta, status === 'processing' && styles.ctaDisabled]}
            disabled={status === 'processing'}
            onPress={() => {
              if (cameraAvailable) {
                void onScanCamera();
              } else {
                void onManualScan();
              }
            }}
          >
            {status === 'processing' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.ctaText}>
                {cameraAvailable ? 'ESCANEAR PATENTE' : 'ENVIAR ESCANEO'}
              </Text>
            )}
          </Pressable>

          {!PLATERECOGNIZER_TOKEN && cameraAllowed ? (
            <Text style={styles.hint}>
              Tip: configurá EXPO_PUBLIC_PLATERECOGNIZER_TOKEN en app_movil/.env para OCR automático.
            </Text>
          ) : null}

          <View style={[styles.resultCard, { backgroundColor: resultBg }]}>
            <Text style={[styles.resultTitle, { color: resultColor }]}>
              {result
                ? result.estado === 'VIGENTE'
                  ? 'VIGENTE'
                  : 'EN INFRACCIÓN'
                : status === 'error'
                  ? 'ERROR'
                  : 'Esperando escaneo'}
            </Text>
            <Text style={styles.resultPlate}>
              {lastPlate || result?.patente_leida || '—'}
            </Text>
            <Text style={styles.resultMsg}>{message}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  body: { flex: 1 },
  cameraWrap: {
    flex: 1.2,
    overflow: 'hidden',
    margin: 12,
    borderRadius: 18,
  },
  camera: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: '78%',
    height: 110,
    borderWidth: 3,
    borderColor: colors.yellow,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  overlayText: {
    marginTop: 10,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: '#000',
    textShadowRadius: 4,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
  },
  info: {
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    gap: 10,
  },
  label: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    letterSpacing: 1,
    fontWeight: '700',
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
  },
  ctaDisabled: { opacity: 0.7 },
  ctaText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  resultCard: {
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  resultTitle: {
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resultPlate: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.text,
  },
  resultMsg: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 13,
  },
});
