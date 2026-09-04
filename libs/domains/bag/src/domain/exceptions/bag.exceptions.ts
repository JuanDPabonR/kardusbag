import { NotFoundError } from '@kardusbag/shared';

export abstract class BagException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BagAlreadyExistsException extends BagException {
  constructor(slug: string) {
    super(`A bag with slug "${slug}" already exists.`);
  }
}

export class BagNotFoundException extends NotFoundError {
  constructor(identifier: string) {
    super(`Bag with identifier "${identifier}" was not found.`);
  }
}

export class InvalidBagPriceException extends BagException {
  constructor(price: number) {
    super(`The price ${price} is invalid. Price must be greater than zero.`);
  }
}
