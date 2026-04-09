import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ZonesService } from './zones.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';

@Controller('hunts/:huntId/zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  /**
   * GET /hunts/:huntId/zones — liste les zones d'une chasse (public)
   */
  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  findAll(@Param('huntId') huntId: string) {
    return this.zonesService.findByHunt(huntId);
  }

  /**
   * POST /hunts/:huntId/zones — créer une zone (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createZone(
    @Param('huntId') huntId: string,
    @Body() dto: CreateZoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.zonesService.createZone(huntId, user.id, dto);
  }

  /**
   * PATCH /hunts/:huntId/zones/:zoneId — modifier une zone (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Patch(':zoneId')
  updateZone(
    @Param('huntId') huntId: string,
    @Param('zoneId') zoneId: string,
    @Body() dto: UpdateZoneDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.zonesService.updateZone(huntId, zoneId, user.id, dto);
  }

  /**
   * DELETE /hunts/:huntId/zones/:zoneId — supprimer une zone (partenaire propriétaire ou admin)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Delete(':zoneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteZone(
    @Param('huntId') huntId: string,
    @Param('zoneId') zoneId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.zonesService.deleteZone(huntId, zoneId, user.id);
  }
}
