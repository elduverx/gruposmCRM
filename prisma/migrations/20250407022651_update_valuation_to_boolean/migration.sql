/*
  Warnings:

  - You are about to alter the column `valuation` on the `PropertyNews` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `TinyInt`.

*/
-- Primero actualizamos los datos existentes
UPDATE `PropertyNews` SET `valuation` = CASE 
  WHEN `valuation` = 'true' OR `valuation` = 'PRECIOSM' THEN '1'
  ELSE '0'
END;

-- Luego cambiamos el tipo de columna
ALTER TABLE `PropertyNews` MODIFY `valuation` BOOLEAN NOT NULL;
