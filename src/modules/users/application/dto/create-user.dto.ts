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

    @ApiPropertyOptional({
        description: 'ພະແນກ (Division) ເຊັ່ນ: ພະແນກສັນຍາທົ່ວໄປ, ພະແນກນິຕິກຳ ແລະ ແກ້ໄຂຂໍ້ຂັດແຍ່ງ (ຫາກບໍ່ລະບຸ ຈະດຶງຈາກ HRM ອັດຕະໂນມັດ)',
        example: 'ພະແນກສັນຍາທົ່ວໄປ',
    })
    @IsOptional()
    @IsString()
    division?: string;

    @ApiPropertyOptional({
        description: 'ຫ້ອງການ/ຝ່າຍ (Department) (ຫາກບໍ່ລະບຸ ຈະດຶງຈາກ HRM ອັດຕະໂນມັດ)',
        example: 'ຫ້ອງການສຳນັກງານໃຫຍ່',
    })
    @IsOptional()
    @IsString()
    department?: string;

    @ApiPropertyOptional({
        description: 'ຊື່ ແລະ ນາມສະກຸນ (ຫາກ HRM ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້)',
        example: 'ສົມສັກ ສີສຸວັນ',
    })
    @IsOptional()
    @IsString()
    fullName?: string;

    @ApiPropertyOptional({
        description: 'ອີເມວ (ຫາກ HRM ບໍ່ສາມາດເຊື່ອມຕໍ່ໄດ້)',
        example: 'somsak@edl.com.la',
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'ເບີໂທລະສັບ',
        example: '02055555555',
    })
    @IsOptional()
    @IsString()
    phone?: string;
}
