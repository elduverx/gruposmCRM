/*
  Warnings:

  - You are about to drop the `_ClientRelatedProperties` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ClientRelatedProperties` DROP FOREIGN KEY `_ClientRelatedProperties_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ClientRelatedProperties` DROP FOREIGN KEY `_ClientRelatedProperties_B_fkey`;

-- DropTable
DROP TABLE `_ClientRelatedProperties`;

-- CreateTable
CREATE TABLE `_ClientProperties` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ClientProperties_AB_unique`(`A`, `B`),
    INDEX `_ClientProperties_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ClientProperties` ADD CONSTRAINT `_ClientProperties_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ClientProperties` ADD CONSTRAINT `_ClientProperties_B_fkey` FOREIGN KEY (`B`) REFERENCES `Property`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
