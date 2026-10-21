import { IsString, IsOptional, IsInt, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContactChannelDto {
    @ApiProperty({ description: 'ຊື່ຊ່ອງທາງຕິດຕໍ່ (ເຊັ່ນ: ຝ່າຍໄອທີ, ສາຍດ່ວນແຈ້ງບັນຫາ, WhatsApp)' })
    @IsString()
    channelName: string;

    @ApiProperty({ description: 'ຂໍ້ມູນຕິດຕໍ່ (ເບີໂທ, ອີເມວ, ຫຼື ລິ້ງ)' })
    @IsString()
    contactInfo: string;

    @ApiPropertyOptional({ description: 'ລາຍລະອຽດ ຫຼື ເວລາເຮັດວຽກ' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ default: 0, description: 'ລຳດັບການສະແດງຜົນ' })
    @IsOptional()
    @IsInt()
    sortOrder?: number;

    @ApiPropertyOptional({ default: true, description: 'ສະຖານະເປີດໃຊ້ງານ' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
