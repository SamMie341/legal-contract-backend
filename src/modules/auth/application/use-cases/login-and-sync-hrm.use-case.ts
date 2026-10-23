import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../dto/login.dto.js';
import * as bcrypt from 'bcrypt';
import * as hrmApiInterface from '../../domain/interface/hrm-api.interface.js';
import * as authUserRepositoryInterface from '../../domain/repositories/auth-user.repository.interface.js';

@Injectable()
export class LoginAndSyncHrmUseCase {
    constructor(
        @Inject(hrmApiInterface.HRM_API_SERVICE)
        private readonly hrmApiService: hrmApiInterface.IHrmApiService,
        @Inject(authUserRepositoryInterface.AUTH_USER_REPOSITORY)
        private readonly authUserRepository: authUserRepositoryInterface.IAuthUserRepository,
        private readonly jwtService: JwtService,
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
        const email = hrmEmployee.email || `${empCode}@edl.com.la`; // Fallback email

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

        // 5. คืนค่า User พร้อมข้อมูลสิทธิ์ครบถ้วน
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
                position: user.position,
                phone: user.phone,
                email: user.email,
            },
        };
    }
}
