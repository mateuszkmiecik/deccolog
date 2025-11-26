CREATE TABLE "catalogs" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"password" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"catalog_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"fingerprint" text NOT NULL,
	"photo_id" text
);
--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_catalog_id_catalogs_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."catalogs"("id") ON DELETE no action ON UPDATE no action;