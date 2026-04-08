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

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user: AuthenticatedUser) {
    await this.rgpdService.deleteAccount(user.id);
  }
}
