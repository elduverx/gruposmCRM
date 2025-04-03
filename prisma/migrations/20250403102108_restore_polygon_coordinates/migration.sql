/*
  Warnings:

  - You are about to drop the column `centerLat` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `centerLng` on the `Zone` table. All the data in the column will be lost.
  - You are about to drop the column `radius` on the `Zone` table. All the data in the column will be lost.
  - Added the required column `coordinates` to the `Zone` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Zone` DROP COLUMN `centerLat`,
    DROP COLUMN `centerLng`,
    DROP COLUMN `radius`,
    ADD COLUMN `coordinates` JSON NOT NULL,
    MODIFY `color` VARCHAR(191) NOT NULL DEFAULT '#FF0000';
