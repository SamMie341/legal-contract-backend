import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserDto {
    @ApiPropertyOptional({ enum: UserRole, description: 'ບົດບາດ (Role)' })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

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
}
