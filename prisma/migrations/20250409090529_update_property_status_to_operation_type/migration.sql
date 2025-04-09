/*
  Warnings:

  - You are about to alter the column `status` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `Property` ADD COLUMN `ascensor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `banos` INTEGER NULL,
    ADD COLUMN `habitaciones` INTEGER NULL,
    ADD COLUMN `metrosCuadrados` INTEGER NULL,
    ADD COLUMN `parking` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `piscina` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` ENUM('SALE', 'RENT') NOT NULL DEFAULT 'SALE';
