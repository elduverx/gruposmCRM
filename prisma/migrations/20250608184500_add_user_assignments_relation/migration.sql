/*
  Warnings:

  - You are about to alter the column `type` on the `Activity` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.
  - You are about to alter the column `type` on the `UserActivity` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `Activity` MODIFY `type` ENUM('DPV', 'NOTICIA', 'ENCARGO', 'VISITA', 'LLAMADA', 'EMAIL', 'OTROS') NOT NULL;

-- AlterTable
ALTER TABLE `Assignment` ADD COLUMN `documentsStatus` JSON NULL,
    ADD COLUMN `estimatedEndDate` DATETIME(3) NULL,
    ADD COLUMN `notes` TEXT NULL,
    ADD COLUMN `requiredDocuments` JSON NULL,
    ADD COLUMN `responsibleId` VARCHAR(191) NULL,
    ADD COLUMN `specialConditions` TEXT NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `PropertyNews` ADD COLUMN `isDone` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `type` VARCHAR(191) NOT NULL DEFAULT 'DPV',
    MODIFY `action` VARCHAR(191) NOT NULL DEFAULT 'Venta',
    MODIFY `valuation` VARCHAR(191) NOT NULL DEFAULT 'No',
    MODIFY `priority` VARCHAR(191) NOT NULL DEFAULT 'LOW',
    MODIFY `responsible` VARCHAR(191) NOT NULL DEFAULT 'Sin asignar',
    MODIFY `value` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `UserActivity` MODIFY `type` ENUM('DPV', 'NOTICIA', 'ENCARGO', 'VISITA', 'LLAMADA', 'EMAIL', 'OTROS') NOT NULL;

-- CreateIndex
CREATE INDEX `Assignment_responsibleId_fkey` ON `Assignment`(`responsibleId`);

-- AddForeignKey
ALTER TABLE `Assignment` ADD CONSTRAINT `Assignment_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
