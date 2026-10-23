import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module.js';

import { LEGAL_CASE_REPOSITORY } from './domain/repositories/legal-case.repository.interface.js';
import { CASE_ATTACHMENT_REPOSITORY } from './domain/repositories/case-attachment.repository.interface.js';

import { LegalCaseRepository } from './infrastructure/repositories/legal-case.repository.js';
import { CaseAttachmentRepository } from './infrastructure/repositories/case-attachment.repository.js';

import { CreateLegalCaseUseCase } from './application/use-cases/create-legal-case.use-case.js';
import { UpdateLegalCaseUseCase } from './application/use-cases/update-legal-case.use-case.js';
import { DeleteLegalCaseUseCase } from './application/use-cases/delete-legal-case.use-case.js';
import { GetLegalCasesUseCase } from './application/use-cases/get-legal-cases.use-case.js';
import { GetLegalCaseByIdUseCase } from './application/use-cases/get-legal-case-by-id.use-case.js';
import { GetLegalCaseDashboardUseCase } from './application/use-cases/get-legal-case-dashboard.use-case.js';

import { UploadCaseAttachmentUseCase } from './application/use-cases/upload-case-attachment.use-case.js';
import { GetCaseAttachmentsUseCase } from './application/use-cases/get-case-attachments.use-case.js';
import { PreviewCaseAttachmentUseCase } from './application/use-cases/preview-case-attachment.use-case.js';
import { DownloadCaseAttachmentUseCase } from './application/use-cases/download-case-attachment.use-case.js';
import { DeleteCaseAttachmentUseCase } from './application/use-cases/delete-case-attachment.use-case.js';

import { LegalCasesController } from './presentation/legal-cases.controller.js';
import { LegalCaseAttachmentsController } from './presentation/legal-case-attachments.controller.js';

@Module({
    imports: [PrismaModule],
    controllers: [LegalCasesController, LegalCaseAttachmentsController],
    providers: [
        {
            provide: LEGAL_CASE_REPOSITORY,
            useClass: LegalCaseRepository,
        },
        {
            provide: CASE_ATTACHMENT_REPOSITORY,
            useClass: CaseAttachmentRepository,
        },
        CreateLegalCaseUseCase,
        UpdateLegalCaseUseCase,
        DeleteLegalCaseUseCase,
        GetLegalCasesUseCase,
        GetLegalCaseByIdUseCase,
        GetLegalCaseDashboardUseCase,
        UploadCaseAttachmentUseCase,
        GetCaseAttachmentsUseCase,
        PreviewCaseAttachmentUseCase,
        DownloadCaseAttachmentUseCase,
        DeleteCaseAttachmentUseCase,
    ],
    exports: [
        LEGAL_CASE_REPOSITORY,
        CASE_ATTACHMENT_REPOSITORY,
    ],
})
export class LegalCasesModule { }
