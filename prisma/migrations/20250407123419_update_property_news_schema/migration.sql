/*
  Warnings:

  - You are about to alter the column `valuation` on the `PropertyNews` table. The data in that column could be lost. The data in that column will be cast from `TinyInt` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `PropertyNews` MODIFY `valuation` VARCHAR(191) NOT NULL;
