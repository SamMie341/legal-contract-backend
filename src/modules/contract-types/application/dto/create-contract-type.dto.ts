import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractTypeDto {
    @ApiProperty({ description: 'ຊື່ປະເພດສັນຍາ (ພາສາລາວ)', example: 'ສັນຍາ ບໍລິການທີ່ປຶກສາ' })
    @IsString()
    nameLo: string;

    @ApiPropertyOptional({ description: 'ຊື່ປະເພດສັນຍາ (ພາສາອັງກິດ)', example: 'Consulting Service Agreement' })
    @IsOptional()
    @IsString()
    nameEn?: string;

    @ApiPropertyOptional({ default: true, description: 'ສະຖານະເປີດໃຊ້ງານ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
