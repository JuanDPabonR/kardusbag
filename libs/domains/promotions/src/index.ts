// Módulo principal del dominio
export * from './promotions-domain.module';

// Entidades y Reglas de Dominio
export * from './domain/entities/promotion';
export * from './domain/rules/promotion-rule.engine';
export * from './domain/exceptions/promotion.exceptions';
export * from './domain/ports/promotion-repository.port';

// Servicios de Aplicación
export * from './application/services/promotions-admin.service';
export * from './application/services/promotions.service';

// Infraestructura y Persistencia
export * from './infrastructure/persistence/promotion.mapper';
export * from './infrastructure/persistence/promotion.repository';
