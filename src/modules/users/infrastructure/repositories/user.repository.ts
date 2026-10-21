import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UpdateUserDto } from '../../application/dto/update-user.dto.js';
import { AuditAction, User, UserRole } from '@prisma/client';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: {
        skip: number;
        take: number;
        search?: string;
        role?: UserRole;
        isActive?: boolean;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, search, role, isActive } = params;

        const whereCondition: any = {
            deletedAt: null,
        };

        if (search) {
            whereCondition.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
                { employeeCode: { contains: search, mode: 'insensitive' } },
                { department: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (role) {
            whereCondition.role = role;
        }

        if (isActive !== undefined) {
            whereCondition.isActive = isActive;
        }

        const [data, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where: whereCondition,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    employeeCode: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    division: true,
                    unit: true,
                    position: true,
                    phone: true,
                    role: true,
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
            }),
            this.prisma.user.count({ where: whereCondition }),
        ]);

        return { data, total };
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.user.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true,
                employeeCode: true,
                username: true,
                email: true,
                fullName: true,
                department: true,
                division: true,
                unit: true,
                position: true,
                phone: true,
                role: true,
                canView: true,
                canUpload: true,
                canEdit: true,
                canDelete: true,
                canDownload: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        createdContracts: { where: { deletedAt: null } },
                        uploadedAttachments: { where: { deletedAt: null } },
                        downloadLogs: true,
                    },
                },
            },
        });
    }

    async findByEmployeeCode(employeeCode: string): Promise<User | null> {
        return this.prisma.user.findUnique({
            where: { employeeCode },
        });
    }

    async createOrRestoreFromHrm(
        data: {
            employeeCode: string;
            username: string;
            email: string;
            passwordHash: string;
            fullName: string;
            department?: string;
            division?: string;
            unit?: string;
            position?: string;
            phone?: string;
            role: UserRole;
            canView: boolean;
            canUpload: boolean;
            canEdit: boolean;
            canDelete: boolean;
            canDownload: boolean;
        },
        currentUserId: string,
    ): Promise<any> {
        return this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.upsert({
                where: { employeeCode: data.employeeCode },
                update: {
                    username: data.username,
                    email: data.email,
                    passwordHash: data.passwordHash,
                    fullName: data.fullName,
                    department: data.department,
                    division: data.division,
                    unit: data.unit,
                    position: data.position,
                    phone: data.phone,
                    role: data.role,
                    canView: data.canView,
                    canUpload: data.canUpload,
                    canEdit: data.canEdit,
                    canDelete: data.canDelete,
                    canDownload: data.canDownload,
                    isActive: true,
                    deletedAt: null,
                },
                create: {
                    ...data,
                    isActive: true,
                },
                select: {
                    id: true,
                    employeeCode: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    division: true,
                    unit: true,
                    position: true,
                    phone: true,
                    role: true,
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    createdAt: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    newValues: {
                        syncedEmployeeCode: newUser.employeeCode,
                        fullName: newUser.fullName,
                        role: newUser.role,
                        canView: newUser.canView,
                        canUpload: newUser.canUpload,
                        canEdit: newUser.canEdit,
                        canDelete: newUser.canDelete,
                        canDownload: newUser.canDownload,
                    },
                },
            });

            return newUser;
        });
    }

    async updateWithAudit(
        id: string,
        dto: UpdateUserDto,
        oldUser: any,
        currentUserId: string,
    ): Promise<any> {
        return this.prisma.$transaction(async (tx) => {
            const updatedUser = await tx.user.update({
                where: { id },
                data: dto,
                select: {
                    id: true,
                    employeeCode: true,
                    username: true,
                    email: true,
                    fullName: true,
                    department: true,
                    division: true,
                    unit: true,
                    position: true,
                    phone: true,
                    role: true,
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    updatedAt: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    oldValues: {
                        role: oldUser.role,
                        isActive: oldUser.isActive,
                        canView: oldUser.canView,
                        canUpload: oldUser.canUpload,
                        canEdit: oldUser.canEdit,
                        canDelete: oldUser.canDelete,
                        canDownload: oldUser.canDownload,
                    },
                    newValues: JSON.parse(JSON.stringify(dto)),
                },
            });

            return updatedUser;
        });
    }

    async softDeleteWithAudit(id: string, oldUser: any, currentUserId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    oldValues: { deletedUserId: id, employeeCode: oldUser.employeeCode, username: oldUser.username },
                    newValues: { deletedAt: new Date(), isActive: false },
                },
            });
        });
    }
}
