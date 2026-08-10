import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader } from '../components/AppHeader';
import { OsmMap } from '../components/OsmMap';
import { colors } from '../theme/colors';

export function HomeScreen() {
  const [userCoords, setUserCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationStatus, setLocationStatus] = useState('Obteniendo ubicación…');
  const [parkingActive, setParkingActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        setLocationStatus('Sin permiso de ubicación — mostrando Casilda');
        return;
      }

      try {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationStatus('Zona de estacionamiento medido');
      } catch {
        if (!cancelled) {
          setLocationStatus('No se pudo leer el GPS — mostrando Casilda');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader subtitle={locationStatus} />
      <View style={styles.mapWrap}>
        <OsmMap
          userLatitude={userCoords?.latitude}
          userLongitude={userCoords?.longitude}
        />
      </View>
      <View style={styles.footer}>
        <Pressable
          style={[styles.cta, parkingActive && styles.ctaStop]}
          onPress={() => setParkingActive((value) => !value)}
        >
          <Text style={styles.ctaText}>
            {parkingActive ? 'DETENER ESTACIONAMIENTO' : 'INICIAR ESTACIONAMIENTO'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapWrap: {
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cta: {
    backgroundColor: colors.yellow,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaStop: {
    backgroundColor: '#DC2626',
  },
  ctaText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
