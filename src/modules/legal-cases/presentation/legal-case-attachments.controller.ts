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
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, isAbsolute, resolve } from 'path';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { DivisionGuard } from '../../../core/guards/division.guard.js';
import { RequiredModule } from '../../../core/decorators/required-module.decorator.js';
import { SystemModule } from '../../../core/constants/division.constant.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

import { UploadCaseAttachmentUseCase } from '../application/use-cases/upload-case-attachment.use-case.js';
import { GetCaseAttachmentsUseCase } from '../application/use-cases/get-case-attachments.use-case.js';
import { PreviewCaseAttachmentUseCase } from '../application/use-cases/preview-case-attachment.use-case.js';
import { DownloadCaseAttachmentUseCase } from '../application/use-cases/download-case-attachment.use-case.js';
import { DeleteCaseAttachmentUseCase } from '../application/use-cases/delete-case-attachment.use-case.js';

// ກຳນົດໂຟລເດີເກັບໄຟລ໌ໄວ້ນອກໂປຣເຈັກ (../uploads/legal-cases ຫຼື ຕາມຄ່າ UPLOAD_DIR_LEGAL_CASES)
const uploadDir = resolve(
    process.cwd(),
    process.env.UPLOAD_DIR_LEGAL_CASES || '../uploads/legal-cases',
);
if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
}

const storage = diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
    },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
    const user = req.user;
    if (user) {
        const canUpload =
            user.role === UserRole.ADMIN ||
            user.role === UserRole.MAIN_USER ||
            user.canUpload === true;
        if (!canUpload) {
            return cb(
                new ForbiddenException(
                    'ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບ',
                ),
                false,
            );
        }
    }

    const allowedExtensions = /\.(pdf|png|jpg|jpeg|gif|webp)$/i;
    const allowedMimeTypes = /^(application\/pdf|image\/(png|jpeg|jpg|gif|webp))$/i;

    if (!file.originalname.match(allowedExtensions) || !file.mimetype.match(allowedMimeTypes)) {
        return cb(
            new BadRequestException(
                'ອະນຸຍາດສະເພາະໄຟລ໌ PDF ແລະ ຮູບພາບເທົ່ານັ້ນ (PDF, PNG, JPG, JPEG, GIF, WEBP)',
            ),
            false,
        );
    }
    cb(null, true);
};

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
    @UseInterceptors(
        FileInterceptor('file', {
            storage,
            fileFilter,
            limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
        }),
    )
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

        const filePath = isAbsolute(attachment.fileUrl)
            ? attachment.fileUrl
            : resolve(process.cwd(), attachment.fileUrl);

        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on server' });
        }

        const mimeType = attachment.fileType || (attachment.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

        return res.sendFile(filePath, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `inline; filename="${encodeURIComponent(attachment.fileName)}"`,
            },
        }, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: 'Error streaming file' });
            }
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

        const filePath = isAbsolute(attachment.fileUrl)
            ? attachment.fileUrl
            : resolve(process.cwd(), attachment.fileUrl);

        if (!existsSync(filePath)) {
            return res.status(404).json({ message: 'Physical file not found on server' });
        }

        const mimeType = attachment.fileType || (attachment.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

        return res.sendFile(filePath, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
            },
        }, (err) => {
            if (err && !res.headersSent) {
                res.status(500).json({ message: 'Error downloading file' });
            }
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
