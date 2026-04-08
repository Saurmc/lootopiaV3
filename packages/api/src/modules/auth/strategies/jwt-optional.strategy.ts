import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { JwtPayload } from './jwt.strategy';

/**
 * Stratégie JWT optionnelle : si aucun token n'est présent ou s'il est invalide,
 * la requête continue sans utilisateur (mode invité).
 * À utiliser avec @UseGuards(JwtOptionalAuthGuard).
 */
@Injectable()
export class JwtOptionalStrategy extends PassportStrategy(Strategy, 'jwt-optional') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.secret') || 'dev-secret-change-me',
    });
  }

  validate(payload: JwtPayload) {
    return { id: payload.sub, role: payload.role };
  }
}
