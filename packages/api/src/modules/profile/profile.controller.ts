import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { BadgesService } from '../badges/badges.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('me')
@Auth()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly badgesService: BadgesService,
  ) {}

  /**
   * GET /me/profile — profil complet du joueur (email, pseudo, avatar, role, is_guest, consent_gps)
   */
  @Get('profile')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getProfile(user.id);
  }

  /**
   * PATCH /me/profile — mise à jour du pseudo et/ou de l'avatar
   */
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(user.id, dto);
  }

  /**
   * GET /me/stats — total de points, chasses jouées/terminées, nombre de badges
   */
  @Get('stats')
  getStats(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getStats(user.id);
  }

  /**
   * GET /me/progress — chasses en cours (non terminées), pour reprise de progression
   */
  @Get('progress')
  getActiveProgresses(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getActiveProgresses(user.id);
  }

  /**
   * GET /me/hunts — historique complet des chasses du joueur
   */
  @Get('hunts')
  getHuntHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.profileService.getHuntHistory(user.id);
  }

  /**
   * GET /me/badges — badges obtenus avec métadonnées (label, description, emoji)
   */
  @Get('badges')
  getBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.badgesService.getUserBadges(user.id);
  }

  /**
   * GET /me/badges/catalog — catalogue complet des badges avec statut earned/non-earned
   * Utile pour afficher tous les badges (débloqués en couleur, verrouillés en grisé)
   */
  @Get('badges/catalog')
  getBadgeCatalog(@CurrentUser() user: AuthenticatedUser) {
    return this.badgesService.getBadgeCatalogForUser(user.id);
  }
}
