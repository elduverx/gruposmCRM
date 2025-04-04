-- MySQL dump 10.13  Distrib 8.4.4, for macos15.2 (arm64)
--
-- Host: localhost    Database: databasesm
-- ------------------------------------------------------
-- Server version	9.2.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_ClientProperties`
--

DROP TABLE IF EXISTS `_ClientProperties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_ClientProperties` (
  `A` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `B` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY `_ClientProperties_AB_unique` (`A`,`B`),
  KEY `_ClientProperties_B_index` (`B`),
  CONSTRAINT `_ClientProperties_A_fkey` FOREIGN KEY (`A`) REFERENCES `Client` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ClientProperties_B_fkey` FOREIGN KEY (`B`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_ClientProperties`
--

LOCK TABLES `_ClientProperties` WRITE;
/*!40000 ALTER TABLE `_ClientProperties` DISABLE KEYS */;
INSERT INTO `_ClientProperties` VALUES ('cm92pcvsn00026h0gjirfb05l','cm92p7lyy00006h0gtjgar7qt'),('cm92t2kqs00026hghp0uzgpip','cm92stsim00016hghrwgq04ng');
/*!40000 ALTER TABLE `_ClientProperties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Activity`
--

DROP TABLE IF EXISTS `Activity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Activity` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Programada',
  `date` datetime(3) NOT NULL,
  `client` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `propertyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Activity_propertyId_fkey` (`propertyId`),
  CONSTRAINT `Activity_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Activity`
--

LOCK TABLES `Activity` WRITE;
/*!40000 ALTER TABLE `Activity` DISABLE KEYS */;
INSERT INTO `Activity` VALUES ('cm92q74qe00066h0guhoi7z4a','Contacto Directo','Programada','2025-04-04 09:53:00.000','er','rr','cm92p7lyy00006h0gtjgar7qt','2025-04-04 11:53:06.231','2025-04-04 11:53:06.231'),('cm92zqxxf00016hxb5vutegml','Llamada','Programada','2025-04-04 14:20:00.000','','','cm92ywsnq00046ht3jbv5vzbr','2025-04-04 16:20:27.075','2025-04-04 16:20:27.075'),('cm93125kh00016h8otnzaoak8','Llamada','Programada','2025-04-04 14:57:00.000','','','cm92ywsnq00046ht3jbv5vzbr','2025-04-04 16:57:09.809','2025-04-04 16:57:09.809');
/*!40000 ALTER TABLE `Activity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Assignment`
--

DROP TABLE IF EXISTS `Assignment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Assignment` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELLED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `dueDate` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `propertyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `clientId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Assignment_clientId_fkey` (`clientId`),
  KEY `Assignment_propertyId_fkey` (`propertyId`),
  CONSTRAINT `Assignment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Assignment_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Assignment`
--

LOCK TABLES `Assignment` WRITE;
/*!40000 ALTER TABLE `Assignment` DISABLE KEYS */;
/*!40000 ALTER TABLE `Assignment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Client`
--

DROP TABLE IF EXISTS `Client`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Client` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `hasRequest` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Client_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Client`
--

LOCK TABLES `Client` WRITE;
/*!40000 ALTER TABLE `Client` DISABLE KEYS */;
INSERT INTO `Client` VALUES ('cm92pcvsn00026h0gjirfb05l','test','were@s','13','qw','2025-04-04 11:29:34.967','2025-04-04 11:29:34.967',0),('cm92t2kqs00026hghp0uzgpip','test1','qweewq@ff','123123','qwe','2025-04-04 13:13:32.548','2025-04-04 13:13:32.548',0);
/*!40000 ALTER TABLE `Client` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `DPV`
--

DROP TABLE IF EXISTS `DPV`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DPV` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `links` json NOT NULL,
  `realEstate` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currentPrice` double DEFAULT NULL,
  `estimatedValue` double DEFAULT NULL,
  `propertyId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DPV_propertyId_key` (`propertyId`),
  KEY `DPV_propertyId_fkey` (`propertyId`),
  CONSTRAINT `DPV_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `Property` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `DPV`
--

LOCK TABLES `DPV` WRITE;
/*!40000 ALTER TABLE `DPV` DISABLE KEYS */;
INSERT INTO `DPV` VALUES ('cm92q6z4800046h0gxgylylwt','[]','qwe','123',233,23333,'cm92p7lyy00006h0gtjgar7qt','2025-04-04 11:52:58.952','2025-04-04 11:52:58.952'),('cm92zr5w200036hxbtqsr10hj','[\"er\"]','eee','1234',123,123,'cm92ywsnq00046ht3jbv5vzbr','2025-04-04 16:20:37.394','2025-04-04 16:20:37.394');
/*!40000 ALTER TABLE `DPV` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `News`
--

DROP TABLE IF EXISTS `News`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `News` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `News`
--

LOCK TABLES `News` WRITE;
/*!40000 ALTER TABLE `News` DISABLE KEYS */;
/*!40000 ALTER TABLE `News` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Property`
--

DROP TABLE IF EXISTS `Property`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Property` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `population` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('SIN_EMPEZAR','EMPEZADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SIN_EMPEZAR',
  `action` enum('IR_A_DIRECCION','REPETIR','LOCALIZAR_VERIFICADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'IR_A_DIRECCION',
  `ownerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ownerPhone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `captureDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `responsibleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hasSimpleNote` tinyint(1) NOT NULL DEFAULT '0',
  `isOccupied` tinyint(1) NOT NULL DEFAULT '0',
  `clientId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zoneId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `occupiedBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('CHALET','PISO','CASA','APARTAMENTO','ATICO','DUPLEX','TERRENO','LOCAL_COMERCIAL','OFICINA','GARAJE','TRASTERO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CASA',
  `isLocated` tinyint(1) NOT NULL DEFAULT '0',
  `responsible` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Property_clientId_fkey` (`clientId`),
  KEY `Property_zoneId_fkey` (`zoneId`),
  KEY `Property_responsibleId_fkey` (`responsibleId`),
  CONSTRAINT `Property_responsibleId_fkey` FOREIGN KEY (`responsibleId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Property_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Property`
--

LOCK TABLES `Property` WRITE;
/*!40000 ALTER TABLE `Property` DISABLE KEYS */;
INSERT INTO `Property` VALUES ('cm92p7lyy00006h0gtjgar7qt','Calle de Larra, 1, Chueca, Madrid','Madrid','SIN_EMPEZAR','IR_A_DIRECCION','test1','123','2025-04-04 11:25:28.953',NULL,0,0,NULL,'cm92pa5xv00016h0g9azu4a31','2025-04-04 11:25:28.954','2025-04-04 13:13:42.061',40.42695685497071,-3.69990348815918,NULL,'DUPLEX',0,NULL),('cm92stsim00016hghrwgq04ng','Calle de Serrano, 46, Salamanca, Madrid','Madrid','SIN_EMPEZAR','IR_A_DIRECCION','test1','444','2025-04-04 13:06:42.714',NULL,0,0,NULL,'cm92ymofl00006ht3svmdg3qu','2025-04-04 13:06:42.716','2025-04-04 15:49:50.061',40.42708752919884,-3.686983130120301,NULL,'CASA',1,NULL),('cm92w46mp00046hgh9wl3wukz','Calle de Alburquerque, 7, Chamberí, Madrid','Madrid','EMPEZADA','REPETIR','qwer','51551','2025-04-04 14:38:46.412',NULL,1,1,'cm92t2kqs00026hghp0uzgpip','cm92pa5xv00016h0g9azu4a31','2025-04-04 14:38:46.415','2025-04-04 15:32:24.387',40.43120363742741,-3.702564239501954,'test1','CASA',1,NULL),('cm92yvwct00026ht3u2kb9w76','Calle de Serrano, 127, Chamartín, Madrid','Madrid','SIN_EMPEZAR','IR_A_DIRECCION','qwe','123','2025-04-04 15:56:18.700',NULL,0,0,NULL,'cm92ymofl00006ht3svmdg3qu','2025-04-04 15:56:18.701','2025-04-04 15:56:18.701',40.44253796657429,-3.688788414001465,NULL,'CASA',1,NULL),('cm92ywsnq00046ht3jbv5vzbr','Calle de Ponzano, 39-41, Chamberí, Madrid','Madrid','SIN_EMPEZAR','IR_A_DIRECCION','qwer','123','2025-04-04 15:57:00.565',NULL,0,0,NULL,'cm92ymofl00006ht3svmdg3qu','2025-04-04 15:57:00.566','2025-04-04 17:41:26.249',40.44015366986629,-3.699302673339844,NULL,'CASA',1,NULL);
/*!40000 ALTER TABLE `Property` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('ADMIN','USER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Zone`
--

DROP TABLE IF EXISTS `Zone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Zone` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#FF0000',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `coordinates` json NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Zone`
--

LOCK TABLES `Zone` WRITE;
/*!40000 ALTER TABLE `Zone` DISABLE KEYS */;
INSERT INTO `Zone` VALUES ('cm92pa5xv00016h0g9azu4a31','zona roja','','#FF0000','2025-04-04 11:27:28.146','2025-04-04 11:27:28.146','\"[{\\\"lat\\\":40.4332289315369,\\\"lng\\\":-3.7082290649414067},{\\\"lat\\\":40.42800224168711,\\\"lng\\\":-3.681449890136719},{\\\"lat\\\":40.42316719191562,\\\"lng\\\":-3.701534271240235}]\"'),('cm92ymofl00006ht3svmdg3qu','zona oro','','#ffc800','2025-04-04 15:49:08.529','2025-04-04 15:49:08.529','\"[{\\\"lat\\\":40.43440488077008,\\\"lng\\\":-3.7068557739257817},{\\\"lat\\\":40.44250530554684,\\\"lng\\\":-3.686943054199219},{\\\"lat\\\":40.433098269241526,\\\"lng\\\":-3.687801361083985}]\"'),('cm92yxlmj00056ht33ho0jqel','zona azul','','#006eff','2025-04-04 15:57:38.107','2025-04-04 15:57:38.107','\"[{\\\"lat\\\":40.43740999093243,\\\"lng\\\":-3.7055683135986333},{\\\"lat\\\":40.451127265872316,\\\"lng\\\":-3.6955261230468754},{\\\"lat\\\":40.443027880081786,\\\"lng\\\":-3.68368148803711}]\"');
/*!40000 ALTER TABLE `Zone` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-04 19:52:37
