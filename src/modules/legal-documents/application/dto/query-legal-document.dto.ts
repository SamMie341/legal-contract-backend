import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus, DocumentType } from '@prisma/client';

export class QueryLegalDocumentDto {
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

    @ApiPropertyOptional({ description: 'ຄົ້ນຫາ (docTitle, docNumberDate, responsiblePerson, purpose)' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມປະເພດນິຕິກຳ', enum: DocumentType })
    @IsOptional()
    @IsEnum(DocumentType)
    docType?: DocumentType;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມສະຖານະ', enum: DocumentStatus })
    @IsOptional()
    @IsEnum(DocumentStatus)
    status?: DocumentStatus;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມປີອອກນິຕິກຳ' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    issueYear?: number;

    @ApiPropertyOptional({ description: 'ກັ່ນຕອງຕາມຫ້ອງການ/ຝ່າຍ (departmentId UUID)' })
    @IsOptional()
    @IsUUID('4')
    departmentId?: string;
}
