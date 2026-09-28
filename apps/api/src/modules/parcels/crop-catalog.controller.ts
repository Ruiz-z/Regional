import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CROP_CATALOG } from './crop-catalog';

// Sin restricción de rol: tanto Admin como Agricultor pueden crear
// parcelas/zonas y necesitan ver las sugerencias del catálogo.
@Controller('crop-catalog')
@UseGuards(JwtAuthGuard)
export class CropCatalogController {
  @Get()
  findAll() {
    return CROP_CATALOG;
  }
}
