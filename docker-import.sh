#!/bin/bash

# Verificar si Docker está en ejecución
if ! docker info > /dev/null 2>&1; then
  echo "Docker no está en ejecución. Por favor, inicia Docker y vuelve a intentarlo."
  exit 1
fi

# Verificar si los contenedores están en ejecución
if ! docker-compose ps | grep -q "app.*Up"; then
  echo "Los contenedores no están en ejecución. Iniciando contenedores..."
  ./start-docker.sh
  exit 0
fi

# Ejecutar el script de importación
echo "Ejecutando script de importación..."
docker-compose exec app npx tsx src/scripts/docker-import.ts

# Preguntar si se desea ejecutar el script de geocodificación
read -p "¿Deseas ejecutar el script de geocodificación ahora? (s/n): " run_geocode
if [[ $run_geocode == "s" || $run_geocode == "S" ]]; then
  echo "Ejecutando script de geocodificación..."
  docker-compose exec app npx tsx src/scripts/docker-geocode.ts
else
  echo "Puedes ejecutar el script de geocodificación más tarde con: docker-compose exec app npx tsx src/scripts/docker-geocode.ts"
fi 