import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IUserRepository } from '../../domain/repositories/user.repository.interface.js';
import { UpdateUserDto } from '../../application/dto/update-user.dto.js';
import { AuditAction, User, UserRole } from '@prisma/client';
import {
    buildDefaultPermissionsForRole,
    resolveToPrismaModules,
    isGeneralContractDivision,
    isPowerContractDivision,
    isLegalAndDisputeDivision,
} from '../../../../core/utils/division-helper.util.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';

@Injectable()
export class UserRepository implements IUserRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenVersionService: TokenVersionService,
    ) { }

    async findAll(params: {
        skip: number;
        take: number;
        search?: string;
        role?: UserRole;
        isActive?: boolean;
        division?: string;
        department?: string;
    }): Promise<{ data: any[]; total: number }> {
        const { skip, take, search, role, isActive, division, department } = params;

        const andConditions: any[] = [{ deletedAt: null }];

        if (search) {
            andConditions.push({
                OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { employeeCode: { contains: search, mode: 'insensitive' } },
                    { department: { contains: search, mode: 'insensitive' } },
                ],
            });
        }

        if (role) {
            andConditions.push({ role });
        }

        if (isActive !== undefined) {
            andConditions.push({ isActive });
        }

        if (division) {
            const trimmedDiv = division.trim();
            if (isPowerContractDivision(trimmedDiv)) {
                andConditions.push({
                    OR: [
                        { division: { contains: 'ຊື້-ຂາຍໄຟ', mode: 'insensitive' } },
                        { division: { contains: 'ຊື້ຂາຍໄຟ', mode: 'insensitive' } },
                    ],
                });
            } else if (isGeneralContractDivision(trimmedDiv)) {
                andConditions.push({
                    OR: [
                        { division: { contains: 'ທົ່ວໄປ', mode: 'insensitive' } },
                        {
                            AND: [
                                { division: { contains: 'ສັນຍາ', mode: 'insensitive' } },
                                { division: { not: { contains: 'ຊື້-ຂາຍໄຟ' } } },
                                { division: { not: { contains: 'ຊື້ຂາຍໄຟ' } } },
                            ],
                        },
                    ],
                });
            } else if (isLegalAndDisputeDivision(trimmedDiv)) {
                andConditions.push({
                    OR: [
                        { division: { contains: 'ນິຕິກຳ', mode: 'insensitive' } },
                        { division: { contains: 'ນິຕິກໍາ', mode: 'insensitive' } },
                        { division: { contains: 'ຂັດແຍ່ງ', mode: 'insensitive' } },
                        { division: { contains: 'ຄະດີ', mode: 'insensitive' } },
                    ],
                });
            } else {
                andConditions.push({ division: { contains: trimmedDiv, mode: 'insensitive' } });
            }
        }

        if (department) {
            andConditions.push({ department: { contains: department.trim(), mode: 'insensitive' } });
        }

        const whereCondition = { AND: andConditions };

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
                    roleId: true,
                    roleRef: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            isSystem: true,
                            permissions: true,
                        },
                    },
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                    modulePermissions: {
                        select: {
                            module: true,
                            canView: true,
                            canUpload: true,
                            canEdit: true,
                            canDelete: true,
                            canDownload: true,
                        },
                    },
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
                modulePermissions: {
                    select: {
                        module: true,
                        canView: true,
                        canUpload: true,
                        canEdit: true,
                        canDelete: true,
                        canDownload: true,
                    },
                },
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
            email?: string | null;
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
            modulePermissions?: any[];
        },
        currentUserId: string,
    ): Promise<any> {
        return this.prisma.$transaction(async (tx) => {
            const { modulePermissions, ...userData } = data as any;
            const normalizedEmail = (userData.email && typeof userData.email === 'string') ? userData.email.trim() || null : null;

            let roleIdToSet = userData.roleId;
            let roleEnumToSet = userData.role;

            if (roleIdToSet) {
                const role = await tx.role.findUnique({ where: { id: roleIdToSet } });
                if (role && Object.values(UserRole).includes(role.name as any)) {
                    roleEnumToSet = role.name as UserRole;
                }
            } else if (roleEnumToSet) {
                const role = await tx.role.findUnique({ where: { name: String(roleEnumToSet) } });
                if (role) {
                    roleIdToSet = role.id;
                }
            }

            const newUser = await tx.user.upsert({
                where: { employeeCode: userData.employeeCode },
                update: {
                    username: userData.username,
                    email: normalizedEmail,
                    passwordHash: userData.passwordHash,
                    fullName: userData.fullName,
                    department: userData.department,
                    division: userData.division,
                    unit: userData.unit,
                    position: userData.position,
                    phone: userData.phone,
                    role: roleEnumToSet,
                    roleId: roleIdToSet,
                    canView: userData.canView,
                    canUpload: userData.canUpload,
                    canEdit: userData.canEdit,
                    canDelete: userData.canDelete,
                    canDownload: userData.canDownload,
                    isActive: true,
                    deletedAt: null,
                },
                create: {
                    ...userData,
                    email: normalizedEmail,
                    role: roleEnumToSet,
                    roleId: roleIdToSet,
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
                    roleId: true,
                    roleRef: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            isSystem: true,
                            permissions: true,
                        },
                    },
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    createdAt: true,
                },
            });

            // Upsert UserModulePermissions (either explicit or generated defaults)
            const permsToSet =
                modulePermissions && modulePermissions.length > 0
                    ? modulePermissions
                    : buildDefaultPermissionsForRole(userData.role, userData.division);

            for (const perm of permsToSet) {
                const targetModules = resolveToPrismaModules(perm.module);
                for (const prismaModule of targetModules) {
                    await tx.userModulePermission.upsert({
                        where: {
                            userId_module: {
                                userId: newUser.id,
                                module: prismaModule,
                            },
                        },
                        update: {
                            canView: perm.canView !== undefined ? perm.canView : true,
                            canUpload: perm.canUpload !== undefined ? perm.canUpload : false,
                            canEdit: perm.canEdit !== undefined ? perm.canEdit : false,
                            canDelete: perm.canDelete !== undefined ? perm.canDelete : false,
                            canDownload: perm.canDownload !== undefined ? perm.canDownload : false,
                        },
                        create: {
                            userId: newUser.id,
                            module: prismaModule,
                            canView: perm.canView !== undefined ? perm.canView : true,
                            canUpload: perm.canUpload !== undefined ? perm.canUpload : false,
                            canEdit: perm.canEdit !== undefined ? perm.canEdit : false,
                            canDelete: perm.canDelete !== undefined ? perm.canDelete : false,
                            canDownload: perm.canDownload !== undefined ? perm.canDownload : false,
                        },
                    });
                }
            }

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    targetUserId: newUser.id,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    newValues: {
                        action: 'CREATE_USER',
                        targetUser: {
                            id: newUser.id,
                            employeeCode: newUser.employeeCode,
                            username: newUser.username,
                            fullName: newUser.fullName,
                            department: newUser.department,
                            division: newUser.division,
                            unit: newUser.unit,
                            position: newUser.position,
                            role: newUser.role,
                            roleId: roleIdToSet,
                            isActive: true,
                        },
                        permissions: {
                            canView: newUser.canView,
                            canUpload: newUser.canUpload,
                            canEdit: newUser.canEdit,
                            canDelete: newUser.canDelete,
                            canDownload: newUser.canDownload,
                            modulePermissions: permsToSet,
                        },
                    },
                },
            });

            const freshNewUser = await tx.user.findUnique({
                where: { id: newUser.id },
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
                    roleId: true,
                    roleRef: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            isSystem: true,
                            permissions: true,
                        },
                    },
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    createdAt: true,
                    modulePermissions: {
                        select: {
                            module: true,
                            canView: true,
                            canUpload: true,
                            canEdit: true,
                            canDelete: true,
                            canDownload: true,
                        },
                    },
                },
            });

            return freshNewUser || newUser;
        });
    }

    async updateWithAudit(
        id: string,
        dto: UpdateUserDto,
        oldUser: any,
        currentUserId: string,
    ): Promise<any> {
        const result = await this.prisma.$transaction(async (tx) => {
            const { modulePermissions, ...userData } = dto;

            if (userData.roleId) {
                const role = await tx.role.findUnique({ where: { id: userData.roleId } });
                if (role && Object.values(UserRole).includes(role.name as any)) {
                    userData.role = role.name as UserRole;
                }
            } else if (userData.role) {
                const role = await tx.role.findUnique({ where: { name: String(userData.role) } });
                if (role) {
                    userData.roleId = role.id;
                }
            }

            await tx.user.update({
                where: { id },
                data: userData,
            });

            if (modulePermissions && modulePermissions.length > 0) {
                for (const perm of modulePermissions) {
                    const targetModules = resolveToPrismaModules(perm.module);
                    for (const prismaModule of targetModules) {
                        await tx.userModulePermission.upsert({
                            where: {
                                userId_module: {
                                    userId: id,
                                    module: prismaModule,
                                },
                            },
                            update: {
                                canView: perm.canView !== undefined ? perm.canView : true,
                                canUpload: perm.canUpload !== undefined ? perm.canUpload : false,
                                canEdit: perm.canEdit !== undefined ? perm.canEdit : false,
                                canDelete: perm.canDelete !== undefined ? perm.canDelete : false,
                                canDownload: perm.canDownload !== undefined ? perm.canDownload : false,
                            },
                            create: {
                                userId: id,
                                module: prismaModule,
                                canView: perm.canView !== undefined ? perm.canView : true,
                                canUpload: perm.canUpload !== undefined ? perm.canUpload : false,
                                canEdit: perm.canEdit !== undefined ? perm.canEdit : false,
                                canDelete: perm.canDelete !== undefined ? perm.canDelete : false,
                                canDownload: perm.canDownload !== undefined ? perm.canDownload : false,
                            },
                        });
                    }
                }
            } else if (modulePermissions !== undefined && Array.isArray(modulePermissions) && modulePermissions.length === 0) {
                // Clear custom overrides to revert to role template
                await tx.userModulePermission.deleteMany({
                    where: { userId: id },
                });
            }

            const updatedUser = await tx.user.findUnique({
                where: { id },
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
                    roleId: true,
                    roleRef: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            isSystem: true,
                            permissions: true,
                        },
                    },
                    canView: true,
                    canUpload: true,
                    canEdit: true,
                    canDelete: true,
                    canDownload: true,
                    isActive: true,
                    updatedAt: true,
                    modulePermissions: {
                        select: {
                            module: true,
                            canView: true,
                            canUpload: true,
                            canEdit: true,
                            canDelete: true,
                            canDownload: true,
                        },
                    },
                },
            });

            if (!updatedUser) {
                throw new NotFoundException('ບໍ່ພົບຜູ້ໃຊ້ນີ້ໃນລະບົບ');
            }

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    targetUserId: id,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    oldValues: {
                        targetUser: {
                            id: oldUser.id,
                            employeeCode: oldUser.employeeCode,
                            username: oldUser.username,
                            fullName: oldUser.fullName,
                            department: oldUser.department,
                            division: oldUser.division,
                            unit: oldUser.unit,
                            position: oldUser.position,
                            role: oldUser.role,
                            roleId: oldUser.roleId,
                            isActive: oldUser.isActive,
                        },
                        permissions: {
                            canView: oldUser.canView,
                            canUpload: oldUser.canUpload,
                            canEdit: oldUser.canEdit,
                            canDelete: oldUser.canDelete,
                            canDownload: oldUser.canDownload,
                            modulePermissions: oldUser.modulePermissions,
                        },
                    },
                    newValues: {
                        targetUser: {
                            id: updatedUser.id,
                            employeeCode: updatedUser.employeeCode,
                            username: updatedUser.username,
                            fullName: updatedUser.fullName,
                            department: updatedUser.department,
                            division: updatedUser.division,
                            unit: updatedUser.unit,
                            position: updatedUser.position,
                            role: updatedUser.role,
                            roleId: updatedUser.roleId,
                            isActive: updatedUser.isActive,
                        },
                        changes: JSON.parse(JSON.stringify(dto)),
                        permissions: {
                            canView: updatedUser.canView,
                            canUpload: updatedUser.canUpload,
                            canEdit: updatedUser.canEdit,
                            canDelete: updatedUser.canDelete,
                            canDownload: updatedUser.canDownload,
                            modulePermissions: updatedUser.modulePermissions,
                        },
                    },
                },
            });

            return updatedUser;
        });

        // ຍົກເລີກສິດ (Invalidate) Token ຂອງ User ທັນທີ ເພື່ອບັງຄັບໃຫ້ Auto-Refresh ຮັບສິດໃໝ່
        await this.tokenVersionService.invalidateUser(id);

        return result;
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
                    targetUserId: id,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    oldValues: {
                        action: 'DELETE_USER',
                        targetUser: {
                            id,
                            employeeCode: oldUser.employeeCode,
                            username: oldUser.username,
                            fullName: oldUser.fullName,
                            department: oldUser.department,
                            division: oldUser.division,
                            role: oldUser.role,
                            isActive: oldUser.isActive,
                        },
                    },
                    newValues: {
                        deletedAt: new Date(),
                        isActive: false,
                        targetUser: {
                            id,
                            employeeCode: oldUser.employeeCode,
                            fullName: oldUser.fullName,
                            isActive: false,
                        },
                    },
                },
            });
        });

        // ຍົກເລີກສິດ (Invalidate) Token ທັນທີ
        await this.tokenVersionService.invalidateUser(id);
    }

    async findRoleById(roleId: string): Promise<any | null> {
        return this.prisma.role.findUnique({
            where: { id: roleId },
            include: { permissions: true },
        });
    }

    async findUserWithPassword(id: string): Promise<User | null> {
        return this.prisma.user.findFirst({
            where: { id, deletedAt: null },
        });
    }

    async updatePasswordWithAudit(
        id: string,
        newPasswordHash: string,
        currentUserId: string,
        actionType: 'RESET_BY_ADMIN' | 'CHANGED_BY_SELF',
    ): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.update({
                where: { id },
                data: { passwordHash: newPasswordHash },
                select: {
                    id: true,
                    username: true,
                    employeeCode: true,
                    fullName: true,
                    department: true,
                    division: true,
                    role: true,
                },
            });

            await tx.auditLog.create({
                data: {
                    userId: currentUserId,
                    targetUserId: id,
                    action: AuditAction.USER_PERMISSION_CHANGE,
                    oldValues: {
                        action: actionType,
                        targetUser: {
                            id,
                            username: user.username,
                            employeeCode: user.employeeCode,
                            fullName: user.fullName,
                            department: user.department,
                            division: user.division,
                            role: user.role,
                        },
                    },
                    newValues: {
                        action: actionType,
                        targetUserId: id,
                        updatedBy: currentUserId,
                        passwordUpdated: true,
                    },
                },
            });
        });

        // ຍົກເລີກສິດ (Invalidate) Token ທັນທີເມື່ອມີການປ່ຽນລະຫັດຜ່ານ
        await this.tokenVersionService.invalidateUser(id);
    }
}
