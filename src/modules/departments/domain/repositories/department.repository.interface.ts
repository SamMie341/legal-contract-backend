import { Department } from '@prisma/client';
import { CreateDepartmentDto } from '../../application/dto/create-department.dto.js';
import { UpdateDepartmentDto } from '../../application/dto/update-department.dto.js';

export const DEPARTMENT_REPOSITORY = Symbol('DEPARTMENT_REPOSITORY');

export interface IDepartmentRepository {
    findAll(params: {
        search?: string;
        isActive?: boolean;
    }): Promise<any[]>;
    findAllForDropdown(): Promise<Department[]>;
    findById(id: string): Promise<any | null>;
    findByName(name: string, excludeId?: string): Promise<Department | null>;
    findByCode(code: string, excludeId?: string): Promise<Department | null>;
    create(dto: CreateDepartmentDto): Promise<Department>;
    update(id: string, dto: UpdateDepartmentDto): Promise<Department>;
    upsertFromHrm(data: { name: string; code?: string; isActive: boolean }): Promise<{ department: Department; action: 'created' | 'updated' }>;
    countUsageById(id: string): Promise<{ legalDocumentsCount: number; legalCasesCount: number }>;
    delete(id: string): Promise<void>;
}
