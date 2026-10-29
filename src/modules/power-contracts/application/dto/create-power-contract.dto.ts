import { IsString, IsInt, IsOptional, IsDate, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PowerContractType, Currency } from '@prisma/client';

export class CreatePowerContractDto {
    @ApiProperty({
        enum: PowerContractType,
        description: 'ປະເພດສັນຍາ (PURCHASE = ສັນຍາຊື້ໄຟຟ້າ, SALE = ສັນຍາຂາຍໄຟຟ້າ)',
        example: PowerContractType.PURCHASE,
    })
    @IsEnum(PowerContractType)
    contractType: PowerContractType;

    @ApiPropertyOptional({ description: 'ເລກທີສັນຍາ', example: 'PPA-2026-001' })
    @IsOptional()
    @IsString()
    contractNumber?: string;

    @ApiProperty({ description: 'ຊື່ໂຄງການ (ກອກຂໍ້ມູນດ້ວຍມື)', example: 'ໂຄງການເຂື່ອນໄຟຟ້ານ້ຳອູ 1' })
    @IsString()
    projectName: string;

    @ApiProperty({
        description:
            'ປະເພດໂຄງການ / ລູກຄ້າ (ສັນຍາຊື້: ເລືອກ 1 ໃນ 5 ປະເພດ ເຊັ່ນ ໄຟຟ້ານໍ້າຕົກ, ແສງຕາເວັນ; ສັນຍາຂາຍ: ກອກຊື່ລູກຄ້າ ຫຼື ປະເພດໂຄງການ)',
        example: 'ໄຟຟ້ານໍ້າຕົກ',
    })
    @IsString()
    projectTypeOrCustomer: string;

    @ApiPropertyOptional({ description: 'ອາຍຸສັນຍາ (ຕົວຢ່າງ: 25 ປີ)', example: '25 ປີ' })
    @IsOptional()
    @IsString()
    durationText?: string;

    @ApiPropertyOptional({ description: 'ຈຳນວນເດືອນອາຍຸສັນຍາ (ຕົວເລກ)', example: 300 })
    @IsOptional()
    @IsInt()
    @Min(1)
    durationMonths?: number;

    @ApiPropertyOptional({ description: 'ມື້ລົງລາຍເຊັນ', example: '2026-01-15' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    signedDate?: Date;

    @ApiPropertyOptional({ description: 'ມື້ມີຜົນບັງຄັບໃຊ້', example: '2026-02-01' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    effectiveDate?: Date;

    @ApiPropertyOptional({ description: 'ມື້ສິ້ນສຸດສັນຍາ (ໃຊ້ແຈ້ງເຕືອນລ່ວງໜ້າ 60 ວັນ)', example: '2051-02-01' })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    expirationDate?: Date;

    @ApiPropertyOptional({ description: 'ກຳລັງການຕິດຕັ້ງ (ຕົວຢ່າງ: 50 MW)', example: '50 MW' })
    @IsOptional()
    @IsString()
    installedCapacity?: string;

    @ApiPropertyOptional({ description: 'ຄ່າກຳລັງການຕິດຕັ້ງເປັນຕົວເລກ (MW) ສຳລັບຄຳນວນໃນ Dashboard', example: 50.0 })
    @IsOptional()
    @IsNumber()
    capacityValue?: number;

    @ApiPropertyOptional({ description: 'ຫົວໜ່ວຍກຳລັງການຕິດຕັ້ງ', default: 'MW', example: 'MW' })
    @IsOptional()
    @IsString()
    capacityUnit?: string;

    @ApiPropertyOptional({ description: 'ທີ່ຕັ້ງໂຄງການ', example: 'ແຂວງຜົ້ງສາລີ' })
    @IsOptional()
    @IsString()
    projectLocation?: string;

    @ApiPropertyOptional({ description: 'ລາຄາໄຟຟ້າ (ຕົວຢ່າງ: 0.065 USD/kWh ຫຼື 850 LAK/kWh)', example: '0.065 USD/kWh' })
    @IsOptional()
    @IsString()
    tariff?: string;

    @ApiPropertyOptional({ description: 'ຄ່າລາຄາໄຟຟ້າ (ຕົວເລກ)', example: 0.065 })
    @IsOptional()
    @IsNumber()
    tariffValue?: number;

    @ApiPropertyOptional({ enum: Currency, default: Currency.USD, description: 'ສະກຸນເງິນລາຄາໄຟ (USD, LAK, CNY)' })
    @IsOptional()
    @IsEnum(Currency)
    tariffCurrency?: Currency;

    @ApiPropertyOptional({ description: 'ລາຍລະອຽດອື່ນໆ / ໝາຍເຫດ', example: 'ໄລຍະກໍ່ສ້າງ 3 ປີ' })
    @IsOptional()
    @IsString()
    additionalDetails?: string;

    @ApiPropertyOptional({ description: 'ແຈ້ງເຕືອນລ່ວງໜ້າກ່ອນສິ້ນສຸດ (ວັນ)', default: 60, example: 60 })
    @IsOptional()
    @IsInt()
    @Min(1)
    notifyDaysBefore?: number;
}

