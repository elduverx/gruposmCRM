/*
  Warnings:

  - You are about to drop the column `latitude` on the `Building` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Building` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `Complex` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Complex` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Building` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`;

-- AlterTable
ALTER TABLE `Complex` DROP COLUMN `latitude`,
    DROP COLUMN `longitude`;
