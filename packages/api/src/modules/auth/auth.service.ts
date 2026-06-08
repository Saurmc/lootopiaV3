import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { InvitationsService } from '../invitations/invitations.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterPartnerDto } from './dto/register-partner.dto';
import { LoginDto } from './dto/login.dto';
import { GuestLoginDto } from './dto/guest-login.dto';
import { ConvertAccountDto } from './dto/convert-account.dto';
import { Role } from '../../common/enums/role.enum';
import { MailService } from '../mail/mail.service';
import { UserEntity } from '../users/entities/user.entity';

const BCRYPT_ROUNDS = 12;
const ACCESS_EXPIRES_IN = '1h';
const REFRESH_EXPIRES_IN = '30d';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

interface RefreshPayload {
  sub: string;
  type: 'refresh';
  version: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly invitationsService: InvitationsService,
    private readonly mailService: MailService,
  ) {}

  private generateTokenPair(user: UserEntity): TokenPair {
    const access_token = this.jwtService.sign(
      { sub: user.id, role: user.role },
      { expiresIn: ACCESS_EXPIRES_IN },
    );
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh', version: user.refresh_token_version },
      { expiresIn: REFRESH_EXPIRES_IN },
    );
    return { access_token, refresh_token };
  }

  async register(dto: RegisterDto): Promise<TokenPair> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createUser(
      dto.email,
      passwordHash,
      dto.role ?? Role.PLAYER,
      dto.pseudo,
    );
    return this.generateTokenPair(user);
  }

  async registerPartner(dto: RegisterPartnerDto): Promise<TokenPair> {
    const invitation = await this.invitationsService.validateToken(dto.token);
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.createUser(invitation.email, passwordHash, Role.PARTNER);
    await this.usersService.updateProfile(user.id, { pseudo: `${dto.firstName} ${dto.lastName}` });
    await this.invitationsService.markAsUsed(invitation.id);
    await this.mailService.sendPartnerWelcome(invitation.email);
    return this.generateTokenPair(user);
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.is_blocked) {
      throw new UnauthorizedException('Account suspended. Contact an administrator.');
    }
    return this.generateTokenPair(user);
  }

  async loginAsGuest(dto: GuestLoginDto): Promise<TokenPair & { is_new: boolean }> {
    const existing = await this.usersService.findByDeviceToken(dto.device_token);
    const user = await this.usersService.findOrCreateGuest(
      dto.device_token,
      dto.consent_gps ?? false,
    );
    return { ...this.generateTokenPair(user), is_new: !existing };
  }

  async convertAccount(userId: string, dto: ConvertAccountDto): Promise<TokenPair> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.convertGuestToUser(userId, dto.email, passwordHash);
    return this.generateTokenPair(user);
  }

  async refreshToken(token: string): Promise<TokenPair> {
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.is_blocked) {
      throw new UnauthorizedException('Account suspended');
    }
    if (user.refresh_token_version !== payload.version) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    return this.generateTokenPair(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.invalidateRefreshTokens(userId);
  }
}
