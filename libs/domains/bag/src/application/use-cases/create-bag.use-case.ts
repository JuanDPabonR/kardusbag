import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BAG_REPOSITORY_PORT,
  type BagRepositoryPort,
} from '../../domain/ports/bag-repository.port';
import { type BagEntity, Bag } from '../../domain/entities/bag.entity';
import { BagAlreadyExistsException } from '../../domain/exceptions/bag.exceptions';

export type CreateBagCommand = Omit<
  BagEntity,
  'id' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

@Injectable()
export class CreateBagUseCase {
  constructor(
    @Inject(BAG_REPOSITORY_PORT)
    private readonly bagRepository: BagRepositoryPort,
  ) {}

  async execute(command: CreateBagCommand): Promise<Bag> {
    const existing = await this.bagRepository.findBySlug(command.slug);
    if (existing) {
      throw new BagAlreadyExistsException(command.slug);
    }

    const newBag = new Bag({
      id: randomUUID(),
      ...command,
    });

    await this.bagRepository.save(newBag);
    return newBag;
  }
}
