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
```

4. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

5. Abrir [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del proyecto

- `src/app`: Páginas y rutas de la aplicación
- `src/components`: Componentes reutilizables
- `src/context`: Contextos de React (autenticación)
- `src/lib`: Utilidades y funciones auxiliares
- `src/types`: Definiciones de tipos TypeScript

## Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Los tokens se almacenan en el localStorage del navegador y se envían en el encabezado de autorización para las solicitudes a la API.

## Licencia

MIT
