CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"resource_id" uuid NOT NULL,
	"action" text NOT NULL,
	"state" text DEFAULT 'queued' NOT NULL,
	"generation" integer NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"log_tail" text,
	"run_after" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "jobs_action_ck" CHECK ("jobs"."action" IN ('create', 'update', 'delete', 'start', 'stop', 'restart')),
	CONSTRAINT "jobs_state_ck" CHECK ("jobs"."state" IN ('queued', 'running', 'done', 'failed', 'cancelled'))
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"spec" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"outputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"error" text,
	"generation" integer DEFAULT 1 NOT NULL,
	"deletion_protection" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"purge_at" timestamp with time zone,
	CONSTRAINT "resources_status_ck" CHECK ("resources"."status" IN ('pending', 'provisioning', 'running', 'updating', 'starting', 'stopping', 'stopped', 'deleting', 'deleted', 'failed')),
	CONSTRAINT "resources_generation_ck" CHECK ("resources"."generation" >= 1)
);
--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "jobs_queue_idx" ON "jobs" USING btree ("run_after") WHERE "jobs"."state" = 'queued';--> statement-breakpoint
CREATE INDEX "jobs_resource_idx" ON "jobs" USING btree ("resource_id");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_one_running_per_resource_uq" ON "jobs" USING btree ("resource_id") WHERE "jobs"."state" = 'running';--> statement-breakpoint
CREATE UNIQUE INDEX "resources_type_name_live_uq" ON "resources" USING btree ("type","name") WHERE "resources"."deleted_at" IS NULL;--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");