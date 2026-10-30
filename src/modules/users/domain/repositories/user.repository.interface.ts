import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from '../../application/dto/update-user.dto.js';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
    findAll(params: {
        skip: number;
        take: number;
        search?: string;
        role?: UserRole;
        isActive?: boolean;
    }): Promise<{ data: any[]; total: number }>;
    findById(id: string): Promise<any | null>;
    findByEmployeeCode(employeeCode: string): Promise<User | null>;
    createOrRestoreFromHrm(
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
    ): Promise<any>;
    updateWithAudit(id: string, dto: UpdateUserDto, oldUser: any, currentUserId: string): Promise<any>;
    softDeleteWithAudit(id: string, oldUser: any, currentUserId: string): Promise<void>;
    findUserWithPassword(id: string): Promise<User | null>;
    updatePasswordWithAudit(
        id: string,
        newPasswordHash: string,
        currentUserId: string,
        actionType: 'RESET_BY_ADMIN' | 'CHANGED_BY_SELF',
    ): Promise<void>;
}
