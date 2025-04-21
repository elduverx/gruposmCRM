#!/bin/bash

# Detener contenedores existentes
docker-compose down

# Construir y iniciar los contenedores
docker-compose up --build -d

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."
sleep 10

# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Mostrar logs
docker-compose logs -f 