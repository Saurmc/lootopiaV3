import { Controller, Get } from '@nestjs/common';
import { StatsService } from './stats.service';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /stats/hunts — KPI par chasse.
   * PARTNER : uniquement ses chasses.
   * ADMIN : toutes les chasses.
   */
  @Auth(Role.PARTNER, Role.ADMIN)
  @Get('hunts')
  getHuntsStats(@CurrentUser() user: AuthenticatedUser) {
    return this.statsService.getHuntsStats(user.id, user.role);
  }
}
