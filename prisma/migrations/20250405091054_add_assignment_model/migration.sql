/*
  Warnings:

  - You are about to drop the column `description` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Assignment` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Assignment` table. All the data in the column will be lost.
  - Added the required column `buyerFeeType` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `buyerFeeValue` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `exclusiveUntil` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerFeeType` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sellerFeeValue` to the `Assignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Assignment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Assignment` DROP COLUMN `description`,
    DROP COLUMN `dueDate`,
    DROP COLUMN `status`,
    DROP COLUMN `title`,
    ADD COLUMN `buyerFeeType` VARCHAR(191) NOT NULL,
    ADD COLUMN `buyerFeeValue` DOUBLE NOT NULL,
    ADD COLUMN `exclusiveUntil` DATETIME(3) NOT NULL,
    ADD COLUMN `origin` VARCHAR(191) NOT NULL,
    ADD COLUMN `price` DOUBLE NOT NULL,
    ADD COLUMN `sellerFeeType` VARCHAR(191) NOT NULL,
    ADD COLUMN `sellerFeeValue` DOUBLE NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;
