import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class GetContractHistoryDto {
    @ApiPropertyOptional({ description: 'ໜ້າທີ່ຕ້ອງການດຶງຂໍ້ມູນ (ເລີ່ມຕົ້ນ 1)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'ຈຳນວນລາຍການຕໍ່ໜ້າ (ເລີ່ມຕົ້ນ 10, ສູງສຸດ 100)', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ enum: AuditAction, description: 'ກັ່ນຕອງຕາມປະເພດການດຳເນີນງານ (ເຊັ່ນ: UPDATE_CONTRACT, CREATE_CONTRACT, UPLOAD_ATTACHMENT)' })
    @IsOptional()
    @IsEnum(AuditAction)
    action?: AuditAction;
}
