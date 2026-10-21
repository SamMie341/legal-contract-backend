import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
    @ApiProperty({
        description: 'ລະຫັດພະນັກງານ (Employee Code) ເພື່ອດຶງຂໍ້ມູນອັດຕະໂນມັດຈາກລະບົບ HRM',
        example: 'EDL-001',
    })
    @IsString()
    @IsNotEmpty()
    employeeCode: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.VIEWER, description: 'ບົດບາດ (Role)' })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({ default: true, description: 'ສິດທິ: ເບິ່ງຂໍ້ມູນ (canView)' })
    @IsOptional()
    @IsBoolean()
    canView?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ອັບໂຫຼດສັນຍາ (canUpload)' })
    @IsOptional()
    @IsBoolean()
    canUpload?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ແກ້ໄຂຂໍ້ມູນ (canEdit)' })
    @IsOptional()
    @IsBoolean()
    canEdit?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ລົບສັນຍາ (canDelete)' })
    @IsOptional()
    @IsBoolean()
    canDelete?: boolean;

    @ApiPropertyOptional({ default: false, description: 'ສິດທິ: ດາວໂຫຼດເອກະສານສັນຍາ (canDownload)' })
    @IsOptional()
    @IsBoolean()
    canDownload?: boolean;
}
