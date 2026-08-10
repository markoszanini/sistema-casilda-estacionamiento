import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { CASILDA_CENTER, CASILDA_ZONE_POLYGON } from '../constants/casilda';

type OsmMapProps = {
  userLatitude?: number | null;
  userLongitude?: number | null;
};

function buildMapHtml(
  centerLat: number,
  centerLng: number,
  zoom: number,
  userLat?: number | null,
  userLng?: number | null,
) {
  const hasUser =
    typeof userLat === 'number' &&
    typeof userLng === 'number' &&
    !Number.isNaN(userLat) &&
    !Number.isNaN(userLng);

  const polygonJs = JSON.stringify(CASILDA_ZONE_POLYGON);

  const userMarkerJs = hasUser
    ? `
      const userMarker = L.circleMarker([${userLat}, ${userLng}], {
        radius: 10,
        color: '#0A6847',
        fillColor: '#F7B801',
        fillOpacity: 0.95,
        weight: 3
      }).addTo(map);
      userMarker.bindPopup('Tu ubicación');
      map.setView([${userLat}, ${userLng}], ${zoom});
    `
    : '';

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { margin: 0; padding: 0; height: 100%; width: 100%; }
      .leaflet-control-attribution { font-size: 10px; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], ${zoom});
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      const zone = L.polygon(${polygonJs}, {
        color: '#0A6847',
        weight: 2,
        fillColor: '#0A6847',
        fillOpacity: 0.22
      }).addTo(map);
      zone.bindPopup('Zona de estacionamiento medido');
      L.marker([${centerLat}, ${centerLng}])
        .addTo(map)
        .bindPopup('Casilda — Estacionamiento medido');
      ${userMarkerJs}
    </script>
  </body>
</html>`;
}

export function OsmMap({ userLatitude, userLongitude }: OsmMapProps) {
  const html = useMemo(
    () =>
      buildMapHtml(
        CASILDA_CENTER.latitude,
        CASILDA_CENTER.longitude,
        CASILDA_CENTER.zoom,
        userLatitude,
        userLongitude,
      ),
    [userLatitude, userLongitude],
  );

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe title="Mapa Casilda OpenStreetMap" srcDoc={html} style={webIframeStyle} />
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          setSupportMultipleWindows={false}
        />
      )}
    </View>
  );
}

const webIframeStyle = {
  border: 'none',
  width: '100%',
  height: '100%',
} as const;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
    backgroundColor: '#E8F0EC',
  },
});
