import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { HrmLoginResponse, HrmEmployee } from './interfaces/hrm-response.interface.js';
import { IHrmApiService } from '../../domain/interface/hrm-api.interface.js';

@Injectable()
export class HrmApiService implements IHrmApiService {
    private readonly HRM_BASE_URL = 'https://hrm-dev.edl.com.la/api';

    constructor(private readonly httpService: HttpService) { }

    // 1. ฟังก์ชัน Login เพื่อดึง Token
    async login(username: string, password: string): Promise<string> {
        try {
            const response = await firstValueFrom(
                this.httpService.post<HrmLoginResponse>(`${this.HRM_BASE_URL}/auth/login`, {
                    username,
                    password,
                }),
            );
            return response.data.token;
        } catch {
            throw new UnauthorizedException('HRM Login failed: Invalid credentials');
        }
    }

    // 2. ฟังก์ชันสำหรับค้นหาพนักงานโดยแนบ Token
    async getEmployeeByCode(token: string, empCode: string): Promise<HrmEmployee> {
        try {
            const response = await firstValueFrom(
                this.httpService.get<{ data: HrmEmployee }>(`${this.HRM_BASE_URL}/employees/${empCode}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }),
            );
            return response.data.data;
        } catch {
            throw new NotFoundException(`HRM Employee with code ${empCode} not found`);
        }
    }
}
