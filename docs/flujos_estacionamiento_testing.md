# Flujos de estacionamiento — SOLO TESTING

> **AVISO:** Este documento y las features asociadas corren únicamente en el
> stack de testing de este repositorio (`app_movil`, `dashboard_web`, Django
> local). **No desplegar a gestión/producción** ni modificar sistemas de gestión Casilda.

## Regla de sección

- Inputs: `calle` (catálogo fijo) + `altura` (número entero).
- Fórmula: `base = floor(altura / 100) * 100` → sección `{CALLE} {base}-{base+100}`.
- Ejemplos:
  - ESPAÑA + 1250 → `ESPAÑA 1200-1300`
  - REMEDIOS DE ESCALADA + 2476 → `REMEDIOS DE ESCALADA 2400-2500`

## Calles fijas (testing)

ESPAÑA, REMEDIOS DE ESCALADA, MITRE, SAN MARTIN, BELGRANO, SARMIENTO,
RIVADAVIA, 9 DE JULIO, INDEPENDENCIA, BUENOS AIRES.

## Duración y tarifa

- Slider: 30–180 minutos, paso 30.
- Tarifa testing: $100 ARS / hora.
- Costo al iniciar: `(minutos / 60) * 100` debitado de billetera (o mock MercadoPago).

## Flujo Vecino

1. Abrir app → Estacionar → **Iniciar Estacionamiento**.
2. Elegir patente, calle, altura (se muestra sección), duración, medio de pago.
3. Confirmar → `POST /api/sessions/iniciar/`.
4. El sistema debita y deja la sesión `ACTIVO` con `seccion`.

## Flujo Inspector

1. Dashboard de fiscalización (testing).
2. Elegir sección de ronda (ej. `ESPAÑA 1200-1300`).
3. Ver vehículos activos en esa sección (patente, marca, modelo, duración).
4. Buscador de patente dentro de la lista.
5. Si la patente no figura → **Labrar acta (PDF)** + foto con timestamp.
6. Impresión física del acta: pendiente de definición.

## Contratos API (Django local testing)

### `POST /api/sessions/iniciar/`

```json
{
  "user_id": 1,
  "patente": "AB123CD",
  "calle": "ESPAÑA",
  "altura": 1250,
  "duracion_minutos": 60,
  "medio_pago": "Billetera"
}
```

Respuesta: `sesion_id`, `seccion`, `costo_cobrado`, `saldo_actual`, `mensaje`.

### `GET /api/sessions/por-seccion/?seccion=ESPAÑA%201200-1300`

Lista de sesiones `ACTIVO` en esa sección.

### `POST /api/actas/`

```json
{
  "patente": "XX000XX",
  "seccion": "ESPAÑA 1200-1300",
  "url_foto": "data:image/jpeg;base64,...",
  "observaciones": "Vehículo sin pago"
}
```

## Cómo probar en local

```bash
# Terminal 1 — API
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py runserver 0.0.0.0:8000

# Terminal 2 — App vecino
cd app_movil && npx expo start --web

# Terminal 3 — Dashboard inspector
cd dashboard_web && npm run dev
```

Login vecino con user demo; alta inspector desde sidebar del dashboard si hace falta.
