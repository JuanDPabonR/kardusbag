import { CollectionInvalidDatesException } from '../exceptions/collection.exception';

export interface CollectionProps {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  bannerUrl?: string | null;
  isActive: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  createdAt: Date;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}

export class Collection {
  private constructor(private readonly props: CollectionProps) {
    this.validateDates(props.startsAt, props.endsAt);
  }

  public static create(
    params: Omit<
      CollectionProps,
      'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
    > & { id?: string },
  ): Collection {
    const now = new Date();
    const slug = params.slug || Collection.generateSlug(params.name);

    return new Collection({
      ...params,
      id: params.id || crypto.randomUUID(),
      slug,
      isActive: params.isActive ?? true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  public static reconstitute(props: CollectionProps): Collection {
    return new Collection(props);
  }

  private validateDates(startsAt?: Date | null, endsAt?: Date | null): void {
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw new CollectionInvalidDatesException(
        'La fecha final debe ser posterior a la fecha inicial.',
      );
    }
  }

  public static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public updateDetails(params: {
    name?: string;
    slug?: string;
    description?: string | null;
    bannerUrl?: string | null;
    isActive?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
  }): void {
    const nextStartsAt =
      params.startsAt !== undefined ? params.startsAt : this.props.startsAt;
    const nextEndsAt =
      params.endsAt !== undefined ? params.endsAt : this.props.endsAt;
    this.validateDates(nextStartsAt, nextEndsAt);

    if (params.name) this.props.name = params.name;
    if (params.slug) this.props.slug = params.slug;
    if (params.description !== undefined)
      this.props.description = params.description;
    if (params.bannerUrl !== undefined) this.props.bannerUrl = params.bannerUrl;
    if (params.isActive !== undefined) this.props.isActive = params.isActive;
    this.props.startsAt = nextStartsAt;
    this.props.endsAt = nextEndsAt;
    this.props.updatedAt = new Date();
  }

  public markAsDeleted(): void {
    this.props.deletedAt = new Date();
    this.props.isActive = false;
    this.props.updatedAt = new Date();
  }

  public toPrimitives(): CollectionProps {
    return { ...this.props };
  }
}
