--> statement-breakpoint
-- 1. Eliminar explícitamente las constraints viejas que amarran a coupons
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_coupon_id_coupons_id_fk";
ALTER TABLE "shopping_carts" DROP CONSTRAINT IF EXISTS "shopping_carts_applied_coupon_id_coupons_id_fk";

--> statement-breakpoint
-- 2. Eliminar la tabla vieja ahora que ya no tiene llaves foráneas apuntándola
DROP TABLE IF EXISTS "coupons" CASCADE;

--> statement-breakpoint
-- 3. Crear la tabla promotions (si no estaba creada ya)
-- ... aquí van las instrucciones CREATE TABLE IF NOT EXISTS "promotions" ...

--> statement-breakpoint
-- 4. Re-enlazar las FKs apuntando a la nueva tabla promotions
ALTER TABLE "orders" 
  ADD CONSTRAINT "orders_coupon_id_promotions_id_fk" 
  FOREIGN KEY ("coupon_id") 
  REFERENCES "promotions"("id") 
  ON DELETE set null 
  ON UPDATE no action;

ALTER TABLE "shopping_carts" 
  ADD CONSTRAINT "shopping_carts_applied_coupon_id_promotions_id_fk" 
  FOREIGN KEY ("applied_coupon_id") 
  REFERENCES "promotions"("id") 
  ON DELETE set null 
  ON UPDATE no action;