import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator.js';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. ดึงค่า Roles ที่ต้องการจาก Decorator
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // ถ้าไม่ได้แปะ @Roles() ไว้ แปลว่าใครที่ Login แล้วก็เข้าได้หมด
        if (!requiredRoles) {
            return true;
        }

        // 2. ดึงข้อมูล User จาก Request (ซึ่งถูกแนบมาโดย JwtAuthGuard แล้ว)
        const { user } = context.switchToHttp().getRequest();

        // 3. ตรวจสอบว่า Role ของ User ตรงกับที่อนุญาตหรือไม่
        const hasRole = requiredRoles.includes(user.role);

        if (!hasRole) {
            throw new ForbiddenException('ທ່ານບໍ່ມີສິດເຂົ້າເຖິງຂໍ້ມູນນີ້ (Forbidden: Insufficient Permissions)');
        }

        return true;
    }
}