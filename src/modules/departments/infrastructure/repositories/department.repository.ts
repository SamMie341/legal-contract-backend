import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { IDepartmentRepository } from '../../domain/repositories/department.repository.interface.js';
import { CreateDepartmentDto } from '../../application/dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../../application/dto/update-department.dto.js';
import { Department } from '@prisma/client';

@Injectable()
export class DepartmentRepository implements IDepartmentRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(params: { search?: string; isActive?: boolean }): Promise<any[]> {
        const whereCondition: any = {};

        if (params.search) {
            whereCondition.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } },
            ];
        }

        if (params.isActive !== undefined) {
            whereCondition.isActive = params.isActive;
        }

        return this.prisma.department.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'asc' },
            include: {
                _count: {
                    select: {
                        legalDocuments: { where: { deletedAt: null } },
                        legalCases: { where: { deletedAt: null } },
                    },
                },
            },
        });
    }

    async findAllForDropdown(): Promise<Department[]> {
        return this.prisma.department.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.department.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        legalDocuments: { where: { deletedAt: null } },
                        legalCases: { where: { deletedAt: null } },
                    },
                },
            },
        });
    }

    async findByName(name: string, excludeId?: string): Promise<Department | null> {
        return this.prisma.department.findFirst({
            where: {
                name,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });
    }

    async findByCode(code: string, excludeId?: string): Promise<Department | null> {
        return this.prisma.department.findFirst({
            where: {
                code,
                ...(excludeId ? { id: { not: excludeId } } : {}),
            },
        });
    }

    async create(dto: CreateDepartmentDto): Promise<Department> {
        return this.prisma.department.create({
            data: {
                name: dto.name,
                code: dto.code,
                isActive: dto.isActive !== undefined ? dto.isActive : true,
            },
        });
    }

    async update(id: string, dto: UpdateDepartmentDto): Promise<Department> {
        return this.prisma.department.update({
            where: { id },
            data: dto,
        });
    }

    async upsertFromHrm(data: { name: string; code?: string; isActive: boolean }): Promise<{ department: Department; action: 'created' | 'updated' }> {
        let existing: Department | null = null;
        if (data.code) {
            existing = await this.prisma.department.findFirst({ where: { code: data.code } });
        }
        if (!existing) {
            existing = await this.prisma.department.findUnique({ where: { name: data.name } });
        }

        if (existing) {
            const updated = await this.prisma.department.update({
                where: { id: existing.id },
                data: {
                    name: data.name,
                    code: data.code || existing.code,
                    isActive: data.isActive,
                },
            });
            return { department: updated, action: 'updated' };
        } else {
            const created = await this.prisma.department.create({
                data: {
                    name: data.name,
                    code: data.code,
                    isActive: data.isActive,
                },
            });
            return { department: created, action: 'created' };
        }
    }

    async countUsageById(id: string): Promise<{ legalDocumentsCount: number; legalCasesCount: number }> {
        const [legalDocumentsCount, legalCasesCount] = await Promise.all([
            this.prisma.legalDocument.count({
                where: { departmentId: id, deletedAt: null },
            }),
            this.prisma.legalCase.count({
                where: { departmentId: id, deletedAt: null },
            }),
        ]);

        return { legalDocumentsCount, legalCasesCount };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.department.delete({
            where: { id },
        });
    }
}
