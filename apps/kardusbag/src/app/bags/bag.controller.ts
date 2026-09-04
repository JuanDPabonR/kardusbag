// apps/kardusbag/src/app/bags/bag.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { CreateBagUseCase, GetBagByIdUseCase } from '@kardusbag/bag'; // O la ruta de tu lib
import { CreateBagDto } from './dtos/create-bag.dto';

@Controller('bags')
export class BagController {
  constructor(
    private readonly createBagUseCase: CreateBagUseCase,
    private readonly getBagByIdUseCase: GetBagByIdUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateBagDto) {
    return await this.createBagUseCase.execute(dto);
  }

  @Get(':id')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.getBagByIdUseCase.execute(id);
  }
}
