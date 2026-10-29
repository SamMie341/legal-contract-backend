import { PartialType } from '@nestjs/swagger';
import { CreatePowerContractDto } from './create-power-contract.dto.js';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ContractStatus } from '@prisma/client';

export class UpdatePowerContractDto extends PartialType(CreatePowerContractDto) {
    @ApiPropertyOptional({
        enum: ContractStatus,
        description: 'ສະຖານະສັນຍາ (DRAFT, ACTIVE, EXPIRING_SOON, EXPIRED, TERMINATED)',
    })
    @IsOptional()
    @IsEnum(ContractStatus)
    status?: ContractStatus;
}

