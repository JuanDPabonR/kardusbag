import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PromotionsAdminService } from '@kardusbag/promotions';
import { CreatePromotionDto } from '../dtos/create-promotion.dto';

@ApiTags('Admin - Promotions')
@Controller('admin/promotions')
export class PromotionsAdminController {
  constructor(
    private readonly promotionsAdminService: PromotionsAdminService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva promoción o cupón de descuento' })
  @ApiResponse({ status: 201, description: 'Promoción creada exitosamente' })
  async create(@Body() dto: CreatePromotionDto) {
    const promotion = await this.promotionsAdminService.create(dto);
    return promotion.toPrimitives();
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las promociones registradas' })
  async findAll() {
    const promotions = await this.promotionsAdminService.findAll();
    return promotions.map((p) => p.toPrimitives());
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una promoción por su ID' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const promotion = await this.promotionsAdminService.findById(id);
    return promotion.toPrimitives();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archivar lógicamente (soft delete) una promoción' })
  async softDelete(@Param('id', ParseUUIDPipe) id: string) {
    return await this.promotionsAdminService.softDelete(id);
  }
}
