import { Promotion } from '../entities/promotion';
import { VariantEvaluationItem } from '../rules/promotion-rule.engine';

export const PROMOTION_REPOSITORY_PORT = Symbol('PROMOTION_REPOSITORY_PORT');

export interface CartEvaluationItem {
  cartItemId: string;
  quantity: number;
  evaluationItem: VariantEvaluationItem;
}

export interface PromotionRepositoryPort {
  findById(id: string): Promise<Promotion | null>;
  findByCode(code: string): Promise<Promotion | null>;
  findActiveCoupon(code: string, now?: Date): Promise<Promotion | null>;
  findActiveAutomaticPromotions(now?: Date): Promise<Promotion[]>;
  findAll(): Promise<Promotion[]>;
  save(promotion: Promotion): Promise<Promotion>;
  update(promotion: Promotion): Promise<void>;
  softDelete(id: string): Promise<void>;

  // Carga de ítems de carrito para evaluación
  getCartItemsForEvaluation(cartId: string): Promise<CartEvaluationItem[]>;
  linkCouponToCart(cartId: string, promotionId: string): Promise<void>;
}
