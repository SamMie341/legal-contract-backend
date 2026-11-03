import { IsOptional, IsEnum, IsBoolean, IsString, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { ModulePermissionDto } from './module-permission.dto.js';

export class UpdateUserDto {
    @ApiPropertyOptional({ enum: UserRole, description: 'ບົດບາດ (Role)' })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'ID ຂອງ Role ທີ່ຕ້ອງການຜູກ (Custom Role ID)',
        example: '33def50d-ba6f-41b3-823d-1357684ecf56',
    })
    @IsOptional()
    @IsUUID()
    roleId?: string;

    @ApiPropertyOptional({ description: 'ເປີດ/ປິດ ການນຳໃຊ້ບັນຊີ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional({
        description: 'ພະແນກ (Division) ເຊັ່ນ: ພະແນກສັນຍາທົ່ວໄປ, ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ',
        example: 'ພະແນກສັນຍາທົ່ວໄປ',
    })
    @IsOptional()
    @IsString()
    division?: string;

    @ApiPropertyOptional({
        description: 'ຫ້ອງການ/ຝ່າຍ (Department)',
        example: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
    })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({ description: 'ສິດທິ: ເບິ່ງຂໍ້ມູນ (canView - ຂໍ້ 4)' })
    @IsOptional()
    @IsBoolean()
    canView?: boolean;

    @ApiPropertyOptional({ description: 'ສິດທິ: ອັບໂຫຼດສັນຍາ (canUpload - ຂໍ້ 3)' })
    @IsOptional()
    @IsBoolean()
    canUpload?: boolean;

    @ApiPropertyOptional({ description: 'ສິດທິ: ແກ້ໄຂຂໍ້ມູນທີ່ກອກ (canEdit - ຂໍ້ 3)' })
    @IsOptional()
    @IsBoolean()
    canEdit?: boolean;

    @ApiPropertyOptional({ description: 'ສິດທິ: ລົບສັນຍາໃນລະບົບ (canDelete - ຂໍ້ 3)' })
    @IsOptional()
    @IsBoolean()
    canDelete?: boolean;

    @ApiPropertyOptional({ description: 'ສິດທິ: ດາວໂຫຼດເອກະສານສັນຍາ (canDownload - ຂໍ້ 5)' })
    @IsOptional()
    @IsBoolean()
    canDownload?: boolean;

    @ApiPropertyOptional({
        description: 'Matrix ສິດລາຍໂມດູນ (Module-Scoped Permissions)',
        type: [ModulePermissionDto],
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ModulePermissionDto)
    modulePermissions?: ModulePermissionDto[];
}
