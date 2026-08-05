-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 05, 2026 at 01:42 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `openq`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `auth` varchar(255) NOT NULL,
  `status` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin7 COLLATE=latin7_general_cs;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `name`, `username`, `password`, `auth`, `status`, `date`, `time`) VALUES
(1, 'admin', 'admin', 'admin', 'admin', 1, '2023-04-28', '01:58:09'),
(2, 'cade', 'cade', 'cade', 'user', 1, '2023-04-28', '01:58:09');

-- --------------------------------------------------------

--
-- Table structure for table `client_data`
--

CREATE TABLE `client_data` (
  `id` int(11) NOT NULL,
  `client_name` varchar(255) DEFAULT NULL,
  `allow_texting` int(11) DEFAULT NULL,
  `allow_priority` int(11) NOT NULL,
  `printer_name` varchar(255) NOT NULL,
  `sms_text` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `client_data`
--

INSERT INTO `client_data` (`id`, `client_name`, `allow_texting`, `allow_priority`, `printer_name`, `sms_text`) VALUES
(1, 'San_Pedro', 0, 0, 'POS-80', '');

-- --------------------------------------------------------

--
-- Table structure for table `cntr_group`
--

CREATE TABLE `cntr_group` (
  `id` int(11) NOT NULL,
  `cntr_grp` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cntr_group`
--

INSERT INTO `cntr_group` (`id`, `cntr_grp`) VALUES
(1, 'PAYMENT'),
(15, 'BILLING'),
(16, 'COLLECTION'),
(17, 'OTHERS');

-- --------------------------------------------------------

--
-- Table structure for table `counter_accounts`
--

CREATE TABLE `counter_accounts` (
  `counter_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `counter_name` varchar(255) NOT NULL,
  `counter_logged_in` varchar(255) NOT NULL,
  `counter_status` int(11) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `task` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin7 COLLATE=latin7_general_cs;

--
-- Dumping data for table `counter_accounts`
--

INSERT INTO `counter_accounts` (`counter_id`, `username`, `password`, `counter_name`, `counter_logged_in`, `counter_status`, `designation`, `task`) VALUES
(61, 'FAS450', 'FAS450', ' LETECIA ESTRELLA', '9', 0, 'Cashier', 'Cashier'),
(62, 'FASC03', 'FASC03', 'JEANY SALAS', '9', 0, 'Cashier', 'Cashier'),
(63, 'FAS429', 'FAS429', ' ELVIE HAW TAY', '', 0, 'CASHIER', 'CASHIER'),
(64, 'NSGA93', 'NSGA93', 'GREGGY BARRES', '6', 0, 'HMO/EMPLOYEE', 'HMO/EMPLOYEE'),
(65, 'FASF33', 'FASF33', 'ELIZA TECSON', '', 0, 'PHIC', 'PHIC'),
(66, 'FAS674', 'FAS674', ' ERWIN HINAUTAN', '4', 0, 'PHIC', 'PHIC'),
(67, 'FAS435', 'FAS435', ' JOHN ASER AMON', '5', 0, 'BILLING', 'BILLING'),
(68, 'FIND82', '1234578', 'CHRISTINA GOLOSINO', '', 0, 'BILLING', 'BILLING'),
(69, 'FASN22', 'FASN22', 'ESSA BISNAR', '1', 0, 'TENTATIVE BILLING', 'TENTATIVE BILLING'),
(70, 'FASM95', 'FASM95', ' MISSY DURANGO', '1', 0, 'TENTATIVE BILLING', 'TENTATIVE BILLING'),
(71, 'PCARES', 'PCARES', ' YAMMINA S. POSAS', '', 0, 'PCARES', 'PCARES'),
(72, 'FAS461', 'FAS461', 'SHARON PARRE?O', '9', 0, 'CASHIER', 'CASHIER'),
(73, 'FAS475', 'FAS475', 'WILMA DUMAGAN', '10', 0, 'CASHIER', 'CASHIER'),
(74, 'FASA17', 'FASA17', 'DENESA ETANG', '9', 0, 'CASHIER', 'CASHIER'),
(75, 'FASC90', 'FASC90', 'JEAN PANES', '9', 0, 'CASHIER', 'CASHIER'),
(76, 'FASF31', 'FASF31', 'REYCHELLE MAE COLEGIO', '10', 0, 'CASHIER', 'CASHIER'),
(77, 'FASK42', 'FASK42', 'LIZA HONRADO', '9', 0, 'CASHIER', 'CASHIER'),
(78, 'FASL46', 'FASL46', 'VANESSA BALITON', '5', 0, 'BILLING', 'BILLING'),
(79, 'FASI80', '12345678', 'ARGIE CASTOLO', '', 0, 'BILLING', 'BILLING'),
(80, 'FASK17', 'FASK17', 'OLGA LAWA', '1', 0, 'TENTATIVE BILLING', 'TENTATIVE BILLING'),
(81, 'FAS470', 'FAS470', 'JOEMAR LIBERTAD', '2', 0, 'TENTATIVE BILLING', 'TENTATIVE BILLING'),
(82, 'admin', '@dm1n', 'MIS ', '', 0, 'MIS', 'MIS'),
(83, 'FASN53', 'FASN53', 'JAYNE POGOY', '8', 0, 'CASHIER', 'CASHIER'),
(84, 'FASJ54', 'FASJ54', 'CRISTY TIZON', '', 0, 'Billing', 'Billing');

-- --------------------------------------------------------

--
-- Table structure for table `counter_number`
--

CREATE TABLE `counter_number` (
  `id` int(11) NOT NULL,
  `counter_num` varchar(255) NOT NULL,
  `ctr_service` varchar(5000) NOT NULL,
  `status` int(11) DEFAULT NULL,
  `sgroup` varchar(255) NOT NULL,
  `cntr_grp` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `counter_number`
--

INSERT INTO `counter_number` (`id`, `counter_num`, `ctr_service`, `status`, `sgroup`, `cntr_grp`) VALUES
(1, '1', 'TENTATIVE BILLING INQUIRIES', 0, '', 'BILLING'),
(2, '2', 'TENTATIVE BILLING INQUIRIES', 0, '', 'BILLING'),
(3, '3', 'OUTPATIENT EMERGENCY CARE OECB', 0, '', 'BILLING'),
(4, '4', 'PHILHEALTH', 0, '', 'OTHERS'),
(5, '5', 'FINAL BILLING', 0, '', 'BILLING'),
(6, '6', 'HMO EMPLOYEE', 0, '', 'OTHERS'),
(7, '7', 'CASHIER', 0, '', 'PAYMENT'),
(8, '8', 'CASHIER', 0, '', 'PAYMENT'),
(9, '9', 'CASHIER', 0, '', 'PAYMENT'),
(10, '10', 'CASHIER', 0, '', 'PAYMENT'),
(11, '11', 'CASHIER', NULL, '', 'PAYMENT'),
(12, '12', '', NULL, '', ''),
(13, '13', 'GENERAL MEDICINE', NULL, '', ''),
(14, '14', '', NULL, '', ''),
(15, '15', '', NULL, '', ''),
(16, '16', '', NULL, '', ''),
(17, '17', '', NULL, '', 'PAYMENT'),
(18, '18', '', NULL, '', ''),
(19, '19', '', NULL, '', ''),
(20, '20', '', NULL, '', ''),
(21, '21', '', NULL, '', ''),
(22, '22', '', NULL, '', ''),
(23, '23', '', NULL, '', ''),
(24, '24', '', NULL, '', ''),
(25, '25', 'TENTATIVE BILLING INQUIRIES,P-CARES,PHILHEALTH,FINAL BILLING,HMO EMPLOYEE,CASHIER', NULL, '', 'PAYMENT');

-- --------------------------------------------------------

--
-- Table structure for table `ctr_select_limit`
--

CREATE TABLE `ctr_select_limit` (
  `id` int(11) NOT NULL,
  `ctr_limit` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ctr_select_limit`
--

INSERT INTO `ctr_select_limit` (`id`, `ctr_limit`) VALUES
(1, 30),
(2, 10);

-- --------------------------------------------------------

--
-- Table structure for table `offices`
--

CREATE TABLE `offices` (
  `id` int(11) NOT NULL,
  `office_name` varchar(255) NOT NULL,
  `group_initial` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `offices`
--

INSERT INTO `offices` (`id`, `office_name`, `group_initial`) VALUES
(1, 'OpenQ', 'VP');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `service_name` varchar(500) NOT NULL,
  `service_initial` varchar(255) NOT NULL,
  `service_priority` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `cntr_grp` varchar(255) NOT NULL,
  `do_fwd_prio` varchar(255) NOT NULL,
  `extra_msg` varchar(500) NOT NULL,
  `counter_no` int(11) NOT NULL,
  `display_card` int(11) NOT NULL,
  `service_name_short` varchar(255) NOT NULL,
  `service_group` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `service_name`, `service_initial`, `service_priority`, `status`, `cntr_grp`, `do_fwd_prio`, `extra_msg`, `counter_no`, `display_card`, `service_name_short`, `service_group`) VALUES
(140, 'TENTATIVE BILLING INQUIRIES', 'T', 'TP', '2', 'ASSESSMENT', '', '', 0, 0, 'TENTATIVE BILLING/INQUIRY Counter 1 & 2', 'VP'),
(142, 'P-CARES', 'PC', 'PCP', '2', 'ASSESSMENT', '', '', 0, 1, 'P-CARES', 'VP'),
(143, 'PHILHEALTH', 'P', 'PP', '2', 'HARBOR', '', '', 0, 0, 'PHILHEALTH CLAIMS Counter 4', 'VP'),
(147, 'HMO EMPLOYEE', 'H', 'HP', '2', 'CASHIER', '', '', 0, 0, 'HMO/EMPLOYEE Counter 6', 'VP'),
(148, 'OUTPATIENT EMERGENCY CARE OECB', 'OE', 'SOE', '2', 'CASHIER', '', '', 0, 0, 'OUTPATIENT EMERGENCY CARE (OECB) Counter 3', 'VP'),
(149, 'FINAL BILLING', 'F', 'FP', '2', 'CASHIER', '', '', 0, 0, 'FINAL BILLING Counter 5', 'VP'),
(150, 'CASHIER', 'C', 'CP', '2', 'HARBOR', '', '', 0, 0, 'CASHIER Counter 7,8,9,10', 'VP');

-- --------------------------------------------------------

--
-- Table structure for table `transaction`
--

CREATE TABLE `transaction` (
  `id` int(11) NOT NULL,
  `service` varchar(255) NOT NULL,
  `ticket` varchar(255) NOT NULL,
  `ticket_service` varchar(255) DEFAULT NULL,
  `for_service` varchar(255) NOT NULL,
  `status` varchar(255) NOT NULL,
  `status_updater` int(11) NOT NULL,
  `date` date DEFAULT NULL,
  `time` time NOT NULL,
  `recall` int(11) NOT NULL,
  `recall_check` int(11) NOT NULL,
  `recall_time` time DEFAULT NULL,
  `counter` varchar(255) NOT NULL,
  `cntr_forwarded` int(11) DEFAULT NULL,
  `counter_user` varchar(255) DEFAULT NULL,
  `forward_hist` varchar(255) DEFAULT NULL,
  `forwarded_from` varchar(255) DEFAULT NULL,
  `forwarded_to` varchar(255) DEFAULT NULL,
  `forward_stat` varchar(255) NOT NULL,
  `cntr_grp` varchar(255) NOT NULL,
  `start_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `duration` varchar(255) NOT NULL,
  `end_date` date DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `void_reasons` varchar(255) DEFAULT NULL,
  `cntr_message` varchar(255) DEFAULT NULL,
  `pnumber` char(11) DEFAULT NULL,
  `texted` int(11) NOT NULL,
  `sub_notes` varchar(255) NOT NULL,
  `counter_history` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transaction`
--

INSERT INTO `transaction` (`id`, `service`, `ticket`, `ticket_service`, `for_service`, `status`, `status_updater`, `date`, `time`, `recall`, `recall_check`, `recall_time`, `counter`, `cntr_forwarded`, `counter_user`, `forward_hist`, `forwarded_from`, `forwarded_to`, `forward_stat`, `cntr_grp`, `start_date`, `start_time`, `duration`, `end_date`, `end_time`, `void_reasons`, `cntr_message`, `pnumber`, `texted`, `sub_notes`, `counter_history`) VALUES
(398434, 'TP', '1', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '07:51:09', 0, 0, '08:09:36', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:09:36', '', '2026-08-05', '08:10:20', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398435, 'CP', '1', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:52:10', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '07:50:05', '', '2026-08-05', '07:51:05', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398436, 'C', '1', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:52:47', 0, 0, '07:58:27', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '07:58:27', '', '2026-08-05', '08:04:09', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398437, 'C', '2', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:52:51', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '07:59:33', '', '2026-08-05', '08:00:13', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398438, 'F', '1', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '07:52:57', 0, 0, '08:10:35', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:10:35', '', '2026-08-05', '08:11:39', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398439, 'FP', '1', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '07:54:34', 0, 0, '08:08:27', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:08:27', '', '2026-08-05', '08:09:42', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398440, 'CP', '2', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:56:09', 0, 0, '08:04:19', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:04:19', '', '2026-08-05', '08:09:33', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398441, 'F', '2', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '07:56:31', 0, 0, '08:11:40', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:11:40', '', '2026-08-05', '08:12:05', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398442, 'C', '3', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:56:40', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:16:26', '', '2026-08-05', '08:16:36', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398443, 'F', '3', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '07:56:46', 0, 0, '08:12:05', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:12:05', '', '2026-08-05', '08:12:31', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398444, 'TP', '2', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '07:58:04', 0, 0, '08:10:22', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:10:22', '', '2026-08-05', '08:11:11', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398445, 'CP', '3', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:59:02', 0, 0, '08:09:34', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:09:34', '', '2026-08-05', '08:10:17', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398446, 'C', '4', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '07:59:10', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:16:39', '', '2026-08-05', '08:16:50', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398447, 'FP', '2', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:01:33', 0, 0, '08:09:35', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:09:35', '', '2026-08-05', '08:10:14', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398448, 'CP', '4', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:02:37', 0, 0, '08:10:19', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:10:19', '', '2026-08-05', '08:10:45', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398449, 'CP', '5', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:02:45', 0, 0, '08:12:18', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:12:18', '', '2026-08-05', '08:12:32', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398450, 'FP', '3', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:03:17', 0, 0, '08:10:15', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:10:15', '', '2026-08-05', '08:10:34', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398451, 'C', '5', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:04:56', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:16:53', '', '2026-08-05', '08:18:41', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398452, 'C', '6', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:05:58', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:25:10', '', '2026-08-05', '08:26:17', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398453, 'CP', '6', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:06:28', 0, 0, '08:14:23', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:14:23', '', '2026-08-05', '08:14:57', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398454, 'F', '4', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:07:24', 0, 0, '08:12:31', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:12:31', '', '2026-08-05', '08:12:43', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398455, 'C', '7', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:08:51', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:30:18', '', '2026-08-05', '08:30:29', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398456, 'TP', '3', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:09:45', 0, 0, '08:10:24', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:10:24', '', '2026-08-05', '08:23:59', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398457, 'F', '5', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:10:58', 0, 0, '08:12:46', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:12:46', '', '2026-08-05', '08:16:15', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398458, 'T', '1', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:12:10', 0, 0, '08:13:55', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:13:55', '', '2026-08-05', '08:15:03', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398459, 'FP', '4', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:14:34', 0, 0, '08:16:15', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:16:15', '', '2026-08-05', '08:52:28', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398460, 'CP', '7', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:14:57', 0, 0, '08:15:00', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:15:00', '', '2026-08-05', '08:15:12', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398461, 'OE', '1', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '08:15:42', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(398462, 'C', '8', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:16:22', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:32:00', '', '2026-08-05', '08:32:30', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398463, 'C', '9', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:18:26', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:32:31', '', '2026-08-05', '08:32:41', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398464, 'C', '10', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:18:44', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:35:59', '', '2026-08-05', '08:36:09', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398465, 'CP', '8', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:22:18', 0, 0, '08:30:12', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:30:12', '', '2026-08-05', '08:32:56', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398466, 'C', '11', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:22:51', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:36:19', '', '2026-08-05', '08:37:37', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398467, 'C', '12', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:23:45', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:44:05', '', '2026-08-05', '08:44:33', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398468, 'C', '13', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:23:50', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:46:33', '', '2026-08-05', '08:46:49', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398469, 'C', '14', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:23:57', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:48:24', '', '2026-08-05', '08:48:54', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398470, 'C', '15', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:03', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:50:53', '', '2026-08-05', '08:51:03', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398471, 'C', '16', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:08', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '08:52:47', '', '2026-08-05', '08:53:57', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398472, 'C', '17', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:13', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:04:12', '', '2026-08-05', '09:04:45', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398473, 'C', '18', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:19', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:04:55', '', '2026-08-05', '09:05:39', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398474, 'C', '19', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:24', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:08:46', '', '2026-08-05', '09:08:56', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398475, 'C', '20', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:28', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:12:16', '', '2026-08-05', '09:12:40', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398476, 'C', '21', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:33', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:14:50', '', '2026-08-05', '09:15:10', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398477, 'CP', '9', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:43', 0, 0, '08:32:57', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:32:57', '', '2026-08-05', '08:33:01', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398478, 'CP', '10', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:24:50', 0, 0, '08:35:31', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:35:31', '', '2026-08-05', '08:35:49', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398479, 'C', '22', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:25:19', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:17:00', '', '2026-08-05', '09:17:50', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398480, 'CP', '11', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:26:29', 0, 0, '08:36:03', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:36:03', '', '2026-08-05', '08:37:21', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398481, 'CP', '12', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:26:54', 0, 0, '08:37:23', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:37:23', '', '2026-08-05', '08:37:52', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398482, 'HP', '1', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:27:33', 0, 0, '08:40:05', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '08:40:05', '', '2026-08-05', '08:46:36', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398483, 'HP', '2', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:27:38', 0, 0, '08:46:36', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '08:46:36', '', '2026-08-05', '08:47:27', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398484, 'TP', '4', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:28:40', 0, 0, '08:37:17', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:37:17', '', '2026-08-05', '08:49:32', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398485, 'HP', '3', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:29:57', 0, 0, '08:47:27', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '08:47:27', '', '2026-08-05', '08:51:20', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398486, 'C', '23', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:32:05', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:17:52', '', '2026-08-05', '09:18:20', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398487, 'C', '24', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:33:00', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:21:21', '', '2026-08-05', '09:22:05', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398488, 'C', '25', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:34:29', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:21:36', '', '2026-08-05', '09:22:06', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398489, 'C', '26', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:36:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:22:11', '', '2026-08-05', '09:23:13', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398490, 'C', '27', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:37:52', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:23:13', '', '2026-08-05', '09:23:35', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398491, 'H', '1', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:38:24', 0, 0, '09:05:00', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:05:00', '', '2026-08-05', '09:05:04', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398492, 'CP', '13', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:38:42', 0, 0, '08:55:09', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '08:55:09', '', '2026-08-05', '08:55:26', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398493, 'H', '2', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:39:21', 0, 0, '09:05:05', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:05:05', '', '2026-08-05', '09:05:09', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398494, 'C', '28', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:39:44', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:23:37', '', '2026-08-05', '09:23:58', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398495, 'CP', '14', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:41:09', 0, 0, '09:02:15', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:02:15', '', '2026-08-05', '09:11:00', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398496, 'T', '2', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:44:13', 0, 0, '08:48:20', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:48:20', '', '2026-08-05', '08:49:51', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398497, 'P', '1', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '08:44:46', 0, 0, '08:54:54', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '08:54:54', '', '2026-08-05', '08:54:55', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398498, 'T', '3', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:45:00', 0, 0, '08:49:33', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:49:33', '', '2026-08-05', '08:49:34', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398499, 'CP', '15', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:46:31', 0, 0, '09:11:01', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:11:01', '', '2026-08-05', '09:11:44', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398500, 'P', '2', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '08:46:41', 0, 0, '08:54:57', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '08:54:57', '', '2026-08-05', '08:54:58', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398501, 'C', '29', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:46:46', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:26:53', '', '2026-08-05', '09:30:41', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398502, 'H', '3', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:47:39', 0, 0, '09:05:10', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:05:10', '', '2026-08-05', '09:15:25', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398503, 'HP', '4', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:48:28', 0, 0, '08:51:25', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '08:51:25', '', '2026-08-05', '09:04:59', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398504, 'T', '4', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '08:48:34', 0, 0, '08:49:36', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '08:49:36', '', '2026-08-05', '09:23:55', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398505, 'F', '6', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:50:08', 0, 0, '08:52:56', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:52:56', '', '2026-08-05', '08:54:07', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398506, 'FP', '5', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:50:18', 0, 0, '08:52:29', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:52:29', '', '2026-08-05', '08:52:55', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398507, 'C', '30', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:50:26', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:27:41', '', '2026-08-05', '09:27:54', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398508, 'C', '31', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:50:31', 0, 0, '09:34:48', '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', '2026-08-05', '09:29:39', '', '2026-08-05', '09:30:00', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O ;  LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398509, 'CP', '16', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:50:37', 0, 0, '09:16:12', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:16:12', '', '2026-08-05', '09:16:33', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398510, 'H', '4', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '08:51:52', 0, 0, '09:15:26', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:15:26', '', '2026-08-05', '09:21:30', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398511, 'C', '32', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:52:07', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:30:02', '', '2026-08-05', '09:30:18', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398512, 'C', '33', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:52:13', 0, 0, '09:35:58', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:35:58', '', '2026-08-05', '09:39:21', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398513, 'F', '7', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '08:53:07', 0, 0, '08:54:08', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '08:54:08', '', '2026-08-05', '09:24:57', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398514, 'C', '34', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:53:35', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:30:26', '', '2026-08-05', '09:30:50', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398515, 'C', '35', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:57:24', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:30:42', '', '2026-08-05', '09:31:24', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398516, 'CP', '17', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:58:27', 0, 0, '09:18:24', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:18:24', '', '2026-08-05', '09:19:15', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398517, 'CP', '18', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:58:59', 0, 0, '09:19:24', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:19:24', '', '2026-08-05', '09:19:28', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398518, 'CP', '19', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:59:12', 0, 0, '09:22:10', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:22:10', '', '2026-08-05', '09:22:27', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398519, 'C', '36', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '08:59:49', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:30:55', '', '2026-08-05', '09:31:34', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398520, 'C', '37', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:00:10', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:34:23', '', '2026-08-05', '09:35:55', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398521, 'CP', '20', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:02:12', 0, 0, '09:22:46', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:22:46', '', '2026-08-05', '09:25:05', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398522, 'P', '3', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '09:03:07', 0, 0, '09:09:47', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '09:09:47', '', '2026-08-05', '09:09:48', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398523, 'C', '38', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:03:25', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:35:57', '', '2026-08-05', '09:36:16', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398524, 'T', '5', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:05:13', 0, 0, '09:23:58', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:23:58', '', '2026-08-05', '09:24:01', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398525, 'C', '39', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:02', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:36:20', '', '2026-08-05', '09:37:01', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398526, 'C', '40', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:07', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:37:03', '', '2026-08-05', '09:37:35', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398527, 'C', '41', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:15', 0, 0, '09:42:54', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:42:54', '', '2026-08-05', '09:44:50', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398528, 'C', '42', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:20', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:38:24', '', '2026-08-05', '09:39:51', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398529, 'C', '43', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:25', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:39:04', '', '2026-08-05', '09:39:24', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398530, 'CP', '21', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:06:35', 0, 0, '09:25:14', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:25:14', '', '2026-08-05', '09:27:54', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398531, 'T', '6', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:06:56', 0, 0, '09:24:06', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:24:06', '', '2026-08-05', '09:24:58', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398532, 'P', '4', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '09:09:11', 0, 0, '09:09:49', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '09:09:49', '', '2026-08-05', '09:09:51', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398533, 'TP', '5', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:09:17', 0, 0, '09:25:10', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:25:10', '', '2026-08-05', '09:34:08', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398534, 'C', '44', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:09:31', 0, 0, '09:44:52', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:44:52', '', '2026-08-05', '09:49:44', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398535, 'CP', '22', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:09:36', 0, 0, '09:28:00', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:28:00', '', '2026-08-05', '09:30:08', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398536, 'C', '45', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:12:15', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:41:05', '', '2026-08-05', '09:42:21', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398537, 'T', '7', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:13:04', 0, 0, '09:26:47', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:26:47', '', '2026-08-05', '09:28:37', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398538, 'C', '46', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:13:18', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:41:46', '', '2026-08-05', '09:42:37', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398539, 'C', '47', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:14:14', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:42:39', '', '2026-08-05', '09:43:23', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398540, 'C', '48', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:17:00', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:43:31', '', '2026-08-05', '09:48:29', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398541, 'HP', '5', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '09:19:18', 0, 0, '09:21:30', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:21:30', '', '2026-08-05', '09:21:41', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398542, 'H', '5', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '09:19:33', 0, 0, '09:21:41', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:21:41', '', '2026-08-05', '09:34:32', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398543, 'F', '8', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:24:32', 0, 0, '09:24:57', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:24:57', '', '2026-08-05', '09:32:55', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398544, 'C', '49', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:25:57', 0, 0, '09:50:37', '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', '2026-08-05', '09:45:58', '', '2026-08-05', '09:46:14', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O ;  LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398545, 'C', '50', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:26:15', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:46:20', '', '2026-08-05', '09:46:45', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398546, 'T', '8', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:26:52', 0, 0, '09:28:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:28:38', '', '2026-08-05', '09:31:17', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398547, 'C', '51', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:28:09', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:48:30', '', '2026-08-05', '09:48:44', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398548, 'F', '9', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:29:06', 0, 0, '09:33:50', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:33:50', '', '2026-08-05', '09:42:30', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398549, 'T', '9', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:29:39', 0, 0, '09:31:20', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:31:20', '', '2026-08-05', '09:32:34', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398550, 'T', '10', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:29:44', 0, 0, '09:32:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:32:38', '', '2026-08-05', '09:34:40', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398551, 'C', '52', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:30:59', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:49:24', '', '2026-08-05', '09:49:58', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398552, 'TP', '6', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:31:09', 0, 0, '09:34:11', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:34:11', '', '2026-08-05', '09:34:12', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398553, 'T', '11', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:31:14', 0, 0, '09:34:42', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:34:42', '', '2026-08-05', '09:37:28', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398554, 'C', '53', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:31:48', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:49:50', '', '2026-08-05', '09:50:12', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398555, 'C', '54', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:31:54', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:54:28', '', '2026-08-05', '09:55:18', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398556, 'C', '55', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:32:00', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:56:12', '', '2026-08-05', '09:57:01', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398557, 'C', '56', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:32:07', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '09:58:13', '', '2026-08-05', '09:58:47', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398558, 'HP', '6', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '09:32:28', 0, 0, '09:34:33', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:34:33', '', '2026-08-05', '09:42:21', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398559, 'FP', '6', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:32:35', 0, 0, '09:32:57', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:32:57', '', '2026-08-05', '09:33:50', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398560, 'FP', '7', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:34:05', 0, 0, '09:42:31', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:42:31', '', '2026-08-05', '09:45:33', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398561, 'C', '57', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:34:34', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:01:06', '', '2026-08-05', '10:01:26', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling] ;  LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398562, 'P', '5', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '09:35:53', 0, 0, '09:38:12', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '09:38:12', '', '2026-08-05', '09:47:19', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398563, 'CP', '23', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:36:01', 0, 0, '09:39:23', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:39:23', '', '2026-08-05', '09:39:43', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398564, 'C', '58', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:38:02', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:01:30', '', '2026-08-05', '10:01:44', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398565, 'H', '6', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '09:38:39', 0, 0, '09:42:21', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '09:42:21', '', '2026-08-05', '10:02:09', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398566, 'T', '12', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:38:48', 0, 0, '09:39:57', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:39:57', '', '2026-08-05', '09:53:16', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398567, 'T', '13', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:39:03', 0, 0, '09:40:59', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:40:59', '', '2026-08-05', '09:42:44', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398568, 'TP', '7', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:39:07', 0, 0, '09:42:49', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:42:49', '', '2026-08-05', '09:43:29', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398569, 'C', '59', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:39:16', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:03:48', '', '2026-08-05', '10:04:08', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398570, 'C', '60', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:39:53', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:04:12', '', '2026-08-05', '10:04:21', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398571, 'TP', '8', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:39:59', 0, 0, '09:43:34', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:43:34', '', '2026-08-05', '09:44:03', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398572, 'C', '61', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:40:27', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:04:28', '', '2026-08-05', '10:05:04', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398573, 'T', '14', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:40:39', 0, 0, '09:48:09', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:48:09', '', '2026-08-05', '09:48:34', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398574, 'F', '10', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:41:17', 0, 0, '09:45:34', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:45:34', '', '2026-08-05', '09:47:13', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398575, 'TP', '9', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:42:19', 0, 0, '09:44:08', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:44:08', '', '2026-08-05', '09:48:06', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398576, 'T', '15', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:42:34', 0, 0, '09:48:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:48:38', '', '2026-08-05', '09:49:16', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398577, 'C', '62', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:43:56', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:06:59', '', '2026-08-05', '10:07:36', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398578, 'C', '63', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:44:10', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:09:37', '', '2026-08-05', '10:10:23', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398579, 'TP', '10', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:45:27', 0, 0, '09:49:21', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:49:21', '', '2026-08-05', '09:54:06', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398580, 'F', '11', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:45:46', 0, 0, '09:47:13', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:47:13', '', '2026-08-05', '09:52:35', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398581, 'PP', '1', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '09:45:52', 0, 0, '09:47:19', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '09:47:19', '', '2026-08-05', '09:47:21', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398582, 'OE', '2', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '09:46:11', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(398583, 'CP', '24', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:47:32', 0, 0, '09:49:45', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '09:49:45', '', '2026-08-05', '09:49:55', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398584, 'FP', '8', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:48:37', 0, 0, '09:52:55', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:52:55', '', '2026-08-05', '09:53:31', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398585, 'TP', '11', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:48:45', 0, 0, '09:54:12', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:54:12', '', '2026-08-05', '09:55:34', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398586, 'C', '64', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:50:42', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:10:10', '', '2026-08-05', '10:11:23', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398587, 'T', '16', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:50:50', 0, 0, '09:55:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '09:55:38', '', '2026-08-05', '10:00:19', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398588, 'F', '12', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:50:55', 0, 0, '09:53:31', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:53:31', '', '2026-08-05', '09:56:11', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398589, 'CP', '25', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:51:08', 0, 0, '10:00:36', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:00:36', '', '2026-08-05', '10:01:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398590, 'C', '65', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:51:49', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:10:24', '', '2026-08-05', '10:11:38', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398591, 'TP', '12', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:52:29', 0, 0, '10:01:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:01:38', '', '2026-08-05', '10:02:27', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398592, 'C', '66', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:53:01', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:15:48', '', '2026-08-05', '10:16:32', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398593, 'H', '7', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '09:53:09', 0, 0, '10:02:10', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '10:02:10', '', '2026-08-05', '10:34:08', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398594, 'C', '67', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:53:40', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:16:33', '', '2026-08-05', '10:18:48', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398595, 'CP', '26', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:54:12', 0, 0, '10:04:48', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:04:48', '', '2026-08-05', '10:05:16', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398596, 'FP', '9', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '09:55:34', 0, 0, '09:56:12', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '09:56:12', '', '2026-08-05', '10:17:23', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398597, 'SOE', '1', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '09:55:44', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'PRIORITY', ''),
(398598, 'T', '17', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:57:07', 0, 0, '10:02:31', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:02:31', '', '2026-08-05', '10:05:34', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398599, 'C', '68', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:58:28', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:18:49', '', '2026-08-05', '10:19:26', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398600, 'TP', '13', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '09:59:08', 0, 0, '10:05:47', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:05:47', '', '2026-08-05', '10:07:22', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398601, 'CP', '27', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '09:59:58', 0, 0, '10:18:50', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:18:50', '', '2026-08-05', '10:20:53', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398602, 'T', '18', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:00:12', 0, 0, '10:07:24', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:07:24', '', '2026-08-05', '10:13:42', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398603, 'CP', '28', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:03:23', 0, 0, '10:26:51', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:26:51', '', '2026-08-05', '10:33:29', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398604, 'C', '69', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:03:36', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:19:27', '', '2026-08-05', '10:22:35', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398605, 'C', '70', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:03:41', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:21:26', '', '2026-08-05', '10:22:01', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]');
INSERT INTO `transaction` (`id`, `service`, `ticket`, `ticket_service`, `for_service`, `status`, `status_updater`, `date`, `time`, `recall`, `recall_check`, `recall_time`, `counter`, `cntr_forwarded`, `counter_user`, `forward_hist`, `forwarded_from`, `forwarded_to`, `forward_stat`, `cntr_grp`, `start_date`, `start_time`, `duration`, `end_date`, `end_time`, `void_reasons`, `cntr_message`, `pnumber`, `texted`, `sub_notes`, `counter_history`) VALUES
(398606, 'T', '19', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:03:55', 0, 0, '10:13:44', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:13:44', '', '2026-08-05', '10:14:19', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398607, 'CP', '29', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:04:06', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:24:09', '', '2026-08-05', '10:25:39', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398608, 'CP', '30', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:04:12', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:25:40', '', '2026-08-05', '10:26:04', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398609, 'C', '71', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:05:39', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:22:36', '', '2026-08-05', '10:24:05', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398610, 'C', '72', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:06:23', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:24:06', '', '2026-08-05', '10:24:47', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398611, 'P', '6', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '10:06:50', 0, 0, '10:22:22', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '10:22:22', '', '2026-08-05', '10:22:24', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398612, 'F', '13', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:07:08', 0, 0, '10:17:23', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '10:17:23', '', '2026-08-05', '10:22:29', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398613, 'T', '20', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:09:15', 0, 0, '10:17:09', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:17:09', '', '2026-08-05', '10:25:42', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398614, 'P', '7', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '10:14:22', 0, 0, '10:23:06', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '10:23:06', '', '2026-08-05', '10:23:08', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398615, 'PP', '2', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '10:15:57', 0, 0, '10:22:17', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '10:22:17', '', '2026-08-05', '10:22:18', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398616, 'T', '21', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:16:54', 0, 0, '10:33:46', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:33:46', '', '2026-08-05', '10:34:44', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398617, 'C', '73', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:17:08', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:27:38', '', '2026-08-05', '10:28:12', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398618, 'C', '74', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:17:14', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:30:46', '', '2026-08-05', '10:32:06', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398619, 'FP', '10', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:17:29', 0, 0, '10:22:30', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '10:22:30', '', '2026-08-05', '10:22:31', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398620, 'P', '8', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '10:19:28', 0, 0, '11:11:18', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:18', '', '2026-08-05', '11:11:20', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398621, 'FP', '11', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:19:39', 0, 0, '10:22:34', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '10:22:34', '', '2026-08-05', '10:23:20', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398622, 'C', '75', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:19:52', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:32:13', '', '2026-08-05', '10:32:59', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398623, 'C', '76', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:20:00', 0, 0, '10:39:20', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:39:20', '', '2026-08-05', '10:41:01', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398624, 'C', '77', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:20:55', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:34:09', '', '2026-08-05', '10:34:37', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398625, 'FP', '12', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:21:20', 0, 0, '10:23:45', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '10:23:45', '', '2026-08-05', '10:40:24', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398626, 'C', '78', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:21:34', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:34:39', '', '2026-08-05', '10:35:28', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398627, 'C', '79', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:21:41', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:35:13', '', '2026-08-05', '10:35:29', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398628, 'CP', '31', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:23:35', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:27:50', '', '2026-08-05', '10:28:10', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398629, 'TP', '14', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:23:43', 0, 0, '10:34:50', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:34:50', '', '2026-08-05', '10:37:29', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398630, 'T', '22', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:23:54', 0, 0, '10:37:35', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:37:35', '', '2026-08-05', '10:38:18', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398631, 'TP', '15', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:24:07', 0, 0, '10:38:47', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:38:47', '', '2026-08-05', '10:41:33', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398632, 'C', '80', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:24:14', 0, 0, '10:41:02', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:41:02', '', '2026-08-05', '10:44:19', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398633, 'C', '81', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:24:20', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:36:33', '', '2026-08-05', '10:37:17', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398634, 'T', '23', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:25:47', 0, 0, '10:38:24', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:38:24', '', '2026-08-05', '10:38:45', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398635, 'C', '82', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:28:06', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:37:19', '', '2026-08-05', '10:37:48', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398636, 'C', '83', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:28:25', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:37:21', '', '2026-08-05', '10:37:55', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398637, 'C', '84', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:29:00', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:37:57', '', '2026-08-05', '10:38:18', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398638, 'C', '85', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:29:08', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:39:44', '', '2026-08-05', '10:41:06', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398639, 'H', '8', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '10:29:30', 0, 0, '10:34:50', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '10:34:50', '', '2026-08-05', '11:11:21', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398640, 'C', '86', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:29:36', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:40:06', '', '2026-08-05', '10:40:50', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398641, 'TP', '16', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:30:44', 0, 0, '10:41:37', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:41:37', '', '2026-08-05', '10:41:56', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398642, 'TP', '17', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:30:54', 0, 0, '10:42:00', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:42:00', '', '2026-08-05', '10:43:15', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398643, 'HP', '7', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '10:30:59', 0, 0, '10:34:09', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '10:34:09', '', '2026-08-05', '10:34:50', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398644, 'C', '87', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:31:13', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:43:05', '', '2026-08-05', '10:43:43', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398645, 'CP', '32', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:31:18', 0, 0, '10:33:31', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:33:31', '', '2026-08-05', '10:37:36', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398646, 'C', '88', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:31:50', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:43:43', '', '2026-08-05', '10:44:57', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398647, 'C', '89', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:33:15', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:46:43', '', '2026-08-05', '10:47:37', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398648, 'C', '90', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:34:13', 0, 0, '10:53:30', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:53:30', '', '2026-08-05', '10:53:58', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398649, 'T', '24', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:35:19', 0, 0, '10:43:41', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:43:41', '', '2026-08-05', '10:53:16', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398650, 'FP', '13', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:35:38', 0, 0, '10:40:25', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '10:40:25', '', '2026-08-05', '11:08:41', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398651, 'CP', '33', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:35:47', 0, 0, '10:37:40', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:37:40', '', '2026-08-05', '10:39:19', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398652, 'C', '91', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:36:18', 0, 0, '10:54:00', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:54:00', '', '2026-08-05', '10:55:03', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398653, 'C', '92', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:37:18', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:49:05', '', '2026-08-05', '10:49:59', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398654, 'T', '25', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:37:56', 0, 0, '10:44:28', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:44:28', '', '2026-08-05', '10:44:31', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398655, 'C', '93', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:38:13', 0, 0, '10:55:05', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:55:05', '', '2026-08-05', '10:57:40', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398656, 'C', '94', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:38:46', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:49:32', '', '2026-08-05', '10:49:55', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398657, 'TP', '18', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:39:06', 0, 0, '10:44:36', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:44:36', '', '2026-08-05', '10:44:41', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398658, 'C', '95', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:39:17', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:50:01', '', '2026-08-05', '10:51:01', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398659, 'C', '96', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:34', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:51:03', '', '2026-08-05', '10:51:19', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398660, 'C', '97', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:38', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:51:22', '', '2026-08-05', '10:52:02', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398661, 'C', '98', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:43', 0, 0, '10:57:41', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:57:41', '', '2026-08-05', '10:59:30', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398662, 'C', '99', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:52:55', '', '2026-08-05', '10:53:18', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398663, 'C', '100', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:53', 0, 0, '10:59:32', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:59:32', '', '2026-08-05', '10:59:45', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398664, 'C', '101', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:40:57', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:55:21', '', '2026-08-05', '10:55:45', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398665, 'CP', '34', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:41:41', 0, 0, '10:44:21', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:44:21', '', '2026-08-05', '10:44:45', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398666, 'C', '102', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:41:49', 0, 0, '11:01:39', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:01:39', '', '2026-08-05', '11:02:05', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398667, 'T', '26', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:41:57', 0, 0, '10:44:46', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:44:46', '', '2026-08-05', '10:45:03', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398668, 'T', '27', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:42:08', 0, 0, '10:45:05', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:45:05', '', '2026-08-05', '10:45:12', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398669, 'C', '103', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:42:19', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:57:09', '', '2026-08-05', '10:58:15', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398670, 'CP', '35', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:42:23', 0, 0, '10:47:02', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '10:47:02', '', '2026-08-05', '10:47:17', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398671, 'CP', '36', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:44:02', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:47:12', '', '2026-08-05', '10:49:03', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398672, 'T', '28', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:44:35', 0, 0, '10:48:56', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:48:56', '', '2026-08-05', '10:58:17', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398673, 'C', '104', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:45:59', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:58:38', '', '2026-08-05', '10:59:53', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398674, 'C', '105', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:46:27', 0, 0, '11:04:26', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:04:26', '', '2026-08-05', '11:06:28', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398675, 'C', '106', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:46:32', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '10:59:15', '', '2026-08-05', '10:59:33', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398676, 'C', '107', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:46:36', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:01:05', '', '2026-08-05', '11:01:21', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398677, 'P', '9', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '10:47:51', 0, 0, '11:11:25', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:25', '', '2026-08-05', '11:11:27', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398678, 'F', '14', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '10:50:06', 0, 0, '11:08:41', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:08:41', '', '2026-08-05', '11:08:50', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398679, 'C', '108', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:50:13', 0, 0, '11:07:58', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:07:58', '', '2026-08-05', '11:09:02', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398680, 'C', '109', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:52:18', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:02:43', '', '2026-08-05', '11:02:58', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398681, 'C', '110', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:52:34', 0, 0, '11:09:45', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:09:45', '', '2026-08-05', '11:06:51', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398682, 'C', '111', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:52:39', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:05:17', '', '2026-08-05', '11:15:14', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398683, 'T', '29', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:53:05', 0, 0, '10:53:19', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:53:19', '', '2026-08-05', '10:58:33', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398684, 'C', '112', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:54:26', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:05:28', '', '2026-08-05', '11:05:52', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398685, 'C', '113', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:56:39', 0, 0, '11:06:53', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:06:53', '', '2026-08-05', '11:07:17', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398686, 'TP', '19', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '10:56:44', 0, 0, '10:58:19', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '10:58:19', '', '2026-08-05', '11:09:39', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398687, 'C', '114', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '10:59:25', 0, 0, '11:07:17', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:07:17', '', '2026-08-05', '11:07:28', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398688, 'C', '115', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:01:21', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:08:39', '', '2026-08-05', '11:09:42', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398689, 'C', '116', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:02:00', 0, 0, '11:09:05', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:09:05', '', '2026-08-05', '11:09:28', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398690, 'C', '117', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:02:05', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:09:46', '', '2026-08-05', '11:10:05', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398691, 'C', '118', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:03:08', 0, 0, '11:11:12', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:12', '', '2026-08-05', '11:11:25', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398692, 'T', '30', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:06:55', 0, 0, '11:09:40', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:09:40', '', '2026-08-05', '11:06:47', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398693, 'F', '15', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:07:02', 0, 0, '11:08:51', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:08:51', '', '2026-08-05', '11:13:54', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398694, 'HP', '8', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '11:08:23', 0, 0, '11:11:22', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:22', '', '2026-08-05', '11:39:43', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398695, 'TP', '20', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:10:24', 0, 0, '11:06:48', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:06:48', '', '2026-08-05', '11:08:59', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398696, 'PP', '3', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '11:10:30', 0, 0, '11:11:41', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:41', '', '2026-08-05', '11:11:42', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398697, 'C', '119', 'CASHIERCounter 7,8, 9, 10', '', 'voided', 0, '2026-08-05', '11:11:28', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:19:02', '', NULL, '11:19:18', 'No-Show', NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [voided]'),
(398698, 'C', '120', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:12:13', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:19:26', '', '2026-08-05', '11:20:20', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398699, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:06:53', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:12:26', '', '2026-08-05', '11:12:43', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398700, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:06:57', 0, 0, '11:14:31', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:14:31', '', '2026-08-05', '11:16:43', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398701, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:07:04', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:15:15', '', '2026-08-05', '11:16:29', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398702, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:07:28', 0, 0, '11:16:51', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:16:51', '', '2026-08-05', '11:17:27', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398703, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:07:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:17:30', '', '2026-08-05', '11:18:09', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398704, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:04', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:10', '', '2026-08-05', '11:18:14', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398705, 'CP', '37', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:11', 0, 0, '11:08:58', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:08:58', '', '2026-08-05', '11:09:43', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398706, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:16', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:15', '', '2026-08-05', '11:18:17', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398707, 'T', '31', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:08:23', 0, 0, '11:09:01', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:09:01', '', '2026-08-05', '11:32:12', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398708, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:29', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:18', '', '2026-08-05', '11:18:20', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398709, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:34', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:21', '', '2026-08-05', '11:18:22', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398710, 'CP', '38', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:44', 0, 0, '11:11:59', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:11:59', '', '2026-08-05', '11:12:32', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398711, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:49', 0, 0, '11:18:09', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', 'PAYMENT', '2026-08-05', '11:18:09', '', '2026-08-05', '11:18:10', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];WILMA DUMAGAN'),
(398712, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:08:54', 0, 0, '11:18:13', '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', '2026-08-05', '11:18:13', '', '2026-08-05', '11:18:14', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];WILMA DUMAGAN;LIZA HONRADO [finished]'),
(398713, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:09:01', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:41', '', '2026-08-05', '11:18:42', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398714, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:09:27', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:43', '', '2026-08-05', '11:18:44', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398715, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'voided', 0, '2026-08-05', '11:09:51', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:45', '', NULL, '11:18:52', 'Incomplete', NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [voided]'),
(398716, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'voided', 0, '2026-08-05', '11:09:58', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:53', '', NULL, '11:18:57', 'Incomplete', NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [voided]'),
(398717, 'CP', '39', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:10:33', 0, 0, '11:13:30', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:13:30', '', '2026-08-05', '11:14:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398718, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'voided', 0, '2026-08-05', '11:10:37', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:18:58', '', NULL, '11:19:01', 'Incomplete', NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [voided]'),
(398719, 'CP', '40', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:10:42', 0, 0, '11:16:16', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:16:16', '', '2026-08-05', '11:17:13', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398720, 'CP', '41', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:01', 0, 0, '11:17:15', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:17:15', '', '2026-08-05', '11:17:43', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398721, 'CP', '42', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:05', 0, 0, '11:20:29', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:20:29', '', '2026-08-05', '11:20:31', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398722, 'CP', '43', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:10', 0, 0, '11:22:53', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:22:53', '', '2026-08-05', '11:23:11', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398723, 'CP', '44', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:19', 0, 0, '11:23:13', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:23:13', '', '2026-08-05', '11:23:20', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398724, 'CP', '45', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:24', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:24:28', '', '2026-08-05', '11:24:52', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398725, 'CP', '46', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:29', 0, 0, '11:24:51', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:24:51', '', '2026-08-05', '11:25:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398726, 'CP', '47', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:37', 0, 0, '11:26:55', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '11:26:55', '', '2026-08-05', '11:27:11', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398727, 'CP', '48', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:11:41', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:27:32', '', '2026-08-05', '11:27:47', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398728, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'voided', 0, '2026-08-05', '11:11:46', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:19:20', '', NULL, '11:19:25', 'No-Show', NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [voided]'),
(398729, 'F', '16', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:11:55', 0, 0, '11:14:23', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:14:23', '', '2026-08-05', '11:16:00', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398730, 'F', '17', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:12:01', 0, 0, '11:16:01', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:16:01', '', '2026-08-05', '11:16:20', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398731, 'T', '32', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:12:07', 0, 0, '11:12:36', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:12:36', '', '2026-08-05', '11:15:07', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398732, 'T', '33', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:12:14', 0, 0, '11:16:27', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:16:27', '', '2026-08-05', '11:24:26', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398733, 'C', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:12:20', 0, 0, '11:19:19', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:19:19', '', '2026-08-05', '11:19:21', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398734, 'CP', '49', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:13:28', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:29:23', '', '2026-08-05', '11:30:03', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398735, 'CP', '50', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:14:08', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:34:36', '', '2026-08-05', '11:35:03', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398736, 'F', '18', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:15:24', 0, 0, '11:16:21', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:16:21', '', '2026-08-05', '11:36:25', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398737, 'C', '122', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:15:39', 0, 0, '11:19:25', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:19:25', '', '2026-08-05', '11:19:54', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398738, 'C', '123', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:15:44', 0, 0, '11:21:04', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:21:04', '', '2026-08-05', '11:21:24', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398739, 'C', '124', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:17:06', 0, 0, '11:21:26', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:21:26', '', '2026-08-05', '11:21:41', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398740, 'CP', '51', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:22:05', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:37:24', '', '2026-08-05', '11:38:09', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398741, 'C', '125', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:23:28', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:23:59', '', '2026-08-05', '11:24:32', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398742, 'C', '126', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:23:33', 0, 0, '11:24:02', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:24:02', '', '2026-08-05', '11:25:01', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398743, 'T', '34', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:23:40', 0, 0, '11:24:28', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:24:28', '', '2026-08-05', '11:30:56', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398744, 'C', '127', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:24:04', 0, 0, '11:25:05', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:25:05', '', '2026-08-05', '11:28:22', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398745, 'C', '128', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:24:46', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:28:04', '', '2026-08-05', '11:28:29', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398746, 'H', '9', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '11:24:52', 0, 0, '11:39:44', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '11:39:44', '', '2026-08-05', '11:47:16', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398747, 'CP', '52', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:25:25', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:41:29', '', '2026-08-05', '11:41:43', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398748, 'CP', '53', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:25:38', 0, 0, '11:41:08', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:41:08', '', '2026-08-05', '11:42:06', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(398749, 'C', '129', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:26:08', 0, 0, '11:28:24', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:28:24', '', '2026-08-05', '11:28:50', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398750, 'TP', '21', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:26:17', 0, 0, '11:30:58', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:30:58', '', '2026-08-05', '11:40:34', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398751, 'C', '130', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:27:39', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:32:04', '', '2026-08-05', '11:33:41', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398752, 'CP', '54', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:30:14', 0, 0, '11:47:25', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:47:25', '', '2026-08-05', '11:47:57', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(398753, 'TP', '22', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:30:23', 0, 0, '11:32:14', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:32:14', '', '2026-08-05', '11:59:50', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398754, 'C', '131', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:30:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:38:42', '', '2026-08-05', '11:40:46', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398755, 'C', '132', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:34:36', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:42:20', '', '2026-08-05', '11:43:23', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398756, 'C', '133', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:34:50', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:43:24', '', '2026-08-05', '11:43:44', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398757, 'FP', '14', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:36:17', 0, 0, '11:36:26', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:36:26', '', '2026-08-05', '11:38:44', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398758, 'FP', '15', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:38:14', 0, 0, '11:38:45', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:38:45', '', '2026-08-05', '11:44:43', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398759, 'TP', '23', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:38:20', 0, 0, '11:40:38', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:40:38', '', '2026-08-05', '11:41:30', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398760, 'F', '19', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:38:43', 0, 0, '11:44:43', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:44:43', '', '2026-08-05', '11:48:45', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398761, 'T', '35', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:39:35', 0, 0, '11:41:33', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:41:33', '', '2026-08-05', '12:02:04', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398762, 'C', '134', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:40:24', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:45:24', '', '2026-08-05', '11:46:53', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398763, 'TP', '24', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:40:57', 0, 0, '12:02:09', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:02:09', '', '2026-08-05', '12:13:04', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398764, 'C', '135', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:41:10', 0, 0, '11:56:01', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:56:01', '', '2026-08-05', '11:56:30', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398765, 'H', '10', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '11:42:15', 0, 0, '11:47:17', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '11:47:17', '', '2026-08-05', '11:50:57', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398766, 'CP', '55', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:44:06', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:49:59', '', '2026-08-05', '11:52:44', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398767, 'C', '136', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:44:30', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:57:42', '', '2026-08-05', '11:58:59', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398768, 'C', '137', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:45:01', 0, 0, '11:58:23', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:58:23', '', '2026-08-05', '11:58:44', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398769, 'C', '138', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:46:55', 0, 0, '11:58:45', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:58:45', '', '2026-08-05', '11:59:00', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398770, 'F', '20', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:47:27', 0, 0, '11:48:46', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '11:48:46', '', '2026-08-05', '12:13:03', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398771, 'H', '11', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '11:47:39', 0, 0, '11:50:57', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '11:50:57', '', '2026-08-05', '13:43:06', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398772, 'C', '139', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:48:16', 0, 0, '12:00:38', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:00:38', '', '2026-08-05', '12:01:36', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398773, 'C', '140', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:48:22', 0, 0, '12:01:22', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:01:22', '', '2026-08-05', '12:01:49', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398774, 'CP', '56', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:48:47', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:52:46', '', '2026-08-05', '11:53:17', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398775, 'CP', '57', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:52:00', 0, 0, '11:52:49', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '11:52:49', '', '2026-08-05', '11:55:58', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(398776, 'CP', '58', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:52:50', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '11:56:23', '', '2026-08-05', '11:57:40', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398777, 'F', '21', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:52:55', 0, 0, '12:13:04', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:04', '', '2026-08-05', '12:13:07', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON');
INSERT INTO `transaction` (`id`, `service`, `ticket`, `ticket_service`, `for_service`, `status`, `status_updater`, `date`, `time`, `recall`, `recall_check`, `recall_time`, `counter`, `cntr_forwarded`, `counter_user`, `forward_hist`, `forwarded_from`, `forwarded_to`, `forward_stat`, `cntr_grp`, `start_date`, `start_time`, `duration`, `end_date`, `end_time`, `void_reasons`, `cntr_message`, `pnumber`, `texted`, `sub_notes`, `counter_history`) VALUES
(398778, 'T', '36', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:53:00', 0, 0, '11:59:53', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '11:59:53', '', '2026-08-05', '11:59:54', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398779, 'C', '141', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:53:06', 0, 0, '12:01:38', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:01:38', '', '2026-08-05', '12:01:58', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398780, 'C', '142', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:53:12', 0, 0, '12:01:52', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:01:52', '', '2026-08-05', '12:02:18', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398781, 'C', '143', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:54:08', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:07:01', '', '2026-08-05', '12:07:51', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398782, 'F', '22', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:54:12', 0, 0, '12:13:08', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:08', '', '2026-08-05', '12:14:28', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398783, 'C', '144', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:55:16', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:07:52', '', '2026-08-05', '12:08:49', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398784, 'F', '23', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:56:33', 0, 0, '12:14:29', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:14:29', '', '2026-08-05', '12:14:30', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398785, 'C', '145', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:56:48', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:12:08', '', '2026-08-05', '12:12:28', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398786, 'P', '10', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '11:58:05', 0, 0, '12:13:31', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:31', '', '2026-08-05', '12:13:32', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398787, 'T', '37', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:58:22', 0, 0, '12:13:12', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:12', '', '2026-08-05', '12:14:00', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398788, 'F', '24', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '11:58:32', 0, 0, '12:14:34', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:14:34', '', '2026-08-05', '12:17:09', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398789, 'CP', '59', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '11:59:08', 0, 0, '12:00:34', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:00:34', '', '2026-08-05', '12:01:21', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398790, 'T', '38', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '11:59:26', 0, 0, '12:14:11', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:14:11', '', '2026-08-05', '12:17:01', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398791, 'F', '25', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:00:51', 0, 0, '12:17:49', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:17:49', '', '2026-08-05', '12:19:01', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398792, 'P', '11', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:03:51', 0, 0, '12:13:33', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:33', '', '2026-08-05', '12:13:34', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398793, 'CP', '60', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:07:18', 0, 0, '12:07:41', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:07:41', '', '2026-08-05', '12:08:02', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398794, 'TP', '25', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:07:28', 0, 0, '12:17:10', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:17:10', '', '2026-08-05', '12:19:54', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398795, 'CP', '61', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:07:36', 0, 0, '12:22:20', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:22:20', '', '2026-08-05', '12:22:55', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398796, 'P', '12', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:08:54', 0, 0, '12:13:34', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:13:34', '', '2026-08-05', '12:13:35', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398797, 'C', '146', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:10:20', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:12:31', '', '2026-08-05', '12:13:10', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398798, 'F', '26', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:12:10', 0, 0, '12:19:37', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:19:37', '', '2026-08-05', '12:22:20', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398799, 'TP', '26', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:12:53', 0, 0, '12:22:00', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:22:00', '', '2026-08-05', '12:22:01', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398800, 'C', '147', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:13:17', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:15:29', '', '2026-08-05', '12:18:39', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398801, 'TP', '27', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:13:22', 0, 0, '12:22:16', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:22:16', '', '2026-08-05', '12:26:05', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398802, 'T', '39', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:15:15', 0, 0, '12:26:10', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:26:10', '', '2026-08-05', '12:27:12', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398803, 'FP', '16', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:15:32', 0, 0, '12:17:09', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:17:09', '', '2026-08-05', '12:17:48', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398804, 'TP', '28', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:17:51', 0, 0, '12:27:09', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:27:09', '', '2026-08-05', '12:27:13', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398805, 'FP', '17', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:17:58', 0, 0, '12:19:01', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:19:01', '', '2026-08-05', '12:19:36', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398806, 'F', '27', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:18:12', 0, 0, '12:22:21', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:22:21', '', '2026-08-05', '12:22:26', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398807, 'F', '28', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:18:43', 0, 0, '12:22:30', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:22:30', '', '2026-08-05', '12:26:11', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398808, 'T', '40', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:18:50', 0, 0, '12:27:53', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:27:53', '', '2026-08-05', '12:29:54', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398809, 'F', '29', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:19:11', 0, 0, '12:27:19', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:27:19', '', '2026-08-05', '12:27:30', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398810, 'TP', '29', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:23:01', 0, 0, '12:28:12', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:28:12', '', '2026-08-05', '12:41:18', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398811, 'C', '148', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:23:58', 0, 0, '12:24:35', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:24:35', '', '2026-08-05', '12:27:47', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398812, 'T', '41', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:24:04', 0, 0, '12:29:59', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:29:59', '', '2026-08-05', '12:30:50', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398813, 'F', '30', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:24:39', 0, 0, '12:27:30', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:27:30', '', '2026-08-05', '12:33:06', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398814, 'CP', '62', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:25:07', 0, 0, '12:30:55', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:30:55', '', '2026-08-05', '12:33:55', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398815, 'FP', '18', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:25:45', 0, 0, '12:26:11', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:26:11', '', '2026-08-05', '12:27:19', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398816, 'T', '42', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:26:41', 0, 0, '12:30:53', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:30:53', '', '2026-08-05', '12:34:20', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398817, 'CP', '63', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:26:51', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:33:38', '', '2026-08-05', '12:34:02', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398818, 'C', '149', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:26:58', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:29:44', '', '2026-08-05', '12:31:07', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398819, 'P', '13', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:27:11', 0, 0, '12:41:40', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:41:40', '', '2026-08-05', '12:41:40', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398820, 'CP', '64', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:27:44', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:34:06', '', '2026-08-05', '12:34:42', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398821, 'C', '150', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:28:49', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:31:10', '', '2026-08-05', '12:32:00', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398822, 'TP', '30', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:31:44', 0, 0, '12:34:24', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:34:24', '', '2026-08-05', '12:35:39', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398823, 'F', '31', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:32:45', 0, 0, '12:33:07', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:33:07', '', '2026-08-05', '12:49:50', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398824, 'CP', '65', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:32:50', 0, 0, '12:33:56', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:33:56', '', '2026-08-05', '12:43:02', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398825, 'T', '43', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:33:33', 0, 0, '12:35:40', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:35:40', '', '2026-08-05', '13:28:26', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398826, 'P', '14', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:34:06', 0, 0, '12:41:41', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:41:41', '', '2026-08-05', '12:41:42', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398827, 'C', '151', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:37:48', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:38:59', '', '2026-08-05', '12:40:18', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398828, 'T', '44', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:38:39', 0, 0, '12:41:20', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:41:20', '', '2026-08-05', '12:53:56', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398829, 'H', '12', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '12:41:11', 0, 0, '13:43:33', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:33', '', '2026-08-05', '13:43:37', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398830, 'C', '152', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:41:27', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:43:08', '', '2026-08-05', '12:43:34', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398831, 'C', '153', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:41:32', 0, 0, '12:43:43', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:43:43', '', '2026-08-05', '12:43:53', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398832, 'FP', '19', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:43:07', 0, 0, '12:49:51', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '12:49:51', '', '2026-08-05', '12:52:45', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398833, 'C', '154', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:43:22', 0, 0, '12:46:04', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '12:46:04', '', '2026-08-05', '13:05:49', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398834, 'F', '32', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:46:02', 0, 0, '13:13:06', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:13:06', '', '2026-08-05', '13:14:16', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398835, 'C', '155', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:47:03', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:47:45', '', '2026-08-05', '12:48:39', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398836, 'P', '15', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:47:50', 0, 0, '12:59:21', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:59:21', '', '2026-08-05', '12:59:22', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398837, 'F', '33', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:51:56', 0, 0, '13:14:17', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:14:17', '', '2026-08-05', '13:14:30', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398838, 'CP', '66', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:52:35', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:55:34', '', '2026-08-05', '12:56:44', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398839, 'CP', '67', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:52:53', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '12:56:47', '', '2026-08-05', '12:57:08', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398840, 'FP', '20', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:53:16', 0, 0, '13:12:37', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:12:37', '', '2026-08-05', '13:12:41', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398841, 'T', '45', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '12:53:44', 0, 0, '12:53:58', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '12:53:58', '', '2026-08-05', '13:04:31', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398842, 'H', '13', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '12:54:08', 0, 0, '13:43:38', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:38', '', '2026-08-05', '13:43:44', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398843, 'PP', '4', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '12:54:21', 0, 0, '12:56:38', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '12:56:38', '', '2026-08-05', '12:56:39', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398844, 'C', '156', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:56:30', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:03:38', '', '2026-08-05', '13:03:58', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398845, 'CP', '68', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:56:45', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:01:37', '', '2026-08-05', '13:02:30', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398846, 'F', '34', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:57:07', 0, 0, '13:14:31', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:14:31', '', '2026-08-05', '13:14:43', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398847, 'F', '35', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '12:57:29', 0, 0, '13:14:45', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:14:45', '', '2026-08-05', '13:15:58', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398848, 'C', '157', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:58:41', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:03:59', '', '2026-08-05', '13:07:34', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398849, 'CP', '69', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '12:59:22', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:06:02', '', '2026-08-05', '13:07:41', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398850, 'HP', '9', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '13:00:18', 0, 0, '13:43:06', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:06', '', '2026-08-05', '13:43:13', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398851, 'HP', '10', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '13:00:28', 0, 0, '13:43:20', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:20', '', '2026-08-05', '13:43:24', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398852, 'C', '158', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:00:36', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:07:35', '', '2026-08-05', '13:08:17', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398853, 'CP', '70', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:00:57', 0, 0, '13:05:50', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:05:50', '', '2026-08-05', '13:09:48', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398854, 'H', '14', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '13:01:56', 0, 0, '13:43:44', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:44', '', '2026-08-05', '14:26:23', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398855, 'CP', '71', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:02:29', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:07:43', '', '2026-08-05', '13:08:18', NULL, NULL, NULL, 0, 'PRIORITY', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398856, 'CP', '72', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:02:35', 0, 0, '13:10:55', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:10:55', '', '2026-08-05', '13:12:58', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398857, 'C', '159', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:03:32', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:08:18', '', '2026-08-05', '13:10:00', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398858, 'C', '160', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:04:00', 0, 0, '13:09:20', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:09:20', '', '2026-08-05', '13:09:45', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398859, 'T', '46', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:04:11', 0, 0, '13:04:33', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:04:33', '', '2026-08-05', '13:12:10', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398860, 'CP', '73', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:04:26', 0, 0, '13:12:59', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:12:59', '', '2026-08-05', '13:13:35', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398861, 'FP', '21', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:04:43', 0, 0, '13:12:43', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:12:43', '', '2026-08-05', '13:13:06', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398862, 'C', '161', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:04:48', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:14:03', '', '2026-08-05', '13:17:35', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398863, 'C', '162', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:04:52', 0, 0, '13:18:07', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:18:07', '', '2026-08-05', '13:18:21', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398864, 'C', '163', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:04:57', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:20:03', '', '2026-08-05', '13:20:20', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398865, 'C', '164', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:05:39', 0, 0, '13:20:27', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:20:27', '', '2026-08-05', '13:21:36', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398866, 'C', '165', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:07:25', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:21:44', '', '2026-08-05', '13:22:36', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398867, 'C', '166', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:07:32', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:22:16', '', '2026-08-05', '13:22:54', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398868, 'CP', '74', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:07:42', 0, 0, '13:14:08', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:14:08', '', '2026-08-05', '13:14:23', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398869, 'C', '167', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:07:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:23:55', '', '2026-08-05', '13:24:17', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398870, 'P', '16', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:10:08', 0, 0, '13:10:49', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:10:49', '', '2026-08-05', '13:29:50', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398871, 'C', '168', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:10:37', 0, 0, '13:24:27', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:24:27', '', '2026-08-05', '13:28:05', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398872, 'F', '36', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:10:42', 0, 0, '13:15:59', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:15:59', '', '2026-08-05', '13:28:02', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398873, 'T', '47', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:10:46', 0, 0, '13:12:11', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:12:11', '', '2026-08-05', '13:12:12', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398874, 'HP', '11', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '13:11:07', 0, 0, '13:43:25', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '13:43:25', '', '2026-08-05', '13:43:32', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(398875, 'CP', '75', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:11:12', 0, 0, '13:15:11', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:15:11', '', '2026-08-05', '13:18:57', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398876, 'CP', '76', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:11:22', 0, 0, '13:19:00', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:19:00', '', '2026-08-05', '13:19:28', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398877, 'CP', '77', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:11:27', 0, 0, '13:21:56', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:21:56', '', '2026-08-05', '13:22:18', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398878, 'T', '48', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:11:40', 0, 0, '13:12:13', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:12:13', '', '2026-08-05', '13:15:35', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398879, 'T', '49', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:12:03', 0, 0, '13:15:37', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:15:37', '', '2026-08-05', '13:15:51', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398880, 'C', '169', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:12:34', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:25:31', '', '2026-08-05', '13:25:55', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398881, 'C', '170', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:13:30', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:25:58', '', '2026-08-05', '13:26:49', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398882, 'T', '50', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:14:35', 0, 0, '13:15:53', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:15:53', '', '2026-08-05', '13:16:53', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398883, 'T', '51', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:16:19', 0, 0, '13:16:54', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:16:54', '', '2026-08-05', '13:21:20', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398884, 'C', '171', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:16:58', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:26:53', '', '2026-08-05', '13:28:15', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398885, 'C', '172', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:17:16', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:27:42', '', '2026-08-05', '13:28:06', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398886, 'C', '173', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:18:26', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:30:13', '', '2026-08-05', '13:30:40', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398887, 'CP', '78', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:18:33', 0, 0, '13:22:20', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:22:20', '', '2026-08-05', '13:22:47', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398888, 'C', '174', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:19:21', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:30:23', '', '2026-08-05', '13:33:52', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398889, 'C', '175', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:19:46', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:32:46', '', '2026-08-05', '13:33:14', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398890, 'TP', '31', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:21:05', 0, 0, '13:21:22', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:21:22', '', '2026-08-05', '13:33:39', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398891, 'CP', '79', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:25:45', 0, 0, '13:28:07', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:28:07', '', '2026-08-05', '13:28:36', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398892, 'F', '37', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:26:04', 0, 0, '13:28:07', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:28:07', '', '2026-08-05', '13:46:07', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398893, 'T', '52', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:26:28', 0, 0, '13:28:29', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:28:29', '', '2026-08-05', '13:54:00', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398894, 'C', '176', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:26:35', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:34:11', '', '2026-08-05', '13:34:34', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398895, 'P', '17', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:26:44', 0, 0, '13:29:52', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:29:52', '', '2026-08-05', '13:29:53', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398896, 'P', '18', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:27:07', 0, 0, '13:29:57', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:29:57', '', '2026-08-05', '13:29:58', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398897, 'CP', '80', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:27:13', 0, 0, '13:31:50', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:31:50', '', '2026-08-05', '13:31:51', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398898, 'F', '38', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:30:28', 0, 0, '13:46:08', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:46:08', '', '2026-08-05', '13:46:50', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398899, 'T', '53', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:31:50', 0, 0, '13:47:03', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:47:03', '', '2026-08-05', '13:47:04', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398900, 'C', '177', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:33:52', 0, 0, '13:36:46', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:36:46', '', '2026-08-05', '13:46:34', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398901, 'F', '39', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:35:11', 0, 0, '13:46:50', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:46:50', '', '2026-08-05', '13:47:36', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398902, 'C', '178', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:35:33', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:37:25', '', '2026-08-05', '13:37:48', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398903, 'C', '179', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:35:56', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:39:47', '', '2026-08-05', '13:40:38', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398904, 'T', '54', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:36:03', 0, 0, '13:53:10', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:53:10', '', '2026-08-05', '13:53:58', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398905, 'C', '180', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:36:36', 0, 0, '13:39:41', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:39:41', '', '2026-08-05', '13:39:59', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398906, 'F', '40', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:37:55', 0, 0, '13:47:36', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '13:47:36', '', '2026-08-05', '14:00:45', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398907, 'T', '55', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:39:54', 0, 0, '13:54:00', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:54:00', '', '2026-08-05', '14:04:58', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398908, 'T', '56', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:40:13', 0, 0, '13:54:04', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:54:04', '', '2026-08-05', '13:57:49', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398909, 'PP', '5', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:42:44', 0, 0, '13:45:03', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:45:03', '', '2026-08-05', '14:07:41', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398910, 'OE', '3', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '13:44:37', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(398911, 'C', '181', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:45:00', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:45:35', '', '2026-08-05', '13:46:08', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398912, 'C', '182', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:45:24', 0, 0, '13:46:36', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:46:36', '', '2026-08-05', '13:46:50', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398913, 'OE', '4', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '13:47:49', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(398914, 'T', '57', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:49:30', 0, 0, '13:57:55', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:57:55', '', '2026-08-05', '13:58:29', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398915, 'T', '58', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:49:52', 0, 0, '13:58:37', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '13:58:37', '', '2026-08-05', '13:59:00', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398916, 'T', '59', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:50:00', 0, 0, '14:00:57', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:00:57', '', '2026-08-05', '14:16:10', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398917, 'T', '60', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:50:05', 0, 0, '14:06:07', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:06:07', '', '2026-08-05', '14:06:11', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398918, 'CP', '81', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:50:34', 0, 0, '13:51:08', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:51:08', '', '2026-08-05', '13:52:00', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398919, 'C', '183', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:50:42', 0, 0, '13:52:02', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '13:52:02', '', '2026-08-05', '13:55:48', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(398920, 'C', '184', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:50:50', 0, 0, '13:52:04', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '13:52:04', '', '2026-08-05', '14:11:27', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398921, 'T', '61', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:52:51', 0, 0, '14:06:17', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:06:17', '', '2026-08-05', '14:06:24', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398922, 'F', '41', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:53:07', 0, 0, '14:06:17', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:06:17', '', '2026-08-05', '14:06:44', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398923, 'FP', '22', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:54:33', 0, 0, '14:00:45', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:00:45', '', '2026-08-05', '14:06:17', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398924, 'F', '42', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '13:54:37', 0, 0, '14:14:16', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:14:16', '', '2026-08-05', '14:24:20', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398925, 'P', '19', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:54:46', 0, 0, '14:08:37', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:08:37', '', '2026-08-05', '14:08:38', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398926, 'PP', '6', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '13:54:56', 0, 0, '14:07:47', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:07:47', '', '2026-08-05', '14:07:49', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398927, 'C', '185', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:56:06', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '13:56:57', '', '2026-08-05', '13:57:22', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398928, 'C', '186', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:56:13', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:03:10', '', '2026-08-05', '14:03:24', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398929, 'C', '187', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:56:19', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:08:03', '', '2026-08-05', '14:08:24', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398930, 'C', '188', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:56:25', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:08:11', '', '2026-08-05', '14:10:33', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(398931, 'CP', '82', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '13:56:41', 0, 0, '14:02:55', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:02:55', '', '2026-08-05', '14:03:30', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398932, 'T', '62', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:56:48', 0, 0, '14:08:25', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:08:25', '', '2026-08-05', '14:08:35', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398933, 'TP', '32', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:57:10', 0, 0, '14:05:03', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:05:03', '', '2026-08-05', '14:06:02', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398934, 'TP', '33', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '13:57:32', 0, 0, '14:08:16', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:08:16', '', '2026-08-05', '14:08:17', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398935, 'C', '189', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:01:16', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:09:59', '', '2026-08-05', '14:10:23', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398936, 'C', '190', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:01:23', 0, 0, '14:11:28', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:11:28', '', '2026-08-05', '14:14:03', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398937, 'TP', '34', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:01:30', 0, 0, '14:16:14', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:16:14', '', '2026-08-05', '14:20:04', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398938, 'CP', '83', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:01:40', 0, 0, '14:03:32', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:03:32', '', '2026-08-05', '14:06:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398939, 'CP', '84', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:03:17', 0, 0, '14:06:08', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:06:08', '', '2026-08-05', '14:13:41', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398940, 'CP', '85', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:03:54', 0, 0, '14:13:48', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:13:48', '', '2026-08-05', '14:13:59', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398941, 'T', '63', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:04:07', 0, 0, '14:20:14', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:20:14', '', '2026-08-05', '14:21:53', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398942, 'CP', '86', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:05:04', 0, 0, '14:23:01', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:23:01', '', '2026-08-05', '14:24:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398943, 'PP', '7', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '14:05:27', 0, 0, '14:08:35', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:08:35', '', '2026-08-05', '14:08:36', NULL, NULL, NULL, 0, 'PRIORITY', ' ERWIN HINAUTAN'),
(398944, 'T', '64', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:07:03', 0, 0, '14:23:56', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:23:56', '', '2026-08-05', '14:23:57', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398945, 'C', '191', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:07:33', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:13:04', '', '2026-08-05', '14:13:22', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398946, 'C', '192', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:07:47', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:13:38', '', '2026-08-05', '14:13:52', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398947, 'C', '193', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:08:03', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:13:54', '', '2026-08-05', '14:14:45', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398948, 'C', '194', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:08:21', 0, 0, '14:14:11', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:14:11', '', '2026-08-05', '14:14:26', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398949, 'C', '195', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:08:37', 0, 0, '14:16:47', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:16:47', '', '2026-08-05', '14:24:44', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398950, 'T', '65', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:09:05', 0, 0, '14:26:57', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:26:57', '', '2026-08-05', '14:35:36', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398951, 'TP', '35', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:11:23', 0, 0, '14:35:40', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:35:40', '', '2026-08-05', '14:43:18', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398952, 'C', '196', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:12:08', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:18:57', '', '2026-08-05', '14:19:50', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]');
INSERT INTO `transaction` (`id`, `service`, `ticket`, `ticket_service`, `for_service`, `status`, `status_updater`, `date`, `time`, `recall`, `recall_check`, `recall_time`, `counter`, `cntr_forwarded`, `counter_user`, `forward_hist`, `forwarded_from`, `forwarded_to`, `forward_stat`, `cntr_grp`, `start_date`, `start_time`, `duration`, `end_date`, `end_time`, `void_reasons`, `cntr_message`, `pnumber`, `texted`, `sub_notes`, `counter_history`) VALUES
(398953, 'C', '197', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:12:14', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:23:28', '', '2026-08-05', '14:25:22', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(398954, 'CP', '87', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:13:25', 0, 0, '14:25:46', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:25:46', '', '2026-08-05', '14:26:04', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398955, 'C', '198', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:13:51', 0, 0, '14:25:11', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:25:11', '', '2026-08-05', '14:25:30', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398956, 'CP', '88', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:13:58', 0, 0, '14:30:56', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:30:56', '', '2026-08-05', '14:31:03', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(398957, 'C', '199', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:14:43', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:27:58', '', '2026-08-05', '14:28:36', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(398958, 'C', '200', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:15:23', 0, 0, '14:27:33', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:27:33', '', '2026-08-05', '14:30:54', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398959, 'T', '66', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:15:28', 0, 0, '14:38:21', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:38:21', '', '2026-08-05', '14:38:24', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398960, 'T', '67', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:16:23', 0, 0, '14:40:44', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:40:44', '', '2026-08-05', '14:40:47', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398961, 'T', '68', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:16:36', 0, 0, '14:43:23', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:43:23', '', '2026-08-05', '14:48:50', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398962, 'C', '201', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:16:52', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:28:37', '', '2026-08-05', '14:28:50', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(398963, 'C', '202', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:16:57', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:29:08', '', '2026-08-05', '14:29:14', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(398964, 'C', '203', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:17:16', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:31:11', '', '2026-08-05', '14:31:37', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398965, 'TP', '36', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:19:24', 0, 0, '14:48:54', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:48:54', '', '2026-08-05', '14:49:08', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398966, 'F', '43', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:20:37', 0, 0, '14:24:21', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:24:21', '', '2026-08-05', '14:24:54', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398967, 'C', '204', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:21:28', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:33:32', '', '2026-08-05', '14:36:03', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398968, 'T', '69', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:23:11', 0, 0, '14:50:27', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:50:27', '', '2026-08-05', '14:51:34', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398969, 'F', '44', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:24:14', 0, 0, '14:24:55', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:24:55', '', '2026-08-05', '14:46:40', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398970, 'H', '15', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '14:26:05', 0, 0, '14:26:24', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '14:26:24', '', '2026-08-05', '15:10:40', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(398971, 'F', '45', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:26:50', 0, 0, '14:47:50', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:47:50', '', '2026-08-05', '14:48:00', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398972, 'F', '46', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:26:56', 0, 0, '14:48:01', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:48:01', '', '2026-08-05', '14:49:44', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398973, 'CP', '89', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:27:22', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:32:53', '', '2026-08-05', '14:33:19', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(398974, 'CP', '90', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:28:16', 0, 0, '14:33:51', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '14:33:51', '', '2026-08-05', '14:37:46', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(398975, 'CP', '91', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:28:26', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:37:05', '', '2026-08-05', '14:37:56', NULL, NULL, NULL, 0, 'PRIORITY', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398976, 'F', '47', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:28:34', 0, 0, '14:49:45', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:49:45', '', '2026-08-05', '14:49:57', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398977, 'F', '48', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:28:39', 0, 0, '14:49:57', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:49:57', '', '2026-08-05', '14:50:15', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398978, 'T', '70', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:28:46', 0, 0, '14:51:45', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '14:51:45', '', '2026-08-05', '15:15:48', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398979, 'T', '71', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:29:02', 0, 0, '15:06:30', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:06:30', '', '2026-08-05', '15:29:18', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398980, 'T', '72', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:29:15', 0, 0, '15:15:54', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:15:54', '', '2026-08-05', '15:44:53', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398981, 'TP', '37', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:29:26', 0, 0, '15:05:10', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:05:10', '', '2026-08-05', '15:05:11', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398982, 'T', '73', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:30:31', 0, 0, '15:29:26', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:29:26', '', '2026-08-05', '15:29:37', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398983, 'OE', '5', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '14:31:19', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(398984, 'C', '205', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:31:24', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:34:45', '', '2026-08-05', '14:35:23', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished] ;  ELVIE HAW TAY [finished]'),
(398985, 'F', '49', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:31:28', 0, 0, '14:50:15', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:50:15', '', '2026-08-05', '14:50:26', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398986, 'T', '74', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:31:34', 0, 0, '15:41:39', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:41:39', '', '2026-08-05', '15:41:40', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398987, 'P', '20', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '14:31:39', 0, 0, '14:44:11', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:44:11', '', '2026-08-05', '14:55:32', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(398988, 'C', '206', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:32:46', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:35:26', '', '2026-08-05', '14:35:46', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(398989, 'T', '75', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:34:04', 0, 0, '15:41:43', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:41:43', '', '2026-08-05', '15:41:48', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398990, 'F', '50', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:34:17', 0, 0, '14:50:29', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:50:29', '', '2026-08-05', '14:50:58', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398991, 'C', '207', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:34:26', 0, 0, '14:35:58', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:35:58', '', '2026-08-05', '14:36:30', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398992, 'C', '208', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:34:30', 0, 0, '14:36:35', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:36:35', '', '2026-08-05', '14:37:11', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398993, 'T', '76', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:35:34', 0, 0, '15:44:36', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:44:36', '', '2026-08-05', '15:44:54', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(398994, 'TP', '38', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:35:40', 0, 0, '15:29:21', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:29:21', '', '2026-08-05', '15:29:22', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(398995, 'FP', '23', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:36:19', 0, 0, '14:46:41', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:46:41', '', '2026-08-05', '14:46:47', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(398996, 'C', '209', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:37:15', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:37:56', '', '2026-08-05', '14:38:15', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(398997, 'F', '51', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:39:08', 0, 0, '14:52:27', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:52:27', '', '2026-08-05', '14:52:42', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(398998, 'C', '210', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:39:18', 0, 0, '14:39:21', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:39:21', '', '2026-08-05', '14:39:45', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(398999, 'C', '211', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:39:50', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:40:38', '', '2026-08-05', '14:40:55', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399000, 'FP', '24', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:44:25', 0, 0, '14:46:48', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:46:48', '', '2026-08-05', '14:47:47', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(399001, 'C', '212', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:44:41', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:47:34', '', '2026-08-05', '14:49:17', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399002, 'T', '77', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:44:51', 0, 0, '15:44:59', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:44:59', '', '2026-08-05', '15:57:22', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399003, 'F', '52', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:45:52', 0, 0, '14:52:42', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:52:42', '', '2026-08-05', '14:53:01', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399004, 'F', '53', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:50:13', 0, 0, '14:53:02', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:53:02', '', '2026-08-05', '14:56:49', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399005, 'FP', '25', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:50:36', 0, 0, '14:51:20', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:51:20', '', '2026-08-05', '14:52:26', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(399006, 'T', '78', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:51:17', 0, 0, '15:45:47', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:45:47', '', '2026-08-05', '15:45:51', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399007, 'C', '213', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:51:49', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:53:08', '', '2026-08-05', '14:54:09', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399008, 'C', '214', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:52:03', 0, 0, '14:54:52', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:54:52', '', '2026-08-05', '14:55:18', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399009, 'H', '16', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '14:52:34', 0, 0, '15:16:07', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '15:16:07', '', '2026-08-05', '15:16:18', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(399010, 'P', '21', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '14:52:41', 0, 0, '14:55:32', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:55:32', '', '2026-08-05', '15:14:29', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(399011, 'F', '54', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:53:23', 0, 0, '14:56:50', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:56:50', '', '2026-08-05', '14:57:03', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399012, 'CP', '92', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:54:05', 0, 0, '14:56:23', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '14:56:23', '', '2026-08-05', '14:58:15', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(399013, 'F', '55', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '14:55:24', 0, 0, '14:57:03', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '14:57:03', '', '2026-08-05', '15:07:15', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399014, 'CP', '93', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:55:50', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '14:58:45', '', '2026-08-05', '15:02:00', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399015, 'C', '215', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:55:59', 0, 0, '15:00:52', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:00:52', '', '2026-08-05', '15:01:34', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399016, 'T', '79', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '14:56:41', 0, 0, '15:46:02', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:46:02', '', '2026-08-05', '15:51:33', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399017, 'OE', '6', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '14:57:54', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399018, 'CP', '94', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '14:58:22', 0, 0, '15:00:45', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:00:45', '', '2026-08-05', '15:01:44', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399019, 'C', '216', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:01:00', 0, 0, '15:01:46', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:01:46', '', '2026-08-05', '15:15:23', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399020, 'HP', '12', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '15:01:08', 0, 0, '15:10:40', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '15:10:40', '', '2026-08-05', '15:16:06', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(399021, 'H', '17', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '15:02:27', 0, 0, '15:16:18', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '15:16:18', '', '2026-08-05', '15:16:25', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(399022, 'C', '217', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:02:44', 0, 0, '15:05:23', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:05:23', '', '2026-08-05', '15:05:35', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399023, 'C', '218', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:02:51', 0, 0, NULL, '8', NULL, ' LETECIA ESTRELLA', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:06:45', '', '2026-08-05', '15:07:09', NULL, NULL, NULL, 0, 'REGULAR', ' LETECIA ESTRELLA [calling]; LETECIA ESTRELLA [finished]'),
(399024, 'P', '22', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '15:04:38', 0, 0, '15:14:30', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:14:30', '', '2026-08-05', '15:14:31', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(399025, 'C', '219', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:05:43', 0, 0, '15:09:18', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:09:18', '', '2026-08-05', '15:09:31', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399026, 'C', '220', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:05:52', 0, 0, '15:16:40', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:16:40', '', '2026-08-05', '15:18:48', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399027, 'T', '80', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:06:01', 0, 0, '15:51:54', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:51:54', '', '2026-08-05', '15:51:57', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399028, 'F', '56', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:06:07', 0, 0, '15:10:39', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:10:39', '', '2026-08-05', '15:10:47', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399029, 'C', '221', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:06:53', 0, 0, '15:18:20', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:18:20', '', '2026-08-05', '15:18:38', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399030, 'FP', '26', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:07:33', 0, 0, '15:10:14', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:10:14', '', '2026-08-05', '15:10:39', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(399031, 'F', '57', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:07:40', 0, 0, '15:10:48', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:10:48', '', '2026-08-05', '15:11:20', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399032, 'CP', '95', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:08:07', 0, 0, '15:11:38', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:11:38', '', '2026-08-05', '15:11:45', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(399033, 'CP', '96', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:08:21', 0, 0, '15:15:27', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:15:27', '', '2026-08-05', '15:15:51', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399034, 'TP', '39', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'called', 0, '2026-08-05', '15:09:19', 0, 0, '15:51:36', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:51:36', '', '2026-08-05', '15:51:42', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399035, 'F', '58', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:10:16', 0, 0, '15:11:20', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:11:20', '', '2026-08-05', '15:20:35', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399036, 'T', '81', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:10:38', 0, 0, '15:52:10', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:52:10', '', '2026-08-05', '15:53:31', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399037, 'TP', '40', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:12:41', 0, 0, '15:53:34', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:53:34', '', '2026-08-05', '15:53:36', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399038, 'P', '23', 'PHILHEALTH CLAIMSCounter 4', '', 'finished', 0, '2026-08-05', '15:13:01', 0, 0, '15:14:31', '4', NULL, ' ERWIN HINAUTAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:14:31', '', '2026-08-05', '15:14:33', NULL, NULL, NULL, 0, 'REGULAR', ' ERWIN HINAUTAN'),
(399039, 'C', '222', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:13:23', 0, 0, '15:18:55', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:18:55', '', '2026-08-05', '15:21:23', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399040, 'T', '82', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:13:30', 0, 0, '15:53:40', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:53:40', '', '2026-08-05', '15:53:55', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399041, 'C', '223', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:14:27', 0, 0, '15:20:35', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:20:35', '', '2026-08-05', '15:23:52', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399042, 'H', '18', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '15:15:28', 0, 0, '15:16:26', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '15:16:26', '', '2026-08-05', '15:33:01', NULL, NULL, NULL, 0, 'REGULAR', 'GREGGY BARRES'),
(399043, 'CP', '97', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:18:33', 0, 0, '15:21:24', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:21:24', '', '2026-08-05', '15:23:15', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399044, 'C', '224', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:19:23', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:21:50', '', '2026-08-05', '15:22:39', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399045, 'C', '225', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:19:36', 0, 0, '15:23:18', '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', '2026-08-05', '15:32:43', '', '2026-08-05', '15:33:34', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O ;  ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399046, 'FP', '27', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:20:32', 0, 0, '15:20:36', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:20:36', '', '2026-08-05', '15:29:35', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(399047, 'C', '226', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:21:36', 0, 0, '15:23:54', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:23:54', '', '2026-08-05', '15:25:49', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399048, 'CP', '98', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:21:45', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:22:40', '', '2026-08-05', '15:23:23', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399049, 'HP', '13', 'HMO/EMPLOYEECounter 6', '', 'finished', 0, '2026-08-05', '15:21:54', 0, 0, '15:33:02', '6', NULL, 'GREGGY BARRES', NULL, NULL, NULL, '', '', '2026-08-05', '15:33:02', '', '2026-08-05', '15:41:48', NULL, NULL, NULL, 0, 'PRIORITY', 'GREGGY BARRES'),
(399050, 'C', '227', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:24:24', 0, 0, '15:24:44', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:24:44', '', '2026-08-05', '15:25:18', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399051, 'F', '59', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:24:39', 0, 0, '15:29:46', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:29:46', '', '2026-08-05', '15:30:47', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399052, 'CP', '99', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:25:29', 0, 0, '15:25:51', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:25:51', '', '2026-08-05', '15:26:22', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(399053, 'C', '228', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:25:54', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:26:58', '', '2026-08-05', '15:30:02', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399054, 'F', '60', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:27:14', 0, 0, '15:30:47', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:30:47', '', '2026-08-05', '15:44:23', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399055, 'C', '229', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:27:20', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:30:05', '', '2026-08-05', '15:40:48', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399056, 'FP', '28', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:28:19', 0, 0, '15:29:36', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:29:36', '', '2026-08-05', '15:29:45', NULL, NULL, NULL, 0, 'PRIORITY', ' JOHN ASER AMON'),
(399057, 'TP', '41', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:29:01', 0, 0, '15:56:01', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:56:01', '', '2026-08-05', '15:56:03', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399058, 'CP', '100', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:29:11', 0, 0, '15:30:14', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:30:14', '', '2026-08-05', '15:35:38', NULL, NULL, NULL, 0, 'PRIORITY', 'WILMA DUMAGAN'),
(399059, 'C', '230', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:31:47', 0, 0, '15:32:50', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:32:50', '', '2026-08-05', '15:34:09', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399060, 'H', '19', 'HMO/EMPLOYEECounter 6', '', 'pending', 0, '2026-08-05', '15:35:25', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399061, 'C', '231', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:36:20', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:39:59', '', '2026-08-05', '15:40:33', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399062, 'C', '232', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:36:29', 0, 0, '15:40:00', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:40:00', '', '2026-08-05', '15:40:18', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399063, 'T', '83', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:36:55', 0, 0, '15:56:12', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:56:12', '', '2026-08-05', '15:56:40', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399064, 'C', '233', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:37:25', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:40:49', '', '2026-08-05', '15:48:00', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399065, 'CP', '101', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:37:43', 0, 0, '15:47:27', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:47:27', '', '2026-08-05', '15:50:00', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399066, 'TP', '42', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:37:50', 0, 0, '15:56:45', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:56:45', '', '2026-08-05', '15:56:52', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399067, 'CP', '102', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:39:03', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:49:20', '', '2026-08-05', '15:49:45', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399068, 'C', '234', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:39:11', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:40:49', '', '2026-08-05', '15:43:49', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399069, 'C', '235', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:39:25', 0, 0, '15:43:00', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:43:00', '', '2026-08-05', '15:43:20', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399070, 'C', '236', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:39:56', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:43:53', '', '2026-08-05', '15:44:24', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399071, 'T', '84', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:40:44', 0, 0, '15:56:56', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:56:56', '', '2026-08-05', '15:57:04', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399072, 'C', '237', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:41:33', 0, 0, '15:45:46', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:45:46', '', '2026-08-05', '15:46:34', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399073, 'C', '238', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:42:58', 0, 0, '15:46:36', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:46:36', '', '2026-08-05', '15:46:53', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399074, 'F', '61', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:43:19', 0, 0, '15:44:24', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:44:24', '', '2026-08-05', '15:44:30', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399075, 'C', '239', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:43:33', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:48:01', '', '2026-08-05', '15:48:58', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399076, 'C', '240', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:44:04', 0, 0, '15:47:44', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:47:44', '', '2026-08-05', '15:48:56', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399077, 'F', '62', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:44:19', 0, 0, '15:44:35', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:44:35', '', '2026-08-05', '15:47:31', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399078, 'F', '63', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:44:25', 0, 0, '15:47:31', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:47:31', '', '2026-08-05', '15:50:38', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399079, 'F', '64', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:44:50', 0, 0, '15:50:39', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:50:39', '', '2026-08-05', '15:50:44', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399080, 'C', '241', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:45:03', 0, 0, NULL, '7', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:49:00', '', '2026-08-05', '15:50:30', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO [calling];LIZA HONRADO [finished]'),
(399081, 'C', '242', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:45:11', 0, 0, '15:48:59', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:48:59', '', '2026-08-05', '15:49:45', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399082, 'C', '243', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:47:49', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:49:54', '', '2026-08-05', '15:50:26', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399083, 'C', '244', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:48:43', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:50:27', '', '2026-08-05', '15:50:53', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399084, 'CP', '103', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:49:13', 0, 0, '15:50:02', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '15:50:02', '', '2026-08-05', '15:54:32', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399085, 'T', '85', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:49:19', 0, 0, '15:57:07', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:57:07', '', '2026-08-05', '15:57:48', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399086, 'H', '20', 'HMO/EMPLOYEECounter 6', '', 'pending', 0, '2026-08-05', '15:49:35', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399087, 'T', '86', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:49:50', 0, 0, '15:57:26', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:57:26', '', '2026-08-05', '16:01:24', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399088, 'F', '65', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:50:39', 0, 0, '15:53:07', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:53:07', '', '2026-08-05', '15:53:08', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399089, 'F', '66', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:52:16', 0, 0, '15:53:08', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '15:53:08', '', '2026-08-05', '16:02:35', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399090, 'TP', '43', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:52:25', 0, 0, '15:57:57', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '15:57:57', '', '2026-08-05', '16:02:42', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399091, 'C', '245', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:54:33', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '15:55:02', '', '2026-08-05', '16:05:29', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399092, 'T', '87', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:55:02', 0, 0, '16:01:26', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:01:26', '', '2026-08-05', '16:14:06', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399093, 'H', '21', 'HMO/EMPLOYEECounter 6', '', 'pending', 0, '2026-08-05', '15:55:44', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399094, 'T', '88', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '15:55:53', 0, 0, '16:02:44', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:02:44', '', '2026-08-05', '16:04:30', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399095, 'C', '246', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:57:58', 0, 0, '15:59:34', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '15:59:34', '', '2026-08-05', '16:01:53', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399096, 'CP', '104', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '15:58:22', 0, 0, '16:00:51', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '16:00:51', '', '2026-08-05', '16:02:16', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399097, 'F', '67', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:58:46', 0, 0, '16:02:35', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '16:02:35', '', '2026-08-05', '16:03:29', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399098, 'F', '68', 'FINAL BILLINGCounter 5', '', 'finished', 0, '2026-08-05', '15:59:58', 0, 0, '16:03:30', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '16:03:30', '', '2026-08-05', '16:04:49', NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399099, 'F', '69', 'FINAL BILLINGCounter 5', '', 'called', 0, '2026-08-05', '16:00:02', 0, 0, '16:04:49', '5', NULL, ' JOHN ASER AMON', NULL, NULL, NULL, '', '', '2026-08-05', '16:04:49', '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ' JOHN ASER AMON'),
(399100, 'T', '89', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:00:18', 0, 0, '16:04:31', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:04:31', '', '2026-08-05', '16:18:39', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399101, 'H', '22', 'HMO/EMPLOYEECounter 6', '', 'pending', 0, '2026-08-05', '16:02:02', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399102, 'P', '24', 'PHILHEALTH CLAIMSCounter 4', '', 'pending', 0, '2026-08-05', '16:05:12', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399103, 'OE', '7', 'OUTPATIENT EMERGENCY CARE (OECB)Counter 3', '', 'pending', 0, '2026-08-05', '16:05:21', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399104, 'C', '247', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:07:58', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '16:08:34', '', '2026-08-05', '16:09:03', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399105, 'C', '248', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:08:03', 0, 0, '16:08:26', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:08:26', '', '2026-08-05', '16:08:57', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399106, 'FP', '29', 'FINAL BILLINGCounter 5', '', 'pending', 0, '2026-08-05', '16:08:19', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'PRIORITY', ''),
(399107, 'CP', '105', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:08:24', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '16:09:04', '', '2026-08-05', '16:13:34', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399108, 'T', '90', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:08:31', 0, 0, '16:14:08', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:14:08', '', '2026-08-05', '16:15:15', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399109, 'T', '91', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:08:45', 0, 0, '16:15:17', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:15:17', '', '2026-08-05', '16:34:27', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399110, 'C', '249', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:10:05', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '16:13:37', '', '2026-08-05', '16:19:31', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399111, 'F', '70', 'FINAL BILLINGCounter 5', '', 'pending', 0, '2026-08-05', '16:14:22', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399112, 'T', '92', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:17:51', 0, 0, '16:18:41', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:18:41', '', '2026-08-05', '16:20:50', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399113, 'T', '93', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:18:15', 0, 0, '16:20:51', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:20:51', '', '2026-08-05', '16:24:52', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399114, 'CP', '106', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:18:23', 0, 0, '16:42:51', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '16:42:51', '', '2026-08-05', '16:48:00', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399115, 'C', '250', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:18:28', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '16:19:32', '', '2026-08-05', '16:23:33', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399116, 'C', '251', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:18:59', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '16:23:45', '', '2026-08-05', '16:24:37', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399117, 'C', '252', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:19:31', 0, 0, '16:28:48', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:28:48', '', '2026-08-05', '16:30:23', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399118, 'C', '253', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:20:51', 0, 0, '16:32:55', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:32:55', '', '2026-08-05', '16:34:22', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399119, 'T', '94', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:21:05', 0, 0, '16:25:23', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:25:23', '', '2026-08-05', '16:25:26', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399120, 'F', '71', 'FINAL BILLINGCounter 5', '', 'pending', 0, '2026-08-05', '16:21:37', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399121, 'TP', '44', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:21:45', 0, 0, '16:24:54', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:24:54', '', '2026-08-05', '16:24:56', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399122, 'C', '254', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:21:52', 0, 0, '16:34:24', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:34:24', '', '2026-08-05', '16:34:42', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399123, 'C', '255', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:22:01', 0, 0, '16:43:09', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:43:09', '', '2026-08-05', '16:43:35', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399124, 'F', '72', 'FINAL BILLINGCounter 5', '', 'pending', 0, '2026-08-05', '16:22:26', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ''),
(399125, 'C', '256', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:22:48', 0, 0, '16:46:03', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:46:03', '', '2026-08-05', '16:46:56', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399126, 'CP', '107', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:23:11', 0, 0, '16:49:05', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '16:49:05', '', '2026-08-05', '17:11:24', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399127, 'C', '257', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:23:19', 0, 0, '16:46:58', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:46:58', '', '2026-08-05', '16:49:11', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399128, 'T', '95', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:23:52', 0, 0, '16:25:28', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:25:28', '', '2026-08-05', '17:00:14', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399129, 'C', '258', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:23:57', 0, 0, '16:49:42', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '16:49:42', '', '2026-08-05', '16:50:29', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN');
INSERT INTO `transaction` (`id`, `service`, `ticket`, `ticket_service`, `for_service`, `status`, `status_updater`, `date`, `time`, `recall`, `recall_check`, `recall_time`, `counter`, `cntr_forwarded`, `counter_user`, `forward_hist`, `forwarded_from`, `forwarded_to`, `forward_stat`, `cntr_grp`, `start_date`, `start_time`, `duration`, `end_date`, `end_time`, `void_reasons`, `cntr_message`, `pnumber`, `texted`, `sub_notes`, `counter_history`) VALUES
(399130, 'C', '259', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:24:58', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:11:04', '', '2026-08-05', '17:14:07', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399131, 'T', '96', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'called', 0, '2026-08-05', '16:26:34', 0, 0, '16:34:35', '1', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '16:34:35', '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399132, 'C', '260', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:27:46', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:19:25', '', '2026-08-05', '17:20:01', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399133, 'CP', '108', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:30:59', 0, 0, '17:11:26', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:11:26', '', '2026-08-05', '17:12:27', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399134, 'CP', '109', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:33:07', 0, 0, '17:12:31', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:12:31', '', '2026-08-05', '17:12:49', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399135, 'C', '261', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:35:53', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:20:02', '', '2026-08-05', '17:20:35', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399136, 'C', '262', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:37:42', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:20:36', '', '2026-08-05', '17:20:57', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399137, 'C', '263', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:38:39', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:25:20', '', '2026-08-05', '17:26:01', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399138, 'CP', '110', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:39:59', 0, 0, '17:12:54', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:12:54', '', '2026-08-05', '17:13:07', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399139, 'CP', '111', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:44:30', 0, 0, '17:17:12', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:17:12', '', '2026-08-05', '17:24:00', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399140, 'C', '264', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:45:39', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:26:04', '', '2026-08-05', '17:26:18', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399141, 'CP', '112', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:48:32', 0, 0, '17:24:01', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:24:01', '', '2026-08-05', '17:25:16', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399142, 'C', '265', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:48:54', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:49:09', '', '2026-08-05', '17:56:34', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399143, 'CP', '113', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:49:15', 0, 0, '17:25:18', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:25:18', '', '2026-08-05', '17:28:15', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399144, 'C', '266', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:52:05', 0, 0, '17:49:54', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:49:54', '', '2026-08-05', '17:50:22', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399145, 'CP', '114', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:55:48', 0, 0, '17:28:17', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:28:17', '', '2026-08-05', '17:28:24', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399146, 'T', '97', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '16:56:33', 0, 0, '17:00:15', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:00:15', '', '2026-08-05', '17:27:32', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399147, 'CP', '115', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '16:59:56', 0, 0, '17:34:44', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:34:44', '', '2026-08-05', '17:34:47', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399148, 'C', '267', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:00:17', 0, 0, '17:50:30', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:50:30', '', '2026-08-05', '17:52:14', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399149, 'C', '268', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:01:36', 0, 0, '17:52:15', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:52:15', '', '2026-08-05', '17:56:03', NULL, NULL, NULL, 0, 'REGULAR', 'SHARON PARRE?O'),
(399150, 'C', '269', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:08:14', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:56:36', '', '2026-08-05', '17:57:09', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399151, 'CP', '116', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:08:26', 0, 0, '17:35:09', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:35:09', '', '2026-08-05', '17:35:29', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399152, 'C', '270', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:14:23', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '17:57:10', '', '2026-08-05', '18:03:43', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399153, 'CP', '117', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:19:21', 0, 0, '17:35:30', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:35:30', '', '2026-08-05', '17:36:35', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399154, 'T', '98', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:19:35', 0, 0, '17:27:36', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:27:36', '', '2026-08-05', '17:28:00', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399155, 'C', '271', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:22:53', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:05:06', '', '2026-08-05', '18:05:39', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399156, 'TP', '45', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:24:34', 0, 0, '17:27:34', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:27:34', '', '2026-08-05', '17:27:35', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399157, 'T', '99', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:27:36', 0, 0, '17:28:01', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:28:01', '', '2026-08-05', '17:42:13', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399158, 'FP', '30', 'FINAL BILLINGCounter 5', '', 'pending', 0, '2026-08-05', '17:29:45', 0, 0, NULL, '', NULL, NULL, NULL, NULL, NULL, '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, 0, 'PRIORITY', ''),
(399159, 'CP', '118', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:29:54', 0, 0, '17:37:19', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:37:19', '', '2026-08-05', '17:37:57', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399160, 'C', '272', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:31:47', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:05:43', '', '2026-08-05', '18:06:10', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399161, 'C', '273', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:33:08', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:06:11', '', '2026-08-05', '18:07:09', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399162, 'CP', '119', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:33:53', 0, 0, '17:37:59', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:37:59', '', '2026-08-05', '17:38:11', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399163, 'C', '274', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:33:59', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:07:10', '', '2026-08-05', '18:07:25', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399164, 'T', '100', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:34:04', 0, 0, '17:58:46', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:58:46', '', '2026-08-05', '17:58:47', NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399165, 'TP', '46', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:37:31', 0, 0, '17:42:16', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:42:16', '', '2026-08-05', '17:58:44', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399166, 'C', '275', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:40:48', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:07:27', '', '2026-08-05', '18:08:19', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399167, 'CP', '120', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:41:30', 0, 0, '17:44:04', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:44:04', '', '2026-08-05', '17:45:47', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399168, 'C', '276', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:42:03', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:08:20', '', '2026-08-05', '18:08:42', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399169, 'C', '277', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:44:05', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:08:42', '', '2026-08-05', '18:08:46', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399170, 'C', '278', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:44:15', 0, 0, '18:10:10', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:10:10', '', '2026-08-05', '18:10:28', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399171, 'TP', '47', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'finished', 0, '2026-08-05', '17:45:29', 0, 0, '17:58:49', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:58:49', '', '2026-08-05', '17:58:50', NULL, NULL, NULL, 0, 'PRIORITY', ' MISSY DURANGO'),
(399172, 'C', '279', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:45:42', 0, 0, '18:13:06', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:13:06', '', '2026-08-05', '18:14:31', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399173, 'C', '280', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:46:16', 0, 0, '18:14:33', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:14:33', '', '2026-08-05', '18:14:42', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399174, 'C', '281', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:48:14', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:22:38', '', '2026-08-05', '18:22:52', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399175, 'CP', '121', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:54:37', 0, 0, '17:57:43', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:57:43', '', '2026-08-05', '17:58:01', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399176, 'C', '282', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:55:33', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:29:01', '', '2026-08-05', '18:30:10', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399177, 'T', '101', 'TENTATIVE BILLING/INQUIRYCounter 1 & 2', '', 'called', 0, '2026-08-05', '17:56:40', 0, 0, '17:58:52', '2', NULL, ' MISSY DURANGO', NULL, NULL, NULL, '', '', '2026-08-05', '17:58:52', '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', ' MISSY DURANGO'),
(399178, 'CP', '122', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '17:57:17', 0, 0, '17:58:03', '9', NULL, 'SHARON PARRE?O', NULL, NULL, NULL, '', '', '2026-08-05', '17:58:03', '', '2026-08-05', '17:59:22', NULL, NULL, NULL, 0, 'PRIORITY', 'SHARON PARRE?O'),
(399179, 'C', '283', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:00:59', 0, 0, '18:28:53', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:28:53', '', '2026-08-05', '18:29:19', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399180, 'C', '284', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:02:34', 0, 0, '18:29:24', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:29:24', '', '2026-08-05', '18:29:29', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399181, 'C', '285', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:07:32', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:30:48', '', '2026-08-05', '18:32:31', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399182, 'CP', '123', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:11:04', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:26:53', '', '2026-08-05', '18:28:53', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399183, 'C', '286', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:20:06', 0, 0, '18:30:46', '10', NULL, 'WILMA DUMAGAN', NULL, NULL, NULL, '', '', '2026-08-05', '18:30:46', '', '2026-08-05', '18:31:22', NULL, NULL, NULL, 0, 'REGULAR', 'WILMA DUMAGAN'),
(399184, 'CP', '124', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:20:21', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:30:11', '', '2026-08-05', '18:30:47', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399185, 'C', '287', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:22:16', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:36:32', '', '2026-08-05', '18:36:42', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399186, 'C', '288', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:24:13', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:38:50', '', '2026-08-05', '18:39:06', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399187, 'C', '289', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:25:28', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:39:15', '', '2026-08-05', '18:39:40', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399188, 'C', '290', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:28:13', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:40:48', '', '2026-08-05', '18:41:58', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished] ;  ELVIE HAW TAY [finished]'),
(399189, 'C', '291', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:32:45', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:41:59', '', '2026-08-05', '18:42:13', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399190, 'C', '292', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:35:55', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:42:13', '', '2026-08-05', '18:42:22', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399191, 'CP', '125', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:42:57', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:43:32', '', NULL, '18:46:40', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling] ;  ELVIE HAW TAY [finished]'),
(399192, 'C', '293', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:43:43', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:46:41', '', '2026-08-05', '18:48:55', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399193, 'C', '294', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:44:01', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:48:56', '', '2026-08-05', '18:52:17', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399194, 'C', '295', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:46:46', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:52:18', '', '2026-08-05', '18:52:24', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399195, 'C', '296', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:47:07', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:53:16', '', '2026-08-05', '18:53:21', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399196, 'C', '297', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:47:43', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:55:06', '', '2026-08-05', '18:58:02', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399197, 'C', '298', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '18:51:24', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '18:58:03', '', '2026-08-05', '18:58:30', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399198, 'CP', '126', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:06:54', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:20:58', '', '2026-08-05', '19:21:45', NULL, NULL, NULL, 0, 'PRIORITY', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399199, 'C', '299', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:08:31', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:25:49', '', '2026-08-05', '19:26:22', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399200, 'C', '300', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:17:58', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:27:58', '', '2026-08-05', '19:28:21', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399201, 'C', '301', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:19:41', 0, 0, '19:27:52', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:27:52', '', '2026-08-05', '19:29:55', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO'),
(399202, 'C', '302', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:20:06', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:30:33', '', '2026-08-05', '19:30:53', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399203, 'CP', '127', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:24:57', 0, 0, '19:26:01', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:26:01', '', '2026-08-05', '19:27:49', NULL, NULL, NULL, 0, 'PRIORITY', 'LIZA HONRADO'),
(399204, 'C', '303', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:25:28', 0, 0, '19:34:12', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:34:12', '', '2026-08-05', '19:36:13', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO'),
(399205, 'C', '304', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:26:16', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:34:55', '', '2026-08-05', '19:35:04', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]; ELVIE HAW TAY [finished]'),
(399206, 'CP', '128', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:27:44', 0, 0, '19:29:57', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:29:57', '', '2026-08-05', '19:34:10', NULL, NULL, NULL, 0, 'PRIORITY', 'LIZA HONRADO'),
(399207, 'C', '305', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:31:10', 0, 0, '19:36:14', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:36:14', '', '2026-08-05', '19:38:37', NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO'),
(399208, 'C', '306', 'CASHIERCounter 7,8, 9, 10', '', 'called', 0, '2026-08-05', '19:32:46', 0, 0, '19:38:39', '9', NULL, 'LIZA HONRADO', NULL, NULL, NULL, '', '', '2026-08-05', '19:38:39', '', NULL, NULL, NULL, NULL, NULL, 0, 'REGULAR', 'LIZA HONRADO'),
(399209, 'C', '307', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:32:59', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:41:18', '', '2026-08-05', '19:41:26', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]'),
(399210, 'C', '308', 'CASHIERCounter 7,8, 9, 10', '', 'finished', 0, '2026-08-05', '19:41:08', 0, 0, NULL, '8', NULL, ' ELVIE HAW TAY', NULL, NULL, NULL, '', 'PAYMENT', NULL, '19:41:58', '', '2026-08-05', '19:42:11', NULL, NULL, NULL, 0, 'REGULAR', ' ELVIE HAW TAY [calling]; ELVIE HAW TAY [finished]');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `client_data`
--
ALTER TABLE `client_data`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `cntr_group`
--
ALTER TABLE `cntr_group`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `counter_accounts`
--
ALTER TABLE `counter_accounts`
  ADD PRIMARY KEY (`counter_id`);

--
-- Indexes for table `counter_number`
--
ALTER TABLE `counter_number`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ctr_select_limit`
--
ALTER TABLE `ctr_select_limit`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `offices`
--
ALTER TABLE `offices`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `transaction`
--
ALTER TABLE `transaction`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `client_data`
--
ALTER TABLE `client_data`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `cntr_group`
--
ALTER TABLE `cntr_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `counter_accounts`
--
ALTER TABLE `counter_accounts`
  MODIFY `counter_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `counter_number`
--
ALTER TABLE `counter_number`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `ctr_select_limit`
--
ALTER TABLE `ctr_select_limit`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `offices`
--
ALTER TABLE `offices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1684;

--
-- AUTO_INCREMENT for table `transaction`
--
ALTER TABLE `transaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=399211;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
