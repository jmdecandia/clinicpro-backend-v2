# ClinicPro Backend - V1 Mínima

Backend funcional para ClinicPro con endpoints mínimos:
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/clinics/:id`
- `GET /api/clinics/slug/:slug`
- `GET /api/dashboard`

## 🚀 Despliegue Rápido en Render (Gratis)

### Opción 1: Deploy Directo (Más fácil)

1. Ve a https://render.com/blueprints
2. Haz clic en **"New Blueprint Instance"**
3. Conecta tu cuenta de GitHub
4. Selecciona el repositorio con este código
5. Render detectará automáticamente el `render.yaml`
6. Haz clic en **"Apply"**
7. Espera a que se despliegue (2-3 minutos)

### Opción 2: Manual

1. Crea una cuenta en https://render.com
2. Haz clic en **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub o sube el código
4. Configura:
   - **Name**: `clinicpro-api`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. Añade variable de entorno:
   - `JWT_SECRET`: genera un valor aleatorio (ej: `openssl rand -base64 32`)
6. Haz clic en **"Create Web Service"**

## 📧 Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Super Admin | `admin@clinicpro.com` | `admin123` |
| Admin Clínica | `clinica@demo.com` | `clinica123` |
| Staff | `staff@demo.com` | `staff123` |

## 🔧 Desarrollo Local

```bash
npm install
npm start
```

El servidor estará en `http://localhost:3001`

## 📋 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil del usuario
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

### Clínicas
- `GET /api/clinics` - Listar clínicas
- `GET /api/clinics/:id` - Obtener clínica por ID
- `GET /api/clinics/slug/:slug` - Obtener clínica por slug
- `POST /api/clinics` - Crear clínica (Super Admin)
- `PUT /api/clinics/:id` - Actualizar clínica

### Dashboard
- `GET /api/dashboard` - Estadísticas del dashboard

### Pacientes, Servicios, Citas, Pagos
Endpoints CRUD completos disponibles.

## 📝 Notas

- Los datos se almacenan en memoria (se reinician al reiniciar el servidor)
- CORS está configurado para permitir cualquier origen
- El token JWT expira en 7 días
