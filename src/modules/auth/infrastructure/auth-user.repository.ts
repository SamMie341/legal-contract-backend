import { Injectable } from '@nestjs/common';
import { User, UserRole } from '@prisma/client';
import { IAuthUserRepository } from '../domain/repositories/auth-user.repository.interface.js';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';

@Injectable()
export class AuthUserRepository implements IAuthUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByUsernameOrEmpCode(username: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: {
                OR: [
                    { employeeCode: username },
                    { username: username },
                ],
            },
        });
    }

    async findByEmployeeCode(empCode: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { employeeCode: empCode },
        });
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.prisma.user.update({
            where: { id: userId },
            data: { lastLoginAt: new Date() },
        });
    }

    async createSyncedEmployee(data: {
        empCode: string;
        email: string;
        fullName: string;
        department: string;
        division: string;
        unit: string;
        position?: string;
        phone?: string;
        passwordHash: string;
        role: UserRole;
    }): Promise<User> {
        return this.prisma.user.create({
            data: {
                employeeCode: data.empCode,
                username: data.empCode,
                email: data.email,
                passwordHash: data.passwordHash,
                fullName: data.fullName,
                department: data.department,
                division: data.division,
                unit: data.unit,
                position: data.position,
                phone: data.phone,
                role: data.role,
            },
        });
    }

    async upsertHrmUser(data: any): Promise<User> {
        return this.prisma.user.upsert({
            where: { employeeCode: data.empCode },
            update: {
                fullName: data.fullName,
                department: data.department,
                division: data.division,
                unit: data.unit,
                position: data.position,
                email: data.email,
                phone: data.phone,
                passwordHash: data.passwordHash,
                lastLoginAt: new Date(),
            },
            create: {
                employeeCode: data.empCode,
                username: data.empCode,
                email: data.email,
                passwordHash: data.passwordHash,
                fullName: data.fullName,
                department: data.department,
                division: data.division,
                unit: data.unit,
                position: data.position,
                phone: data.phone,
                role: UserRole.VIEWER,
            },
        });
    }
}
