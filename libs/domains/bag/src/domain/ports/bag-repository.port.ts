import { Bag } from '../entities/bag.entity';

export const BAG_REPOSITORY_PORT = Symbol('BAG_REPOSITORY_PORT');

export interface BagRepositoryPort {
  findById(id: string): Promise<Bag | null>;
  findBySlug(slug: string): Promise<Bag | null>;
  findAllActive(): Promise<Bag[]>;
  save(bag: Bag): Promise<void>;
  update(bag: Bag): Promise<void>;
  delete(id: string): Promise<void>;
}
