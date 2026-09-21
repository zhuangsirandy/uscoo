CREATE TABLE `assessment_leads` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`user_id` text,
	`name` text DEFAULT '' NOT NULL,
	`email` text NOT NULL,
	`wechat` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`timing` text DEFAULT '' NOT NULL,
	`company` text DEFAULT '' NOT NULL,
	`application_path` text DEFAULT '' NOT NULL,
	`has_chatgpt` text DEFAULT 'unknown' NOT NULL,
	`wants_interview` integer DEFAULT 0 NOT NULL,
	`language` text DEFAULT '' NOT NULL,
	`assessment` text DEFAULT '{}' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `idx_assessment_leads_created` ON `assessment_leads` (`created`);--> statement-breakpoint
CREATE INDEX `idx_assessment_leads_email` ON `assessment_leads` (`email`);--> statement-breakpoint
CREATE INDEX `idx_assessment_leads_visitor` ON `assessment_leads` (`visitor_id`);