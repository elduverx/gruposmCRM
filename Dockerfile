# Etapa de construcción
FROM node:18-alpine AS builder

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar OpenSSL y otras dependencias necesarias
RUN apk add --no-cache openssl

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig.json ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY next.config.js ./
COPY prisma ./prisma/
COPY .env.example ./.env

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm install --legacy-peer-deps && \
    npm install @tailwindcss/forms --legacy-peer-deps

# Copiar el resto del código fuente
COPY . .

# Generar el cliente de Prisma y configurar Tailwind
RUN npx prisma generate && \
    npx tailwindcss init -p

# Construir la aplicación sin intentar acceder a la base de datos
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV SKIP_DB_CHECK=true
RUN NODE_OPTIONS="--max_old_space_size=4096" npm run build

# Etapa de producción
FROM node:18-alpine AS runner

WORKDIR /app

# Instalar OpenSSL en la etapa de producción
RUN apk add --no-cache openssl

# Copiar archivos necesarios desde la etapa de construcción
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.env ./

# Instalar solo las dependencias de producción
RUN npm install --production --legacy-peer-deps && \
    npm install @tailwindcss/forms --legacy-peer-deps

# Generar el cliente de Prisma en la etapa de producción
RUN npx prisma generate

# Exponer el puerto
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["node", "server.js"] 