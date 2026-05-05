CREATE TABLE "columns" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(32) DEFAULT 'bg-muted' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
INSERT INTO "columns" ("id", "user_id", "name", "color", "position")
SELECT
	upper(substring(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 26)),
	user_id,
	name,
	(array_agg(color ORDER BY position))[1],
	(ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY MIN(position))) - 1
FROM "board_columns"
GROUP BY user_id, name;--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_column_id_board_columns_id_fk";--> statement-breakpoint
UPDATE "tasks" t
SET "column_id" = c."id"
FROM "board_columns" bc
JOIN "columns" c ON c."user_id" = bc."user_id" AND c."name" = bc."name"
WHERE t."column_id" = bc."id";--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."columns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
DROP TABLE "board_columns" CASCADE;
