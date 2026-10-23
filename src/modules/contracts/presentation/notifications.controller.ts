import { Controller, Get, Patch, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { GetNotificationsUseCase } from '../application/use-cases/get-notifications.use-case.js';
import { MarkNotificationReadUseCase } from '../application/use-cases/mark-notification-read.use-case.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(
        private readonly getNotificationsUseCase: GetNotificationsUseCase,
        private readonly markReadUseCase: MarkNotificationReadUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງການແຈ້ງເຕືອນ (ຄ່າເລີ່ມຕົ້ນສະແດງສະເພາະທີ່ຍັງບໍ່ທັນອ່ານ)' })
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
    @Get()
    async getNotifications(
        @CurrentUser() user: any,
        @Query('unreadOnly') unreadOnly?: string,
    ) {
        const isUnread = unreadOnly === undefined || unreadOnly === 'true';
        return this.getNotificationsUseCase.execute(user.userId, isUnread);
    }

    @ApiOperation({ summary: 'ໝາຍການແຈ້ງເຕືອນທັງໝົດວ່າອ່ານແລ້ວ' })
    @Patch('read-all')
    async markAllAsRead(@CurrentUser() user: any) {
        return this.markReadUseCase.executeAll(user.userId);
    }

    @ApiOperation({ summary: 'ໝາຍການແຈ້ງເຕືອນລາຍການໃດໜຶ່ງວ່າອ່ານແລ້ວ' })
    @Patch(':id/read')
    async markAsRead(@Param('id', ParseUUIDPipe) notificationId: string) {
        return this.markReadUseCase.execute(notificationId);
    }
}
