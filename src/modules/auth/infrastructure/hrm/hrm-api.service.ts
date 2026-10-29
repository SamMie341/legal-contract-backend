import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { HrmLoginResponse, HrmEmployee, HrmDepartmentItem, HrmDepartmentsResponse, HrmSyncResponse } from './interfaces/hrm-response.interface.js';
import { IHrmApiService } from '../../domain/interface/hrm-api.interface.js';

@Injectable()
export class HrmApiService implements IHrmApiService {
    private serviceTokenCache: { username: string; token: string; expiresAt: number } | null = null;

    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    private get baseUrl(): string {
        return this.configService.get<string>('HRM_BASE_URL') || 'https://api-test.edl.com.la/hrm/api';
    }

    private get timeoutMs(): number {
        return Number(this.configService.get('HRM_TIMEOUT')) || 30000;
    }

    // 1. ฟังก์ชัน Login เพื่อดึง Token (พร้อมระบบ Cache Token สำหรับ Service Account)
    async login(username: string, password: string): Promise<string> {
        // ถ้าเป็น Token ที่เคยดึงไว้และยังไม่หมดอายุ (Cache 45 นาที) ให้ใช้ต่อได้ทันทีเพื่อลด Round-trip
        if (
            this.serviceTokenCache &&
            this.serviceTokenCache.username === username &&
            Date.now() < this.serviceTokenCache.expiresAt
        ) {
            return this.serviceTokenCache.token;
        }

        try {
            const response = await firstValueFrom(
                this.httpService.post<HrmLoginResponse>(
                    `${this.baseUrl}/auth/login`,
                    { username, password },
                    { timeout: this.timeoutMs },
                ),
            );

            const token = response.data.token;

            // Cache token ໄວ້ 45 ນາທີ (HRM token ມີອາຍຸ 60 ນາທີ)
            this.serviceTokenCache = {
                username,
                token,
                expiresAt: Date.now() + 45 * 60 * 1000,
            };

            return token;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
                throw new BadRequestException(
                    `HRM Login timed out (${this.timeoutMs}ms exceeded): ເຊີເວີ HRM ຕອບສະໜອງຊ້າ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ`,
                );
            }
            if (error.code === 'ECONNREFUSED' || error.code === 'ENETUNREACH' || error.code === 'EHOSTUNREACH') {
                throw new BadRequestException(
                    `ບໍ່ສາມາດເຊື່ອມຕໍ່ລະບົບ HRM ໄດ້ (${error.code}): ເຄືອຂ່າຍບໍ່ສາມາດເຂົ້າເຖິງ HRM server ໄດ້`,
                );
            }
            throw new BadRequestException(
                `HRM Login failed: ${error.response?.data?.message || error.message || 'Invalid credentials'}`,
            );
        }
    }

    // 2. ฟังก์ชันสำหรับค้นหาพนักงานโดยแนบ Token
    async getEmployeeByCode(token: string, empCode: string): Promise<HrmEmployee> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<HrmSyncResponse>(
                    `${this.baseUrl}/hrms/employee?search=${encodeURIComponent(empCode)}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        timeout: this.timeoutMs,
                    },
                ),
            );

            const employees = response.data?.data?.employees || [];
            const employee =
                employees.find((e) => String(e.emp_code) === String(empCode)) ||
                employees[0];

            if (!employee) {
                throw new NotFoundException(`HRM Employee with code ${empCode} not found`);
            }

            return employee;
        } catch (error: any) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                throw new BadRequestException(
                    `HRM Employee lookup failed: timeout of ${this.timeoutMs}ms exceeded. ເຊີເວີ HRM ຕອບສະໜອງຊ້າ ກະລຸນາລອງໃໝ່ອີກຄັ້ງ`,
                );
            }
            const status = error.response?.status;
            if (status === 401) {
                // ເຄຍ Cache Token ຖ້າ Token ໝົດອາຍຸ
                this.serviceTokenCache = null;
            }
            if (status === 404) {
                throw new NotFoundException(`HRM Employee with code ${empCode} not found`);
            }
            throw new BadRequestException(
                `HRM Employee lookup failed: ${error.response?.data?.message || error.message}`,
            );
        }
    }

    // 3. ฟังก์ชันสำหรับดึงรายการแผนก/ฝ่ายจาก HRM
    async getDepartments(token: string): Promise<HrmDepartmentItem[]> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<HrmDepartmentsResponse>(`${this.baseUrl}/hrms/department`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    timeout: this.timeoutMs,
                }),
            );
            return response.data.data;
        } catch (error: any) {
            if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
                throw new BadRequestException(
                    `HRM fetch departments failed: timeout of ${this.timeoutMs}ms exceeded.`,
                );
            }
            if (error.response?.status === 401) {
                this.serviceTokenCache = null;
            }
            throw new BadRequestException(`HRM fetch departments failed: ${error.message}`);
        }
    }
}
