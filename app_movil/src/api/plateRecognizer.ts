import { PLATERECOGNIZER_TOKEN, PLATERECOGNIZER_URL } from '../config';

type PlateCandidate = {
  plate?: string;
  score?: number;
  region?: { code?: string };
};

type PlateRecognizerResponse = {
  results?: Array<{
    plate?: string;
    score?: number;
    candidates?: PlateCandidate[];
  }>;
  error?: string;
  detail?: string;
};

/**
 * Envía una foto a PlateRecognizer y devuelve la patente más probable.
 * Requiere EXPO_PUBLIC_PLATERECOGNIZER_TOKEN.
 */
export async function recognizePlateFromPhoto(photoUri: string): Promise<string> {
  if (!PLATERECOGNIZER_TOKEN) {
    throw new Error(
      'Falta EXPO_PUBLIC_PLATERECOGNIZER_TOKEN. Configuralo en app_movil/.env',
    );
  }

  const formData = new FormData();
  formData.append('upload', {
    uri: photoUri,
    name: 'scan.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('regions', 'ar');

  const response = await fetch(PLATERECOGNIZER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Token ${PLATERECOGNIZER_TOKEN}`,
    },
    body: formData,
  });

  const data = (await response.json()) as PlateRecognizerResponse;
  if (!response.ok) {
    throw new Error(
      data.detail || data.error || `PlateRecognizer error HTTP ${response.status}`,
    );
  }

  const best =
    data.results?.[0]?.plate ||
    data.results?.[0]?.candidates?.[0]?.plate ||
    '';

  const plate = best.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (!plate) {
    throw new Error('No se pudo leer ninguna patente en la imagen.');
  }
  return plate;
}
