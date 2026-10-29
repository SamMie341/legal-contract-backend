import { Module } from '@nestjs/common';
import { PowerContractsController } from './presentation/power-contracts.controller.js';
import { PowerAttachmentsController } from './presentation/power-attachments.controller.js';
import { PowerNotificationsController } from './presentation/power-notifications.controller.js';

import { CreatePowerContractUseCase } from './application/use-cases/create-power-contract.use-case.js';
import { UpdatePowerContractUseCase } from './application/use-cases/update-power-contract.use-case.js';
import { DeletePowerContractUseCase } from './application/use-cases/delete-power-contract.use-case.js';
import { GetPowerContractsUseCase } from './application/use-cases/get-power-contracts.use-case.js';
import { GetPowerContractByIdUseCase } from './application/use-cases/get-power-contract-by-id.use-case.js';
import { GetPowerContractHistoryUseCase } from './application/use-cases/get-power-contract-history.use-case.js';
import { GetPowerDashboardStatsUseCase } from './application/use-cases/get-power-dashboard-stats.use-case.js';
import { GetPowerProjectTypesUseCase } from './application/use-cases/get-power-project-types.use-case.js';

import { UploadPowerAttachmentUseCase } from './application/use-cases/upload-power-attachment.use-case.js';
import { DownloadPowerAttachmentUseCase } from './application/use-cases/download-power-attachment.use-case.js';
import { PreviewPowerAttachmentUseCase } from './application/use-cases/preview-power-attachment.use-case.js';
import { GetPowerAttachmentsUseCase } from './application/use-cases/get-power-attachments.use-case.js';
import { DeletePowerAttachmentUseCase } from './application/use-cases/delete-power-attachment.use-case.js';

import { PowerContractExpiryCronService } from './application/services/power-contract-expiry-cron.service.js';
import { GetPowerNotificationsUseCase } from './application/use-cases/get-power-notifications.use-case.js';
import { MarkPowerNotificationReadUseCase } from './application/use-cases/mark-power-notification-read.use-case.js';

import { POWER_CONTRACT_REPOSITORY } from './domain/repositories/power-contract.repository.interface.js';
import { PowerContractRepository } from './infrastructure/repositories/power-contract.repository.js';
import { POWER_CONTRACT_ATTACHMENT_REPOSITORY } from './domain/repositories/power-contract-attachment.repository.interface.js';
import { PowerContractAttachmentRepository } from './infrastructure/repositories/power-contract-attachment.repository.js';
import { POWER_CONTRACT_NOTIFICATION_REPOSITORY } from './domain/repositories/power-contract-notification.repository.interface.js';
import { PowerContractNotificationRepository } from './infrastructure/repositories/power-contract-notification.repository.js';

@Module({
    controllers: [
        PowerContractsController,
        PowerAttachmentsController,
        PowerNotificationsController,
    ],
    providers: [
        CreatePowerContractUseCase,
        UpdatePowerContractUseCase,
        DeletePowerContractUseCase,
        GetPowerContractsUseCase,
        GetPowerContractByIdUseCase,
        GetPowerContractHistoryUseCase,
        GetPowerDashboardStatsUseCase,
        GetPowerProjectTypesUseCase,
        UploadPowerAttachmentUseCase,
        DownloadPowerAttachmentUseCase,
        PreviewPowerAttachmentUseCase,
        GetPowerAttachmentsUseCase,
        DeletePowerAttachmentUseCase,
        PowerContractExpiryCronService,
        GetPowerNotificationsUseCase,
        MarkPowerNotificationReadUseCase,
        {
            provide: POWER_CONTRACT_REPOSITORY,
            useClass: PowerContractRepository,
        },
        {
            provide: POWER_CONTRACT_ATTACHMENT_REPOSITORY,
            useClass: PowerContractAttachmentRepository,
        },
        {
            provide: POWER_CONTRACT_NOTIFICATION_REPOSITORY,
            useClass: PowerContractNotificationRepository,
        },
    ],
    exports: [POWER_CONTRACT_REPOSITORY],
})
export class PowerContractsModule { }

