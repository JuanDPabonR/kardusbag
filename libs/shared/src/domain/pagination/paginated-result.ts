export interface PaginatedResultProps<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
}

export class PaginatedResult<T> {
  readonly items: readonly T[];
  readonly totalItems: number;
  readonly page: number;
  readonly pageSize: number;
  readonly pages: number;

  constructor(props: PaginatedResultProps<T>) {
    this.items = Object.freeze([...(props.items || [])]);
    this.totalItems = Math.max(0, props.totalItems || 0);
    this.page = Math.max(1, props.page || 1);
    this.pageSize = Math.max(1, props.pageSize || 10);
    this.pages =
      this.pageSize > 0 ? Math.ceil(this.totalItems / this.pageSize) : 0;
  }

  map<U>(fn: (item: T, index: number) => U): PaginatedResult<U> {
    return new PaginatedResult<U>({
      items: this.items.map(fn),
      totalItems: this.totalItems,
      page: this.page,
      pageSize: this.pageSize,
    });
  }

  static create<T>(props: PaginatedResultProps<T>): PaginatedResult<T> {
    return new PaginatedResult(props);
  }
}
