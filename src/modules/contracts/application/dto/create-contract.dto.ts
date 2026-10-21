import { IsString, IsInt, IsOptional, IsDate, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from '@prisma/client';

export class CreateContractDto {
    @ApiProperty({ description: 'ຊື່ສັນຍາ' })
    @IsString()
    title: string;

    @ApiProperty({ description: 'ລະຫັດປະເພດສັນຍາ (1-14)' })
    @IsInt()
    @Min(1)
    contractTypeId: number;

    @ApiProperty({ description: 'ເລກທີສັນຍາ' })
    @IsString()
    contractNumber: string;

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

    @ApiPropertyOptional({ enum: Currency, default: Currency.LAK, description: 'ສະກຸນເງິນ (LAK, USD, CNY)' })
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

    @ApiPropertyOptional({ description: 'ແຈ້ງເຕືອນລ່ວງໜ້າ (ວັນ)', default: 60 })
    @IsOptional()
    @IsInt()
    notifyDaysBefore?: number;
}
