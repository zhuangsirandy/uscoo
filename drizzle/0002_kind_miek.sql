CREATE TABLE `assessment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`user_id` text,
	`event_type` text NOT NULL,
	`event_key` text NOT NULL,
	`language` text DEFAULT '' NOT NULL,
	`referrer` text DEFAULT '' NOT NULL,
	`utm_source` text DEFAULT '' NOT NULL,
	`utm_medium` text DEFAULT '' NOT NULL,
	`utm_campaign` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_assessment_events_event_key` ON `assessment_events` (`event_key`);--> statement-breakpoint
CREATE INDEX `idx_assessment_events_type_created` ON `assessment_events` (`event_type`,`created`);--> statement-breakpoint
CREATE INDEX `idx_assessment_events_user_created` ON `assessment_events` (`user_id`,`created`);--> statement-breakpoint
CREATE INDEX `idx_assessment_events_visitor` ON `assessment_events` (`visitor_id`);--> statement-breakpoint
CREATE TABLE `support_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text DEFAULT '' NOT NULL,
	`user_id` text,
	`name` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`message` text NOT NULL,
	`language` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`reply` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_support_requests_status_created` ON `support_requests` (`status`,`created`);--> statement-breakpoint
CREATE INDEX `idx_support_requests_user_created` ON `support_requests` (`user_id`,`created`);--> statement-breakpoint
CREATE INDEX `idx_support_requests_visitor_created` ON `support_requests` (`visitor_id`,`created`);--> statement-breakpoint
ALTER TABLE `accounts` ADD `profile` text DEFAULT '{}' NOT NULL;