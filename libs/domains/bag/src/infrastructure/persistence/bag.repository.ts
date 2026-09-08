import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull } from 'drizzle-orm';
import { bagsTable, DrizzleDb } from '@kardusbag/database';
import { BagRepositoryPort } from '../../domain/ports/bag-repository.port';
import { Bag } from '../../domain/entities/bag.entity';
import { BagMapper } from './bag.mapper';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

@Injectable()
export class BagRepository implements BagRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDb,
  ) {}

  async findById(id: string): Promise<Bag | null> {
    const [row] = await this.db
      .select()
      .from(bagsTable)
      .where(and(eq(bagsTable.id, id), isNull(bagsTable.deletedAt)))
      .limit(1);

    if (!row) return null;
    return BagMapper.toDomain(row);
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
    const raw = BagMapper.toPersistenceInsert(bag);
    await this.db.insert(bagsTable).values(raw);
  }

  async update(bag: Bag): Promise<void> {
    const raw = BagMapper.toPersistenceUpdate(bag);
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
