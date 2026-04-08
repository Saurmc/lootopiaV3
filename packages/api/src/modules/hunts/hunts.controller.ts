import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { ProgressService } from '../progress/progress.service';
import { ValidateStepDto } from '../progress/dto/validate-step.dto';
import { CreateHuntDto } from './dto/create-hunt.dto';
import { UpdateHuntDto } from './dto/update-hunt.dto';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { NearbyQueryDto } from './dto/nearby-query.dto';
import { Role } from '../../common/enums/role.enum';

@Controller('hunts')
export class HuntsController {
  constructor(
    private readonly huntsService: HuntsService,
    private readonly progressService: ProgressService,
  ) {}

  /**
   * POST /hunts — créer une nouvelle chasse (partenaire ou admin uniquement)
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createHunt(
    @Body() dto: CreateHuntDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.huntsService.createHunt(user.id, dto);
  }

  /**
   * PATCH /hunts/:id — modifier une chasse (partenaire propriétaire ou admin)
   * Retourne 404 si la chasse n'existe pas ou n'appartient pas au partenaire.
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Patch(':id')
  updateHunt(
    @Param('id') huntId: string,
    @Body() dto: UpdateHuntDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.huntsService.updateHunt(huntId, user.id, dto);
  }

  /**
   * DELETE /hunts/:id — supprimer une chasse (partenaire propriétaire ou admin)
   * Retourne 404 si la chasse n'existe pas ou n'appartient pas au partenaire.
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHunt(
    @Param('id') huntId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.huntsService.deleteHunt(huntId, user.id);
  }

  /**
   * GET /hunts — liste toutes les chasses actives
   * GET /hunts?q= — recherche textuelle
   * GET /hunts?lat=&lng=&radius= — chasses dans un rayon
   * Accessible en mode invité ET connecté.
   */
  @UseGuards(JwtOptionalAuthGuard)
  @Get()
  findAll(
    @Query() query: NearbyQueryDto,
    @CurrentUser() _user: AuthenticatedUser | null,
  ) {
    if (query.q) {
      return this.huntsService.search(query.q);
    }
    if (query.lat !== undefined && query.lng !== undefined) {
      return this.huntsService.findNearby(query.lat, query.lng, query.radius);
    }
    return this.huntsService.findAll();
  }

  @UseGuards(JwtOptionalAuthGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() _user: AuthenticatedUser | null,
  ) {
    return this.huntsService.getDetail(id);
  }

  /**
   * GET /hunts/:id/progress — progression du joueur sur la chasse (JWT requis)
   * Retourne les étapes avec leur statut et coordonnées GPS (si consentement donné).
   */
  @Auth()
  @Get(':id/progress')
  getProgress(
    @Param('id') huntId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.getProgressWithSteps(user.id, huntId);
  }

  /**
   * POST /hunts/:id/steps/:stepId/validate — valider une étape par proximité GPS
   * Vérifie via PostGIS que le joueur est dans le rayon de l'étape courante.
   */
  @Auth()
  @Post(':id/steps/:stepId/validate')
  @HttpCode(HttpStatus.OK)
  validateStep(
    @Param('id') huntId: string,
    @Param('stepId') stepId: string,
    @Body() dto: ValidateStepDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.validateStep(user.id, huntId, stepId, dto);
  }

  /**
   * POST /hunts/:id/join — rejoindre une chasse (JWT requis)
   * Crée une entrée de progression pour le joueur connecté.
   * Mode invité non supporté : la progression ne peut pas être sauvegardée.
   */
  @Auth()
  @Post(':id/join')
  @HttpCode(HttpStatus.CREATED)
  joinHunt(
    @Param('id') huntId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.joinHunt(user.id, huntId);
  }
}
