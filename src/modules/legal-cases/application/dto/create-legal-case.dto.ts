import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUUID,
    IsNumber,
    IsDateString,
    MaxLength,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CaseType, DisputeStatus } from '@prisma/client';

export class CreateLegalCaseDto {
    @ApiProperty({ description: 'ລະຫັດຄະດີ (Case Code)', example: 'EDL-2026-005' })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນລະຫັດຄະດີ' })
    @IsString()
    @MaxLength(100)
    caseCode: string;

    @ApiProperty({ description: 'ຊື່ຈຳເລີຍ ຫຼື ຫົວຂໍ້ຄະດີ', example: 'ບໍລິສັດ ບົວລະພາ ກໍ່ສ້າງ ຈຳກັດ' })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນຊື່ຈຳເລີຍ ຫຼື ຫົວຂໍ້ຄະດີ' })
    @IsString()
    @MaxLength(255)
    defendant: string;

    @ApiPropertyOptional({ description: 'ຂໍ້ກ່າວຫາ / ເນື້ອໃນຫຍໍ້', example: 'ລະເມີດສັນຍາຮັບເໝົາກໍ່ສ້າງ ແລະ ບໍ່ມອບວຽກຕາມກຳນົດ' })
    @IsOptional()
    @IsString()
    allegation?: string;

    @ApiPropertyOptional({ description: 'ID ຂອງຫ້ອງການ/ຝ່າຍທີ່ກ່ຽວຂ້ອງ (Department UUID)', example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
    @IsOptional()
    @IsUUID('4', { message: 'departmentId ຕ້ອງເປັນ UUID' })
    departmentId?: string;

    @ApiPropertyOptional({ description: 'ການດຳເນີນງານຂອງພາກສ່ວນກ່ຽວຂ້ອງ', example: 'ສົ່ງເອກະສານໃຫ້ພະແນກນິຕິກຳດຳເນີນຄະດີ' })
    @IsOptional()
    @IsString()
    departmentAction?: string;

    @ApiProperty({ description: 'ປະເພດຄະດີ', enum: CaseType, example: CaseType.COMMERCIAL })
    @IsNotEmpty({ message: 'ກະລຸນາເລືອກປະເພດຄະດີ' })
    @IsEnum(CaseType, { message: 'ປະເພດຄະດີບໍ່ຖືກຕ້ອງ' })
    caseType: CaseType;

    @ApiPropertyOptional({ description: 'ມູນຄ່າຄວາມເສຍຫາຍ (LAK)', example: 500000000, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    damageLak?: number = 0;

    @ApiPropertyOptional({ description: 'ມູນຄ່າຄວາມເສຍຫາຍ (USD)', example: 25000, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    damageUsd?: number = 0;

    @ApiPropertyOptional({ description: 'ຄ່າປັບໃໝ (LAK)', example: 50000000, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    fineLak?: number = 0;

    @ApiPropertyOptional({ description: 'ຄ່າປັບໃໝ (USD)', example: 2500, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    fineUsd?: number = 0;

    @ApiPropertyOptional({ description: 'ລວມຍອດທີ່ຕ້ອງຊຳລະ (LAK - ຖ້າບໍ່ປ້ອນຈະຄຳນວນຈາກ damageLak + fineLak ອັດຕະໂນມັດ)', example: 550000000 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    totalDueLak?: number;

    @ApiPropertyOptional({ description: 'ລວມຍອດທີ່ຕ້ອງຊຳລະ (USD - ຖ້າບໍ່ປ້ອນຈະຄຳນວນຈາກ damageUsd + fineUsd ອັດຕະໂນມັດ)', example: 27500 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    totalDueUsd?: number;

    @ApiPropertyOptional({ description: 'ສະຖານະຂໍ້ຂັດແຍ່ງ / ຂັ້ນສານ', enum: DisputeStatus, default: DisputeStatus.FIRST_INSTANCE })
    @IsOptional()
    @IsEnum(DisputeStatus, { message: 'ສະຖານະຂໍ້ຂັດແຍ່ງບໍ່ຖືກຕ້ອງ' })
    disputeStatus?: DisputeStatus = DisputeStatus.FIRST_INSTANCE;

    @ApiPropertyOptional({ description: 'ຍອດເກັບກູ້ຄືນໄດ້ (LAK)', example: 100000000, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    recoveredLak?: number = 0;

    @ApiPropertyOptional({ description: 'ຍອດເກັບກູ້ຄືນໄດ້ (USD)', example: 5000, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    recoveredUsd?: number = 0;

    @ApiProperty({ description: 'ວັນທີເລີ່ມຕົ້ນຄະດີ (YYYY-MM-DD)', example: '2026-01-15' })
    @IsNotEmpty({ message: 'ກະລຸນາປ້ອນວັນທີເລີ່ມຕົ້ນຄະດີ' })
    @IsDateString({}, { message: 'ວັນທີຕ້ອງເປັນຮູບແບບ YYYY-MM-DD' })
    date: string;

    @ApiPropertyOptional({ description: 'ຄວາມຄືບໜ້າຄະດີ / ບັນທຶກຂັ້ນຕອນ', example: 'ສານຂັ້ນຕົ້ນກຳລັງໄຕ່ສວນພະຍານ' })
    @IsOptional()
    @IsString()
    disputeProgress?: string;

    @ApiPropertyOptional({ description: 'ລິ້ງພາຍນອກ (External URL / Drive Link)', example: 'https://sharepoint.edl.com.la/cases/005' })
    @IsOptional()
    @IsString()
    externalUrl?: string;
}
