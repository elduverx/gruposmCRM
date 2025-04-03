/*
  Warnings:

  - You are about to drop the column `occupantName` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `propertyType` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Property` DROP COLUMN `occupantName`,
    DROP COLUMN `propertyType`,
    ADD COLUMN `occupiedBy` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND') NOT NULL DEFAULT 'HOUSE',
    MODIFY `captureDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
