import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

// TODO: JWT guard
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    // TODO: implement
    return true;
  }
}
