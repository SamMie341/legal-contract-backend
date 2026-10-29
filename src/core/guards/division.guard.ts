import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_MODULE_KEY } from '../decorators/required-module.decorator.js';
import { SystemModule } from '../constants/division.constant.js';
import { assertCanAccessModule } from '../utils/division-helper.util.js';

@Injectable()
export class DivisionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. ອ່ານຄ່າ Module ທີ່ຖືກກຳນົດຈາກ @RequiredModule()
        const requiredModule = this.reflector.getAllAndOverride<SystemModule>(REQUIRED_MODULE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // ຫາກບໍ່ມີການກຳນົດ @RequiredModule() ໃຫ້ຜ່ານໄດ້
        if (!requiredModule) {
            return true;
        }

        // 2. ດຶງຂໍ້ມູນ User ຈາກ Request
        const { user } = context.switchToHttp().getRequest();

        // 3. ກວດສອບສິດການເຂົ້າເຖິງໂມດູນຕາມ Division
        assertCanAccessModule(user, requiredModule);

        return true;
    }
}
