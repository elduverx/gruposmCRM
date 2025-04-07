/*
  Warnings:

  - Made the column `value` on table `PropertyNews` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `PropertyNews` ADD COLUMN `commissionType` VARCHAR(191) NOT NULL DEFAULT 'percentage',
    ADD COLUMN `commissionValue` DOUBLE NOT NULL DEFAULT 3,
    MODIFY `value` DOUBLE NOT NULL;

-- RenameIndex
ALTER TABLE `PropertyNews` RENAME INDEX `PropertyNews_propertyId_fkey` TO `PropertyNews_propertyId_idx`;
