export class PromotionNotFoundException extends Error {
  constructor(identifier: string) {
    super(`La promoción "${identifier}" no existe o fue eliminada.`);
    this.name = 'PromotionNotFoundException';
  }
}

export class CouponNotFoundOrExpiredException extends Error {
  constructor(code: string) {
    super(`El cupón "${code}" no existe o no se encuentra vigente.`);
    this.name = 'CouponNotFoundOrExpiredException';
  }
}

export class CouponUsageLimitReachedException extends Error {
  constructor(code: string) {
    super(
      `El cupón "${code}" ha alcanzado su límite máximo de usos permitidos.`,
    );
    this.name = 'CouponUsageLimitReachedException';
  }
}

export class PromotionConflictException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromotionConflictException';
  }
}

export class InvalidPromotionDataException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPromotionDataException';
  }
}

export class MinOrderSubtotalNotMetException extends Error {
  constructor(minAmount: number) {
    super(
      `Para usar esta promoción se requiere un subtotal mínimo de $${minAmount.toLocaleString('es-CO')} en artículos válidos.`,
    );
    this.name = 'MinOrderSubtotalNotMetException';
  }
}
