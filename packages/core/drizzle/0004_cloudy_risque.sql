CREATE TABLE "board_columns" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"board_id" varchar(26) NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(32) DEFAULT 'bg-muted' NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_columns" ADD CONSTRAINT "board_columns_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "board_columns" ("id", "board_id", "user_id", "name", "color", "position")
SELECT
	upper(substring(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 26)),
	b."id",
	b."user_id",
	'To Do',
	'bg-destructive',
	0
FROM "boards" b;--> statement-breakpoint
INSERT INTO "board_columns" ("id", "board_id", "user_id", "name", "color", "position")
SELECT
	upper(substring(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 26)),
	b."id",
	b."user_id",
	'Doing',
	'bg-chart-3',
	1
FROM "boards" b;--> statement-breakpoint
INSERT INTO "board_columns" ("id", "board_id", "user_id", "name", "color", "position")
SELECT
	upper(substring(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 1, 26)),
	b."id",
	b."user_id",
	'Done',
	'bg-chart-4',
	2
FROM "boards" b;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "column_id" varchar(26);--> statement-breakpoint
UPDATE "tasks" t
SET "column_id" = c."id"
FROM "board_columns" c
WHERE c."board_id" = t."board_id"
	AND c."name" = CASE t."status"
		WHEN 'todo' THEN 'To Do'
		WHEN 'doing' THEN 'Doing'
		WHEN 'done' THEN 'Done'
	END;--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "column_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_column_id_board_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."board_columns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "status";--> statement-breakpoint
DROP TYPE "public"."status";
