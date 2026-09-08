CREATE TYPE "public"."promotion_scope" AS ENUM('global', 'categories', 'collections', 'specific_bags', 'specific_variants', 'attributes');--> statement-breakpoint
CREATE TABLE "promotion_bags" (
	"promotion_id" uuid NOT NULL,
	"bag_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_categories" (
	"promotion_id" uuid NOT NULL,
	"category_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_collections" (
	"promotion_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotion_variants" (
	"promotion_id" uuid NOT NULL,
	"variant_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(50),
	"type" "discount_type" NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"scope" "promotion_scope" DEFAULT 'global' NOT NULL,
	"attribute_rules" jsonb DEFAULT '{}'::jsonb,
	"min_order_subtotal" numeric(12, 2) DEFAULT '0.00',
	"max_discount_amount" numeric(12, 2),
	"usage_limit_total" integer,
	"usage_limit_per_customer" integer DEFAULT 1,
	"current_usage_count" integer DEFAULT 0 NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "promotion_bags" ADD CONSTRAINT "promotion_bags_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_bags" ADD CONSTRAINT "promotion_bags_bag_id_bags_id_fk" FOREIGN KEY ("bag_id") REFERENCES "public"."bags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_categories" ADD CONSTRAINT "promotion_categories_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_categories" ADD CONSTRAINT "promotion_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_collections" ADD CONSTRAINT "promotion_collections_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_collections" ADD CONSTRAINT "promotion_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_variants" ADD CONSTRAINT "promotion_variants_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_variants" ADD CONSTRAINT "promotion_variants_variant_id_bag_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."bag_variants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "prom_bag_pk" ON "promotion_bags" USING btree ("promotion_id","bag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prom_cat_pk" ON "promotion_categories" USING btree ("promotion_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prom_col_pk" ON "promotion_collections" USING btree ("promotion_id","collection_id");--> statement-breakpoint
CREATE UNIQUE INDEX "prom_var_pk" ON "promotion_variants" USING btree ("promotion_id","variant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_code_idx" ON "promotions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "promotions_is_active_idx" ON "promotions" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "promotions_starts_ends_idx" ON "promotions" USING btree ("starts_at","expires_at");--> statement-breakpoint
CREATE INDEX "promotions_deleted_at_idx" ON "promotions" USING btree ("deleted_at");