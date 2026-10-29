CREATE TYPE "public"."media_mime" AS ENUM('image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif');--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"site_id" text NOT NULL,
	"storage_key" text NOT NULL,
	"mime" "media_mime" NOT NULL,
	"size" integer NOT NULL,
	"alt" text NOT NULL,
	"filename" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "media_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_site_created_idx" ON "media" USING btree ("site_id","created_at");