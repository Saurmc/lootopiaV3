import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { NearbyQueryDto } from './dto/nearby-query.dto';

@Controller('hunts')
@UseGuards(JwtOptionalAuthGuard)
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  /**
   * GET /hunts — liste toutes les chasses actives
   * GET /hunts?lat=48.8&lng=2.3&radius=5000 — chasses dans un rayon (mode carte)
   * Accessible en mode invité ET connecté.
   */
  @Get()
  findAll(
    @Query() query: NearbyQueryDto,
    @CurrentUser() _user: AuthenticatedUser | null,
  ) {
    if (query.lat !== undefined && query.lng !== undefined) {
      return this.huntsService.findNearby(query.lat, query.lng, query.radius);
    }
    return this.huntsService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() _user: AuthenticatedUser | null,
  ) {
    return this.huntsService.findById(id);
  }
}
