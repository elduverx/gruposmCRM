/*
  Warnings:

  - You are about to drop the column `commissionType` on the `PropertyNews` table. All the data in the column will be lost.
  - You are about to drop the column `commissionValue` on the `PropertyNews` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Property` ADD COLUMN `ascensor` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `banos` INTEGER NULL,
    ADD COLUMN `habitaciones` INTEGER NULL,
    ADD COLUMN `metrosCuadrados` DOUBLE NULL,
    ADD COLUMN `parking` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `piscina` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `PropertyNews` DROP COLUMN `commissionType`,
    DROP COLUMN `commissionValue`,
    MODIFY `value` DOUBLE NULL;

-- RenameIndex
ALTER TABLE `PropertyNews` RENAME INDEX `PropertyNews_propertyId_idx` TO `PropertyNews_propertyId_fkey`;
