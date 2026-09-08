// Módulo principal del dominio
export * from './collections-domain.module';

// Entidades y Reglas de Dominio
export * from './domain/entities/collection';
export * from './domain/exceptions/collection.exception';
export * from './domain/ports/collection-repository.port';

// Servicios de Aplicación
export * from './application/services/collection-admin.service';
export * from './application/services/collection.service';

// Infraestructura y Persistencia
export * from './infrastructure/persistence/collection.mapper';
export * from './infrastructure/persistence/collection.repository';
