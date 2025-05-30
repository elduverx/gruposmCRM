/*
  Warnings:

  - You are about to alter the column `status` on the `Property` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `Enum(EnumId(1))`.
  - You are about to drop the `_UserZones` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[basePropertyId]` on the table `Property` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `_UserZones` DROP FOREIGN KEY `_UserZones_A_fkey`;

-- DropForeignKey
ALTER TABLE `_UserZones` DROP FOREIGN KEY `_UserZones_B_fkey`;

-- AlterTable
ALTER TABLE `Property` ADD COLUMN `basePropertyId` VARCHAR(191) NULL,
    ADD COLUMN `isSold` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `status` ENUM('SIN_EMPEZAR', 'EMPEZADA', 'SOLD') NOT NULL DEFAULT 'SIN_EMPEZAR';

-- DropTable
DROP TABLE `_UserZones`;

-- CreateTable
CREATE TABLE `BaseProperty` (
    `id` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `population` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `type` ENUM('CHALET', 'PISO', 'CASA', 'APARTAMENTO', 'ATICO', 'DUPLEX', 'TERRENO', 'LOCAL_COMERCIAL', 'OFICINA', 'GARAJE', 'TRASTERO') NOT NULL DEFAULT 'CASA',
    `habitaciones` INTEGER NULL,
    `banos` INTEGER NULL,
    `metrosCuadrados` INTEGER NULL,
    `parking` BOOLEAN NOT NULL DEFAULT false,
    `ascensor` BOOLEAN NOT NULL DEFAULT false,
    `piscina` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ZoneUsers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ZoneUsers_AB_unique`(`A`, `B`),
    INDEX `_ZoneUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Property_basePropertyId_key` ON `Property`(`basePropertyId`);

-- CreateIndex
CREATE INDEX `Property_basePropertyId_fkey` ON `Property`(`basePropertyId`);

-- AddForeignKey
ALTER TABLE `Property` ADD CONSTRAINT `Property_basePropertyId_fkey` FOREIGN KEY (`basePropertyId`) REFERENCES `BaseProperty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ZoneUsers` ADD CONSTRAINT `_ZoneUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ZoneUsers` ADD CONSTRAINT `_ZoneUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `Zone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
