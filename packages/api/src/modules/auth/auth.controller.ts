import { Body, Controller, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthService, TokenPair } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { ConvertAccountDto } from './dto/convert-account.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Auth } from '../../common/guards/auth-roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<TokenPair> {
    return this.authService.register(dto);
  }

  @Post('register/partner')
  @HttpCode(HttpStatus.CREATED)
  registerPartner(@Body() dto: RegisterPartnerDto): Promise<TokenPair> {
    return this.authService.registerPartner(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<TokenPair> {
    return this.authService.login(dto);
  }

  @Post('guest')
  @HttpCode(HttpStatus.OK)
  loginAsGuest(@Body() dto: GuestLoginDto): Promise<TokenPair & { is_new: boolean }> {
    return this.authService.loginAsGuest(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.authService.refreshToken(dto.refresh_token);
  }

  @Patch('convert')
  @UseGuards(Auth)
  @HttpCode(HttpStatus.OK)
  convertAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConvertAccountDto,
  ): Promise<TokenPair> {
    return this.authService.convertAccount(user.id, dto);
  }

  @Post('logout')
  @UseGuards(Auth)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.id);
  }
}
