#!/bin/bash

# Obtener la fecha actual para el nombre del archivo
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Crear el directorio de backups si no existe
mkdir -p $BACKUP_DIR

# Configuración de la base de datos
DB_USER="root"
DB_PASS="password"
DB_NAME="railway"
CONTAINER_NAME="crm-db-1"

echo "Iniciando backup de la base de datos..."

# Crear el backup
docker exec $CONTAINER_NAME mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_FILE

# Verificar si el backup fue exitoso
if [ $? -eq 0 ]; then
    echo "Backup completado exitosamente: $BACKUP_FILE"
    echo "Tamaño del archivo: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "Error al crear el backup"
    exit 1
fi 