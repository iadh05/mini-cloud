CREATE TABLE "services" (
	"id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"path" text NOT NULL,
	"aws" text NOT NULL,
	"engine" text NOT NULL,
	"phase" integer NOT NULL,
	"status" text DEFAULT 'planned' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_number_unique" UNIQUE("number"),
	CONSTRAINT "services_path_unique" UNIQUE("path"),
	CONSTRAINT "services_category_ck" CHECK ("services"."category" IN ('compute', 'networking', 'storage', 'databases', 'security', 'observability', 'integration', 'delivery', 'billing')),
	CONSTRAINT "services_status_ck" CHECK ("services"."status" IN ('planned', 'beta', 'available'))
);
--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_type_services_id_fk" FOREIGN KEY ("type") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;