export class CollectionNotFoundException extends Error {
  constructor(idOrSlug: string) {
    super(
      `La colección identificada con "${idOrSlug}" no existe o fue archivada.`,
    );
    this.name = 'CollectionNotFoundException';
  }
}

export class CollectionSlugAlreadyExistsException extends Error {
  constructor(slug: string) {
    super(`El slug "${slug}" ya se encuentra registrado.`);
    this.name = 'CollectionSlugAlreadyExistsException';
  }
}

export class CollectionInvalidDatesException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectionInvalidDatesException';
  }
}
