import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto.js';
import * as bcrypt from 'bcrypt';
import * as hrmApiInterface from '../../domain/interface/hrm-api.interface.js';
import * as authUserRepositoryInterface from '../../domain/repositories/auth-user.repository.interface.js';
import { getAccessibleModules, getPermissionsByModule } from '../../../../core/utils/division-helper.util.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';

@Injectable()
export class LoginAndSyncHrmUseCase {
    constructor(
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
        private readonly jwtService: JwtService,
        private readonly tokenVersionService: TokenVersionService,
    ) { }

    async execute(dto: LoginDto) {
        // 1. นำ Username/Password ไป Login ที่ HRM
        const hrmToken = await this.hrmApiService.login(dto.username, dto.password);

        // 2. ถ้า Login ผ่าน ให้นำ Token ไปค้นหาข้อมูลพนักงาน
        const empCode = dto.username;
        const hrmEmployee = await this.hrmApiService.getEmployeeByCode(hrmToken, empCode);

        // 3. เตรียมข้อมูล (Data Mapping) จาก HRM ให้ตรงกับ Prisma Schema ของเรา
        const fullName = `${hrmEmployee.first_name_la} ${hrmEmployee.last_name_la}`;
        const departmentName = hrmEmployee.office?.department?.department_name || '';
        const divisionName = hrmEmployee.office?.division?.division_name || '';
        const unitName = hrmEmployee.office?.unit?.unit_name || '';
        const positionName = hrmEmployee.office?.position?.pos_name || '';
        const email = hrmEmployee.email?.trim() || null; // Nullable if not provided

        // สร้างรหัสผ่านจำลองสำหรับการเข้าระบบแบบ Local
        const dummyPasswordHash = await bcrypt.hash(dto.password, 10);

        // 4. บันทึกหรืออัปเดตข้อมูลผู้ใช้ในระบบของเรา (Upsert)
        const user = await this.authUserRepository.upsertHrmUser({
            empCode: hrmEmployee.emp_code,
            email: email,
            passwordHash: dummyPasswordHash,
            fullName: fullName,
            department: departmentName,
            division: divisionName,
            unit: unitName,
            position: positionName,
            phone: hrmEmployee.phone || '',
        });

        const roleName = (user as any).roleRef?.name || user.role;
        const accessibleModules = getAccessibleModules(user);
        const permissionsByModule = getPermissionsByModule(user);
        const tokenVersion = (user as any).tokenVersion ?? 1;

        // Cache token version ໃນ Memory ສຳລັບ Pure Stateless Fast Check
        this.tokenVersionService.setVersion(user.id, tokenVersion);

        const accessPayload = {
            sub: user.id,
            empCode: user.employeeCode,
            username: user.username,
            fullName: user.fullName,
            role: roleName,
            roleId: (user as any).roleId,
            roleTitle: (user as any).roleRef?.title,
            department: user.department,
            division: user.division,
            unit: user.unit,
            position: user.position,
            tokenVersion,
            accessibleModules,
            permissionsByModule,
        };

        const accessToken = this.jwtService.sign(accessPayload, { expiresIn: '8h' });

        // Rotated Refresh Token ໃໝ່
        const refreshPayload = {
            sub: user.id,
            tokenVersion,
            type: 'refresh',
        };
        const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: '7d' });
        await this.authUserRepository.updateRefreshToken(user.id, refreshToken);

        // 5. ຄືນຄ່າ User ພ້ອມຂໍ້ມູນສິດຄົບຖ້ວນ
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                employeeCode: user.employeeCode,
                fullName: user.fullName,
                role: roleName,
                roleId: (user as any).roleId,
                roleTitle: (user as any).roleRef?.title,
                canView: user.canView,
                canUpload: user.canUpload,
                canEdit: user.canEdit,
                canDelete: user.canDelete,
                canDownload: user.canDownload,
                department: user.department,
                division: user.division,
                unit: user.unit,
                position: user.position,
                phone: user.phone,
                email: user.email,
                accessibleModules,
                permissionsByModule,
            },
        };
    }
}
