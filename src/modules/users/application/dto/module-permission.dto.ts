import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SystemModule } from '@prisma/client';

export class ModulePermissionDto {
    @ApiProperty({
        enum: SystemModule,
        description: 'ໂມດູນທີ່ຕ້ອງການກຳນົດສິດ (CONTRACTS, POWER_CONTRACTS, LEGAL_DOCUMENTS, LEGAL_CASES)',
        example: SystemModule.CONTRACTS,
    })
    @IsEnum(SystemModule)
    module: SystemModule;

    @ApiPropertyOptional({ default: true, description: 'ສິດທິ: ເບິ່ງຂໍ້ມູນ (canView)' })
    @IsOptional()
    @IsBoolean()
    canView?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ອັບໂຫຼດ/ສ້າງຂໍ້ມູນ (canUpload)' })
    @IsOptional()
    @IsBoolean()
    canUpload?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ແກ້ໄຂຂໍ້ມູນ (canEdit)' })
    @IsOptional()
    @IsBoolean()
    canEdit?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ລົບຂໍ້ມູນ (canDelete)' })
    @IsOptional()
    @IsBoolean()
    canDelete?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ດາວໂຫຼດເອກະສານ/ໄຟລ໌ແນບ (canDownload)' })
    @IsOptional()
    @IsBoolean()
    canDownload?: boolean;
}
