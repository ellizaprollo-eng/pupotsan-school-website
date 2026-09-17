CREATE TABLE `school_content` (
	`id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
