CREATE TYPE "public"."sprint_day" AS ENUM('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun');--> statement-breakpoint
CREATE TABLE "sprints" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"start_date" date NOT NULL,
	"name" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sprints_start_date_must_be_monday" CHECK (EXTRACT(ISODOW FROM "start_date") = 1)
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sprint_id" varchar(26);--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sprint_day" "sprint_day";--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "sprint_position" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "sprints_user_id_start_date_unique" ON "sprints" USING btree ("user_id","start_date");--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_id_sprints_id_fk" FOREIGN KEY ("sprint_id") REFERENCES "public"."sprints"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_sprint_fields_atomicity" CHECK (
  ("sprint_id" IS NULL AND "sprint_day" IS NULL AND "sprint_position" IS NULL)
  OR
  ("sprint_id" IS NOT NULL AND "sprint_day" IS NOT NULL AND "sprint_position" IS NOT NULL)
);
