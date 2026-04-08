import { Controller, Get } from '@nestjs/common';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ProfileService } from './profile.service';
import { BadgesService } from '../badges/badges.service';

@Controller('me')
@Auth()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly badgesService: BadgesService,
  ) {}

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
   * GET /me/badges — liste des badges obtenus par le joueur
   */
  @Get('badges')
  getBadges(@CurrentUser() user: AuthenticatedUser) {
    return this.badgesService.getUserBadges(user.id);
  }
}
