import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PowerContractType, ContractStatus } from '@prisma/client';

export class QueryPowerContractDto {
    @ApiPropertyOptional({ description: 'ໜ້າທີ່ (Page number)', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'ຈຳນວນລາຍການຕໍ່ໜ້າ (Items per page)', default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'ຄຳຄົ້ນຫາ (ຊື່ໂຄງການ, ເລກທີສັນຍາ, ທີ່ຕັ້ງ, ລູກຄ້າ)' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: PowerContractType, description: 'ປະເພດສັນຍາ (PURCHASE ຫຼື SALE)' })
    @IsOptional()
    @IsEnum(PowerContractType)
    contractType?: PowerContractType;

    @ApiPropertyOptional({ enum: ContractStatus, description: 'ສະຖານະສັນຍາ' })
    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;

    @ApiPropertyOptional({ description: 'ປະເພດໂຄງການ ຫຼື ຊື່ລູກຄ້າ' })
    @IsOptional()
    @IsString()
    projectTypeOrCustomer?: string;
}

