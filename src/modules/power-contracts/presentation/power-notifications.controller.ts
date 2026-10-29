import { Controller, Get, Patch, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { GetPowerNotificationsUseCase } from '../application/use-cases/get-power-notifications.use-case.js';
import { MarkPowerNotificationReadUseCase } from '../application/use-cases/mark-power-notification-read.use-case.js';

@ApiTags('Power Notifications (ການແຈ້ງເຕືອນສັນຍາຊື້-ຂາຍໄຟຟ້າ - 60 ວັນ)')
@ApiBearerAuth()
@Controller('power-notifications')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.POWER_CONTRACTS)
export class PowerNotificationsController {
    constructor(
        private readonly getNotificationsUseCase: GetPowerNotificationsUseCase,
        private readonly markReadUseCase: MarkPowerNotificationReadUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງການແຈ້ງເຕືອນສັນຍາຊື້-ຂາຍໄຟຟ້າ (ຄ່າເລີ່ມຕົ້ນສະແດງສະເພາະທີ່ຍັງບໍ່ທັນອ່ານ)' })
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
        return this.markReadUseCase.execute(undefined, user.userId);
    }

    @ApiOperation({ summary: 'ໝາຍການແຈ້ງເຕືອນລາຍການໃດໜຶ່ງວ່າອ່ານແລ້ວ' })
    @Patch(':id/read')
    async markAsRead(@Param('id', ParseUUIDPipe) notificationId: string) {
        return this.markReadUseCase.execute(notificationId);
    }
}

