import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { SystemModule } from '@prisma/client';

export class RoleModulePermissionDto {
    @ApiProperty({
        description: 'ລະຫັດໂມດູນ (CONTRACTS, POWER_CONTRACTS, LEGAL_DOCUMENTS, LEGAL_CASES)',
        enum: SystemModule,
        example: SystemModule.CONTRACTS,
    })
    @IsEnum(SystemModule, { message: 'ໂມດູນຕ້ອງແມ່ນ CONTRACTS, POWER_CONTRACTS, LEGAL_DOCUMENTS ຫຼື LEGAL_CASES' })
    module!: SystemModule;

    @ApiProperty({ description: 'ສິດເຂົ້າເບິ່ງຂໍ້ມູນ (canView)', example: true, required: false })
    @IsBoolean()
    @IsOptional()
    canView?: boolean;

    @ApiProperty({ description: 'ສິດອັບໂຫຼດ/ສ້າງຂໍ້ມູນ (canUpload)', example: false, required: false })
    @IsBoolean()
    @IsOptional()
    canUpload?: boolean;

    @ApiProperty({ description: 'ສິດແກ້ໄຂຂໍ້ມູນ (canEdit)', example: false, required: false })
    @IsBoolean()
    @IsOptional()
    canEdit?: boolean;

    @ApiProperty({ description: 'ສິດລົບຂໍ້ມູນ (canDelete)', example: false, required: false })
    @IsBoolean()
    @IsOptional()
    canDelete?: boolean;

    @ApiProperty({ description: 'ສິດດາວໂຫຼດໄຟລ໌ແນບ (canDownload)', example: false, required: false })
    @IsBoolean()
    @IsOptional()
    canDownload?: boolean;
}
