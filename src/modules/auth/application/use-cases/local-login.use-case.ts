import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto.js';
import * as bcrypt from 'bcrypt';
import * as authUserRepositoryInterface from '../../domain/repositories/auth-user.repository.interface.js';

@Injectable()
export class LocalLoginUseCase {
    constructor(
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
        private readonly jwtService: JwtService,
    ) { }

    async execute(dto: LoginDto) {
        // 1. ค้นหาผู้ใช้ในฐานข้อมูลของเรา (เช็คว่าผู้ใช้นี้เคยถูก Sync มาหรือยัง)
        const user = await this.authUserRepository.findByUsernameOrEmpCode(dto.username);

        if (!user) {
            throw new UnauthorizedException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ ກະລຸນາເຂົ້າສູ່ລະບົບຜ່ານ HRM ກ່ອນ (User not found)');
        }

        // 2. ตรวจสอบรหัสผ่านที่เก็บไว้ในระบบของเราด้วย bcrypt
        const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (Invalid credentials)');
        }

        if (!user.isActive || user.deletedAt) {
            throw new UnauthorizedException('ບັນຊີຂອງທ່ານຖືກລະງັບ ຫຼື ຖືກລົບແລ້ວ (Account is disabled)');
        }

        // 3. อัปเดตเวลาเข้าสู่ระบบล่าสุด (Last Login)
        await this.authUserRepository.updateLastLogin(user.id);

        // 4. สร้าง Local JWT Token
        const payload = {
            sub: user.id,
            empCode: user.employeeCode,
            fullName: user.fullName,
            role: user.role,
            department: user.department,
            division: user.division,
            unit: user.unit,
        };

        const accessToken = this.jwtService.sign(payload);

        return {
            accessToken,
            user: {
                id: user.id,
                employeeCode: user.employeeCode,
                fullName: user.fullName,
                role: user.role,
                canView: user.canView,
                canUpload: user.canUpload,
                canEdit: user.canEdit,
                canDelete: user.canDelete,
                canDownload: user.canDownload,
                department: user.department,
                division: user.division,
                unit: user.unit,
            }
        };
    }
}
