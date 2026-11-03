import { Role, RoleModulePermission } from '@prisma/client';
import { CreateRoleDto } from '../../application/dto/create-role.dto.js';
import { UpdateRoleDto } from '../../application/dto/update-role.dto.js';

export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';

export type RoleWithPermissions = Role & {
    permissions: RoleModulePermission[];
    _count?: {
        users: number;
    };
};

export interface IRoleRepository {
    findAll(): Promise<RoleWithPermissions[]>;
    findById(id: string): Promise<RoleWithPermissions | null>;
    findByName(name: string): Promise<RoleWithPermissions | null>;
    createRole(dto: CreateRoleDto, userId?: string): Promise<RoleWithPermissions>;
    updateRole(id: string, dto: UpdateRoleDto, userId?: string): Promise<RoleWithPermissions>;
    deleteRole(id: string, userId?: string): Promise<void>;
    countUsersByRoleId(roleId: string): Promise<number>;
}
