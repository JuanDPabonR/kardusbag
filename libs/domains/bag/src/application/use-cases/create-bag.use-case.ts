import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BAG_REPOSITORY_PORT,
  BagRepositoryPort,
} from '../../domain/ports/bag-repository.port';
import {
  BagEntity,
  BagDimensions,
  Bag,
} from '../../domain/entities/bag.entity';

export interface CreateBagCommand {
  categoryId?: string;
  name: string;
  slug: string;
  skuPrefix?: string;
  description?: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  material?: string;
  dimensions?: BagDimensions;
  capacityLiters?: number;
  weightGrams?: number;
  hasLaptopSleeve?: boolean;
}

@Injectable()
export class CreateBagUseCase {
  constructor(
    @Inject(BAG_REPOSITORY_PORT)
    private readonly bagRepository: BagRepositoryPort,
  ) {}

  async execute(command: CreateBagCommand): Promise<Bag> {
    const existing = await this.bagRepository.findBySlug(command.slug);
    if (existing) {
      throw new Error(
        `Ya existe un bolso registrado con el slug "${command.slug}".`,
      );
    }

    const newBag = new Bag({
      id: randomUUID(),
      ...command,
    });

    await this.bagRepository.save(newBag);
    return newBag;
  }
}
