-- CreateTable
CREATE TABLE `CatastroProperty` (
    `id` VARCHAR(191) NOT NULL,
    `reference` VARCHAR(191) NOT NULL,
    `streetType` VARCHAR(191) NULL,
    `streetName` VARCHAR(191) NULL,
    `number` VARCHAR(191) NULL,
    `block` VARCHAR(191) NULL,
    `stairway` VARCHAR(191) NULL,
    `floor` VARCHAR(191) NULL,
    `door` VARCHAR(191) NULL,
    `reformType` VARCHAR(191) NULL,
    `age` VARCHAR(191) NULL,
    `quality` VARCHAR(191) NULL,
    `constructedArea` VARCHAR(191) NULL,
    `propertyType` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CatastroProperty_reference_key`(`reference`),
    INDEX `CatastroProperty_reference_idx`(`reference`),
    INDEX `CatastroProperty_streetName_number_idx`(`streetName`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
