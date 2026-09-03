export class BagNotFoundException extends Error {
  constructor(identifier: string) {
    super(
      `El bolso con identificador o slug "${identifier}" no fue encontrado.`,
    );
    this.name = 'BagNotFoundException';
  }
}
