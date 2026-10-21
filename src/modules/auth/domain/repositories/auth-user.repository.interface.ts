import { User, UserRole } from '@prisma/client';

export const AUTH_USER_REPOSITORY = Symbol('AUTH_USER_REPOSITORY');

export interface IAuthUserRepository {
    findByUsernameOrEmpCode(username: string): Promise<User | null>;
    findByEmployeeCode(empCode: string): Promise<User | null>;
    updateLastLogin(userId: string): Promise<void>;
    createSyncedEmployee(data: {
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
    }): Promise<User>;
    upsertHrmUser(data: {
        empCode: string;
        email: string;
        fullName: string;
        department: string;
        division: string;
        unit: string;
        position: string;
        phone: string;
        passwordHash: string;
    }): Promise<User>;
}
