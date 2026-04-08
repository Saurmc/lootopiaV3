import { Controller, Get } from '@nestjs/common';
import { Auth } from '../../common/guards/auth-roles.guard';
import { Role } from '../../common/enums/role.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@Auth(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/stats — KPI globaux de la plateforme (admin uniquement)
   * Couvre US27 (dashboard), US28 (joueurs/chasses), US29 (participation/complétion).
   */
  @Get('stats')
  getGlobalStats() {
    return this.adminService.getGlobalStats();
  }
}
