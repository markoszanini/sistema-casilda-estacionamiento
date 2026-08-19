# Casilda Inspectores (Dashboard Web + Capacitor)

Panel de fiscalización municipal. En escritorio corre con Vite; en dispositivos
de **inspectores** se empaqueta con Capacitor (Android).

La app Expo de `app_movil/` sigue siendo para vecinos (y demo de inspector
nativo). Esta shell Capacitor es solo el panel web para inspectores/empleados.

## Web local

```bash
npm install
npm run dev
```

Abrí http://127.0.0.1:5173 (Django en :8000).

## App Android (inspectores)

Requisitos: Android Studio + JDK.

```bash
# 1) Build web + copiar a Android
npm run mobile:build

# 2) Abrir en Android Studio
npm run mobile:android
```

Desde Android Studio: Run en emulador o dispositivo.

### API en el dispositivo

| Entorno | URL Django |
|---|---|
| Emulador Android | `http://10.0.2.2:8000` (default en código) |
| Celular físico | `VITE_API_URL=http://IP-DE-TU-PC:8000 npm run mobile:build` |

Django debe escuchar en `0.0.0.0:8000` y el celular en la misma WiFi.
