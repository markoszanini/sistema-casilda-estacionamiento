import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'ar.gob.casilda.inspectores',
  appName: 'Casilda Inspectores',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Permite hablar con Django local por HTTP en demos
    cleartext: true,
  },
}

export default config
