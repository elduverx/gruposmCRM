/*
  Warnings:

  - You are about to alter the column `type` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `Property` MODIFY `type` ENUM('HOUSE', 'APARTMENT', 'COMMERCIAL', 'LAND') NOT NULL DEFAULT 'HOUSE';

-- CreateTable
CREATE TABLE `PropertyNews` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `valuation` VARCHAR(191) NOT NULL,
    `priority` VARCHAR(191) NOT NULL,
    `responsible` VARCHAR(191) NOT NULL,
    `value` DOUBLE NULL,
    `propertyId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PropertyNews_propertyId_fkey`(`propertyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PropertyNews` ADD CONSTRAINT `PropertyNews_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
