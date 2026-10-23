import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module.js';

import { LEGAL_DOCUMENT_REPOSITORY } from './domain/repositories/legal-document.repository.interface.js';
import { DOCUMENT_ATTACHMENT_REPOSITORY } from './domain/repositories/document-attachment.repository.interface.js';

import { LegalDocumentRepository } from './infrastructure/repositories/legal-document.repository.js';
import { DocumentAttachmentRepository } from './infrastructure/repositories/document-attachment.repository.js';

import { CreateLegalDocumentUseCase } from './application/use-cases/create-legal-document.use-case.js';
import { UpdateLegalDocumentUseCase } from './application/use-cases/update-legal-document.use-case.js';
import { DeleteLegalDocumentUseCase } from './application/use-cases/delete-legal-document.use-case.js';
import { GetLegalDocumentsUseCase } from './application/use-cases/get-legal-documents.use-case.js';
import { GetLegalDocumentByIdUseCase } from './application/use-cases/get-legal-document-by-id.use-case.js';
import { GetLegalDocumentDashboardUseCase } from './application/use-cases/get-legal-document-dashboard.use-case.js';

import { UploadDocumentAttachmentUseCase } from './application/use-cases/upload-document-attachment.use-case.js';
import { GetDocumentAttachmentsUseCase } from './application/use-cases/get-document-attachments.use-case.js';
import { PreviewDocumentAttachmentUseCase } from './application/use-cases/preview-document-attachment.use-case.js';
import { DownloadDocumentAttachmentUseCase } from './application/use-cases/download-document-attachment.use-case.js';
import { DeleteDocumentAttachmentUseCase } from './application/use-cases/delete-document-attachment.use-case.js';

import { LegalDocumentsController } from './presentation/legal-documents.controller.js';
import { LegalDocumentAttachmentsController } from './presentation/legal-document-attachments.controller.js';

@Module({
    imports: [PrismaModule],
    controllers: [LegalDocumentsController, LegalDocumentAttachmentsController],
    providers: [
        {
            provide: LEGAL_DOCUMENT_REPOSITORY,
            useClass: LegalDocumentRepository,
        },
        {
            provide: DOCUMENT_ATTACHMENT_REPOSITORY,
            useClass: DocumentAttachmentRepository,
        },
        CreateLegalDocumentUseCase,
        UpdateLegalDocumentUseCase,
        DeleteLegalDocumentUseCase,
        GetLegalDocumentsUseCase,
        GetLegalDocumentByIdUseCase,
        GetLegalDocumentDashboardUseCase,
        UploadDocumentAttachmentUseCase,
        GetDocumentAttachmentsUseCase,
        PreviewDocumentAttachmentUseCase,
        DownloadDocumentAttachmentUseCase,
        DeleteDocumentAttachmentUseCase,
    ],
    exports: [
        LEGAL_DOCUMENT_REPOSITORY,
        DOCUMENT_ATTACHMENT_REPOSITORY,
    ],
})
export class LegalDocumentsModule { }
