export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type PaginationQuery = {
  limit?: unknown;
  offset?: unknown;
};

export type Pagination = {
  limit: number;
  offset: number;
};

export type Paginated<T> = {
  data: T[];
  pagination: Pagination & { total: number };
};

export function parsePagination(query: PaginationQuery): Pagination {
  const rawLimit = Number(query.limit ?? DEFAULT_LIMIT);
  const rawOffset = Number(query.offset ?? 0);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0;

  return { limit, offset };
}

export function paginated<T>(data: T[], total: number, pagination: Pagination): Paginated<T> {
  return {
    data,
    pagination: { ...pagination, total },
  };
}
