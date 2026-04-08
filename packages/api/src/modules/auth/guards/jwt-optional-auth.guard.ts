import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard JWT optionnel : laisse passer la requête même sans token valide.
 * request.user sera null/undefined si le visiteur est en mode invité.
 */
@Injectable()
export class JwtOptionalAuthGuard extends AuthGuard('jwt-optional') {
  handleRequest<T>(_err: unknown, user: T): T {
    // Ne lève pas d'exception si pas de token — retourne null (mode invité)
    return user;
  }

  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
