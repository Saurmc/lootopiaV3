import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { ConvertAccountDto } from './dto/convert-account.dto';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ access_token: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ access_token: string }> {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/guest
   * Connexion / création d'un compte invité via l'UUID du device.
   * Appelé au 1er lancement de l'app mobile (après acceptation du consentement).
   * Idempotent : retourne toujours le même compte pour le même device_token.
   */
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  loginAsGuest(
    @Body() dto: GuestLoginDto,
  ): Promise<{ access_token: string; is_new: boolean }> {
    return this.authService.loginAsGuest(dto);
  }

  /**
   * PATCH /auth/convert
   * Convertit le compte invité courant en compte complet (email + password).
   * Nécessite d'être authentifié en tant qu'invité.
   * Conserve le même user_id → progressions et badges préservés.
   */
  @Patch('convert')
  @UseGuards(Auth)
  @HttpCode(HttpStatus.OK)
  convertAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConvertAccountDto,
  ): Promise<{ access_token: string }> {
    return this.authService.convertAccount(user.id, dto);
  }
}
