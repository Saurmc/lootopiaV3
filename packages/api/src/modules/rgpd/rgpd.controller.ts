import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RgpdService } from './rgpd.service';
import { UpdateConsentDto } from './dto/update-consent.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('me')
@Auth()
export class RgpdController {
  constructor(private readonly rgpdService: RgpdService) {}

  @Get('consent')
  async getConsent(@CurrentUser() user: AuthenticatedUser) {
    const consent = await this.rgpdService.getGpsConsent(user.id);
    return { consent_gps: consent };
  }

  @Patch('consent')
  async updateConsent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateConsentDto,
  ) {
    await this.rgpdService.updateGpsConsent(user.id, dto.consent_gps);
    return { message: 'Consent updated' };
  }

  /**
   * PATCH /me/password — changement de mot de passe
   * Non accessible aux comptes invités (rejected dans UsersService)
   */
  @Patch('password')
  async updatePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePasswordDto,
  ) {
    await this.rgpdService.updatePassword(
      user.id,
      dto.current_password,
      dto.new_password,
      dto.new_password_confirm,
    );
    return { message: 'Password updated' };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.rgpdService.deleteAccount(user.id);
  }
}
