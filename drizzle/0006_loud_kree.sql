CREATE TABLE "items_tags" (
	"item_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "items_tags_item_id_tag_id_pk" PRIMARY KEY("item_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "items_tags" ADD CONSTRAINT "items_tags_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items_tags" ADD CONSTRAINT "items_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;