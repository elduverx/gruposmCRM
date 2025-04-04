/*
  Warnings:

  - You are about to alter the column `status` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(1))`.
  - You are about to alter the column `action` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Enum(EnumId(2))`.
  - You are about to alter the column `type` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(3))`.
  - You are about to drop the `PropertyNews` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `PropertyNews` DROP FOREIGN KEY `PropertyNews_propertyId_fkey`;

-- AlterTable
ALTER TABLE `Property` MODIFY `status` ENUM('SIN_EMPEZAR', 'EMPEZADA') NOT NULL DEFAULT 'SIN_EMPEZAR',
    MODIFY `action` ENUM('IR_A_DIRECCION', 'REPETIR', 'LOCALIZAR_VERIFICADO') NOT NULL DEFAULT 'IR_A_DIRECCION',
    MODIFY `type` ENUM('CHALET', 'PISO', 'CASA', 'APARTAMENTO', 'ATICO', 'DUPLEX', 'TERRENO', 'LOCAL_COMERCIAL', 'OFICINA', 'GARAJE', 'TRASTERO') NOT NULL DEFAULT 'CASA';

-- DropTable
DROP TABLE `PropertyNews`;
