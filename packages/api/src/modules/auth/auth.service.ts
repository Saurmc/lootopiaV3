import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { ConvertAccountDto } from './dto/convert-account.dto';
import { Role } from '../../common/enums/role.enum';

const BCRYPT_ROUNDS = 12;

// Durée du JWT : 365 jours — "connecté jusqu'à désinstallation" (guests + users)
const JWT_EXPIRES_IN = '365d';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ access_token: string }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createUser(
      dto.email,
      passwordHash,
      dto.role ?? Role.PLAYER,
      dto.pseudo,
    );
    const token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: JWT_EXPIRES_IN },
    );
    return { access_token: token };
  }

  async login(dto: LoginDto): Promise<{ access_token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: JWT_EXPIRES_IN },
    );
    return { access_token: token };
  }

  /**
   * Connexion / création d'un compte invité via device_token.
   * Idempotent : le même device_token retourne toujours le même compte + un nouveau JWT.
   */
  async loginAsGuest(dto: GuestLoginDto): Promise<{ access_token: string; is_new: boolean }> {
    const existing = await this.usersService.findByDeviceToken(dto.device_token);
    const user = await this.usersService.findOrCreateGuest(
      dto.device_token,
      dto.consent_gps ?? false,
    );
    const token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: JWT_EXPIRES_IN },
    );
    return { access_token: token, is_new: !existing };
  }

  /**
   * Convertit un compte invité en compte complet.
   * Retourne un nouveau JWT avec les mêmes sub/role.
   */
  async convertAccount(
    userId: string,
    dto: ConvertAccountDto,
  ): Promise<{ access_token: string }> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.convertGuestToUser(userId, dto.email, passwordHash);
    const token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: JWT_EXPIRES_IN },
    );
    return { access_token: token };
  }
}
