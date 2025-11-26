ALTER TABLE "catalogs" ADD COLUMN "id" serial PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "catalog_id" integer;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE no action ON UPDATE no action;