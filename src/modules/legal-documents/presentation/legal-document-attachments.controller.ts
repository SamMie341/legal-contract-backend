import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    ParseUUIDPipe,
    UseInterceptors,
    UploadedFile,
    UseGuards,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { createUploadMulterOptions, sendStoredFile } from '../../../core/utils/file-upload.util.js';

import { UploadDocumentAttachmentUseCase } from '../application/use-cases/upload-document-attachment.use-case.js';
import { GetDocumentAttachmentsUseCase } from '../application/use-cases/get-document-attachments.use-case.js';
import { PreviewDocumentAttachmentUseCase } from '../application/use-cases/preview-document-attachment.use-case.js';
import { DownloadDocumentAttachmentUseCase } from '../application/use-cases/download-document-attachment.use-case.js';
import { DeleteDocumentAttachmentUseCase } from '../application/use-cases/delete-document-attachment.use-case.js';

const legalDocumentUploadOptions = createUploadMulterOptions({
    envKey: 'UPLOAD_DIR_LEGAL_DOCS',
    defaultDir: '../uploads/legal-documents',
    module: SystemModule.LEGAL_DOCUMENTS,
});

@ApiTags('Legal Documents - Attachments (ເອກະສານຕິດຄັດນິຕິກຳ)')
@ApiBearerAuth()
@Controller('legal-documents')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.LEGAL_DOCUMENTS)
export class LegalDocumentAttachmentsController {
    constructor(
        private readonly uploadUseCase: UploadDocumentAttachmentUseCase,
        private readonly getAttachmentsUseCase: GetDocumentAttachmentsUseCase,
        private readonly previewUseCase: PreviewDocumentAttachmentUseCase,
        private readonly downloadUseCase: DownloadDocumentAttachmentUseCase,
        private readonly deleteAttachmentUseCase: DeleteDocumentAttachmentUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍການໄຟລ໌ແນບທັງໝົດຂອງນິຕິກຳ' })
    @Get(':id/attachments')
    async getAttachments(
        @Param('id', ParseUUIDPipe) legalDocumentId: string,
        @CurrentUser() user: any,
    ) {
        return this.getAttachmentsUseCase.execute(legalDocumentId, user);
    }

    @ApiOperation({
        summary:
            'ອັບໂຫຼດໄຟລ໌ແນບໃສ່ນິຕິກຳ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload - ສະເພາະ PDF ແລະ ຮູບພາບ)',
    })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @Post(':id/attachments')
    @UseInterceptors(FileInterceptor('file', legalDocumentUploadOptions))
    async uploadFile(
        @Param('id', ParseUUIDPipe) legalDocumentId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        return this.uploadUseCase.execute(legalDocumentId, file, user);
    }

    @ApiOperation({ summary: 'ເປີດເບິ່ງໄຟລ໌ແນບເທິງໜ້າເວັບ (Preview PDF / ຮູບພາບ ສຳລັບຜູ້ມີສິດ canView)' })
    @Get('attachments/:attachmentId/preview')
    async previewFile(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const attachment = await this.previewUseCase.execute(attachmentId, user);

        return sendStoredFile(res, {
            storageKey: attachment.fileUrl,
            fileName: attachment.fileName,
            mimeType: attachment.fileType,
            disposition: 'inline',
        });
    }

    @ApiOperation({ summary: 'ດາວໂຫຼດໄຟລ໌ແນບນິຕິກຳ (ສະເພາະ Admin ຫຼື ຜູ້ທີ່ໄດ້ຮັບອະນຸຍາດ canDownload)' })
    @Get('attachments/:attachmentId/download')
    async downloadFile(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
        @Res() res: Response,
    ) {
        const attachment = await this.downloadUseCase.execute(attachmentId, user);

        return sendStoredFile(res, {
            storageKey: attachment.fileUrl,
            fileName: attachment.fileName,
            mimeType: attachment.fileType,
            disposition: 'attachment',
        });
    }

    @ApiOperation({ summary: 'ລົບໄຟລ໌ແນບນິຕິກຳ (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete('attachments/:attachmentId')
    async deleteAttachment(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteAttachmentUseCase.execute(attachmentId, user);
    }
}
