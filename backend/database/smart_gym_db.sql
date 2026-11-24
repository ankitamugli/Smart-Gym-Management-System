-- MySQL dump 10.13  Distrib 8.0.40, for Win64 (x86_64)
--
-- Host: localhost    Database: smart_gym_db
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `check_in_time` datetime(6) NOT NULL,
  `check_out_time` datetime(6) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjcaqd29v2qy723owsdah2t8vx` (`user_id`),
  CONSTRAINT `FKjcaqd29v2qy723owsdah2t8vx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `challenge_participations`
--

DROP TABLE IF EXISTS `challenge_participations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `challenge_participations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `joined_at` datetime(6) DEFAULT NULL,
  `progress_value` int DEFAULT NULL,
  `reward_points_earned` int DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `challenge_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK3dcwuly0wksoeuk8lc23lf00i` (`challenge_id`,`user_id`),
  KEY `FKh8e152b90sb7j0vy7pwr2t9q2` (`user_id`),
  CONSTRAINT `FKgiqe7hf2valh1trof8yte1sgj` FOREIGN KEY (`challenge_id`) REFERENCES `fitness_challenges` (`id`),
  CONSTRAINT `FKh8e152b90sb7j0vy7pwr2t9q2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `chat_history`
--

DROP TABLE IF EXISTS `chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `message` varchar(1000) NOT NULL,
  `response` varchar(3000) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `diet_goals`
--

DROP TABLE IF EXISTS `diet_goals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diet_goals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calorie_goal` double NOT NULL,
  `carbs_goal` double DEFAULT NULL,
  `fats_goal` double DEFAULT NULL,
  `protein_goal` double DEFAULT NULL,
  `user_id` bigint NOT NULL,
  `cup_ml` int NOT NULL DEFAULT '250',
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKjb9ovymxr2k83nl8pv9m19nlp` (`user_id`),
  CONSTRAINT `FKf6e4ydfhght5518kdt6qpensh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `equipment`
--

DROP TABLE IF EXISTS `equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `equipment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `available_quantity` int NOT NULL,
  `brand` varchar(255) DEFAULT NULL,
  `category` varchar(255) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `last_maintenance_date` date DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `total_quantity` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fitness_challenges`
--

DROP TABLE IF EXISTS `fitness_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fitness_challenges` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `challenge_type` varchar(255) DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `duration_in_days` int DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reward_points` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `target_value` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `foods`
--

DROP TABLE IF EXISTS `foods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `foods` (
  `id` varchar(255) NOT NULL,
  `calories` double NOT NULL,
  `carbs` double NOT NULL,
  `fat` double NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `protein` double NOT NULL,
  `serving` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meal_logs`
--

DROP TABLE IF EXISTS `meal_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calories` double NOT NULL,
  `carbs` double DEFAULT NULL,
  `fats` double DEFAULT NULL,
  `meal_date` date NOT NULL,
  `meal_name` varchar(255) NOT NULL,
  `meal_type` varchar(255) NOT NULL,
  `protein` double DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKp3xr0rnprrvb2yy6bbc3uypk9` (`user_id`),
  CONSTRAINT `FKp3xr0rnprrvb2yy6bbc3uypk9` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `membership_plans`
--

DROP TABLE IF EXISTS `membership_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `membership_plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `duration_in_months` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKnconflq2x1uvxvs7sc0mnmh4` (`name`),
  CONSTRAINT `membership_plans_chk_1` CHECK ((`duration_in_months` >= 1))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `nutrition`
--

DROP TABLE IF EXISTS `nutrition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nutrition` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `calories` double NOT NULL,
  `carbs` double NOT NULL,
  `fat` double NOT NULL,
  `food_name` varchar(255) DEFAULT NULL,
  `meal_date` date DEFAULT NULL,
  `meal_name` varchar(255) DEFAULT NULL,
  `protein` double NOT NULL,
  `water_ml` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `posture_analysis`
--

DROP TABLE IF EXISTS `posture_analysis`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `posture_analysis` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `back_angle` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `exercise_name` varchar(255) DEFAULT NULL,
  `feedback` text,
  `knee_angle` double DEFAULT NULL,
  `posture_status` varchar(255) DEFAULT NULL,
  `score` int DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKreayyejegcsskxbg60qf7432k` (`user_id`),
  CONSTRAINT `FKreayyejegcsskxbg60qf7432k` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `progress_records`
--

DROP TABLE IF EXISTS `progress_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `progress_records` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `data` text,
  `kind` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5kdmctx5x2jb7a2m2g74nmebo` (`user_id`),
  CONSTRAINT `FK5kdmctx5x2jb7a2m2g74nmebo` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sleep_logs`
--

DROP TABLE IF EXISTS `sleep_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sleep_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `notes` varchar(500) DEFAULT NULL,
  `sleep_date` date NOT NULL,
  `sleep_hours` double NOT NULL,
  `sleep_quality` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKi63172q9udpt10wsexar8t6sm` (`user_id`),
  CONSTRAINT `FKi63172q9udpt10wsexar8t6sm` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trainer_bookings`
--

DROP TABLE IF EXISTS `trainer_bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainer_bookings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `message` varchar(500) DEFAULT NULL,
  `scheduled_at` datetime(6) NOT NULL,
  `status` varchar(255) NOT NULL,
  `member_id` bigint NOT NULL,
  `trainer_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKa4jief85q2kvr7727frjk6hgo` (`member_id`),
  KEY `FKcookj6ry9jnyuko6dn7iqsiry` (`trainer_id`),
  CONSTRAINT `FKa4jief85q2kvr7727frjk6hgo` FOREIGN KEY (`member_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKcookj6ry9jnyuko6dn7iqsiry` FOREIGN KEY (`trainer_id`) REFERENCES `trainers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trainers`
--

DROP TABLE IF EXISTS `trainers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) DEFAULT NULL,
  `available` bit(1) DEFAULT NULL,
  `bio` varchar(1000) DEFAULT NULL,
  `experience_years` int NOT NULL,
  `hourly_rate` double DEFAULT NULL,
  `specialization` varchar(255) NOT NULL,
  `supported_goals` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKse8qmhomor3guutjui5wfmrk3` (`user_id`),
  CONSTRAINT `FKmkxcvfr0uu3pwv772aurye5w7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_memberships`
--

DROP TABLE IF EXISTS `user_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_memberships` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `auto_renew` bit(1) DEFAULT NULL,
  `expiry_date` date NOT NULL,
  `start_date` date NOT NULL,
  `status` varchar(255) DEFAULT NULL,
  `plan_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKm73p6xw0rk36lesdm0k65guo0` (`plan_id`),
  KEY `FK3aftj3ypdb19itnsapcxykedv` (`user_id`),
  CONSTRAINT `FK3aftj3ypdb19itnsapcxykedv` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKm73p6xw0rk36lesdm0k65guo0` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `qr_token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  UNIQUE KEY `UK7t8j158vhuu0i1l30fflo2p8b` (`qr_token`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `water`
--

DROP TABLE IF EXISTS `water`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `water` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cups` int NOT NULL,
  `water_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKpegk5nfq0y82eaw1y780g33my` (`water_date`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workout_plans`
--

DROP TABLE IF EXISTS `workout_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workout_plans` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `days_per_week` int DEFAULT NULL,
  `equipment` varchar(255) DEFAULT NULL,
  `fitness_goal` varchar(255) DEFAULT NULL,
  `fitness_level` varchar(255) DEFAULT NULL,
  `workout_schedule` text,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK4vr09ve028fenv5fb6e9akqlx` (`user_id`),
  CONSTRAINT `FK4vr09ve028fenv5fb6e9akqlx` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-24 14:43:18
