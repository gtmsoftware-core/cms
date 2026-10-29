CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('page', 'site-settings');--> statement-breakpoint
CREATE TABLE "contents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text NOT NULL,
	"type" "content_type" NOT NULL,
	"slug" text NOT NULL,
	"status" "content_status" NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contents" ADD CONSTRAINT "contents_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "contents_site_type_slug_key" ON "contents" USING btree ("site_id","type","slug") WHERE "contents"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "contents_site_status_idx" ON "contents" USING btree ("site_id","status");