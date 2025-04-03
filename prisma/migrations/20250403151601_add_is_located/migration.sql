-- AlterTable
ALTER TABLE `Property` ADD COLUMN `isLocated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `lastContact` DATETIME(3) NULL;
