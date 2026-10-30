import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { DocumentStatus, DocumentType } from '@prisma/client';

export class CreateLegalDocumentDto {
    @ApiProperty({ description: 'ຫົວຂໍ້ / ຊື່ນິຕິກຳ', example: 'ກົດລະບຽບວ່າດ້ວຍການຄຸ້ມຄອງພະນັກງານ' })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນຫົວຂໍ້ / ຊື່ນິຕິກຳ' })
    @IsString()
    @MaxLength(255)
    docTitle: string;

    @ApiProperty({ description: 'ປະເພດນິຕິກຳ', enum: DocumentType, example: DocumentType.REGULATION })
    @IsNotEmpty({ message: 'ກະລຸນາເລືອກປະເພດນິຕິກຳ' })
    @IsEnum(DocumentType, { message: 'ປະເພດນິຕິກຳບໍ່ຖືກຕ້ອງ' })
    docType: DocumentType;

    @ApiProperty({ description: 'ປີອອກນິຕິກຳ', example: 2026 })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນປີອອກນິຕິກຳ' })
    @Type(() => Number)
    @IsInt({ message: 'ປີອອກນິຕິກຳຕ້ອງເປັນຕົວເລກຖ້ວນ' })
    @Min(1950)
    @Max(2100)
    issueYear: number;

    @ApiProperty({ description: 'ເລກທີ ແລະ ວັນທີອອກນິຕິກຳ', example: 'ເລກທີ 012/ຟຟລ, ລົງວັນທີ 15/01/2026' })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນເລກທີ ແລະ ວັນທີອອກນິຕິກຳ' })
    @IsString()
    @MaxLength(255)
    docNumberDate: string;

    @ApiPropertyOptional({ description: 'ສະຖານະນິຕິກຳ', enum: DocumentStatus, default: DocumentStatus.ACTIVE })
    @IsOptional()
    @IsEnum(DocumentStatus, { message: 'ສະຖານະນິຕິກຳບໍ່ຖືກຕ້ອງ' })
    status?: DocumentStatus;

    @ApiPropertyOptional({ description: 'ຜູ້ຮັບຜິດຊອບ / ຜູ້ປະສານງານ', example: 'ທ່ານ ສົມສັກ ວົງສາ' })
    @IsOptional()
    @IsString()
    responsiblePerson?: string;

    @ApiProperty({ description: 'ID ຂອງຫ້ອງການ/ຝ່າຍທີ່ຮັບຜິດຊອບ (Department UUID)', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    @IsNotEmpty({ message: 'ກະລຸນາເລືອກຝ່າຍ' })
    @IsUUID('4', { message: 'departmentId ຕ້ອງເປັນ UUID' })
    departmentId: string;

    @ApiPropertyOptional({ description: 'ຈຸດປະສົງ / ເນື້ອໃນຫຍໍ້', example: 'ເພື່ອກຳນົດຫຼັກການ ແລະ ລະບຽບການ...' })
    @IsOptional()
    @IsString()
    purpose?: string;

    @ApiPropertyOptional({ description: 'ລິ້ງພາຍນອກ (External URL / Cloud Link)', example: 'https://sharepoint.edl.com.la/docs/123' })
    @IsOptional()
    @IsString()
    externalUrl?: string;
}
