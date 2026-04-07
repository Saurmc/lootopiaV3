import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RgpdService } from './rgpd.service';
import { UpdateConsentDto } from './dto/update-consent.dto';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class RgpdController {
  constructor(private readonly rgpdService: RgpdService) {}

  // GET /me/consent — état du consentement GPS
  @Get('consent')
  async getConsent(@Request() req: { user: { id: string } }) {
    const consent = await this.rgpdService.getGpsConsent(req.user.id);
    return { consent_gps: consent };
  }

  // PATCH /me/consent — mise à jour du consentement GPS
  @Patch('consent')
  async updateConsent(
    @Request() req: { user: { id: string } },
    @Body() dto: UpdateConsentDto,
  ) {
    await this.rgpdService.updateGpsConsent(req.user.id, dto.consent_gps);
    return { message: 'Consent updated' };
  }

  // DELETE /me — suppression du compte et de toutes les données associées
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Request() req: { user: { id: string } }) {
    await this.rgpdService.deleteAccount(req.user.id);
  }
}
