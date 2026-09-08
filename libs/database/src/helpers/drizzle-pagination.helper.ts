import { count, getTableName, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { PaginatedResult, type PaginationParams } from '@kardusbag/shared';
import type { DrizzleDb } from '../client';

export interface PaginationFilter {
  page?: number;
  limit?: number;
}

export interface CalculatedPagination {
  page: number;
  limit: number;
  offset: number;
  pageSize: number;
}

/**
 * Normaliza y calcula los valores seguros de paginación (page >= 1, limit entre 1 y maxLimit, offset).
 */
export function calculatePagination(
  filter?: PaginationParams,
  defaultLimit = 10,
  maxLimit = 100,
): CalculatedPagination {
  const page = Math.max(1, Number(filter?.page) || 1);
  const rawLimit = Number(filter?.limit) || defaultLimit;
  const limit = Math.max(1, Math.min(maxLimit, rawLimit));
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset,
    pageSize: limit,
  };
}

/**
 * Aplica paginación (.limit() y .offset()) a cualquier consulta Drizzle compatible de forma fluida y segura.
 *
 * @example
 * const query = db.select().from(bagsTable).where(isNull(bagsTable.deletedAt));
 * const rows = await withPagination(query, filter);
 */
export function withPagination<
  T extends { limit: (limit: number) => { offset: (offset: number) => any } },
>(
  query: T,
  filter?: PaginationParams,
  defaultLimit = 10,
  maxLimit = 100,
): ReturnType<ReturnType<T['limit']>['offset']> {
  const { limit, offset } = calculatePagination(filter, defaultLimit, maxLimit);
  return query.limit(limit).offset(offset);
}

export interface PaginateTableOptions<T = any, R = T> {
  where?: SQL | undefined;
  filter?: PaginationParams;
  with?: any;
  orderBy?: any;
  transform?: (item: T) => R;
}

/**
 * Pagina de forma automática, optimizada y en paralelo cualquier tabla Drizzle.
 *
 * @example
 * return paginate(this.db, collectionsTable, {
 *   filter,
 *   where: isNull(collectionsTable.deletedAt),
 *   with: { bags: { with: { bag: true } } },
 *   transform: (c) => ({ ... }),
 * });
 */
export async function paginate<T = any, R = T>(
  db: DrizzleDb,
  table: PgTable,
  options: PaginateTableOptions<T, R> = {},
): Promise<PaginatedResult<R>> {
  const { filter, where, with: withRelations, orderBy, transform } = options;
  const { limit, offset, page, pageSize } = calculatePagination(filter);

  const tableName = getTableName(table);
  let queryModel = (db.query as any)[tableName];

  if (!queryModel) {
    for (const key of Object.keys(db.query || {})) {
      const entry = (db.query as any)[key];
      if (
        entry?.table === table ||
        (entry?.table && getTableName(entry.table) === tableName)
      ) {
        queryModel = entry;
        break;
      }
    }
  }

  const dataPromise: Promise<T[]> = queryModel
    ? queryModel.findMany({
        where,
        limit,
        offset,
        with: withRelations,
        orderBy,
      })
    : (db
        .select()
        .from(table as any)
        .where(where)
        .limit(limit)
        .offset(offset) as any);

  const countPromise = db
    .select({ total: count() })
    .from(table as any)
    .where(where);

  const [rawItems, [countResult]] = await Promise.all([
    dataPromise,
    countPromise,
  ]);

  const items: R[] = transform
    ? rawItems.map(transform)
    : (rawItems as unknown as R[]);

  return PaginatedResult.create({
    items,
    totalItems: Number(countResult?.total ?? 0),
    page,
    pageSize,
  });
}

export interface PaginateQueryOptions<T = any, R = T> {
  filter?: PaginationParams;
  transform?: (item: T) => R;
}

/**
 * Pagina cualquier consulta personalizada (ej. joins o groupBy complejos).
 *
 * @example
 * return paginateQuery(
 *   db.select().from(bagsTable).where(...),
 *   db.select({ total: count() }).from(bagsTable).where(...),
 *   { filter, transform: (r) => BagMapper.toDomain(r) }
 * );
 */
export async function paginateQuery<T = any, R = T>(
  query: any,
  countQuery: any,
  options: PaginateQueryOptions<T, R> = {},
): Promise<PaginatedResult<R>> {
  const { limit, offset, page, pageSize } = calculatePagination(options.filter);

  const [rawItems, [countResult]] = await Promise.all([
    query.limit(limit).offset(offset),
    countQuery,
  ]);

  const items: R[] = options.transform
    ? rawItems.map(options.transform)
    : (rawItems as unknown as R[]);

  const total =
    typeof countResult === 'object' && countResult !== null
      ? Number(countResult.total ?? countResult.count ?? 0)
      : Number(countResult ?? 0);

  return PaginatedResult.create({
    items,
    totalItems: total,
    page,
    pageSize,
  });
}
