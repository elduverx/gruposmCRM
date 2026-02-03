SET FOREIGN_KEY_CHECKS=0;

-- Table structure for table `UserGoal`
--

DROP TABLE IF EXISTS `UserGoal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserGoal` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `targetCount` int NOT NULL,
  `currentCount` int NOT NULL DEFAULT '0',
  `startDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `endDate` datetime(3) DEFAULT NULL,
  `isCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `category` enum('GENERAL','ACTIVITY','DPV','NEWS','BILLED','ASSIGNMENT','LOCATED_TENANTS','ADDED_PHONES','EMPTY_PROPERTIES','NEW_PROPERTIES','LOCATED_PROPERTIES') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'GENERAL',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserGoal_userId_idx` (`userId`),
  CONSTRAINT `UserGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserGoal`
--

LOCK TABLES `UserGoal` WRITE;
/*!40000 ALTER TABLE `UserGoal` DISABLE KEYS */;
/*!40000 ALTER TABLE `UserGoal` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Table structure for table `UserActivity`
--

DROP TABLE IF EXISTS `UserActivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserActivity` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `goalId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` enum('DPV','NOTICIA','ENCARGO','VISITA','LLAMADA','EMAIL','OTROS') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timestamp` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `metadata` json DEFAULT NULL,
  `relatedId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relatedType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `UserActivity_userId_idx` (`userId`),
  KEY `UserActivity_goalId_idx` (`goalId`),
  CONSTRAINT `UserActivity_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `UserGoal` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `UserActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `UserActivity`
--

LOCK TABLES `UserActivity` WRITE;
/*!40000 ALTER TABLE `UserActivity` DISABLE KEYS */;
INSERT INTO `UserActivity` VALUES ('cmc353kr60005pbu6rn64k3mu','cmc1pgh1o0000xk1cmstbvf2c',NULL,'NOTICIA','Nueva noticia creada: PVA para AV DIPUTACION PROVINCIAL, 2, 7','2025-06-19 08:49:21.618','\"{\\\"propertyId\\\":\\\"cmc29ffv401uo93iiwglxasu2\\\",\\\"type\\\":\\\"PVA\\\",\\\"action\\\":\\\"Venta\\\",\\\"priority\\\":\\\"HIGH\\\"}\"','cmc353kbe0003pbu69o2lopry','PROPERTY_NEWS',2),('cmcalz3mk00025v9k77c7tcc0','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: Zona dorada ','2025-06-24 14:16:09.500','\"{\\\"name\\\":\\\"Zona dorada \\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40154201615995,\\\"lng\\\":-0.404047966003418},{\\\"lat\\\":39.40071235778854,\\\"lng\\\":-0.3984260559082032},{\\\"lat\\\":39.397758693885976,\\\"lng\\\":-0.40009975433349615},{\\\"lat\\\":39.39689580217447,\\\"lng\\\":-0.402975082397461},{\\\"lat\\\":39.39885388722582,\\\"lng\\\":-0.40512084960937506}]}\"','cmcalz31900005v9kukigq1pk','ZONE',1),('cmcbrib6c0002q2uu9c7irv2y','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA DIAMANTE (Tirolina)','2025-06-25 09:38:50.004','\"{\\\"name\\\":\\\"ZONA DIAMANTE (Tirolina)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.41300678161889,\\\"lng\\\":-0.406494140625},{\\\"lat\\\":39.410452744712806,\\\"lng\\\":-0.4082536697387696},{\\\"lat\\\":39.40985568363303,\\\"lng\\\":-0.4049921035766602},{\\\"lat\\\":39.41058542425848,\\\"lng\\\":-0.4027175903320313}]}\"','cmcbrial20000q2uu52ov3fp7','ZONE',1),('cmcbrng270005q2uueq5jvcv1','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA COBRE (Charco)','2025-06-25 09:42:49.615','\"{\\\"name\\\":\\\"ZONA COBRE (Charco)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.4081620622646,\\\"lng\\\":-0.4012370109558106},{\\\"lat\\\":39.40423118707247,\\\"lng\\\":-0.4028677940368653},{\\\"lat\\\":39.40343503346968,\\\"lng\\\":-0.3977394104003907},{\\\"lat\\\":39.4045795014158,\\\"lng\\\":-0.397181510925293}]}\"','cmcbrnfgx0003q2uu7rreiers','ZONE',1),('cmcbrokws00025gdkekwxinrw','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA BRONCE (El Mercat)','2025-06-25 09:43:42.557','\"{\\\"name\\\":\\\"ZONA BRONCE (El Mercat)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40157612587276,\\\"lng\\\":-0.40396213531494146},{\\\"lat\\\":39.40419683371823,\\\"lng\\\":-0.40288925170898443},{\\\"lat\\\":39.403433852987874,\\\"lng\\\":-0.39778232574462896},{\\\"lat\\\":39.40077994196192,\\\"lng\\\":-0.3985977172851563}]}\"','cmcbrokbf00005gdkqqvv7do4','ZONE',1),('cmcbrpw2x0007q2uun2hmkrk5','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Zona eliminada: ZONA BRONCE (El Mercat)','2025-06-25 09:44:43.689','\"{\\\"name\\\":\\\"ZONA BRONCE (El Mercat)\\\",\\\"description\\\":\\\"\\\"}\"','cmcbrokbf00005gdkqqvv7do4','ZONE',1),('cmcbrqt3z000aq2uunbaymqdd','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA BRONCE (El Mercat)','2025-06-25 09:45:26.495','\"{\\\"name\\\":\\\"ZONA BRONCE (El Mercat)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40345412782131,\\\"lng\\\":-0.39778232574462896},{\\\"lat\\\":39.40078363031017,\\\"lng\\\":-0.3985226154327393},{\\\"lat\\\":39.40143053039581,\\\"lng\\\":-0.40386557579040533},{\\\"lat\\\":39.40425857442271,\\\"lng\\\":-0.4028463363647461}]}\"','cmcbrqsl70008q2uu2rz9y5m6','ZONE',1),('cmcbrts1q000222pffti0bp0h','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA PLASTICO (Paluzié)','2025-06-25 09:47:45.087','\"{\\\"name\\\":\\\"ZONA PLASTICO (Paluzié)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40278982380827,\\\"lng\\\":-0.40664434432983404},{\\\"lat\\\":39.401313584631666,\\\"lng\\\":-0.4070734977722168},{\\\"lat\\\":39.39990366411314,\\\"lng\\\":-0.4059362411499024},{\\\"lat\\\":39.399571913966994,\\\"lng\\\":-0.40492773056030273},{\\\"lat\\\":39.40267371624107,\\\"lng\\\":-0.40349006652832037},{\\\"lat\\\":39.402740063446,\\\"lng\\\":-0.4041767120361328},{\\\"lat\\\":39.40217611019248,\\\"lng\\\":-0.4045200347900391}]}\"','cmcbrtrg7000022pf1cb1kqbc','ZONE',1),('cmcbrvxhp000282iv2kp19obm','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA HIERRO (Plaza Mayor)','2025-06-25 09:49:25.453','\"{\\\"name\\\":\\\"ZONA HIERRO (Plaza Mayor)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.404797171964404,\\\"lng\\\":-0.40634393692016607},{\\\"lat\\\":39.40431616748634,\\\"lng\\\":-0.40490627288818365},{\\\"lat\\\":39.40406737076491,\\\"lng\\\":-0.4030179977416992},{\\\"lat\\\":39.40270726633332,\\\"lng\\\":-0.40351152420043945},{\\\"lat\\\":39.402753875464555,\\\"lng\\\":-0.4041284322738648},{\\\"lat\\\":39.40212772132932,\\\"lng\\\":-0.40449857711792},{\\\"lat\\\":39.40278290234112,\\\"lng\\\":-0.40667653083801275}]}\"','cmcbrvwwh000082ivtn9uf2ai','ZONE',1),('cmcbrzfkf000522pfk53e9u6h','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA CRISTAL (Berenguer)','2025-06-25 09:52:08.848','\"{\\\"name\\\":\\\"ZONA CRISTAL (Berenguer)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.410501663747986,\\\"lng\\\":-0.402674674987793},{\\\"lat\\\":39.4097387519962,\\\"lng\\\":-0.4050135612487793},{\\\"lat\\\":39.4079641206313,\\\"lng\\\":-0.4055285453796387},{\\\"lat\\\":39.40705190936512,\\\"lng\\\":-0.4018592834472656},{\\\"lat\\\":39.40829583086041,\\\"lng\\\":-0.4013442993164063}]}\"','cmcbrzez7000322pfbmilk5qb','ZONE',1),('cmcbs14w9000582iv1i47gkoa','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA PLATA (El Funeral)','2025-06-25 09:53:28.329','\"{\\\"name\\\":\\\"ZONA PLATA (El Funeral)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40796354638014,\\\"lng\\\":-0.40550708770751953},{\\\"lat\\\":39.40486197936398,\\\"lng\\\":-0.40632247924804693},{\\\"lat\\\":39.40432392788984,\\\"lng\\\":-0.40487408638000494},{\\\"lat\\\":39.404091717669964,\\\"lng\\\":-0.4030072689056397},{\\\"lat\\\":39.40710076697972,\\\"lng\\\":-0.4018592834472656}]}\"','cmcbs14b3000382ivjfil4771','ZONE',1),('cmcbs4ovo000822pfa6p76rxi','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA PLATINO (Rabal)','2025-06-25 09:56:14.196','\"{\\\"name\\\":\\\"ZONA PLATINO (Rabal)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.41035146753101,\\\"lng\\\":-0.4082751274108887},{\\\"lat\\\":39.40980416094154,\\\"lng\\\":-0.4050135612487793},{\\\"lat\\\":39.40736610667159,\\\"lng\\\":-0.4057645797729493},{\\\"lat\\\":39.407979774617466,\\\"lng\\\":-0.40928363800048834}]}\"','cmcbs4o9x000622pfnsdzyfbj','ZONE',1),('cmcbs6emr000882ivjbpp2jxz','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA MUNDIAL 82','2025-06-25 09:57:34.228','\"{\\\"name\\\":\\\"ZONA MUNDIAL 82\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40794409595123,\\\"lng\\\":-0.40924072265625},{\\\"lat\\\":39.403797583762156,\\\"lng\\\":-0.41177272796630865},{\\\"lat\\\":39.40326261567014,\\\"lng\\\":-0.40915489196777344},{\\\"lat\\\":39.407740481724176,\\\"lng\\\":-0.40799081325531006}]}\"','cmcbs6e96000682iv5euh1zu5','ZONE',1),('cmcbs862d000b22pfvylm8vgu','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA ROJA (La Region - Rambleta) Tecnocasa','2025-06-25 09:58:56.437','\"{\\\"name\\\":\\\"ZONA ROJA (La Region - Rambleta) Tecnocasa\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.407740451416394,\\\"lng\\\":-0.40798008441925054},{\\\"lat\\\":39.40734654220644,\\\"lng\\\":-0.4057109355926514},{\\\"lat\\\":39.40283097169779,\\\"lng\\\":-0.4067516326904297},{\\\"lat\\\":39.40325393309416,\\\"lng\\\":-0.40914416313171387}]}\"','cmcbs85h3000922pflkha5ddz','ZONE',1),('cmcbtn1zl0003iia3229fyo8j','cmc1pgh1o0000xk1cmstbvf2c',NULL,'DPV','DPV actualizado para CL UNIO MUSICAL, 10, 22','2025-06-25 10:38:30.610','\"{\\\"propertyId\\\":\\\"cmc29fe8q005693iiuuqrjz68\\\",\\\"currentPrice\\\":295000,\\\"estimatedValue\\\":220000,\\\"realEstate\\\":\\\"3casas\\\",\\\"links\\\":[]}\"','cmcbtn13i0001iia3uroserpd','PROPERTY_DPV',3),('cmcbtnbjs0007iia39yio3nvk','cmc1pgh1o0000xk1cmstbvf2c',NULL,'DPV','DPV actualizado para CL UNIO MUSICAL, 10, 22','2025-06-25 10:38:43.000','\"{\\\"propertyId\\\":\\\"cmc29fe8q005693iiuuqrjz68\\\",\\\"currentPrice\\\":295000,\\\"estimatedValue\\\":220000,\\\"realEstate\\\":\\\"3casas\\\",\\\"links\\\":[\\\"https://www.idealista.com/inmueble/108129083/\\\"]}\"','cmcbtn13i0001iia3uroserpd','PROPERTY_DPV',3),('cmcbtplqu000biia3fskxjlpe','cmc1pgh1o0000xk1cmstbvf2c',NULL,'DPV','DPV actualizado para CL CASTELLON, 8, 3','2025-06-25 10:40:29.527','\"{\\\"propertyId\\\":\\\"cmc29fg8m029f93iicknwx2fq\\\",\\\"currentPrice\\\":120000,\\\"estimatedValue\\\":90000,\\\"realEstate\\\":\\\"INMOLLORENS\\\",\\\"links\\\":[\\\"https://www.idealista.com/inmueble/108394989/\\\"]}\"','cmcbtpkv80009iia3isrfz6x1','PROPERTY_DPV',3),('cmcbtv5y1000fiia340pht11e','cmc1pgh1o0000xk1cmstbvf2c',NULL,'DPV','DPV actualizado para CL SAN MIGUEL, 32, 7','2025-06-25 10:44:48.986','\"{\\\"propertyId\\\":\\\"cmc29fk5j071m93ii87leicol\\\",\\\"currentPrice\\\":130000,\\\"estimatedValue\\\":115000,\\\"realEstate\\\":\\\"\\\",\\\"links\\\":[\\\"https://www.idealista.com/inmueble/108462771/\\\"]}\"','cmcbtv526000diia3vudcdevp','PROPERTY_DPV',3),('cmcbtwqdy000iiia3yszknc3x','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva actividad creada: OTROS para CL SAN MIGUEL, 32, 7','2025-06-25 10:46:02.134','\"{\\\"propertyId\\\":\\\"cmc29fk5j071m93ii87leicol\\\",\\\"type\\\":\\\"OTROS\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"date\\\":\\\"2025-06-25T10:45:00.000Z\\\"}\"','cmcbtwpax000giia3stwaif7u','PROPERTY_ACTIVITY',1),('cmcbtwrh8000k12blgv234k2n','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva actividad: OTROS para CL SAN MIGUEL, 32, 7','2025-06-25 10:46:03.549','\"{\\\"propertyId\\\":\\\"cmc29fk5j071m93ii87leicol\\\",\\\"type\\\":\\\"OTROS\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"client\\\":\\\"\\\",\\\"notes\\\":\\\"13:00 Va Maria a hacer la visita y el chico le ha dicho que le gusta la casa y esta dispuesto a comprarla siempre y cuando este bien de precio.\\\",\\\"date\\\":\\\"2025-06-25T10:45\\\"}\"','cmcbtwpax000giia3stwaif7u','PROPERTY_ACTIVITY',1),('cmcooehz70003d5uii42uzefl','cmc1pgh1o0000xk1cmstbvf2c',NULL,'LLAMADA','Nueva actividad creada: LLAMADA para CL PERIS Y VALERO, 5, 3','2025-07-04 10:32:53.635','\"{\\\"propertyId\\\":\\\"cmc29fkr8080o93iijrjtgzkl\\\",\\\"type\\\":\\\"LLAMADA\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"date\\\":\\\"2024-10-25T10:23:00.000Z\\\"}\"','cmcooeh0j0001d5uiz6yyejbn','PROPERTY_ACTIVITY',1),('cmcooejsv0001hd1fv5vyavwx','cmc1pgh1o0000xk1cmstbvf2c',NULL,'LLAMADA','Nueva actividad: LLAMADA para CL PERIS Y VALERO, 5, 3','2025-07-04 10:32:55.998','\"{\\\"propertyId\\\":\\\"cmc29fkr8080o93iijrjtgzkl\\\",\\\"type\\\":\\\"LLAMADA\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"client\\\":\\\"cristina\\\",\\\"notes\\\":\\\"R0 25/11/10 R0 16/12/2024./04.02.25 18:15 Hablo con cristina me dice que debido a que su inquilina no encontró nada se lo ha alquilado un año más, no se puede vender hasta finales de año,\\\",\\\"date\\\":\\\"2024-10-25T10:23\\\"}\"','cmcooeh0j0001d5uiz6yyejbn','PROPERTY_ACTIVITY',1),('cmcopiz7p0002woo2vrglvqkc','cmc1pgh1o0000xk1cmstbvf2c',NULL,'LLAMADA','Nueva actividad creada: LLAMADA para CL FRANCESC LARRODE ARTOLA, 6, 7','2025-07-04 11:04:22.213','\"{\\\"propertyId\\\":\\\"cmc29fhfb03lq93iis7pxxdpj\\\",\\\"type\\\":\\\"LLAMADA\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"date\\\":\\\"2025-07-04T11:04:00.000Z\\\"}\"','cmcopiy1h0000woo2tld1pv89','PROPERTY_ACTIVITY',1),('cmcopj0ej00015um87dkwl8e5','cmc1pgh1o0000xk1cmstbvf2c',NULL,'LLAMADA','Nueva actividad: LLAMADA para CL FRANCESC LARRODE ARTOLA, 6, 7','2025-07-04 11:04:23.755','\"{\\\"propertyId\\\":\\\"cmc29fhfb03lq93iis7pxxdpj\\\",\\\"type\\\":\\\"LLAMADA\\\",\\\"status\\\":\\\"Pendiente\\\",\\\"client\\\":\\\"\\\",\\\"notes\\\":\\\" 08/05/2025 19:00h Elvira sigue igual no tiene nada claro que hacer pero que se va a apuntar mi telefono y en caso de que reactivara el tema me llama, si nos entra algo en massanasa decÍrselo\\\",\\\"date\\\":\\\"2025-07-04T11:04\\\"}\"','cmcopiy1h0000woo2tld1pv89','PROPERTY_ACTIVITY',1),('cmcvsap7v0003ih57p55t0o3c','cmc1pgh1o0000xk1cmstbvf2c',NULL,'DPV','DPV actualizado para PZ REGION DE LA, 1, 4','2025-07-09 09:56:18.092','\"{\\\"propertyId\\\":\\\"cmc29fgi402d793iit474bguy\\\",\\\"currentPrice\\\":89000,\\\"estimatedValue\\\":0,\\\"realEstate\\\":\\\"grupo sm\\\",\\\"links\\\":[\\\"https://www.gruposergiomartinez.com/property/29\\\"]}\"','cmcvsaobu0001ih57w8333rs1','PROPERTY_DPV',3),('cmcvsbb4v0007ih57st9k8zt1','cmc1pgh1o0000xk1cmstbvf2c',NULL,'NOTICIA','Nueva noticia creada: PVA para PZ REGION DE LA, 1, 4','2025-07-09 09:56:46.495','\"{\\\"propertyId\\\":\\\"cmc29fgi402d793iit474bguy\\\",\\\"type\\\":\\\"PVA\\\",\\\"action\\\":\\\"Venta\\\",\\\"priority\\\":\\\"HIGH\\\"}\"','cmcvsba8x0005ih57bg11fpqn','PROPERTY_NEWS',2),('cmcvse5gw000cih57sx9eisyu','cmc1pgh1o0000xk1cmstbvf2c',NULL,'ENCARGO','Nuevo encargo creado: SALE para cmc29fgi402d793iit474bguy','2025-07-09 09:58:59.120','\"{\\\"propertyId\\\":\\\"cmc29fgi402d793iit474bguy\\\",\\\"type\\\":\\\"SALE\\\",\\\"price\\\":89000,\\\"clientId\\\":\\\"cmcvsdaq00008ih57s5mdeedr\\\"}\"','cmcvse4nr000aih57y20wuy8y','PROPERTY_ASSIGNMENT',2),('cmcvsf8ki0001asc4o3wjr6uo','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Propiedad marcada como localizada: PZ REGION DE LA, 1, 4','2025-07-09 09:59:49.794','\"{\\\"propertyId\\\":\\\"cmc29fgi402d793iit474bguy\\\",\\\"address\\\":\\\"PZ REGION DE LA, 1, 4\\\",\\\"action\\\":\\\"mark_as_located\\\"}\"','cmc29fgi402d793iit474bguy','PROPERTY_LOCATED',1),('cmeqw2xad00011me9uxpb3z3t','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Zona eliminada: ZONA ROJA (La Region - Rambleta) Tecnocasa','2025-08-25 09:02:47.557','\"{\\\"name\\\":\\\"ZONA ROJA (La Region - Rambleta) Tecnocasa\\\",\\\"description\\\":\\\"\\\"}\"','cmcbs85h3000922pflkha5ddz','ZONE',1),('cmeqw3kyq00041me9memlbuh9','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZON ','2025-08-25 09:03:18.242','\"{\\\"name\\\":\\\"ZON \\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.40768334683915,\\\"lng\\\":-0.4079103469848633},{\\\"lat\\\":39.4072856948271,\\\"lng\\\":-0.4056787490844727},{\\\"lat\\\":39.40281195344423,\\\"lng\\\":-0.4067730903625489},{\\\"lat\\\":39.40322620081348,\\\"lng\\\":-0.4090046882629395}]}\"','cmeqw3i0v00021me9qsjzz8nh','ZONE',1),('cmeqw4bsk0001takc6t22d8xb','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Zona eliminada: ZON ','2025-08-25 09:03:53.012','\"{\\\"name\\\":\\\"ZON \\\",\\\"description\\\":\\\"\\\"}\"','cmeqw3i0v00021me9qsjzz8nh','ZONE',1),('cmeqw5dlg0004takctu9pbw3h','cmc1pgh1o0000xk1cmstbvf2c',NULL,'OTROS','Nueva zona creada: ZONA ROJA (La Región)','2025-08-25 09:04:42.004','\"{\\\"name\\\":\\\"ZONA ROJA (La Región)\\\",\\\"description\\\":\\\"\\\",\\\"coordinates\\\":[{\\\"lat\\\":39.403247797665614,\\\"lng\\\":-0.4089403152465821},{\\\"lat\\\":39.40291640006968,\\\"lng\\\":-0.4067516326904297},{\\\"lat\\\":39.40735699703226,\\\"lng\\\":-0.40580749511718756},{\\\"lat\\\":39.40765523594892,\\\"lng\\\":-0.4079103469848633}]}\"','cmeqw5d2r0002takc5mepgc5e','ZONE',1);
/*!40000 ALTER TABLE `UserActivity` ENABLE KEYS */;
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
INSERT INTO `Zone` VALUES ('cmcalz31900005v9kukigq1pk','Zona dorada ','','#fdc700','2025-06-24 14:16:08.639','2025-06-24 14:16:08.639','\"[{\\\"lat\\\":39.40154201615995,\\\"lng\\\":-0.404047966003418},{\\\"lat\\\":39.40071235778854,\\\"lng\\\":-0.3984260559082032},{\\\"lat\\\":39.397758693885976,\\\"lng\\\":-0.40009975433349615},{\\\"lat\\\":39.39689580217447,\\\"lng\\\":-0.402975082397461},{\\\"lat\\\":39.39885388722582,\\\"lng\\\":-0.40512084960937506}]\"'),('cmcbrial20000q2uu52ov3fp7','ZONA DIAMANTE (Tirolina)','','#b8ffc3','2025-06-25 09:38:49.144','2025-06-25 09:38:49.144','\"[{\\\"lat\\\":39.41300678161889,\\\"lng\\\":-0.406494140625},{\\\"lat\\\":39.410452744712806,\\\"lng\\\":-0.4082536697387696},{\\\"lat\\\":39.40985568363303,\\\"lng\\\":-0.4049921035766602},{\\\"lat\\\":39.41058542425848,\\\"lng\\\":-0.4027175903320313}]\"'),('cmcbrnfgx0003q2uu7rreiers','ZONA COBRE (Charco)','','#cbd35f','2025-06-25 09:42:48.456','2025-06-25 09:42:48.456','\"[{\\\"lat\\\":39.4081620622646,\\\"lng\\\":-0.4012370109558106},{\\\"lat\\\":39.40423118707247,\\\"lng\\\":-0.4028677940368653},{\\\"lat\\\":39.40343503346968,\\\"lng\\\":-0.3977394104003907},{\\\"lat\\\":39.4045795014158,\\\"lng\\\":-0.397181510925293}]\"'),('cmcbrqsl70008q2uu2rz9y5m6','ZONA BRONCE (El Mercat)','','#d1c329','2025-06-25 09:45:25.724','2025-06-25 09:45:25.724','\"[{\\\"lat\\\":39.40345412782131,\\\"lng\\\":-0.39778232574462896},{\\\"lat\\\":39.40078363031017,\\\"lng\\\":-0.3985226154327393},{\\\"lat\\\":39.40143053039581,\\\"lng\\\":-0.40386557579040533},{\\\"lat\\\":39.40425857442271,\\\"lng\\\":-0.4028463363647461}]\"'),('cmcbrtrg7000022pf1cb1kqbc','ZONA PLASTICO (Paluzié)','','#ffc2f4','2025-06-25 09:47:44.217','2025-06-25 09:47:44.217','\"[{\\\"lat\\\":39.40278982380827,\\\"lng\\\":-0.40664434432983404},{\\\"lat\\\":39.401313584631666,\\\"lng\\\":-0.4070734977722168},{\\\"lat\\\":39.39990366411314,\\\"lng\\\":-0.4059362411499024},{\\\"lat\\\":39.399571913966994,\\\"lng\\\":-0.40492773056030273},{\\\"lat\\\":39.40267371624107,\\\"lng\\\":-0.40349006652832037},{\\\"lat\\\":39.402740063446,\\\"lng\\\":-0.4041767120361328},{\\\"lat\\\":39.40217611019248,\\\"lng\\\":-0.4045200347900391}]\"'),('cmcbrvwwh000082ivtn9uf2ai','ZONA HIERRO (Plaza Mayor)','','#86cff4','2025-06-25 09:49:24.595','2025-06-25 09:49:24.595','\"[{\\\"lat\\\":39.404797171964404,\\\"lng\\\":-0.40634393692016607},{\\\"lat\\\":39.40431616748634,\\\"lng\\\":-0.40490627288818365},{\\\"lat\\\":39.40406737076491,\\\"lng\\\":-0.4030179977416992},{\\\"lat\\\":39.40270726633332,\\\"lng\\\":-0.40351152420043945},{\\\"lat\\\":39.402753875464555,\\\"lng\\\":-0.4041284322738648},{\\\"lat\\\":39.40212772132932,\\\"lng\\\":-0.40449857711792},{\\\"lat\\\":39.40278290234112,\\\"lng\\\":-0.40667653083801275}]\"'),('cmcbrzez7000322pfbmilk5qb','ZONA CRISTAL (Berenguer)','','#ebebeb','2025-06-25 09:52:07.988','2025-06-25 09:52:07.988','\"[{\\\"lat\\\":39.410501663747986,\\\"lng\\\":-0.402674674987793},{\\\"lat\\\":39.4097387519962,\\\"lng\\\":-0.4050135612487793},{\\\"lat\\\":39.4079641206313,\\\"lng\\\":-0.4055285453796387},{\\\"lat\\\":39.40705190936512,\\\"lng\\\":-0.4018592834472656},{\\\"lat\\\":39.40829583086041,\\\"lng\\\":-0.4013442993164063}]\"'),('cmcbs14b3000382ivjfil4771','ZONA PLATA (El Funeral)','','#696969','2025-06-25 09:53:27.176','2025-06-25 09:53:27.176','\"[{\\\"lat\\\":39.40796354638014,\\\"lng\\\":-0.40550708770751953},{\\\"lat\\\":39.40486197936398,\\\"lng\\\":-0.40632247924804693},{\\\"lat\\\":39.40432392788984,\\\"lng\\\":-0.40487408638000494},{\\\"lat\\\":39.404091717669964,\\\"lng\\\":-0.4030072689056397},{\\\"lat\\\":39.40710076697972,\\\"lng\\\":-0.4018592834472656}]\"'),('cmcbs4o9x000622pfnsdzyfbj','ZONA PLATINO (Rabal)','','#00e1ff','2025-06-25 09:56:12.994','2025-06-25 09:56:12.994','\"[{\\\"lat\\\":39.41035146753101,\\\"lng\\\":-0.4082751274108887},{\\\"lat\\\":39.40980416094154,\\\"lng\\\":-0.4050135612487793},{\\\"lat\\\":39.40736610667159,\\\"lng\\\":-0.4057645797729493},{\\\"lat\\\":39.407979774617466,\\\"lng\\\":-0.40928363800048834}]\"'),('cmcbs6e96000682iv5euh1zu5','ZONA MUNDIAL 82','','#00ccff','2025-06-25 09:57:33.644','2025-06-25 09:57:33.644','\"[{\\\"lat\\\":39.40794409595123,\\\"lng\\\":-0.40924072265625},{\\\"lat\\\":39.403797583762156,\\\"lng\\\":-0.41177272796630865},{\\\"lat\\\":39.40326261567014,\\\"lng\\\":-0.40915489196777344},{\\\"lat\\\":39.407740481724176,\\\"lng\\\":-0.40799081325531006}]\"'),('cmeqw5d2r0002takc5mepgc5e','ZONA ROJA (La Región)','','#FF0000','2025-08-25 09:04:41.237','2025-08-25 09:04:41.237','\"[{\\\"lat\\\":39.403247797665614,\\\"lng\\\":-0.4089403152465821},{\\\"lat\\\":39.40291640006968,\\\"lng\\\":-0.4067516326904297},{\\\"lat\\\":39.40735699703226,\\\"lng\\\":-0.40580749511718756},{\\\"lat\\\":39.40765523594892,\\\"lng\\\":-0.4079103469848633}]\"');
/*!40000 ALTER TABLE `Zone` ENABLE KEYS */;
UNLOCK TABLES;

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
INSERT INTO `_ClientProperties` VALUES ('cmcvsdaq00008ih57s5mdeedr','cmc29fgi402d793iit474bguy'),('cmcom6jgy0000mfix05fjrioy','cmc29fkr8080o93iijrjtgzkl');
/*!40000 ALTER TABLE `_ClientProperties` ENABLE KEYS */;
UNLOCK TABLES;

--

-- Table structure for table `_ZoneUsers`
--

DROP TABLE IF EXISTS `_ZoneUsers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_ZoneUsers` (
  `A` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `B` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  UNIQUE KEY `_ZoneUsers_AB_unique` (`A`,`B`),
  KEY `_ZoneUsers_B_index` (`B`),
  CONSTRAINT `_ZoneUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_ZoneUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `Zone` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_ZoneUsers`
--

LOCK TABLES `_ZoneUsers` WRITE;
/*!40000 ALTER TABLE `_ZoneUsers` DISABLE KEYS */;
/*!40000 ALTER TABLE `_ZoneUsers` ENABLE KEYS */;
UNLOCK TABLES;

--

SET FOREIGN_KEY_CHECKS=1;
