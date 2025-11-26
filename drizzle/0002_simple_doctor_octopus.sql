ALTER TABLE "catalogs" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "fingerprint" text NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "photo_id" text;