-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 16, 2026 at 12:33 PM
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
-- Database: `quicksolve`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(11) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `company_name_arabic` varchar(255) DEFAULT NULL,
  `trade_license_number` varchar(100) DEFAULT NULL,
  `trade_license_expiry` datetime DEFAULT NULL,
  `trn` varchar(50) DEFAULT NULL,
  `company_type` enum('INDIVIDUAL','COMPANY','FREE_ZONE','OFFSHORE','GOVERNMENT') DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `number_of_employees` int(11) DEFAULT NULL,
  `establishment_date` datetime DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `po_box` varchar(20) DEFAULT NULL,
  `emirate` varchar(50) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `immigration_file_number` varchar(100) DEFAULT NULL,
  `labour_file_number` varchar(100) DEFAULT NULL,
  `establishment_card_number` varchar(100) DEFAULT NULL,
  `establishment_card_expiry` datetime DEFAULT NULL,
  `account_tier` enum('ONE_TIME','STARTER','GROWTH','ENTERPRISE','VIP') DEFAULT NULL,
  `account_manager_id` int(11) DEFAULT NULL,
  `credit_limit` float DEFAULT NULL,
  `outstanding_balance` float DEFAULT NULL,
  `payment_terms_days` int(11) DEFAULT NULL,
  `sla_level` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `account_packages`
--

CREATE TABLE `account_packages` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `status` enum('PENDING','ACTIVE','PAUSED','EXPIRED','CANCELLED') DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `billing_cycle` varchar(20) DEFAULT NULL,
  `next_billing_date` datetime DEFAULT NULL,
  `agreed_price` float DEFAULT NULL,
  `included_transactions` int(11) DEFAULT NULL,
  `transactions_used` int(11) DEFAULT NULL,
  `transactions_remaining` int(11) DEFAULT NULL,
  `overage_amount` float DEFAULT NULL,
  `auto_renew` tinyint(1) DEFAULT NULL,
  `renewal_reminder_sent` tinyint(1) DEFAULT NULL,
  `notes` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_email` varchar(255) DEFAULT NULL,
  `user_name` varchar(255) DEFAULT NULL,
  `activity_type` enum('LOGIN','LOGOUT','PASSWORD_CHANGE','PASSWORD_RESET','CREATE','READ','UPDATE','DELETE','STATUS_CHANGE','ASSIGNMENT','DOCUMENT_UPLOAD','DOCUMENT_DOWNLOAD','EMAIL_SENT','SMS_SENT','WHATSAPP_SENT','CALL_MADE','PAYMENT_RECEIVED','INVOICE_CREATED','INVOICE_SENT','LEAD_CONVERTED','LEAD_ASSIGNED','NOTE_ADDED','EXPORT','IMPORT','SYSTEM','OTHER') NOT NULL,
  `action` varchar(100) NOT NULL,
  `entity_type` varchar(50) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `entity_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `changes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`changes`)),
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `request_url` varchar(500) DEFAULT NULL,
  `request_method` varchar(10) DEFAULT NULL,
  `extra_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extra_data`)),
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `user_email`, `user_name`, `activity_type`, `action`, `entity_type`, `entity_id`, `entity_name`, `description`, `old_values`, `new_values`, `changes`, `ip_address`, `user_agent`, `request_url`, `request_method`, `extra_data`, `created_at`) VALUES
(1, 3, 'admin@quicksolve.ae', NULL, 'CREATE', 'created', 'lead', 1, 'LD-202603-BA664', NULL, 'null', 'null', 'null', NULL, NULL, NULL, NULL, NULL, '2026-03-06 23:33:15'),
(2, 3, 'admin@quicksolve.ae', NULL, 'CREATE', 'created', 'lead', 2, 'LD-202603-D5B1A', NULL, 'null', 'null', 'null', NULL, NULL, NULL, NULL, NULL, '2026-03-08 22:53:18');

-- --------------------------------------------------------

--
-- Table structure for table `alembic_version`
--

CREATE TABLE `alembic_version` (
  `version_num` varchar(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `alembic_version`
--

INSERT INTO `alembic_version` (`version_num`) VALUES
('b8a14d05dbdd');

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` int(11) NOT NULL,
  `application_number` varchar(50) NOT NULL,
  `account_id` int(11) NOT NULL,
  `contact_id` int(11) DEFAULT NULL,
  `service_id` int(11) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `account_package_id` int(11) DEFAULT NULL,
  `applicant_name` varchar(255) DEFAULT NULL,
  `applicant_name_arabic` varchar(255) DEFAULT NULL,
  `applicant_passport` varchar(50) DEFAULT NULL,
  `applicant_passport_expiry` datetime DEFAULT NULL,
  `applicant_nationality` varchar(100) DEFAULT NULL,
  `applicant_emirates_id` varchar(20) DEFAULT NULL,
  `applicant_phone` varchar(20) DEFAULT NULL,
  `applicant_email` varchar(255) DEFAULT NULL,
  `status` enum('NEW','QUALIFIED','DOCS_REQUESTED','DOCS_RECEIVED','DOCS_INCOMPLETE','QUOTE_SENT','PAYMENT_PENDING','PAYMENT_RECEIVED','TYPING','SUBMITTED','UNDER_REVIEW','ADDITIONAL_INFO_REQUIRED','APPROVED','REJECTED','DELIVERED','CLOSED_WON','CLOSED_LOST','CANCELLED','ON_HOLD') DEFAULT NULL,
  `previous_status` enum('NEW','QUALIFIED','DOCS_REQUESTED','DOCS_RECEIVED','DOCS_INCOMPLETE','QUOTE_SENT','PAYMENT_PENDING','PAYMENT_RECEIVED','TYPING','SUBMITTED','UNDER_REVIEW','ADDITIONAL_INFO_REQUIRED','APPROVED','REJECTED','DELIVERED','CLOSED_WON','CLOSED_LOST','CANCELLED','ON_HOLD') DEFAULT NULL,
  `urgency` enum('NORMAL','URGENT','FAST_TRACK','SAME_DAY') DEFAULT NULL,
  `service_fee` float DEFAULT NULL,
  `govt_fee` float DEFAULT NULL,
  `typing_fee` float DEFAULT NULL,
  `courier_fee` float DEFAULT NULL,
  `additional_charges` float DEFAULT NULL,
  `discount` float DEFAULT NULL,
  `vat_amount` float DEFAULT NULL,
  `total_amount` float DEFAULT NULL,
  `amount_paid` float DEFAULT NULL,
  `amount_due` float DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT NULL,
  `govt_reference_number` varchar(100) DEFAULT NULL,
  `transaction_number` varchar(100) DEFAULT NULL,
  `received_date` datetime DEFAULT current_timestamp(),
  `target_completion_date` datetime DEFAULT NULL,
  `submission_date` datetime DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `delivery_date` datetime DEFAULT NULL,
  `docs_checklist` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`docs_checklist`)),
  `docs_completion_percentage` int(11) DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `client_notes` text DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `source` varchar(50) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `is_retainer_transaction` tinyint(1) DEFAULT NULL,
  `requires_followup` tinyint(1) DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `application_status_history`
--

CREATE TABLE `application_status_history` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `from_status` enum('NEW','QUALIFIED','DOCS_REQUESTED','DOCS_RECEIVED','DOCS_INCOMPLETE','QUOTE_SENT','PAYMENT_PENDING','PAYMENT_RECEIVED','TYPING','SUBMITTED','UNDER_REVIEW','ADDITIONAL_INFO_REQUIRED','APPROVED','REJECTED','DELIVERED','CLOSED_WON','CLOSED_LOST','CANCELLED','ON_HOLD') DEFAULT NULL,
  `to_status` enum('NEW','QUALIFIED','DOCS_REQUESTED','DOCS_RECEIVED','DOCS_INCOMPLETE','QUOTE_SENT','PAYMENT_PENDING','PAYMENT_RECEIVED','TYPING','SUBMITTED','UNDER_REVIEW','ADDITIONAL_INFO_REQUIRED','APPROVED','REJECTED','DELIVERED','CLOSED_WON','CLOSED_LOST','CANCELLED','ON_HOLD') NOT NULL,
  `changed_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blog_posts`
--

CREATE TABLE `blog_posts` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `content_html` text DEFAULT NULL,
  `featured_image_url` varchar(500) DEFAULT NULL,
  `featured_image_alt` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`tags`)),
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(500) DEFAULT NULL,
  `meta_keywords` varchar(500) DEFAULT NULL,
  `canonical_url` varchar(500) DEFAULT NULL,
  `og_title` varchar(255) DEFAULT NULL,
  `og_description` varchar(500) DEFAULT NULL,
  `og_image` varchar(500) DEFAULT NULL,
  `schema_markup` text DEFAULT NULL,
  `status` enum('DRAFT','PENDING_REVIEW','SCHEDULED','PUBLISHED','ARCHIVED') DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `author_name` varchar(255) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `views` int(11) DEFAULT NULL,
  `likes` int(11) DEFAULT NULL,
  `shares` int(11) DEFAULT NULL,
  `related_services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`related_services`)),
  `related_posts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`related_posts`)),
  `allow_comments` tinyint(1) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT NULL,
  `reading_time_minutes` int(11) DEFAULT NULL,
  `word_count` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `channel` enum('GOOGLE_ADS','GOOGLE_SEO','FACEBOOK','INSTAGRAM','LINKEDIN','EMAIL','SMS','WHATSAPP','REFERRAL','OFFLINE','OTHER') NOT NULL,
  `campaign_type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `objective` varchar(255) DEFAULT NULL,
  `status` enum('DRAFT','SCHEDULED','ACTIVE','PAUSED','COMPLETED','CANCELLED') DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `budget` float DEFAULT NULL,
  `budget_spent` float DEFAULT NULL,
  `target_audience` text DEFAULT NULL,
  `target_services` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_services`)),
  `target_emirates` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`target_emirates`)),
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `landing_page_url` varchar(500) DEFAULT NULL,
  `impressions` int(11) DEFAULT NULL,
  `clicks` int(11) DEFAULT NULL,
  `leads_generated` int(11) DEFAULT NULL,
  `conversions` int(11) DEFAULT NULL,
  `revenue_generated` float DEFAULT NULL,
  `ctr` float DEFAULT NULL,
  `cpl` float DEFAULT NULL,
  `cpa` float DEFAULT NULL,
  `roas` float DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `external_campaign_id` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(11) NOT NULL,
  `account_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `full_name_arabic` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `role` enum('OWNER','PARTNER','HR_MANAGER','PRO_COORDINATOR','FINANCE','EMPLOYEE','DEPENDENT','SPONSOR','OTHER') DEFAULT NULL,
  `job_title` varchar(100) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `passport_number` varchar(50) DEFAULT NULL,
  `passport_expiry` datetime DEFAULT NULL,
  `passport_country` varchar(100) DEFAULT NULL,
  `emirates_id` varchar(20) DEFAULT NULL,
  `emirates_id_expiry` datetime DEFAULT NULL,
  `visa_uid` varchar(50) DEFAULT NULL,
  `visa_expiry` datetime DEFAULT NULL,
  `visa_type` varchar(50) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `date_of_birth` datetime DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `marital_status` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `preferred_language` varchar(20) DEFAULT NULL,
  `preferred_channel` varchar(20) DEFAULT NULL,
  `consent_marketing` tinyint(1) DEFAULT NULL,
  `consent_communication` tinyint(1) DEFAULT NULL,
  `is_primary` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `digital_assets`
--

CREATE TABLE `digital_assets` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `asset_type` enum('IMAGE','VIDEO','DOCUMENT','PDF','INFOGRAPHIC','LOGO','BANNER','AD_CREATIVE','SOCIAL_POST','REEL','TEMPLATE','CHECKLIST','BROCHURE','OTHER') NOT NULL,
  `description` text DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `channel` varchar(50) DEFAULT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `status` enum('DRAFT','PENDING_APPROVAL','APPROVED','PUBLISHED','ARCHIVED','REJECTED') DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `version` int(11) DEFAULT NULL,
  `parent_asset_id` int(11) DEFAULT NULL,
  `impressions` int(11) DEFAULT NULL,
  `clicks` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `published_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `documents`
--

CREATE TABLE `documents` (
  `id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `document_type` enum('PASSPORT','EMIRATES_ID','VISA_COPY','PHOTO','LABOUR_CONTRACT','OFFER_LETTER','NOC','SALARY_CERTIFICATE','MEDICAL_REPORT','MEDICAL_FITNESS','INSURANCE','SPONSOR_PASSPORT','SPONSOR_EMIRATES_ID','SPONSOR_VISA','TRADE_LICENSE','ESTABLISHMENT_CARD','MOA','SHARE_CERTIFICATE','DEGREE_CERTIFICATE','MARRIAGE_CERTIFICATE','BIRTH_CERTIFICATE','POLICE_CLEARANCE','BANK_STATEMENT','PAYMENT_RECEIPT','APPLICATION_FORM','SIGNED_FORM','GOVERNMENT_RECEIPT','APPROVAL_LETTER','OTHER') NOT NULL,
  `name` varchar(255) NOT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_url` varchar(500) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `status` enum('PENDING','RECEIVED','VERIFIED','REJECTED','EXPIRED') DEFAULT NULL,
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `document_number` varchar(100) DEFAULT NULL,
  `issue_date` datetime DEFAULT NULL,
  `expiry_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `is_sensitive` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `account_id` int(11) NOT NULL,
  `application_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `invoice_type` varchar(20) DEFAULT NULL,
  `status` enum('DRAFT','SENT','VIEWED','PARTIAL','PAID','OVERDUE','CANCELLED','REFUNDED') DEFAULT NULL,
  `invoice_date` datetime DEFAULT current_timestamp(),
  `due_date` datetime DEFAULT NULL,
  `sent_date` datetime DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `subtotal` float DEFAULT NULL,
  `discount_amount` float DEFAULT NULL,
  `discount_percentage` float DEFAULT NULL,
  `vat_percentage` float DEFAULT NULL,
  `vat_amount` float DEFAULT NULL,
  `total_amount` float DEFAULT NULL,
  `amount_paid` float DEFAULT NULL,
  `amount_due` float DEFAULT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','CREDIT_CARD','CHEQUE','ONLINE','OTHER') DEFAULT NULL,
  `payment_reference` varchar(100) DEFAULT NULL,
  `currency` varchar(3) DEFAULT NULL,
  `billing_name` varchar(255) DEFAULT NULL,
  `billing_address` text DEFAULT NULL,
  `billing_trn` varchar(50) DEFAULT NULL,
  `billing_email` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `internal_notes` text DEFAULT NULL,
  `pdf_url` varchar(500) DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT NULL,
  `reminder_count` int(11) DEFAULT NULL,
  `last_reminder_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `service_id` int(11) DEFAULT NULL,
  `description` varchar(500) NOT NULL,
  `item_type` varchar(50) DEFAULT NULL,
  `quantity` float DEFAULT NULL,
  `unit_price` float DEFAULT NULL,
  `discount` float DEFAULT NULL,
  `total` float DEFAULT NULL,
  `is_taxable` tinyint(1) DEFAULT NULL,
  `display_order` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `lead_number` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `service_required` varchar(100) DEFAULT NULL,
  `services_interested` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`services_interested`)),
  `emirate` varchar(50) DEFAULT NULL,
  `urgency` varchar(20) DEFAULT NULL,
  `status` enum('NEW','CONTACTED','QUALIFIED','PROPOSAL_SENT','NEGOTIATION','CONVERTED','LOST','JUNK') DEFAULT NULL,
  `source` enum('WEBSITE','GOOGLE_ADS','INSTAGRAM','FACEBOOK','WHATSAPP','REFERRAL','WALK_IN','COLD_CALL','PARTNER','OTHER') DEFAULT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `utm_source` varchar(100) DEFAULT NULL,
  `utm_medium` varchar(100) DEFAULT NULL,
  `utm_campaign` varchar(100) DEFAULT NULL,
  `utm_term` varchar(255) DEFAULT NULL,
  `utm_content` varchar(255) DEFAULT NULL,
  `landing_page` varchar(500) DEFAULT NULL,
  `referrer` varchar(500) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `estimated_value` float DEFAULT NULL,
  `converted_account_id` int(11) DEFAULT NULL,
  `converted_at` datetime DEFAULT NULL,
  `inquiry_message` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `lost_reason` varchar(255) DEFAULT NULL,
  `next_followup_date` datetime DEFAULT NULL,
  `last_contacted_at` datetime DEFAULT NULL,
  `contact_attempts` int(11) DEFAULT NULL,
  `is_hot` tinyint(1) DEFAULT NULL,
  `do_not_contact` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `zoho_lead_id` varchar(50) DEFAULT NULL,
  `zoho_synced_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `leads`
--

INSERT INTO `leads` (`id`, `lead_number`, `first_name`, `last_name`, `email`, `phone`, `whatsapp`, `company_name`, `service_required`, `services_interested`, `emirate`, `urgency`, `status`, `source`, `campaign_id`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `landing_page`, `referrer`, `assigned_to`, `created_by`, `estimated_value`, `converted_account_id`, `converted_at`, `inquiry_message`, `notes`, `lost_reason`, `next_followup_date`, `last_contacted_at`, `contact_attempts`, `is_hot`, `do_not_contact`, `created_at`, `updated_at`, `zoho_lead_id`, `zoho_synced_at`) VALUES
(1, 'LD-202603-BA664', 'Rahul', 'SHARMA', 'rahulsharmax@icloud.com', '+919649385555', NULL, NULL, 'Family Visa', NULL, NULL, 'normal', 'NEW', 'WEBSITE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, '2026-03-06 23:33:12', '2026-03-06 23:33:14', '559904000003561015', '2026-03-06 18:03:14'),
(2, 'LD-202603-D5B1A', 'john', 'Cena', 'jc@gmail.com', '+9719829850245', NULL, NULL, 'Family Visa', NULL, NULL, 'normal', 'NEW', 'WEBSITE', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, 0, '2026-03-08 22:53:11', '2026-03-08 22:53:18', '559904000003567002', '2026-03-08 17:23:18');

-- --------------------------------------------------------

--
-- Table structure for table `packages`
--

CREATE TABLE `packages` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `package_type` enum('ONE_TIME','MONTHLY','QUARTERLY','YEARLY') DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` float NOT NULL,
  `original_price` float DEFAULT NULL,
  `included_transactions` int(11) DEFAULT NULL,
  `overage_rate` float DEFAULT NULL,
  `validity_days` int(11) DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `sla_level` varchar(50) DEFAULT NULL,
  `priority_support` tinyint(1) DEFAULT NULL,
  `dedicated_pro` tinyint(1) DEFAULT NULL,
  `display_order` int(11) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT NULL,
  `badge_text` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package_services`
--

CREATE TABLE `package_services` (
  `package_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `package_service_association`
--

CREATE TABLE `package_service_association` (
  `id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `quantity` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `payment_number` varchar(50) NOT NULL,
  `invoice_id` int(11) NOT NULL,
  `received_by` int(11) DEFAULT NULL,
  `amount` float NOT NULL,
  `payment_method` enum('CASH','BANK_TRANSFER','CREDIT_CARD','CHEQUE','ONLINE','OTHER') NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp(),
  `reference_number` varchar(100) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `cheque_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `name_arabic` varchar(255) DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `category` enum('VISA','EMIRATES_ID','MEDICAL_FITNESS','ATTESTATION','TRANSLATION','CORPORATE','LABOUR','TYPING','OTHER') NOT NULL,
  `sub_category` varchar(100) DEFAULT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `description_arabic` text DEFAULT NULL,
  `service_fee` float DEFAULT NULL,
  `govt_fee_estimate` float DEFAULT NULL,
  `urgent_fee` float DEFAULT NULL,
  `typical_turnaround_days` int(11) DEFAULT NULL,
  `urgent_turnaround_days` int(11) DEFAULT NULL,
  `required_documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`required_documents`)),
  `eligibility_criteria` text DEFAULT NULL,
  `process_steps` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`process_steps`)),
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `keywords` text DEFAULT NULL,
  `icon` varchar(100) DEFAULT NULL,
  `display_order` int(11) DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT NULL,
  `is_popular` tinyint(1) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_public` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `hashed_password` varchar(255) NOT NULL,
  `role` enum('super_admin','admin','manager','pro_officer','staff','accountant','client') NOT NULL DEFAULT 'client',
  `is_active` tinyint(1) DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL,
  `last_login` datetime DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `permissions` text DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `verification_token` varchar(255) DEFAULT NULL,
  `password_reset_token` varchar(255) DEFAULT NULL,
  `password_reset_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `username`, `full_name`, `phone`, `hashed_password`, `role`, `is_active`, `is_verified`, `created_at`, `updated_at`, `last_login`, `whatsapp`, `avatar_url`, `permissions`, `is_online`, `email_verified_at`, `verification_token`, `password_reset_token`, `password_reset_expires`) VALUES
(3, 'admin@quicksolve.ae', NULL, 'Admin User', NULL, '$2b$12$atbbdbFpMeE7q2Rn2ozS7eKjEa.D4RwFN5nCX4PggkHQzQAA/dzeS', 'super_admin', 1, 1, '2026-03-06 22:27:29', '2026-03-13 23:26:54', '2026-03-13 17:56:54', NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `vendor_type` enum('TYPING_CENTER','MEDICAL_CENTER','TRANSLATION','ATTESTATION','COURIER','PHOTOGRAPHY','PRO_RUNNER','INSURANCE','OTHER') NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emirate` varchar(50) DEFAULT NULL,
  `area` varchar(100) DEFAULT NULL,
  `trade_license` varchar(100) DEFAULT NULL,
  `trn` varchar(50) DEFAULT NULL,
  `rate_card` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`rate_card`)),
  `payment_terms` varchar(100) DEFAULT NULL,
  `sla_turnaround_hours` int(11) DEFAULT NULL,
  `reliability_score` float DEFAULT NULL,
  `total_jobs` int(11) DEFAULT NULL,
  `successful_jobs` int(11) DEFAULT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT NULL,
  `is_preferred` tinyint(1) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vendor_jobs`
--

CREATE TABLE `vendor_jobs` (
  `id` int(11) NOT NULL,
  `job_number` varchar(50) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `application_id` int(11) NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `job_type` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','FAILED','CANCELLED') DEFAULT NULL,
  `quoted_cost` float DEFAULT NULL,
  `actual_cost` float DEFAULT NULL,
  `assigned_date` datetime DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `completed_date` datetime DEFAULT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `input_documents` text DEFAULT NULL,
  `output_documents` text DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `completion_notes` text DEFAULT NULL,
  `quality_rating` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_accounts_trade_license_number` (`trade_license_number`),
  ADD KEY `ix_accounts_company_name` (`company_name`),
  ADD KEY `ix_accounts_email` (`email`),
  ADD KEY `ix_accounts_id` (`id`);

--
-- Indexes for table `account_packages`
--
ALTER TABLE `account_packages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_account_packages_package_id` (`package_id`),
  ADD KEY `ix_account_packages_id` (`id`),
  ADD KEY `ix_account_packages_account_id` (`account_id`);

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_activity_logs_id` (`id`),
  ADD KEY `ix_activity_logs_activity_type` (`activity_type`),
  ADD KEY `ix_activity_logs_user_id` (`user_id`),
  ADD KEY `ix_activity_logs_entity_id` (`entity_id`),
  ADD KEY `ix_activity_logs_entity_type` (`entity_type`),
  ADD KEY `ix_activity_logs_created_at` (`created_at`);

--
-- Indexes for table `alembic_version`
--
ALTER TABLE `alembic_version`
  ADD PRIMARY KEY (`version_num`);

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_applications_application_number` (`application_number`),
  ADD KEY `account_package_id` (`account_package_id`),
  ADD KEY `campaign_id` (`campaign_id`),
  ADD KEY `ix_applications_contact_id` (`contact_id`),
  ADD KEY `ix_applications_assigned_to` (`assigned_to`),
  ADD KEY `ix_applications_account_id` (`account_id`),
  ADD KEY `ix_applications_status` (`status`),
  ADD KEY `ix_applications_urgency` (`urgency`),
  ADD KEY `ix_applications_id` (`id`),
  ADD KEY `ix_applications_service_id` (`service_id`);

--
-- Indexes for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `changed_by` (`changed_by`),
  ADD KEY `ix_application_status_history_id` (`id`),
  ADD KEY `ix_application_status_history_application_id` (`application_id`);

--
-- Indexes for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_blog_posts_slug` (`slug`),
  ADD KEY `author_id` (`author_id`),
  ADD KEY `ix_blog_posts_category` (`category`),
  ADD KEY `ix_blog_posts_id` (`id`),
  ADD KEY `ix_blog_posts_title` (`title`),
  ADD KEY `ix_blog_posts_status` (`status`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_campaigns_code` (`code`),
  ADD KEY `ix_campaigns_channel` (`channel`),
  ADD KEY `ix_campaigns_id` (`id`),
  ADD KEY `ix_campaigns_name` (`name`),
  ADD KEY `ix_campaigns_status` (`status`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_contacts_email` (`email`),
  ADD KEY `ix_contacts_id` (`id`),
  ADD KEY `ix_contacts_account_id` (`account_id`);

--
-- Indexes for table `digital_assets`
--
ALTER TABLE `digital_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `campaign_id` (`campaign_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `parent_asset_id` (`parent_asset_id`),
  ADD KEY `ix_digital_assets_asset_type` (`asset_type`),
  ADD KEY `ix_digital_assets_id` (`id`),
  ADD KEY `ix_digital_assets_name` (`name`),
  ADD KEY `ix_digital_assets_status` (`status`);

--
-- Indexes for table `documents`
--
ALTER TABLE `documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `uploaded_by` (`uploaded_by`),
  ADD KEY `verified_by` (`verified_by`),
  ADD KEY `ix_documents_application_id` (`application_id`),
  ADD KEY `ix_documents_document_type` (`document_type`),
  ADD KEY `ix_documents_id` (`id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_invoices_invoice_number` (`invoice_number`),
  ADD KEY `application_id` (`application_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_invoices_id` (`id`),
  ADD KEY `ix_invoices_status` (`status`),
  ADD KEY `ix_invoices_account_id` (`account_id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `ix_invoice_items_id` (`id`),
  ADD KEY `ix_invoice_items_invoice_id` (`invoice_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_leads_lead_number` (`lead_number`),
  ADD UNIQUE KEY `ix_leads_zoho_lead_id` (`zoho_lead_id`),
  ADD KEY `campaign_id` (`campaign_id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `converted_account_id` (`converted_account_id`),
  ADD KEY `ix_leads_email` (`email`),
  ADD KEY `ix_leads_phone` (`phone`),
  ADD KEY `ix_leads_id` (`id`),
  ADD KEY `ix_leads_source` (`source`),
  ADD KEY `ix_leads_status` (`status`),
  ADD KEY `ix_leads_assigned_to` (`assigned_to`);

--
-- Indexes for table `packages`
--
ALTER TABLE `packages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_packages_slug` (`slug`),
  ADD KEY `ix_packages_name` (`name`),
  ADD KEY `ix_packages_id` (`id`);

--
-- Indexes for table `package_services`
--
ALTER TABLE `package_services`
  ADD PRIMARY KEY (`package_id`,`service_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `package_service_association`
--
ALTER TABLE `package_service_association`
  ADD PRIMARY KEY (`id`),
  ADD KEY `package_id` (`package_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `ix_package_service_association_id` (`id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_payments_payment_number` (`payment_number`),
  ADD KEY `received_by` (`received_by`),
  ADD KEY `ix_payments_id` (`id`),
  ADD KEY `ix_payments_invoice_id` (`invoice_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_services_slug` (`slug`),
  ADD KEY `ix_services_category` (`category`),
  ADD KEY `ix_services_name` (`name`),
  ADD KEY `ix_services_id` (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_users_email` (`email`),
  ADD UNIQUE KEY `ix_users_username` (`username`),
  ADD KEY `ix_users_id` (`id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ix_vendors_id` (`id`),
  ADD KEY `ix_vendors_name` (`name`),
  ADD KEY `ix_vendors_vendor_type` (`vendor_type`);

--
-- Indexes for table `vendor_jobs`
--
ALTER TABLE `vendor_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ix_vendor_jobs_job_number` (`job_number`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `ix_vendor_jobs_vendor_id` (`vendor_id`),
  ADD KEY `ix_vendor_jobs_id` (`id`),
  ADD KEY `ix_vendor_jobs_application_id` (`application_id`),
  ADD KEY `ix_vendor_jobs_status` (`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `account_packages`
--
ALTER TABLE `account_packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `applications`
--
ALTER TABLE `applications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `application_status_history`
--
ALTER TABLE `application_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `blog_posts`
--
ALTER TABLE `blog_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `digital_assets`
--
ALTER TABLE `digital_assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `documents`
--
ALTER TABLE `documents`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `packages`
--
ALTER TABLE `packages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `package_service_association`
--
ALTER TABLE `package_service_association`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `vendor_jobs`
--
ALTER TABLE `vendor_jobs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_packages`
--
ALTER TABLE `account_packages`
  ADD CONSTRAINT `account_packages_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `account_packages_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`);

--
-- Constraints for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `applications_ibfk_2` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`),
  ADD CONSTRAINT `applications_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `applications_ibfk_4` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `applications_ibfk_5` FOREIGN KEY (`account_package_id`) REFERENCES `account_packages` (`id`),
  ADD CONSTRAINT `applications_ibfk_6` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`);

--
-- Constraints for table `application_status_history`
--
ALTER TABLE `application_status_history`
  ADD CONSTRAINT `application_status_history_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`),
  ADD CONSTRAINT `application_status_history_ibfk_2` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `blog_posts`
--
ALTER TABLE `blog_posts`
  ADD CONSTRAINT `blog_posts_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `contacts`
--
ALTER TABLE `contacts`
  ADD CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`);

--
-- Constraints for table `digital_assets`
--
ALTER TABLE `digital_assets`
  ADD CONSTRAINT `digital_assets_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`),
  ADD CONSTRAINT `digital_assets_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `digital_assets_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `digital_assets_ibfk_4` FOREIGN KEY (`parent_asset_id`) REFERENCES `digital_assets` (`id`);

--
-- Constraints for table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`),
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `documents_ibfk_3` FOREIGN KEY (`verified_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`),
  ADD CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`),
  ADD CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  ADD CONSTRAINT `invoice_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`),
  ADD CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leads_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `leads_ibfk_4` FOREIGN KEY (`converted_account_id`) REFERENCES `accounts` (`id`);

--
-- Constraints for table `package_services`
--
ALTER TABLE `package_services`
  ADD CONSTRAINT `package_services_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  ADD CONSTRAINT `package_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `package_service_association`
--
ALTER TABLE `package_service_association`
  ADD CONSTRAINT `package_service_association_ibfk_1` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  ADD CONSTRAINT `package_service_association_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`),
  ADD CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`);

--
-- Constraints for table `vendor_jobs`
--
ALTER TABLE `vendor_jobs`
  ADD CONSTRAINT `vendor_jobs_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`),
  ADD CONSTRAINT `vendor_jobs_ibfk_2` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`),
  ADD CONSTRAINT `vendor_jobs_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
