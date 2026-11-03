import { SetMetadata } from '@nestjs/common';
import { SystemModule } from '@prisma/client';

export type PermissionAction = 'canView' | 'canUpload' | 'canEdit' | 'canDelete' | 'canDownload';

export interface ModuleAccessRequirement {
    module: SystemModule;
    action: PermissionAction;
}

export const MODULE_ACCESS_KEY = 'MODULE_ACCESS_KEY';
export const REQUIRE_ACCESS_KEY = MODULE_ACCESS_KEY;

export const RequireAccess = (module: SystemModule, action: PermissionAction = 'canView') =>
    SetMetadata(MODULE_ACCESS_KEY, { module, action });
