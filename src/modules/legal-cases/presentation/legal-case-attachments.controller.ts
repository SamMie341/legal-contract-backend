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

import { UploadCaseAttachmentUseCase } from '../application/use-cases/upload-case-attachment.use-case.js';
import { GetCaseAttachmentsUseCase } from '../application/use-cases/get-case-attachments.use-case.js';
import { PreviewCaseAttachmentUseCase } from '../application/use-cases/preview-case-attachment.use-case.js';
import { DownloadCaseAttachmentUseCase } from '../application/use-cases/download-case-attachment.use-case.js';
import { DeleteCaseAttachmentUseCase } from '../application/use-cases/delete-case-attachment.use-case.js';

const legalCaseUploadOptions = createUploadMulterOptions({
    envKey: 'UPLOAD_DIR_LEGAL_CASES',
    defaultDir: '../uploads/legal-cases',
    module: SystemModule.LEGAL_CASES,
});

@ApiTags('Legal Cases - Attachments (ເອກະສານຕິດຄັດສຳນວນຄະດີ)')
@ApiBearerAuth()
@Controller('legal-cases')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.LEGAL_CASES)
export class LegalCaseAttachmentsController {
    constructor(
        private readonly uploadUseCase: UploadCaseAttachmentUseCase,
        private readonly getAttachmentsUseCase: GetCaseAttachmentsUseCase,
        private readonly previewUseCase: PreviewCaseAttachmentUseCase,
        private readonly downloadUseCase: DownloadCaseAttachmentUseCase,
        private readonly deleteAttachmentUseCase: DeleteCaseAttachmentUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍການໄຟລ໌ແນບທັງໝົດຂອງຄະດີ' })
    @Get(':id/attachments')
    async getAttachments(
        @Param('id') idOrCode: string,
        @CurrentUser() user: any,
    ) {
        return this.getAttachmentsUseCase.execute(idOrCode, user);
    }

    @ApiOperation({
        summary:
            'ອັບໂຫຼດໄຟລ໌ແນບໃສ່ສຳນວນຄະດີ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload - ສະເພາະ PDF ແລະ ຮູບພາບ)',
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
    @UseInterceptors(FileInterceptor('file', legalCaseUploadOptions))
    async uploadFile(
        @Param('id') idOrCode: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        return this.uploadUseCase.execute(idOrCode, file, user);
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

    @ApiOperation({ summary: 'ດາວໂຫຼດໄຟລ໌ແນບສຳນວນຄະດີ (ສະເພາະ Admin ຫຼື ຜູ້ທີ່ໄດ້ຮັບອະນຸຍາດ canDownload)' })
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

    @ApiOperation({ summary: 'ລົບໄຟລ໌ແນບສຳນວນຄະດີ (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete('attachments/:attachmentId')
    async deleteAttachment(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteAttachmentUseCase.execute(attachmentId, user);
    }
}
