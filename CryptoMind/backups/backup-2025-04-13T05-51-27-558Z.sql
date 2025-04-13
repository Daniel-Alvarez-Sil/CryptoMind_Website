-- MySQL dump 10.13  Distrib 8.0.41, for Linux (x86_64)
--
-- Host: db-cryptomind.cmkp6fsa6pac.us-east-1.rds.amazonaws.com    Database: CryptoMindDB
-- ------------------------------------------------------
-- Server version	8.0.40

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
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `accion`
--

DROP TABLE IF EXISTS `accion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accion` (
  `id_accion` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id_accion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accion`
--

LOCK TABLES `accion` WRITE;
/*!40000 ALTER TABLE `accion` DISABLE KEYS */;
/*!40000 ALTER TABLE `accion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id_bitacora` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int NOT NULL,
  `id_accion` int NOT NULL,
  `fecha_hora` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_bitacora`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_accion` (`id_accion`),
  CONSTRAINT `bitacora_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `bitacora_ibfk_2` FOREIGN KEY (`id_accion`) REFERENCES `accion` (`id_accion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `id_categoria` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id_categoria`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'Tecnología','Cursos relacionados con innovaciones tecnológicas.'),(2,'Tecnología','Temas relacionados con avances tecnológicos y digitales.');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion`
--

DROP TABLE IF EXISTS `configuracion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion` (
  `id_usuario` int NOT NULL,
  `id_configuracion` int NOT NULL,
  `volumen_musica` int NOT NULL,
  `idioma` varchar(50) NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_configuracion`),
  CONSTRAINT `configuracion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `configuracion_chk_1` CHECK ((`volumen_musica` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion`
--

LOCK TABLES `configuracion` WRITE;
/*!40000 ALTER TABLE `configuracion` DISABLE KEYS */;
/*!40000 ALTER TABLE `configuracion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contenido`
--

DROP TABLE IF EXISTS `contenido`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contenido` (
  `id_nivel` int NOT NULL,
  `id_contenido` int NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `url_recurso` text NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`id_nivel`,`id_contenido`),
  CONSTRAINT `contenido_ibfk_1` FOREIGN KEY (`id_nivel`) REFERENCES `nivel` (`id_nivel`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contenido`
--

LOCK TABLES `contenido` WRITE;
/*!40000 ALTER TABLE `contenido` DISABLE KEYS */;
/*!40000 ALTER TABLE `contenido` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `curso`
--

DROP TABLE IF EXISTS `curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso` (
  `id_curso` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text,
  `estado` enum('activo','inactivo') NOT NULL,
  `dificultad` int NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_curso`),
  CONSTRAINT `curso_chk_1` CHECK ((`dificultad` between 1 and 10))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso`
--

LOCK TABLES `curso` WRITE;
/*!40000 ALTER TABLE `curso` DISABLE KEYS */;
INSERT INTO `curso` VALUES (1,'Introducción al Blockchain','Aprende los fundamentos del blockchain y su aplicación en diferentes industrias.','activo',5,'2025-04-12 03:57:38'),(2,'Fundamentos de Inteligencia Artificial','Curso introductorio que explora los conceptos básicos de la IA','activo',3,'2025-04-13 01:51:39');
/*!40000 ALTER TABLE `curso` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`admin`@`%`*/ /*!50003 TRIGGER `prevent_delete_curso` BEFORE DELETE ON `curso` FOR EACH ROW BEGIN
    DECLARE user_count INT;
    SELECT COUNT(*) INTO user_count FROM usuario_curso WHERE id_curso = OLD.id_curso;
    IF user_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede eliminar el curso porque hay usuarios inscritos.';
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `curso_categoria`
--

DROP TABLE IF EXISTS `curso_categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curso_categoria` (
  `id_curso` int NOT NULL,
  `id_categoria` int NOT NULL,
  PRIMARY KEY (`id_curso`,`id_categoria`),
  KEY `id_categoria` (`id_categoria`),
  CONSTRAINT `curso_categoria_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `curso_categoria_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categoria` (`id_categoria`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `curso_categoria`
--

LOCK TABLES `curso_categoria` WRITE;
/*!40000 ALTER TABLE `curso_categoria` DISABLE KEYS */;
INSERT INTO `curso_categoria` VALUES (1,2);
/*!40000 ALTER TABLE `curso_categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nivel`
--

DROP TABLE IF EXISTS `nivel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nivel` (
  `id_nivel` int NOT NULL AUTO_INCREMENT,
  `id_curso` int NOT NULL,
  `dificultad` int NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descripcion` text,
  `orden` int NOT NULL,
  PRIMARY KEY (`id_nivel`),
  KEY `id_curso` (`id_curso`),
  CONSTRAINT `nivel_ibfk_1` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `nivel_chk_1` CHECK ((`dificultad` between 1 and 10)),
  CONSTRAINT `nivel_chk_2` CHECK ((`orden` between 1 and 99))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nivel`
--

LOCK TABLES `nivel` WRITE;
/*!40000 ALTER TABLE `nivel` DISABLE KEYS */;
INSERT INTO `nivel` VALUES (1,1,3,'Fundamentos del Blockchain','En este nivel conocerás qué es blockchain, para qué sirve y sus principales características.',1),(2,2,2,'Historia y Definición de la IA','Explora los orígenes y la evolución de la Inteligencia Artificial',1),(3,2,3,'Aplicaciones Actuales de la IA','Describe cómo se usa la IA en diferentes industrias',2);
/*!40000 ALTER TABLE `nivel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `opcion`
--

DROP TABLE IF EXISTS `opcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `opcion` (
  `id_opcion` int NOT NULL AUTO_INCREMENT,
  `id_pregunta` int NOT NULL,
  `texto_opcion` text NOT NULL,
  `es_correcta` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_opcion`),
  KEY `id_pregunta` (`id_pregunta`),
  CONSTRAINT `opcion_ibfk_1` FOREIGN KEY (`id_pregunta`) REFERENCES `pregunta` (`id_pregunta`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `opcion`
--

LOCK TABLES `opcion` WRITE;
/*!40000 ALTER TABLE `opcion` DISABLE KEYS */;
INSERT INTO `opcion` VALUES (1,1,'Proteger la propiedad intelectual de los usuarios.',0),(2,1,'Registrar información en bloques de forma segura y descentralizada.',1),(3,1,'Enviar mensajes cifrados a través de nodos.',0),(4,1,'Gestionar redes sociales privadas.',0),(5,2,'Contraseñas personales',0),(6,2,'Algoritmos de consenso y criptografía',1),(7,2,'Bases de datos relacionales',0),(8,2,'Permisos de administrador',0),(9,3,'Que funciona en un solo servidor central',0),(10,3,'Que los datos son gestionados por múltiples nodos sin control central',1),(11,3,'Que depende del gobierno para operar',0),(12,3,'Que necesita internet para acceder',0),(13,4,'Las transacciones pueden ser canceladas fácilmente',0),(14,4,'No se necesita intermediario para verificar la operación',1),(15,4,'Las transacciones son más lentas que con un banco',0),(16,4,'Solo funciona con criptomonedas',0),(17,5,'Alan Turing',1),(18,5,'Bill Gates',0),(19,5,'Mark Zuckerberg',0),(20,5,'Ada Lovelace',0),(21,6,'Reconocimiento facial en seguridad',1),(22,6,'Fotocopiado automático de documentos',0),(23,6,'Televisión por cable',0),(24,6,'Análisis de clima manual',0);
/*!40000 ALTER TABLE `opcion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pregunta`
--

DROP TABLE IF EXISTS `pregunta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pregunta` (
  `id_pregunta` int NOT NULL AUTO_INCREMENT,
  `id_nivel` int NOT NULL,
  `texto_pregunta` text NOT NULL,
  `dificultad` int NOT NULL,
  PRIMARY KEY (`id_pregunta`),
  KEY `id_nivel` (`id_nivel`),
  CONSTRAINT `pregunta_ibfk_1` FOREIGN KEY (`id_nivel`) REFERENCES `nivel` (`id_nivel`) ON DELETE CASCADE,
  CONSTRAINT `pregunta_chk_1` CHECK ((`dificultad` between 1 and 10))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pregunta`
--

LOCK TABLES `pregunta` WRITE;
/*!40000 ALTER TABLE `pregunta` DISABLE KEYS */;
INSERT INTO `pregunta` VALUES (1,1,'¿Cuál es el objetivo principal de una cadena de bloques?',3),(2,1,'¿Qué elemento es esencial para garantizar la seguridad de los datos en una blockchain?',4),(3,1,'¿Qué significa que la blockchain sea descentralizada?',3),(4,1,'¿Cuál es una de las principales ventajas del uso de blockchain en transacciones?',3),(5,2,'¿Quién es considerado uno de los pioneros de la Inteligencia Artificial?',2),(6,3,'¿Cuál de las siguientes es una aplicación real de la IA en el presente?',2);
/*!40000 ALTER TABLE `pregunta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesion`
--

DROP TABLE IF EXISTS `sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesion` (
  `id_usuario` int DEFAULT NULL,
  `id_sesion` int NOT NULL AUTO_INCREMENT,
  `inicio_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `termino_en` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id_sesion`),
  KEY `id_usuario` (`id_usuario`),
  CONSTRAINT `sesion_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesion`
--

LOCK TABLES `sesion` WRITE;
/*!40000 ALTER TABLE `sesion` DISABLE KEYS */;
INSERT INTO `sesion` VALUES (1,1,'2025-03-29 05:50:17','2025-03-29 05:50:50'),(1,2,'2025-03-29 18:53:09','2025-03-29 20:00:00'),(1,3,'2025-03-29 13:17:58','2025-03-29 13:18:22'),(1,4,'2025-03-29 17:17:41','2025-03-29 17:19:51'),(1,5,'2025-03-29 17:27:45','2025-03-29 17:40:33'),(1,6,'2025-03-29 17:29:47','2025-03-29 17:40:36'),(1,7,'2025-03-29 17:39:04','2025-03-29 17:40:39'),(1,8,'2025-03-29 17:40:16','2025-03-29 17:40:48'),(1,9,'2025-03-29 18:12:53','2025-03-29 18:12:55'),(1,10,'2025-03-29 18:24:01','2025-03-29 18:24:03'),(1,11,'2025-03-29 18:26:04','2025-03-29 18:26:26'),(2,12,'2025-03-29 18:27:03','2025-03-29 18:27:13'),(3,13,'2025-03-29 18:32:18','2025-03-29 18:32:34'),(1,14,'2025-04-12 21:19:09','2025-04-12 21:19:29'),(1,15,'2025-04-12 21:19:24','2025-04-12 21:50:24'),(9,16,'2025-04-12 23:05:36',NULL);
/*!40000 ALTER TABLE `sesion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `correo` varchar(150) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ultima_conexion` timestamp NULL DEFAULT NULL,
  `nombre` varchar(50) NOT NULL,
  `nacimiento` date NOT NULL,
  `pais` varchar(30) NOT NULL,
  `genero` enum('Female','Male','Non-binary','Prefer not to say') DEFAULT NULL,
  `tokens` int NOT NULL,
  `puntaje` int NOT NULL,
  `vidas` int NOT NULL,
  `es_admin` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `correo` (`correo`),
  CONSTRAINT `usuario_chk_1` CHECK ((`tokens` between 0 and 1000)),
  CONSTRAINT `usuario_chk_2` CHECK ((`vidas` between 0 and 3))
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'johndoe','john@example.com','hashedpassword123','2025-03-29 05:24:21',NULL,'John Doe','1990-05-15','México','',500,0,3,NULL),(2,'janedoe','jane@example.com','securepass456','2025-03-29 05:24:21',NULL,'Jane Doe','1995-08-22','Argentina','',250,0,2,NULL),(3,'alexsmith','alex@example.com','anotherpass789','2025-03-29 05:24:21',NULL,'Alex Smith','2000-01-10','Chile','',100,0,1,NULL),(5,'platanito','presentame@lori.com','supersecret123','2025-04-07 03:40:45',NULL,'Emi','2004-04-06','Mexico','',0,0,3,NULL),(9,'prueba1','prueba@gmail.com','lolxd?','2025-04-08 02:30:52',NULL,'nombre','2004-05-06','Benin','',0,0,3,NULL),(10,'emil','prueba2@gmail.com','246','2025-04-11 23:30:47',NULL,'nombre','2003-02-25','Vanuatu','Prefer not to say',0,0,3,NULL),(12,'emilo','prueba3@gmail.com','3456','2025-04-11 23:36:53',NULL,'nombre','2004-02-20','Luxembourg','Non-binary',0,0,3,NULL),(13,'das','das@gmail.com','prueba123','2025-04-12 11:09:19',NULL,'','2005-03-10','',NULL,0,0,0,1);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_curso`
--

DROP TABLE IF EXISTS `usuario_curso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_curso` (
  `id_usuario` int NOT NULL,
  `id_curso` int NOT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_terminacion` timestamp NULL DEFAULT NULL,
  `progreso` int NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_curso`),
  KEY `id_curso` (`id_curso`),
  CONSTRAINT `usuario_curso_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `usuario_curso_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `curso` (`id_curso`) ON DELETE CASCADE,
  CONSTRAINT `usuario_curso_chk_1` CHECK ((`progreso` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_curso`
--

LOCK TABLES `usuario_curso` WRITE;
/*!40000 ALTER TABLE `usuario_curso` DISABLE KEYS */;
INSERT INTO `usuario_curso` VALUES (1,1,'2025-04-12 06:35:47','2025-04-12 10:35:47',0),(2,1,'2025-04-12 06:35:47',NULL,0),(3,1,'2025-04-12 06:56:41',NULL,0);
/*!40000 ALTER TABLE `usuario_curso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_nivel`
--

DROP TABLE IF EXISTS `usuario_nivel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_nivel` (
  `id_usuario` int NOT NULL,
  `id_nivel` int NOT NULL,
  `fecha_inicio` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_fin` timestamp NOT NULL,
  `avance` int NOT NULL,
  PRIMARY KEY (`id_usuario`,`id_nivel`),
  KEY `id_nivel` (`id_nivel`),
  CONSTRAINT `usuario_nivel_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `usuario_nivel_ibfk_2` FOREIGN KEY (`id_nivel`) REFERENCES `nivel` (`id_nivel`) ON DELETE CASCADE,
  CONSTRAINT `usuario_nivel_chk_1` CHECK ((`avance` between 0 and 100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_nivel`
--

LOCK TABLES `usuario_nivel` WRITE;
/*!40000 ALTER TABLE `usuario_nivel` DISABLE KEYS */;
INSERT INTO `usuario_nivel` VALUES (1,1,'2025-04-12 06:56:02','2025-04-12 07:56:02',100),(2,1,'2025-04-12 06:56:02','0000-00-00 00:00:00',0),(3,1,'2025-04-12 06:56:03','0000-00-00 00:00:00',0);
/*!40000 ALTER TABLE `usuario_nivel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_pregunta`
--

DROP TABLE IF EXISTS `usuario_pregunta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_pregunta` (
  `id_usuario_pregunta` int NOT NULL AUTO_INCREMENT,
  `id_usuario` int DEFAULT NULL,
  `id_pregunta` int DEFAULT NULL,
  `fecha_respuesta` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `es_correcta` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_usuario_pregunta`),
  KEY `id_usuario` (`id_usuario`),
  KEY `id_pregunta` (`id_pregunta`),
  CONSTRAINT `usuario_pregunta_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  CONSTRAINT `usuario_pregunta_ibfk_2` FOREIGN KEY (`id_pregunta`) REFERENCES `pregunta` (`id_pregunta`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_pregunta`
--

LOCK TABLES `usuario_pregunta` WRITE;
/*!40000 ALTER TABLE `usuario_pregunta` DISABLE KEYS */;
INSERT INTO `usuario_pregunta` VALUES (1,1,1,'2025-04-12 21:54:39',1),(2,1,2,'2025-04-12 21:54:39',1),(3,1,3,'2025-04-12 21:54:39',1),(4,1,4,'2025-04-12 21:54:39',1);
/*!40000 ALTER TABLE `usuario_pregunta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario_pregunta_opcion`
--

DROP TABLE IF EXISTS `usuario_pregunta_opcion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario_pregunta_opcion` (
  `id_usuario_pregunta` int NOT NULL,
  `id_opcion` int NOT NULL,
  PRIMARY KEY (`id_usuario_pregunta`,`id_opcion`),
  KEY `id_opcion` (`id_opcion`),
  CONSTRAINT `usuario_pregunta_opcion_ibfk_1` FOREIGN KEY (`id_usuario_pregunta`) REFERENCES `usuario_pregunta` (`id_usuario_pregunta`) ON DELETE CASCADE,
  CONSTRAINT `usuario_pregunta_opcion_ibfk_2` FOREIGN KEY (`id_opcion`) REFERENCES `opcion` (`id_opcion`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario_pregunta_opcion`
--

LOCK TABLES `usuario_pregunta_opcion` WRITE;
/*!40000 ALTER TABLE `usuario_pregunta_opcion` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuario_pregunta_opcion` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-04-13  5:51:28
