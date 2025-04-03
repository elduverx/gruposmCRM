-- DropForeignKey
ALTER TABLE `Property` DROP FOREIGN KEY `Property_clientId_fkey`;

-- AlterTable
ALTER TABLE `Client` ADD COLUMN `hasRequest` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Property` ADD COLUMN `responsible` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_ClientToProperty` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClientToProperty_AB_unique`(`A`, `B`),
    INDEX `_ClientToProperty_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ClientRelatedProperties` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClientRelatedProperties_AB_unique`(`A`, `B`),
    INDEX `_ClientRelatedProperties_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ClientToProperty` ADD CONSTRAINT `_ClientToProperty_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientToProperty` ADD CONSTRAINT `_ClientToProperty_B_fkey` FOREIGN KEY (`B`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientRelatedProperties` ADD CONSTRAINT `_ClientRelatedProperties_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientRelatedProperties` ADD CONSTRAINT `_ClientRelatedProperties_B_fkey` FOREIGN KEY (`B`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
