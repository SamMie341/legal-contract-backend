import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IRoleRepository, RoleWithPermissions } from '../../domain/repositories/role.repository.interface.js';
import { CreateRoleDto } from '../../application/dto/create-role.dto.js';
import { UpdateRoleDto } from '../../application/dto/update-role.dto.js';
import { resolveToPrismaModules } from '../../../../core/utils/division-helper.util.js';
import { TokenVersionService } from '../../../../core/services/token-version.service.js';

@Injectable()
export class RoleRepository implements IRoleRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly tokenVersionService: TokenVersionService,
    ) { }

    async findAll(): Promise<RoleWithPermissions[]> {
        return this.prisma.role.findMany({
            include: {
                permissions: true,
                _count: {
                    select: { users: { where: { deletedAt: null } } },
                },
            },
            orderBy: [
                { isSystem: 'desc' },
                { name: 'asc' },
            ],
        }) as unknown as RoleWithPermissions[];
    }

    async findById(id: string): Promise<RoleWithPermissions | null> {
        return this.prisma.role.findUnique({
            where: { id },
            include: {
                permissions: true,
                _count: {
                    select: { users: { where: { deletedAt: null } } },
                },
            },
        }) as unknown as RoleWithPermissions | null;
    }

    async findByName(name: string): Promise<RoleWithPermissions | null> {
        return this.prisma.role.findUnique({
            where: { name: name.toUpperCase().trim() },
            include: {
                permissions: true,
                _count: {
                    select: { users: { where: { deletedAt: null } } },
                },
            },
        }) as unknown as RoleWithPermissions | null;
    }

    async countUsersByRoleId(roleId: string): Promise<number> {
        return this.prisma.user.count({
            where: { roleId, deletedAt: null },
        });
    }

    async createRole(dto: CreateRoleDto, userId?: string): Promise<RoleWithPermissions> {
        const normalizedName = dto.name.toUpperCase().trim();

        const existing = await this.prisma.role.findUnique({
            where: { name: normalizedName },
        });
        if (existing) {
            throw new BadRequestException(`ຊື່ Role '${normalizedName}' ມີໃນລະບົບແລ້ວ`);
        }

        return this.prisma.$transaction(async (tx) => {
            const role = await tx.role.create({
                data: {
                    name: normalizedName,
                    title: dto.title.trim(),
                    description: dto.description?.trim(),
                    isSystem: false,
                },
            });

            if (dto.permissions && dto.permissions.length > 0) {
                const modulePermsToCreate: any[] = [];
                for (const p of dto.permissions) {
                    const targetModules = resolveToPrismaModules(p.module);
                    for (const prismaModule of targetModules) {
                        modulePermsToCreate.push({
                            roleId: role.id,
                            module: prismaModule,
                            canView: p.canView !== false,
                            canUpload: p.canUpload === true,
                            canEdit: p.canEdit === true,
                            canDelete: p.canDelete === true,
                            canDownload: p.canDownload === true,
                        });
                    }
                }
                if (modulePermsToCreate.length > 0) {
                    await tx.roleModulePermission.createMany({
                        data: modulePermsToCreate,
                        skipDuplicates: true,
                    });
                }
            }

            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: AuditAction.CREATE_ROLE,
                        details: `ສ້າງບົດບາດໃໝ່: ${role.name} (${role.title})`,
                        newValues: {
                            roleId: role.id,
                            name: role.name,
                            title: role.title,
                            permissions: (dto.permissions || []) as any,
                        },
                    },
                });
            }

            return tx.role.findUnique({
                where: { id: role.id },
                include: {
                    permissions: true,
                    _count: { select: { users: true } },
                },
            }) as unknown as RoleWithPermissions;
        });
    }

    async updateRole(id: string, dto: UpdateRoleDto, userId?: string): Promise<RoleWithPermissions> {
        const existing = await this.prisma.role.findUnique({
            where: { id },
            include: { permissions: true },
        });
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບບົດບາດ (Role not found)');
        }

        let newName = existing.name;
        if (dto.name) {
            newName = dto.name.toUpperCase().trim();
            if (newName !== existing.name) {
                if (existing.isSystem) {
                    throw new BadRequestException('ບໍ່ສາມາດປ່ຽນລະຫັດຊື່ຂອງ Role ລະບົບ (System Role) ໄດ້');
                }
                const duplicate = await this.prisma.role.findUnique({
                    where: { name: newName },
                });
                if (duplicate) {
                    throw new BadRequestException(`ຊື່ Role '${newName}' ມີໃນລະບົບແລ້ວ`);
                }
            }
        }

        const updatedRole = await this.prisma.$transaction(async (tx) => {
            const updated = await tx.role.update({
                where: { id },
                data: {
                    name: newName,
                    title: dto.title !== undefined ? dto.title.trim() : undefined,
                    description: dto.description !== undefined ? dto.description.trim() : undefined,
                },
            });

            if (dto.permissions !== undefined) {
                // Upsert each module permission
                for (const p of dto.permissions) {
                    const targetModules = resolveToPrismaModules(p.module);
                    for (const prismaModule of targetModules) {
                        await tx.roleModulePermission.upsert({
                            where: {
                                roleId_module: {
                                    roleId: id,
                                    module: prismaModule,
                                },
                            },
                            create: {
                                roleId: id,
                                module: prismaModule,
                                canView: p.canView !== false,
                                canUpload: p.canUpload === true,
                                canEdit: p.canEdit === true,
                                canDelete: p.canDelete === true,
                                canDownload: p.canDownload === true,
                            },
                            update: {
                                canView: p.canView !== undefined ? p.canView : undefined,
                                canUpload: p.canUpload !== undefined ? p.canUpload : undefined,
                                canEdit: p.canEdit !== undefined ? p.canEdit : undefined,
                                canDelete: p.canDelete !== undefined ? p.canDelete : undefined,
                                canDownload: p.canDownload !== undefined ? p.canDownload : undefined,
                            },
                        });
                    }
                }
            }

            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: AuditAction.UPDATE_ROLE,
                        details: `ແກ້ໄຂບົດບາດ: ${updated.name}`,
                        oldValues: {
                            name: existing.name,
                            title: existing.title,
                            description: existing.description,
                            permissions: existing.permissions,
                        },
                        newValues: {
                            name: updated.name,
                            title: updated.title,
                            description: updated.description,
                            permissions: (dto.permissions || []) as any,
                        },
                    },
                });
            }

            return tx.role.findUnique({
                where: { id },
                include: {
                    permissions: true,
                    _count: { select: { users: true } },
                },
            }) as unknown as RoleWithPermissions;
        });

        // ຍົກເລີກສິດ (Invalidate) Token ຂອງທຸກໆ User ທີ່ຖື Role ນີ້ທັນທີ ເພື່ອບັງຄັບໃຫ້ Auto-Refresh ຮັບສິດໃໝ່
        await this.tokenVersionService.invalidateRole(id);

        return updatedRole;
    }

    async deleteRole(id: string, userId?: string): Promise<void> {
        const existing = await this.prisma.role.findUnique({
            where: { id },
            include: {
                _count: { select: { users: { where: { deletedAt: null } } } },
            },
        });

        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບບົດບາດ (Role not found)');
        }

        if (existing.isSystem) {
            throw new BadRequestException('ບໍ່ສາມາດລົບບົດບາດຫຼັກຂອງລະບົບ (System Role) ໄດ້');
        }

        if (existing._count.users > 0) {
            throw new BadRequestException(
                `ບໍ່ສາມາດລົບ Role ນີ້ໄດ້ ເນື່ອງຈາກມີຜູ້ໃຊ້ງານຈຳນວນ ${existing._count.users} ຄົນກຳລັງນຳໃຊ້ຢູ່. ກະລຸນາຍ້າຍຜູ້ໃຊ້ໄປ Role ອື່ນກ່ອນ.`,
            );
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.role.delete({ where: { id } });

            if (userId) {
                await tx.auditLog.create({
                    data: {
                        userId,
                        action: AuditAction.DELETE_ROLE,
                        details: `ລົບບົດບາດ: ${existing.name} (${existing.title})`,
                        oldValues: {
                            roleId: existing.id,
                            name: existing.name,
                            title: existing.title,
                        },
                    },
                });
            }
        });
    }
}
