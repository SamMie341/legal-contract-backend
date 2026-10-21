import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@prisma/client';

export class CreateSupportTicketDto {
    @ApiProperty({ description: 'ຫົວຂໍ້ບັນຫາ ຫຼື ຂໍ້ສະເໜີປັບປຸງ' })
    @IsString()
    subject: string;

    @ApiProperty({ description: 'ລາຍລະອຽດບັນຫາ' })
    @IsString()
    description: string;

    @ApiPropertyOptional({ description: 'ລິ້ງຮູບພາບປະກອບ (ຖ້າມີ)' })
    @IsOptional()
    @IsString()
    attachmentUrl?: string;

    @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM, description: 'ລະດັບຄວາມສຳຄັນ' })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;
}
