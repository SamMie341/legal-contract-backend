import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client'; // ดึง Enum มาจาก Prisma

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);