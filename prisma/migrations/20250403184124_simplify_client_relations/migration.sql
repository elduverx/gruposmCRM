/*
  Warnings:

  - You are about to drop the `_ClientToProperty` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ClientToProperty` DROP FOREIGN KEY `_ClientToProperty_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ClientToProperty` DROP FOREIGN KEY `_ClientToProperty_B_fkey`;

-- DropTable
DROP TABLE `_ClientToProperty`;
