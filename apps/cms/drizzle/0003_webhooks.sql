CREATE TYPE "public"."outbox_event_type" AS ENUM('content.published', 'content.updated', 'content.unpublished', 'content.deleted', 'site.settings.updated', 'site.revalidated', 'media.deleted', 'ping');--> statement-breakpoint
CREATE TYPE "public"."webhook_delivery_status" AS ENUM('success', 'failed');--> statement-breakpoint
CREATE TABLE "outbox_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text NOT NULL,
	"type" "outbox_event_type" NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"processed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text NOT NULL,
	"event_ids" text[] NOT NULL,
	"event_types" text[] NOT NULL,
	"status" "webhook_delivery_status" NOT NULL,
	"http_status" integer,
	"duration_ms" integer NOT NULL,
	"error" text,
	"attempted_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "webhook_url" text;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "webhook_secret_enc" text;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_events_processed_next_idx" ON "outbox_events" USING btree ("processed_at","next_attempt_at");--> statement-breakpoint
CREATE INDEX "outbox_events_site_idx" ON "outbox_events" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_site_attempted_idx" ON "webhook_deliveries" USING btree ("site_id","attempted_at");