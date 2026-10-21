import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@prisma/client';

export class UpdateSupportTicketDto {
    @ApiPropertyOptional({ enum: TicketStatus, description: 'ສະຖານະ Ticket (OPEN, IN_PROGRESS, RESOLVED, CLOSED)' })
    @IsOptional()
    @IsEnum(TicketStatus)
    status?: TicketStatus;

    @ApiPropertyOptional({ enum: TicketPriority, description: 'ລະດັບຄວາມສຳຄັນ' })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;

    @ApiPropertyOptional({ description: 'ບັນທຶກຈາກຜູ້ດູແລລະບົບ (Admin Note)' })
    @IsOptional()
    @IsString()
    adminNote?: string;

    @ApiPropertyOptional({ description: 'ID ຂອງຜູ້ຮັບຜິດຊອບ (Assigned User ID)' })
    @IsOptional()
    @IsUUID()
    assignedToId?: string;
}
