CREATE TABLE `accounts` (
	`user_id` text PRIMARY KEY NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`display_name` text DEFAULT '' NOT NULL,
	`access_status` text DEFAULT 'pending' NOT NULL,
	`access_granted_at` text,
	`access_source` text,
	`referral_code` text NOT NULL,
	`referred_by_user_id` text,
	`reward_credits` integer DEFAULT 0 NOT NULL,
	`activation_token` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`updated` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_accounts_referral_code` ON `accounts` (`referral_code`);--> statement-breakpoint
CREATE INDEX `idx_accounts_referred_by` ON `accounts` (`referred_by_user_id`);--> statement-breakpoint
CREATE TABLE `reward_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`credits` integer NOT NULL,
	`related_user_id` text,
	`idempotency_key` text NOT NULL,
	`created` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `accounts`(`user_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reward_events_idempotency` ON `reward_events` (`idempotency_key`);--> statement-breakpoint
CREATE INDEX `idx_reward_events_user_created` ON `reward_events` (`user_id`,`created`);--> statement-breakpoint
PRAGMA optimize;
