-- CreateTable
CREATE TABLE `_ZoneUsers` (
    `A` VARCHAR(191) NOT NULL,
    `B` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `_ZoneUsers_AB_unique`(`A`, `B`),
    INDEX `_ZoneUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ZoneUsers` ADD CONSTRAINT `_ZoneUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Zone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ZoneUsers` ADD CONSTRAINT `_ZoneUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; 