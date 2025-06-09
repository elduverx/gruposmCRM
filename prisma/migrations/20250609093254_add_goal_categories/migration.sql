/*
  Warnings:

  - You are about to alter the column `category` on the `UserGoal` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `UserGoal` MODIFY `category` ENUM('GENERAL', 'ACTIVITY', 'DPV', 'NEWS', 'ASSIGNMENT') NOT NULL DEFAULT 'GENERAL';
