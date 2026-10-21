import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateContractTypeDto {
    @ApiPropertyOptional({ description: 'ຊື່ປະເພດສັນຍາ (ພາສາລາວ)', example: 'ສັນຍາ ບໍລິການທີ່ປຶກສາ' })
    @IsOptional()
    @IsString()
    nameLo?: string;

    @ApiPropertyOptional({ description: 'ຊື່ປະເພດສັນຍາ (ພາສາອັງກິດ)', example: 'Consulting Service Agreement' })
    @IsOptional()
    @IsString()
    nameEn?: string;

    @ApiPropertyOptional({ description: 'ສະຖານະເປີດໃຊ້ງານ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
