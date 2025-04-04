/*
  Warnings:

  - You are about to alter the column `type` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `Property` MODIFY `type` ENUM('CHALET', 'PISO', 'CASA', 'APARTAMENTO', 'ATICO', 'DUPLEX', 'TERRENO', 'LOCAL_COMERCIAL', 'OFICINA', 'GARAJE', 'TRASTERO') NOT NULL DEFAULT 'CASA';
