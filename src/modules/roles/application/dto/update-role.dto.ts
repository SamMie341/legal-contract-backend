import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleModulePermissionDto } from './role-module-permission.dto.js';

export class UpdateRoleDto {
    @ApiProperty({
        description: 'ຊື່ລະຫັດ Role (Unique, ຕົວພິມໃຫຍ່)',
        example: 'CONTRACT_AUDITOR',
        required: false,
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        description: 'ຊື່ສະແດງຂອງ Role ພາສາລາວ (Display Title)',
        example: 'ນາຍຊ່າງກວດສອບສັນຍາຂັ້ນສູງ',
        required: false,
    })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiProperty({
        description: 'ຄຳອະທິບາຍໜ້າທີ່ ຫຼື ຄວາມຮັບຜິດຊອບຂອງ Role',
        example: 'ຮັບຜິດຊອບກວດສອບສັນຍາ ແລະ ດາວໂຫຼດໄຟລ໌ທຸກພະແນກ',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'ລາຍການສິດລາຍໂມດູນ (Module Permissions Matrix)',
        type: [RoleModulePermissionDto],
        required: false,
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RoleModulePermissionDto)
    @IsOptional()
    permissions?: RoleModulePermissionDto[];
}
