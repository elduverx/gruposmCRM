# Real Estate CRM

Un sistema CRM para gestión de bienes inmuebles con autenticación de usuarios.

## Características

- Autenticación de usuarios (registro e inicio de sesión)
- Dashboard con estadísticas
- Gestión de inmuebles
- Gestión de clientes
- Noticias
- Encargos
- Mapa de zonas

## Tecnologías utilizadas

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- JWT para autenticación
- Leaflet para mapas

## Instalación

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/real-estate-crm.git
cd real-estate-crm
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
```
JWT_SECRET=your-super-secret-key-change-this-in-production
DATABASE_URL="mysql://usuario:contraseña@localhost:3306/nombre_db"
NEXTAUTH_SECRET="tu_secret_para_auth"
ADMIN_EMAIL="admin@example.com" # opcional para seed
ADMIN_PASSWORD="contraseña" # opcional para seed
```

4. Configurar la base de datos:
```bash
npx prisma migrate dev
```

5. (Opcional) Cargar datos iniciales:
```bash
npx prisma db seed
```

6. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

7. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

- `src/app`: Páginas y rutas de la aplicación
- `src/components`: Componentes reutilizables
- `src/context`: Contextos de React (autenticación)
- `src/lib`: Utilidades y funciones auxiliares
- `src/types`: Definiciones de tipos TypeScript

## Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens se almacenan en el localStorage del navegador y se envían en el encabezado de autorización para las solicitudes a la API.

## Migración de Usuarios desde JSON

El sistema incluye scripts para migrar usuarios desde el archivo JSON local (`data/users.json`) a la base de datos MySQL con Prisma.

### Versión JavaScript

```bash
# Ver información antes de migrar
node scripts/migrate-users.js

# Realizar la migración
node scripts/migrate-users.js --force
```

### Versión TypeScript

```bash
# Ver información antes de migrar
npx ts-node scripts/migrate-users-typescript.ts

# Realizar la migración
npx ts-node scripts/migrate-users-typescript.ts --force
```

Estos scripts:
- Verifican la conexión a la base de datos
- Leen los usuarios del archivo JSON
- Comprueban si cada usuario ya existe en la base de datos
- Migran solo los usuarios que no existen
- Generan un informe con los resultados

## Desarrollo

```bash
npm run dev
```

## Build para producción

```bash
npm run build
npm start
```

## Licencia

MIT
