import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDepartmentDto {
    @ApiProperty({ description: 'ຊື່ຫ້ອງການ/ຝ່າຍ/ສະຖາບັນ', example: 'ຝ່າຍກົດໝາຍ ແລະ ນິຕິກຳ' })
    @IsString()
    name: string;

    @ApiPropertyOptional({ description: 'ລະຫັດຫ້ອງການ/ຝ່າຍ', example: 'LEGAL-DIV' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ default: true, description: 'ສະຖານະເປີດໃຊ້ງານ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
