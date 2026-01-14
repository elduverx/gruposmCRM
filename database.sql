-- SQL Export for gruposmCRM Database
-- Database: u565926324_crmdatadb

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `User`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `User` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Zone`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Zone` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `color` varchar(191) NOT NULL DEFAULT '#FF0000',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `coordinates` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `_ZoneUsers`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `_ZoneUsers` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL,
  UNIQUE KEY `_ZoneUsers_AB_unique` (`A`,`B`),
  KEY `_ZoneUsers_B_index` (`B`),
  CONSTRAINT `_ZoneUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Zone` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ZoneUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `BaseProperty`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `BaseProperty` (
  `id` varchar(191) NOT NULL,
  `address` varchar(191) NOT NULL,
  `population` varchar(191) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `type` enum('CHALET','PISO','CASA','APARTAMENTO','ATICO','DUPLEX','TERRENO','LOCAL_COMERCIAL','OFICINA','GARAJE','TRASTERO') NOT NULL DEFAULT 'CASA',
  `habitaciones` int DEFAULT NULL,
  `banos` int DEFAULT NULL,
  `metrosCuadrados` int DEFAULT NULL,
  `parking` tinyint(1) NOT NULL DEFAULT '0',
  `ascensor` tinyint(1) NOT NULL DEFAULT '0',
  `piscina` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Complex`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Complex` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` varchar(191) NOT NULL,
  `population` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `totalBuildings` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Building`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Building` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `address` varchar(191) NOT NULL,
  `population` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `totalFloors` int DEFAULT NULL,
  `totalUnits` int DEFAULT NULL,
  `complexId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Building_complexId_fkey` (`complexId`),
  CONSTRAINT `Building_complexId_fkey` FOREIGN KEY (`complexId`) REFERENCES `Complex` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Property`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Property` (
  `id` varchar(191) NOT NULL,
  `address` varchar(191) NOT NULL,
  `population` varchar(191) NOT NULL,
  `status` enum('SIN_EMPEZAR','EMPEZADA','SOLD') NOT NULL DEFAULT 'SIN_EMPEZAR',
  `action` enum('IR_A_DIRECCION','REPETIR','LOCALIZAR_VERIFICADO') NOT NULL DEFAULT 'IR_A_DIRECCION',
  `ownerName` varchar(191) NOT NULL,
  `ownerPhone` varchar(191) NOT NULL,
  `captureDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `responsibleId` varchar(191) DEFAULT NULL,
  `hasSimpleNote` tinyint(1) NOT NULL DEFAULT '0',
  `isOccupied` tinyint(1) NOT NULL DEFAULT '0',
  `clientId` varchar(191) DEFAULT NULL,
  `zoneId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `occupiedBy` varchar(191) DEFAULT NULL,
  `occupiedByName` varchar(191) DEFAULT NULL,
  `type` enum('CHALET','PISO','CASA','APARTAMENTO','ATICO','DUPLEX','TERRENO','LOCAL_COMERCIAL','OFICINA','GARAJE','TRASTERO') NOT NULL DEFAULT 'CASA',
  `isLocated` tinyint(1) NOT NULL DEFAULT '0',
  `responsible` varchar(191) DEFAULT NULL,
  `ascensor` tinyint(1) NOT NULL DEFAULT '0',
  `banos` int DEFAULT NULL,
  `habitaciones` int DEFAULT NULL,
  `metrosCuadrados` int DEFAULT NULL,
  `parking` tinyint(1) NOT NULL DEFAULT '0',
  `piscina` tinyint(1) NOT NULL DEFAULT '0',
  `basePropertyId` varchar(191) DEFAULT NULL,
  `buildingId` varchar(191) DEFAULT NULL,
  `isSold` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Property_basePropertyId_key` (`basePropertyId`),
  KEY `Property_clientId_fkey` (`clientId`),
  KEY `Property_zoneId_fkey` (`zoneId`),
  KEY `Property_responsibleId_fkey` (`responsibleId`),
  KEY `Property_buildingId_fkey` (`buildingId`),
  CONSTRAINT `Property_basePropertyId_fkey` FOREIGN KEY (`basePropertyId`) REFERENCES `BaseProperty` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Property_buildingId_fkey` FOREIGN KEY (`buildingId`) REFERENCES `Building` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Property_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Property_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Client`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Client` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `hasRequest` tinyint(1) NOT NULL DEFAULT '0',
  `isTenant` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `_ClientProperties`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `_ClientProperties` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL,
  UNIQUE KEY `_ClientProperties_AB_unique` (`A`,`B`),
  KEY `_ClientProperties_B_index` (`B`),
  CONSTRAINT `_ClientProperties_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ClientProperties_B_fkey` FOREIGN KEY (`B`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `News`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `News` (
  `id` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` varchar(191) NOT NULL,
  `image` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Assignment`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Assignment` (
  `id` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `propertyId` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `responsibleId` varchar(191) DEFAULT NULL,
  `buyerFeeType` varchar(191) NOT NULL,
  `buyerFeeValue` double NOT NULL,
  `exclusiveUntil` datetime(3) NOT NULL,
  `origin` varchar(191) NOT NULL,
  `price` double NOT NULL,
  `sellerFeeType` varchar(191) NOT NULL,
  `sellerFeeValue` double NOT NULL,
  `type` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `notes` text,
  `estimatedEndDate` datetime(3) DEFAULT NULL,
  `requiredDocuments` json DEFAULT NULL,
  `documentsStatus` json DEFAULT NULL,
  `specialConditions` text,
  PRIMARY KEY (`id`),
  KEY `Assignment_propertyId_fkey` (`propertyId`),
  KEY `Assignment_clientId_fkey` (`clientId`),
  KEY `Assignment_responsibleId_fkey` (`responsibleId`),
  CONSTRAINT `Assignment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Assignment_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Assignment_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `Activity`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `Activity` (
  `id` varchar(191) NOT NULL,
  `type` enum('DPV','NOTICIA','ENCARGO','VISITA','LLAMADA','EMAIL','OTROS') NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Programada',
  `date` datetime(3) NOT NULL,
  `client` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `propertyId` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Activity_propertyId_fkey` (`propertyId`),
  KEY `Activity_userId_fkey` (`userId`),
  CONSTRAINT `Activity_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Activity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `DPV`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `DPV` (
  `id` varchar(191) NOT NULL,
  `links` json NOT NULL,
  `realEstate` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `currentPrice` double DEFAULT NULL,
  `estimatedValue` double DEFAULT NULL,
  `propertyId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DPV_propertyId_key` (`propertyId`),
  KEY `DPV_propertyId_fkey` (`propertyId`),
  CONSTRAINT `DPV_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `PropertyNews`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `PropertyNews` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'DPV',
  `action` varchar(191) NOT NULL DEFAULT 'Venta',
  `valuation` varchar(191) NOT NULL DEFAULT 'No',
  `priority` varchar(191) NOT NULL DEFAULT 'LOW',
  `responsible` varchar(191) NOT NULL DEFAULT 'Sin asignar',
  `value` double NOT NULL DEFAULT '0',
  `propertyId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `precioCliente` double DEFAULT NULL,
  `precioSM` double DEFAULT NULL,
  `commissionType` varchar(191) NOT NULL DEFAULT 'percentage',
  `commissionValue` double NOT NULL DEFAULT '3',
  `isDone` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `PropertyNews_propertyId_idx` (`propertyId`),
  CONSTRAINT `PropertyNews_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `ClientRequest`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `ClientRequest` (
  `id` varchar(191) NOT NULL,
  `clientId` varchar(191) NOT NULL,
  `bedrooms` int NOT NULL,
  `bathrooms` int NOT NULL,
  `minPrice` double NOT NULL,
  `maxPrice` double NOT NULL,
  `propertyType` varchar(191) NOT NULL,
  `features` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'SALE',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ClientRequest_clientId_key` (`clientId`),
  CONSTRAINT `ClientRequest_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `UserGoal`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `UserGoal` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `targetCount` int NOT NULL,
  `currentCount` int NOT NULL DEFAULT '0',
  `startDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` datetime(3) DEFAULT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `category` enum('GENERAL','ACTIVITY','DPV','NEWS','BILLED','ASSIGNMENT','LOCATED_TENANTS','ADDED_PHONES','EMPTY_PROPERTIES','NEW_PROPERTIES','LOCATED_PROPERTIES') NOT NULL DEFAULT 'GENERAL',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserGoal_userId_idx` (`userId`),
  CONSTRAINT `UserGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `UserActivity`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `UserActivity` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `goalId` varchar(191) DEFAULT NULL,
  `type` enum('DPV','NOTICIA','ENCARGO','VISITA','LLAMADA','EMAIL','OTROS') NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `metadata` json DEFAULT NULL,
  `relatedId` varchar(191) DEFAULT NULL,
  `relatedType` varchar(191) DEFAULT NULL,
  `points` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `UserActivity_userId_idx` (`userId`),
  KEY `UserActivity_goalId_idx` (`goalId`),
  CONSTRAINT `UserActivity_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `UserGoal` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for table `CatastroProperty`
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `CatastroProperty` (
  `id` varchar(191) NOT NULL,
  `reference` varchar(191) NOT NULL,
  `streetType` varchar(191) DEFAULT NULL,
  `streetName` varchar(191) DEFAULT NULL,
  `number` varchar(191) DEFAULT NULL,
  `block` varchar(191) DEFAULT NULL,
  `stairway` varchar(191) DEFAULT NULL,
  `floor` varchar(191) DEFAULT NULL,
  `door` varchar(191) DEFAULT NULL,
  `reformType` varchar(191) DEFAULT NULL,
  `age` varchar(191) DEFAULT NULL,
  `quality` varchar(191) DEFAULT NULL,
  `constructedArea` varchar(191) DEFAULT NULL,
  `propertyType` varchar(191) DEFAULT NULL,
  `address` varchar(191) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CatastroProperty_reference_key` (`reference`),
  KEY `CatastroProperty_reference_idx` (`reference`),
  KEY `CatastroProperty_streetName_number_idx` (`streetName`,`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

SET FOREIGN_KEY_CHECKS=1;
COMMIT;
