import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum';
import { AdminService } from './admin.service';
import { InvitationsService } from '../invitations/invitations.service';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto';

@Controller('admin')
@Auth(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly invitationsService: InvitationsService,
  ) {}

  /**
   * GET /admin/stats — KPI globaux de la plateforme (admin uniquement)
   * Couvre US27 (dashboard), US28 (joueurs/chasses), US29 (participation/complétion).
   */
  @Get('stats')
  getGlobalStats() {
    return this.adminService.getGlobalStats();
  }

  /**
   * POST /admin/invitations — Envoie une invitation d'inscription partenaire (US03)
   * Génère un token 72h, envoie un email avec le lien d'activation.
   */
  @Post('invitations')
  @HttpCode(HttpStatus.CREATED)
  createInvitation(
    @Body() dto: CreateInvitationDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.invitationsService.create(dto, admin.id);
  }

  /**
   * GET /admin/invitations — Liste toutes les invitations (en attente / utilisées / expirées)
   */
  @Get('invitations')
  listInvitations() {
    return this.invitationsService.findAll();
  }

  /**
   * GET /admin/partners — Liste tous les comptes partenaires avec leurs stats
   */
  @Get('partners')
  getPartners() {
    return this.adminService.getPartners();
  }

  /**
   * PATCH /admin/partners/:id/block — Suspend un compte partenaire (bloque le login)
   */
  @Patch('partners/:id/block')
  @HttpCode(HttpStatus.NO_CONTENT)
  blockPartner(@Param('id') id: string) {
    return this.adminService.setPartnerBlocked(id, true);
  }

  /**
   * PATCH /admin/partners/:id/unblock — Réactive un compte partenaire suspendu
   */
  @Patch('partners/:id/unblock')
  @HttpCode(HttpStatus.NO_CONTENT)
  unblockPartner(@Param('id') id: string) {
    return this.adminService.setPartnerBlocked(id, false);
  }
}
