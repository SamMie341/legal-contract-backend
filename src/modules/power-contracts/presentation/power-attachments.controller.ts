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
    Req,
    Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response, Request } from 'express';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { createUploadMulterOptions, sendStoredFile } from '../../../core/utils/file-upload.util.js';

import { UploadPowerAttachmentUseCase } from '../application/use-cases/upload-power-attachment.use-case.js';
import { DownloadPowerAttachmentUseCase } from '../application/use-cases/download-power-attachment.use-case.js';
import { PreviewPowerAttachmentUseCase } from '../application/use-cases/preview-power-attachment.use-case.js';
import { GetPowerAttachmentsUseCase } from '../application/use-cases/get-power-attachments.use-case.js';
import { DeletePowerAttachmentUseCase } from '../application/use-cases/delete-power-attachment.use-case.js';

const powerContractUploadOptions = createUploadMulterOptions({
    envKey: 'POWER_CONTRACT_UPLOAD_DIR',
    defaultDir: '../uploads/power-contracts',
    module: SystemModule.POWER_CONTRACTS,
});

@ApiTags('Power Contract Attachments (ເອກະສານຕິດຄັດສັນຍາຊື້-ຂາຍໄຟຟ້າ)')
@ApiBearerAuth()
@Controller('power-contracts')
@UseGuards(JwtAuthGuard, RolesGuard, DivisionGuard)
@RequiredModule(SystemModule.POWER_CONTRACTS)
export class PowerAttachmentsController {
    constructor(
        private readonly uploadUseCase: UploadPowerAttachmentUseCase,
        private readonly downloadUseCase: DownloadPowerAttachmentUseCase,
        private readonly previewUseCase: PreviewPowerAttachmentUseCase,
        private readonly getAttachmentsUseCase: GetPowerAttachmentsUseCase,
        private readonly deleteAttachmentUseCase: DeletePowerAttachmentUseCase,
    ) { }

    @ApiOperation({ summary: 'ດຶງລາຍການໄຟລ໌ແນບທັງໝົດຂອງສັນຍາຊື້-ຂາຍໄຟຟ້າ' })
    @Get(':id/attachments')
    async getAttachments(
        @Param('id', ParseUUIDPipe) contractId: string,
        @CurrentUser() user: any,
    ) {
        return this.getAttachmentsUseCase.execute(contractId, user);
    }

    @ApiOperation({
        summary: 'ອັບໂຫຼດໄຟລ໌ແນບໃສ່ສັນຍາຊື້-ຂາຍໄຟຟ້າ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload - ສະເພາະ PDF ແລະ ຮູບພາບ)',
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
    @UseInterceptors(FileInterceptor('file', powerContractUploadOptions))
    async uploadFile(
        @Param('id', ParseUUIDPipe) contractId: string,
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: any,
    ) {
        return this.uploadUseCase.execute(contractId, file, user);
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
            storageKey: attachment.storageKey,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            disposition: 'inline',
        });
    }

    @ApiOperation({ summary: 'ດາວໂຫຼດໄຟລ໌ແນບ (ສະເພາະ Admin ຫຼື ຜູ້ທີ່ໄດ້ຮັບອະນຸຍາດ canDownload)' })
    @Get('attachments/:attachmentId/download')
    async downloadFile(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const attachment = await this.downloadUseCase.execute(
            attachmentId,
            user,
            req.ip,
            req.headers['user-agent'] as string,
        );

        return sendStoredFile(res, {
            storageKey: attachment.storageKey,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            disposition: 'attachment',
        });
    }

    @ApiOperation({ summary: 'ລົບໄຟລ໌ແນບ (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
    @Delete('attachments/:attachmentId')
    async deleteAttachment(
        @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
        @CurrentUser() user: any,
    ) {
        return this.deleteAttachmentUseCase.execute(attachmentId, user);
    }
}

