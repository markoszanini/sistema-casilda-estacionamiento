# Informe de Estado: Estacionamiento Inteligente Casilda

Este informe resume el estado actual del proyecto (Fase 1) luego de la primera jornada de desarrollo y detalla los pasos a seguir para cada miembro del equipo.

## 1. Lo que se hizo (Backend)

Como **Desarrollador 1**, me encargué de dejar toda la base e infraestructura del servidor lista para que el resto del equipo pueda conectarse y avanzar sin bloqueos.

*   **Arquitectura de Datos:** Se definió la base de datos (con integración 1 a 1 a `Casilda Conecta`).
*   **Repositorio:** Se inicializó el módulo aislado en GitHub (`sistema-casilda-estacionamiento`).
*   **Proyecto Django:** Se configuró el framework Django junto a Django REST Framework.
*   **Modelos y Migraciones:** Se programaron las tablas de la base de datos (`UserWallet`, `UserFavoriteVehicle`, `ParkingSession`, etc.) y se generó el archivo de base de datos local `db.sqlite3`.
*   **Endpoints API REST:** Se crearon las URLs para que la aplicación móvil pueda consumir los datos (rutas como `/api/wallets/`, `/api/sessions/`, etc.).

---

## 2. Próximos pasos para el Diseñador Gráfico

> [!IMPORTANT]
> El diseño es lo que el usuario va a juzgar primero. Buscamos un diseño que grite "Smart City", muy intuitivo y moderno (nada de plantillas genéricas).

**Tareas a iniciar:**
1.  **Revisión del flujo:** Mirar los [prompts_para_equipo](file:///C:/Users/tecno/.gemini/antigravity/brain/3fa8ed4c-09ff-4f9a-8eae-f1ecae22832f/prompts_para_equipo.md) para entender el flujo de los usuarios (abrir app, mapa, inicio, fin, cargar billetera).
2.  **Paleta y Estilo:** Definir colores y tipografías (sugiero probar combinaciones limpias, tal vez con opciones de modo oscuro).
3.  **Wireframes:** Armar los bocetos en Figma de al menos estas pantallas clave:
    *   **Home/Mapa:** Dónde estoy, y el botón gigante para Iniciar/Frenar estacionamiento.
    *   **Billetera:** Cuánto saldo tengo y el botón de cargar con MercadoPago.
    *   **Mis Vehículos:** Lista de patentes asociadas al usuario.
4.  **Entrega:** Pasarle el enlace de Figma al Desarrollador Frontend para que empiece a codificar las pantallas.

---

## 3. Próximos pasos para el Desarrollador 2 (Frontend)

> [!TIP]
> Por ahora **NO** vamos a usar la API paga de Google Maps. Vas a tener que integrar **OpenStreetMap** en la aplicación móvil para no generar gastos.

**Tareas a iniciar:**
1.  **Clonar el código:** Hacé `git clone` del repositorio para tener tu copia local del proyecto.
2.  **Inicializar Proyecto Móvil:** Creá el esqueleto de la aplicación (recomendado: usar React Native CLI o Expo) en una carpeta nueva dentro del repositorio, ej: `/app_movil`.
3.  **Mapa Libre:** Investigá e integrá la librería de mapa (`react-native-maps` conectada a OpenStreetMap o `Leaflet` si es PWA) para que, usando el GPS del celular, marque un punto en el mapa de Casilda.
4.  **Conexión a la API:** Probá hacer peticiones `GET` y `POST` a los endpoints de la API que ya dejé levantados en Django (vas a tener que correr el servidor de Django localmente con `python manage.py runserver`).
5.  **Esperar diseños:** Mientras armás la lógica de mapas y la conexión a la API, quedá a la espera de que el Diseñador te pase el Figma para empezar a pintar la UI final.

---

## 4. Próximos pasos para el Ingeniero (Técnico / Hardware)

1.  **Cámara y LPR local:** Dado que el presupuesto inicial es $0, tu primera tarea es lograr instalar y hacer correr un software Open Source (como OpenALPR o PlateRecognizer local) en tu PC.
2.  **Simulación:** Tomá una foto con el celular a la patente de un auto en la calle, pasásela a tu script local, y asegurate de que el script logre leer el texto de la patente correctamente.
3.  **Integración futura:** Cuando eso ande, te vas a juntar con el Backend para mandar esa patente por internet al sistema de infracciones que ya está programado en Django.
