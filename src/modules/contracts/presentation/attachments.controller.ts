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
import { Roles } from '../../../core/decorators/roles.decorator.js';
import { CurrentUser } from '../../../core/decorators/current-user.decorator.js';
import { UserRole } from '@prisma/client';

import { UploadAttachmentUseCase } from '../application/use-cases/upload-attachment.use-case.js';
import { DownloadAttachmentUseCase } from '../application/use-cases/download-attachment.use-case.js';
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

// กรองเฉพาะไฟล์ PDF และรูปภาพเท่านั้น
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const allowedExtensions = /\.(pdf|png|jpg|jpeg|gif|webp)$/i;
  const allowedMimeTypes = /^(application\/pdf|image\/(png|jpeg|jpg|gif|webp))$/i;

  if (!file.originalname.match(allowedExtensions) || !file.mimetype.match(allowedMimeTypes)) {
    return cb(
      new BadRequestException(
        'ອະນຸຍາດສະເພາະໄຟລ໌ PDF ແລະ ຮູບພາບເທົ່ານັ້ນ (Allowed: PDF, PNG, JPG, JPEG, GIF, WEBP)'
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
    private readonly getAttachmentsUseCase: GetAttachmentsUseCase,
    private readonly deleteAttachmentUseCase: DeleteAttachmentUseCase,
  ) { }

  @ApiOperation({ summary: 'ດຶງລາຍການໄຟລ໌ແນບທັງໝົດຂອງສັນຍາ' })
  @Get(':id/attachments')
  async getAttachments(@Param('id', ParseUUIDPipe) contractId: string) {
    return this.getAttachmentsUseCase.execute(contractId);
  }

  @ApiOperation({ summary: 'ອັບໂຫຼດໄຟລ໌ແນບໃສ່ສັນຍາ (Admin, Main User, Editor)' })
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
  @Roles(UserRole.ADMIN, UserRole.MAIN_USER, UserRole.EDITOR)
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
    return this.uploadUseCase.execute(contractId, file, user.userId);
  }

  @ApiOperation({ summary: 'ດາວໂຫຼດໄຟລ໌ແນບ (ສະເພາະ Admin ຫຼື Main User ທີ່ໄດ້ຮັບອະນຸຍາດ)' })
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

    res.set({
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.fileName)}"`,
    });

    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
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
