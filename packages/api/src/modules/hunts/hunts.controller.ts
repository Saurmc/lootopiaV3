import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { HuntsService } from './hunts.service';
import { JwtOptionalAuthGuard } from '../auth/guards/jwt-optional-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('hunts')
@UseGuards(JwtOptionalAuthGuard)
export class HuntsController {
  constructor(private readonly huntsService: HuntsService) {}

  // Accessible en mode invité et en mode connecté
  @Get()
  findAll(@CurrentUser() _user: AuthenticatedUser | null) {
    return this.huntsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() _user: AuthenticatedUser | null) {
    return this.huntsService.findById(id);
  }
}
