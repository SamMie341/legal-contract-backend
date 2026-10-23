import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, IsDateString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { CaseType, DisputeStatus } from '@prisma/client';

export class QueryLegalCaseDto {
    @ApiPropertyOptional({ description: 'ເລກໜ້າ (Page)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'ຈຳນວນຕໍ່ໜ້າ (Limit)', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'ຄົ້ນຫາ (caseCode, defendant, allegation, departmentAction, disputeProgress)' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມປະເພດຄະດີ', enum: CaseType })
    @IsOptional()
    @IsEnum(CaseType)
    caseType?: CaseType;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມສະຖານະຂໍ້ຂັດແຍ່ງ / ຂັ້ນສານ', enum: DisputeStatus })
    @IsOptional()
    @IsEnum(DisputeStatus)
    disputeStatus?: DisputeStatus;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມຫ້ອງການ/ຝ່າຍ (departmentId UUID)' })
    @IsOptional()
    @IsUUID('4')
    departmentId?: string;

    @ApiPropertyOptional({ description: 'ວັນທີເລີ່ມຕົ້ນ (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'ວັນທີສິ້ນສຸດ (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
