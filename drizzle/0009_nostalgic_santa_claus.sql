CREATE TYPE "public"."effort" AS ENUM('low', 'high');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "effort" "effort";