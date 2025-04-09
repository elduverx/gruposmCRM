-- AlterTable
ALTER TABLE `ClientRequest` ADD COLUMN `type` ENUM('SALE', 'RENT') NOT NULL DEFAULT 'SALE';
