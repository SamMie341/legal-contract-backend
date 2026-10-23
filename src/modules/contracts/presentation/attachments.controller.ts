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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname, isAbsolute, resolve } from 'path';
import type { Response, Request } from 'express';
import { createReadStream, existsSync, mkdirSync } from 'fs';

import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../core/guards/roles.guard.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

import { UploadAttachmentUseCase } from '../application/use-cases/upload-attachment.use-case.js';
import { DownloadAttachmentUseCase } from '../application/use-cases/download-attachment.use-case.js';
import { PreviewAttachmentUseCase } from '../application/use-cases/preview-attachment.use-case.js';
import { GetAttachmentsUseCase } from '../application/use-cases/get-attachments.use-case.js';
import { DeleteAttachmentUseCase } from '../application/use-cases/delete-attachment.use-case.js';

// กำหนดโฟลเดอร์เก็บไฟล์ไว้นอกโปรเจกต์ (../uploads/contracts หรือตามค่า UPLOAD_DIR ใน .env)
const uploadDir = resolve(process.cwd(), process.env.UPLOAD_DIR || '../uploads/contracts');
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir, { recursive: true });
}

// กำหนดที่เก็บไฟล์และชื่อไฟล์
const storage = diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

// กรองเฉพาะไฟล์ PDF และรูปภาพเท่านั้น พร้อมตรวจสอบสิทธิ์ canUpload ก่อนบันทึกไฟล์ลง Disk
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
          'ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບ (Permission Denied: canUpload required)',
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
        'ອະນຸຍາດສະເພາະໄຟລ໌ PDF ແລະ ຮູບພາບເທົ່ານັ້ນ (Allowed: PDF, PNG, JPG, JPEG, GIF, WEBP)',
      ),
      false,
    );
  }
  cb(null, true);
};

@ApiTags('Attachments (ເອກະສານຕິດຄັດ)')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttachmentsController {
  constructor(
    private readonly uploadUseCase: UploadAttachmentUseCase,
    private readonly downloadUseCase: DownloadAttachmentUseCase,
    private readonly previewUseCase: PreviewAttachmentUseCase,
    private readonly getAttachmentsUseCase: GetAttachmentsUseCase,
    private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
  ) {}

  @ApiOperation({ summary: 'ດຶງລາຍການໄຟລ໌ແນບທັງໝົດຂອງສັນຍາ' })
  @Get(':id/attachments')
  async getAttachments(
    @Param('id', ParseUUIDPipe) contractId: string,
    @CurrentUser() user: any,
  ) {
    return this.getAttachmentsUseCase.execute(contractId, user);
  }

  @ApiOperation({ summary: 'ອັບໂຫຼດໄຟລ໌ແນບໃສ່ສັນຍາ (Admin, Main User ຫຼື ຜູ້ມີສິດ canUpload - ສະເພາະ PDF ແລະ ຮູບພາບ)' })
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

    const filePath = isAbsolute(attachment.storageKey)
      ? attachment.storageKey
      : resolve(process.cwd(), attachment.storageKey);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on server' });
    }

    const mimeType = attachment.mimeType || (attachment.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

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
      req.headers['user-agent'],
    );

    const filePath = isAbsolute(attachment.storageKey)
      ? attachment.storageKey
      : resolve(process.cwd(), attachment.storageKey);

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on server' });
    }

    const mimeType = attachment.mimeType || (attachment.fileName?.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');

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

  @ApiOperation({ summary: 'ລົບໄຟລ໌ແນບ (Admin, Main User ຫຼື ຜູ້ມີສິດ canDelete)' })
  @Delete('attachments/:attachmentId')
  async deleteAttachment(
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @CurrentUser() user: any,
  ) {
    return this.deleteAttachmentUseCase.execute(attachmentId, user);
  }
}
