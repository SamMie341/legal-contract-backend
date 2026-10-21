import { IsString, IsInt, IsOptional, IsDate, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Currency, ContractStatus } from '@prisma/client';

export class UpdateContractDto {
    @ApiPropertyOptional({ description: 'ຊື່ສັນຍາ' })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiPropertyOptional({ description: 'ລະຫັດປະເພດສັນຍາ (1-14)' })
    @IsOptional()
    @IsInt()
    @Min(1)
    contractTypeId?: number;

    @ApiPropertyOptional({ description: 'ເລກທີສັນຍາ' })
    @IsOptional()
    @IsString()
    contractNumber?: string;

    @ApiPropertyOptional({ description: 'ອາຍຸສັນຍາ (ຕົວຢ່າງ: 5 ປີ, 24 ເດືອນ)' })
    @IsOptional()
    @IsString()
    durationText?: string;

    @ApiPropertyOptional({ description: 'ມື້ລົງລາຍເຊັນ' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    signedDate?: Date;

    @ApiPropertyOptional({ description: 'ມື້ມີຜົນບັງຄັບໃຊ້' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    effectiveDate?: Date;

    @ApiPropertyOptional({ description: 'ມື້ສິ້ນສຸດສັນຍາ' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expirationDate?: Date;

    @ApiPropertyOptional({ description: 'ມູນຄ່າສັນຍາ' })
    @IsOptional()
    @IsNumber()
    contractValue?: number;

    @ApiPropertyOptional({ enum: Currency, description: 'ສະກຸນເງິນ (LAK, USD, CNY)' })
    @IsOptional()
    @IsEnum(Currency)
    currency?: Currency;

    @ApiPropertyOptional({ description: 'ສັດສ່ວນຫຸ້ນ ຫຼື ຈຳນວນເງິນ ປະກອບທຶນ' })
    @IsOptional()
    @IsString()
    equityOrCapitalContribution?: string;

    @ApiPropertyOptional({ description: 'ຜູ້ຈັດຕັ້ງປະຕິບັດ' })
    @IsOptional()
    @IsString()
    implementer?: string;

    @ApiPropertyOptional({ description: 'ລາຍລະອຽດເພີ່ມເຕີມ' })
    @IsOptional()
    @IsString()
    additionalDetails?: string;

    @ApiPropertyOptional({ description: 'ແຈ້ງເຕືອນລ່ວງໜ້າ (ວັນ)' })
    @IsOptional()
    @IsInt()
    notifyDaysBefore?: number;

    @ApiPropertyOptional({ enum: ContractStatus, description: 'ສະຖານະສັນຍາ' })
    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;
}
