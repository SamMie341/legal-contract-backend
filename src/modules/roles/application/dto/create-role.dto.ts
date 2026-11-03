import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RoleModulePermissionDto } from './role-module-permission.dto.js';

export class CreateRoleDto {
    @ApiProperty({
        description: 'ຊື່ລະຫັດ Role (Unique, ຕົວພິມໃຫຍ່ເຊັ່ນ CONTRACT_AUDITOR, DISPUTE_OFFICER)',
        example: 'CONTRACT_AUDITOR',
    })
    @IsString()
    @IsNotEmpty({ message: 'ກະລຸນາໃສ່ຊື່ລະຫັດ Role' })
    name!: string;

    @ApiProperty({
        description: 'ຊື່ສະແດງຂອງ Role ພາສາລາວ (Display Title)',
        example: 'ນາຍຊ່າງກວດສອບສັນຍາ',
    })
    @IsString()
    @IsNotEmpty({ message: 'ກະລຸນາໃສ່ຊື່ສະແດງຂອງ Role' })
    title!: string;

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
