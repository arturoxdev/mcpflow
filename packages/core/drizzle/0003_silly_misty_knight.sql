CREATE TYPE "public"."source" AS ENUM('internal', 'external');--> statement-breakpoint
ALTER TABLE "boards" ADD COLUMN "public_inbox_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "source" "source" DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "created_by" varchar(50);