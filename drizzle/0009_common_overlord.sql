ALTER TABLE "items" DROP CONSTRAINT "items_catalog_id_catalogs_id_fk";
--> statement-breakpoint
ALTER TABLE "catalogs" DROP COLUMN "id";--> statement-breakpoint
ALTER TABLE "items" DROP COLUMN "catalog_id";