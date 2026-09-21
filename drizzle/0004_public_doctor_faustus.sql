CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`message_key` text NOT NULL,
	`kind` text NOT NULL,
	`reference_id` text NOT NULL,
	`recipient` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`reply_to` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`provider_id` text DEFAULT '' NOT NULL,
	`error` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_email_message_key` ON `email_outbox` (`message_key`);--> statement-breakpoint
CREATE INDEX `idx_email_status_created` ON `email_outbox` (`status`,`created`);