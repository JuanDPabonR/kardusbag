import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BagRepositoryPort } from '../../domain/ports/bag-repository.port';
import { Bag } from '../../domain/entities/bag.entity';
import { BagMapper } from './bag.mapper';
import { bagsTable } from '@kardusbag/database';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

@Injectable()
export class BagRepository implements BagRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: NodePgDatabase,
  ) {}

  async findById(id: string): Promise<Bag | null> {
    const rows = await this.db
      .select()
      .from(bagsTable)
      .where(and(eq(bagsTable.id, id), isNull(bagsTable.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;
    return BagMapper.toDomain(rows[0]);
  }

  async findBySlug(slug: string): Promise<Bag | null> {
    const rows = await this.db
      .select()
      .from(bagsTable)
      .where(and(eq(bagsTable.slug, slug), isNull(bagsTable.deletedAt)))
      .limit(1);

    if (rows.length === 0) return null;
    return BagMapper.toDomain(rows[0]);
  }

  async findAllActive(): Promise<Bag[]> {
    const rows = await this.db
      .select()
      .from(bagsTable)
      .where(and(eq(bagsTable.isActive, true), isNull(bagsTable.deletedAt)));

    return rows.map(BagMapper.toDomain);
  }

  async save(bag: Bag): Promise<void> {
    const raw = BagMapper.toPersistence(bag);
    await this.db.insert(bagsTable).values(raw);
  }

  async update(bag: Bag): Promise<void> {
    const raw = BagMapper.toPersistence(bag);
    await this.db
      .update(bagsTable)
      .set(raw)
      .where(eq(bagsTable.id, bag.toPrimitives().id));
  }

  async delete(id: string): Promise<void> {
    // Soft delete preferido
    await this.db
      .update(bagsTable)
      .set({ deletedAt: new Date(), isActive: false })
      .where(eq(bagsTable.id, id));
  }
}
