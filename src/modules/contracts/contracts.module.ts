import { Module } from '@nestjs/common';
import { ContractsController } from './presentation/contracts.controller.js';
import { AttachmentsController } from './presentation/attachments.controller.js';
import { NotificationsController } from './presentation/notifications.controller.js';

import { CreateContractUseCase } from './application/use-cases/create-contract.use-case.js';
import { UpdateContractUseCase } from './application/use-cases/update-contract.use-case.js';
import { DeleteContractUseCase } from './application/use-cases/delete-contract.use-case.js';
import { GetContractsUseCase } from './application/use-cases/get-contracts.use-case.js';
import { GetContractByIdUseCase } from './application/use-cases/get-contract-by-id.use-case.js';
import { GetContractHistoryUseCase } from './application/use-cases/get-contract-history.use-case.js';
import { GetDashboardStatsUseCase } from './application/use-cases/get-dashboard-stats.use-case.js';

import { UploadAttachmentUseCase } from './application/use-cases/upload-attachment.use-case.js';
import { DownloadAttachmentUseCase } from './application/use-cases/download-attachment.use-case.js';
import { PreviewAttachmentUseCase } from './application/use-cases/preview-attachment.use-case.js';
import { GetAttachmentsUseCase } from './application/use-cases/get-attachments.use-case.js';
import { DeleteAttachmentUseCase } from './application/use-cases/delete-attachment.use-case.js';

import { ContractExpiryCronService } from './application/services/contract-expiry-cron.services.js';
import { GetNotificationsUseCase } from './application/use-cases/get-notifications.use-case.js';
import { MarkNotificationReadUseCase } from './application/use-cases/mark-notification-read.use-case.js';

import { CONTRACT_REPOSITORY } from './domain/repositories/contract.repository.interface.js';
import { ContractRepository } from './infrastructure/repositories/contract.repository.js';
import { CONTRACT_ATTACHMENT_REPOSITORY } from './domain/repositories/contract-attachment.repository.interface.js';
import { ContractAttachmentRepository } from './infrastructure/repositories/contract-attachment.repository.js';
import { NOTIFICATION_REPOSITORY } from './domain/repositories/notification.repository.interface.js';
import { NotificationRepository } from './infrastructure/repositories/notification.repository.js';

@Module({
    controllers: [ContractsController, AttachmentsController, NotificationsController],
    providers: [
        CreateContractUseCase,
        UpdateContractUseCase,
        DeleteContractUseCase,
        GetContractsUseCase,
        GetContractByIdUseCase,
        GetContractHistoryUseCase,
        GetDashboardStatsUseCase,
        UploadAttachmentUseCase,
        DownloadAttachmentUseCase,
        PreviewAttachmentUseCase,
        GetAttachmentsUseCase,
        DeleteAttachmentUseCase,
        ContractExpiryCronService,
        GetNotificationsUseCase,
        MarkNotificationReadUseCase,
        {
            provide: CONTRACT_REPOSITORY,
            useClass: ContractRepository,
        },
        {
            provide: CONTRACT_ATTACHMENT_REPOSITORY,
            useClass: ContractAttachmentRepository,
        },
        {
            provide: NOTIFICATION_REPOSITORY,
            useClass: NotificationRepository,
        },
    ],
    exports: [CONTRACT_REPOSITORY],
})
export class ContractsModule { }
