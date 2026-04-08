import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

/**
 * Combinaison JwtAuthGuard + RolesGuard.
 * Usage : @Auth(Role.ADMIN) ou @Auth(Role.PARTNER, Role.ADMIN)
 * Sans rôle : @Auth() — authentifié uniquement, tous rôles acceptés.
 */
export function Auth(...roles: Role[]) {
  return applyDecorators(
    ...(roles.length ? [Roles(...roles)] : []),
    UseGuards(JwtAuthGuard, RolesGuard),
  );
}
