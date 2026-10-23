import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDepartmentDto {
    @ApiPropertyOptional({ description: 'ຊື່ຫ້ອງການ/ຝ່າຍ/ສະຖາບັນ', example: 'ຝ່າຍກົດໝາຍ ແລະ ນິຕິກຳ' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'ລະຫັດຫ້ອງການ/ຝ່າຍ', example: 'LEGAL-DIV' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ description: 'ສະຖານະເປີດໃຊ້ງານ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
