ALTER TABLE "columns" ADD COLUMN "is_closed" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
UPDATE "columns" SET "is_closed" = true WHERE LOWER("name") = 'done';
