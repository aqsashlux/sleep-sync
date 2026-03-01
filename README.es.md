**Idioma: Español | [English](README.md) | [Português](README.pt.md) | [中文](README.zh.md)**

# Sleep Sync

Una app de escritorio que te ayuda a corregir tu horario de sueño gradualmente usando técnicas de avance de fase circadiana.

![Sleep Sync](sync.png)

## El Problema

Si naturalmente te duermes a las 3 AM y te despiertas al mediodía, no estás roto. Tienes un cronotipo tardío -- una variación biológica donde tu reloj interno funciona desfasado respecto a los horarios convencionales. Millones de personas lidian con esto: desarrolladores que programan mejor a las 2 AM, gamers que encuentran su flow cuando todos los demás duermen, trabajadores por turnos que rotan entre día y noche, o cualquier persona con Síndrome de Fase de Sueño Retrasada (SFSR).

El consejo habitual -- "simplemente acuéstate más temprano" -- falla aproximadamente el 80% de las veces porque tu ritmo circadiano se resiste a cambios abruptos. Es como forzarte a vivir en un jet lag permanente.

## La Ciencia

Tu ritmo circadiano está regulado por el núcleo supraquiasmático, un grupo de neuronas que responde a la luz, la temperatura, los horarios de comida y la melatonina. Intentar desplazar tu sueño 3 horas de la noche a la mañana lucha contra todas estas señales a la vez.

El **avance de fase** funciona diferente: en lugar de un único cambio grande, mueves tu horario hacia más temprano entre 30-60 minutos cada pocos días, alternando con días de consolidación donde mantienes el horario estable. Esto le da a tu reloj interno tiempo para recalibrarse sin el estrés del jet lag social. Estudios clínicos muestran que el avance de fase gradual tiene tasas de éxito superiores al 80%, comparado con menos del 20% para cambios abruptos.

## Cómo Funciona

Sleep Sync implementa esto como un plan diario:

1. Configuras tus horarios actuales de dormir/despertar y tu horario objetivo.
2. En los **días de avance**, la app mueve tu hora objetivo de acostarte hacia más temprano en una cantidad configurable (30-50 min).
3. En los **días de mantenimiento**, mantienes el horario actual para que tu cuerpo se consolide.
4. La app rastrea **9 fases de energía** a lo largo del día relativas a tu hora de despertar (inercia de sueño, pico matutino, bajón post-almuerzo, desaceleración, etc.) para que sepas qué esperar de tu cuerpo a cada hora.

Puedes forzar cualquier fecha específica a ser un día de mantenimiento o avance, y confirmar los avances completados con verificaciones integradas.

## Para Quién Es

- **Desarrolladores y noctámbulos** -- desplaza tu ventana de concentración profunda a un horario más funcional sin perderla
- **Gamers y streamers** -- alinea tu rendimiento máximo con tu horario de streaming
- **Personas con SFSR** -- un enfoque estructurado y sin medicamentos para mover tu ventana de sueño
- **Trabajadores por turnos** -- reduce la disrupción circadiana al rotar entre turnos de día y noche

## Stack Tecnológico

| Capa     | Tecnología                                              |
|----------|---------------------------------------------------------|
| Frontend | React 19, Vite 7, Tailwind CSS 4, Lucide React         |
| Backend  | Express 5, better-sqlite3 (modo WAL)                   |
| Auth     | Google OAuth 2.0 (react-oauth/google + google-auth-library), JWT |
| i18n     | i18next, react-i18next, detección de idioma del navegador |
| Desktop  | Electron 33, electron-builder (instalador NSIS)         |
| Testing  | Test runner nativo de Node.js (node:test), 72 tests     |

## Primeros Pasos

### Requisitos Previos

- **Node.js 20+** (usa el flag `--env-file`; se recomienda 24+)
- Un **Client ID de Google OAuth** de [Google Cloud Console](https://console.cloud.google.com/)

### Configuración de Google OAuth

1. Ve a Google Cloud Console > APIs & Services > Credentials.
2. Crea un **OAuth 2.0 Client ID** (tipo Web application).
3. En **Authorized JavaScript origins**, agrega `http://localhost:5173`.
4. Copia el Client ID para el siguiente paso.

### Instalación

```bash
git clone https://github.com/aqsashlux/sleep-sync.git
cd sleep-sync
npm install
```

Crea un archivo `.env` en la raíz del proyecto con tus valores:

```env
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com  # mismo valor
JWT_SECRET=cualquier-cadena-larga-aleatoria
PORT=3001  # opcional, por defecto 3001
```

### Ejecución

Abre dos terminales:

```bash
# Terminal 1 -- Backend (puerto 3001)
node --env-file=.env server.js

# Terminal 2 -- Frontend (puerto 5173)
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) e inicia sesión con tu cuenta de Google, o haz clic en **Probar sin cuenta** para usar el modo invitado (datos almacenados solo localmente).

## Comandos

| Comando                           | Descripción                             |
|-----------------------------------|-----------------------------------------|
| `npm run dev`                     | Iniciar servidor de desarrollo Vite     |
| `node --env-file=.env server.js`  | Iniciar backend Express                 |
| `npm run build`                   | Build de producción                     |
| `npm run electron:build:win`      | Build de app de escritorio Windows (NSIS) |
| `npm run lint`                    | Ejecutar ESLint                         |
| `node --test tests/*.test.js`    | Ejecutar los 72 tests                   |
| `node db/migrate.js`             | Migrar db.json legacy a SQLite          |

## Estructura del Proyecto

```
sleep-sync/
├── server.js              # Orquestador Express (~35 líneas)
├── config.js              # Configuración centralizada (puertos, ruta DB, JWT, OAuth)
├── .env.example           # Plantilla de variables de entorno
├── db/
│   ├── schema.sql         # DDL de SQLite (4 tablas)
│   ├── database.js        # Inicialización SQLite + singleton getDB()
│   └── migrate.js         # Migración db.json -> SQLite
├── middleware/
│   └── auth.js            # requireAuth + optionalAuth (verificación JWT)
├── routes/
│   ├── auth.js            # Intercambio de token Google OAuth, endpoints de sesión
│   └── data.js            # CRUD de datos de sueño con sanitización completa
├── services/
│   ├── user-service.js    # CRUD de usuarios (findOrCreateUserByGoogle)
│   └── sleep-service.js   # Configuración de sueño, overrides, verificaciones de avance
├── src/
│   ├── main.jsx           # Entrada de la app (proveedores OAuth + Auth)
│   ├── App.jsx            # HashRouter, rutas protegidas/públicas
│   ├── i18n/
│   │   ├── index.js       # Configuración i18next (detección, fallback)
│   │   └── locales/       # JSONs de traducción en, es, pt, zh
│   ├── context/
│   │   └── AuthContext.jsx # Auth de Google + modo invitado
│   ├── hooks/
│   │   └── useAuth.js
│   ├── lib/
│   │   └── api.js         # Cliente HTTP con Bearer token, auto-logout en 401
│   └── components/
│       ├── CircadianCalculator.jsx   # Lógica principal y UI de la app
│       ├── LoginScreen.jsx           # Google Sign-In + entrada de invitado
│       ├── UserMenu.jsx             # Avatar de usuario + dropdown de logout
│       ├── LanguageSwitcher.jsx     # Selector de idioma (EN/ES/PT/ZH)
│       └── GuestBanner.jsx          # Banner informativo para modo invitado
├── electron/
│   ├── main.cjs           # Proceso principal Electron (popup OAuth, fork del servidor)
│   └── preload.cjs        # contextBridge
└── tests/                 # 72 tests usando node:test (SQLite in-memory)
```

## API

Todos los endpoints de datos requieren un JWT en el header `Authorization: Bearer <token>`.

| Método | Endpoint            | Auth | Descripción                                          |
|--------|---------------------|------|------------------------------------------------------|
| POST   | `/api/auth/google`  | No   | Intercambiar token de Google ID por un JWT           |
| GET    | `/api/auth/me`      | Sí   | Obtener el perfil del usuario autenticado            |
| POST   | `/api/auth/logout`  | Sí   | Logout (stateless, eliminación de token del lado del cliente) |
| GET    | `/api/data`         | Sí   | Obtener la configuración de sueño y overrides del usuario |
| POST   | `/api/data`         | Sí   | Guardar datos de sueño (verificación de conflictos por revisión) |

### Modelo de datos

La base de datos SQLite (`db/sync.db`) tiene 4 tablas:

- **users** -- Información de cuenta de Google (id, email, nombre para mostrar, avatar)
- **sleep_settings** -- 1:1 por usuario (horarios de dormir/despertar, cantidad de avance, días de consolidación, contador de revisión)
- **day_overrides** -- Overrides por fecha forzando mantenimiento o avance
- **advance_checks** -- Flags de confirmación de avance por fecha

## Compilar la App de Escritorio

El build de Electron produce un instalador de Windows (NSIS):

```bash
npm run electron:build:win
```

El instalador se genera en el directorio `release/`. En modo producción, Electron crea un fork del servidor Express como proceso hijo y gestiona su ciclo de vida.

## Características

- Corrección gradual del horario de sueño mediante algoritmo de avance de fase
- 9 fases de energía mapeadas a tu hora de despertar
- Overrides por día (forzar mantenimiento o avance en cualquier fecha)
- Verificaciones de confirmación de avance
- **UI multi-idioma** -- Inglés (por defecto), Español, Portugués, Chino Simplificado, con detección automática del idioma del navegador
- **Modo invitado/demo** -- prueba la app sin cuenta; datos almacenados en localStorage
- **Soporte multi-usuario** -- Google Sign-In con aislamiento de datos por usuario en SQLite
- Prevención de conflictos basada en revisiones para guardados concurrentes
- UI con tema oscuro/nocturno
- App de escritorio con instalador de Windows

## Licencia

[MIT](LICENSE)
