import { Injectable, Inject } from '@nestjs/common';
import {
  BAG_REPOSITORY_PORT,
  type BagRepositoryPort,
} from '../../domain/ports/bag-repository.port';
import { BagNotFoundException } from '../../domain/exceptions/bag.exceptions';
import { Bag } from '../../domain/entities/bag.entity';

@Injectable()
export class GetBagByIdUseCase {
  constructor(
    @Inject(BAG_REPOSITORY_PORT)
    private readonly bagRepository: BagRepositoryPort,
  ) {}

  async execute(id: string): Promise<Bag> {
    const bag = await this.bagRepository.findById(id);
    if (!bag) {
      throw new BagNotFoundException(id);
    }
    return bag;
  }
}
