import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// TODO: guard vérification rôles
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: implement
    return true;
  }
}
