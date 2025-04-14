-- CreateTable
CREATE TABLE `UserGoal` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `targetCount` INTEGER NOT NULL,
    `currentCount` INTEGER NOT NULL DEFAULT 0,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isCompleted` BOOLEAN NOT NULL DEFAULT false,
    `category` VARCHAR(191) NOT NULL DEFAULT 'GENERAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserGoal_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `goalId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,
    `relatedId` VARCHAR(191) NULL,
    `relatedType` VARCHAR(191) NULL,
    `points` INTEGER NOT NULL DEFAULT 1,

    INDEX `UserActivity_userId_idx`(`userId`),
    INDEX `UserActivity_goalId_idx`(`goalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserGoal` ADD CONSTRAINT `UserGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivity` ADD CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserActivity` ADD CONSTRAINT `UserActivity_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `UserGoal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
