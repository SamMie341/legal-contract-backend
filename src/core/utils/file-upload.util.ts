import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, isAbsolute, resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SystemModule } from '../constants/division.constant.js';
import { canAccessModule } from './division-helper.util.js';

export const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const DEFAULT_ALLOWED_FILE_EXTENSIONS = /\.pdf$/i;
export const DEFAULT_ALLOWED_MIME_TYPES = /^application\/pdf$/i;
export const DEFAULT_INVALID_FILE_TYPE_MESSAGE = 'ອະນຸຍາດສະເພາະໄຟລ໌ PDF ເທົ່ານັ້ນ';

const MIME_BY_EXT: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
};

export interface UploadMulterConfig {
    /** Environment variable name overriding the directory, e.g. 'UPLOAD_DIR'. */
    envKey?: string;
    /** Default upload directory relative to process.cwd(), e.g. '../uploads/contracts'. */
    defaultDir: string;
    /** Module key for checking `canUpload` in fileFilter (omit to skip module check). */
    module?: SystemModule;
    /** Optional prefix prepended to the generated UUID filename on disk, e.g. 'ticket-'. */
    filenamePrefix?: string;
    /** Maximum allowed file size in bytes (default: 25 MB). */
    maxFileSize?: number;
    /** Allowed file extensions regex (default: PDF and images). */
    allowedExtensions?: RegExp;
    /** Allowed MIME types regex (default: PDF and images). */
    allowedMimeTypes?: RegExp;
    /** Error message returned when extension or MIME type is rejected. */
    invalidFileTypeMessage?: string;
}

export interface SendStoredFileOptions {
    storageKey: string;
    fileName?: string | null;
    mimeType?: string | null;
    disposition: 'inline' | 'attachment';
    errorMessage?: string;
}

function stripControlChars(value: string): string {
    let out = '';
    for (let i = 0; i < value.length; i++) {
        const code = value.charCodeAt(i);
        if (code >= 0x20 && code !== 0x7f) {
            out += value[i];
        }
    }
    return out;
}

function encodeRFC5987ValueChars(value: string): string {
    return encodeURIComponent(value).replace(
        /['()*!]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

/**
 * Decodes and normalizes an uploaded filename so UTF-8 names (Lao, Thai, etc.)
 * are never corrupted into latin1 mojibake ("ภาษาเอเลี่ยน").
 */
export function decodeOriginalFilename(originalname?: string | null): string {
    if (!originalname) return '';

    let cleaned = stripControlChars(originalname);

    // Only attempt latin1 -> utf8 recovery when all code units are <= 0xFF and at least
    // one extended byte (0x80..0xFF) is present, verified by lossless round-tripping.
    let hasNonLatin1 = false;
    let hasExtendedLatin1 = false;
    for (let i = 0; i < cleaned.length; i++) {
        const code = cleaned.charCodeAt(i);
        if (code > 0xff) {
            hasNonLatin1 = true;
            break;
        }
        if (code >= 0x80) {
            hasExtendedLatin1 = true;
        }
    }

    if (!hasNonLatin1 && hasExtendedLatin1) {
        const decoded = Buffer.from(cleaned, 'latin1').toString('utf8');
        if (!decoded.includes('\uFFFD') && Buffer.from(decoded, 'utf8').toString('latin1') === cleaned) {
            cleaned = decoded;
        }
    }

    const baseName = cleaned.split(/[/\\]/).pop() ?? '';
    return baseName.normalize('NFC').trim();
}

/**
 * Builds an RFC 6266 / RFC 5987 Content-Disposition header with a safe ASCII fallback
 * and UTF-8 `filename*` so browsers preserve Lao/Thai filenames on download/preview.
 */
export function buildContentDisposition(
    disposition: 'inline' | 'attachment',
    fileName?: string | null,
): string {
    if (!fileName) {
        return disposition;
    }

    const cleanName = decodeOriginalFilename(fileName) || 'file';
    const ext = extname(cleanName);
    const base = ext ? cleanName.slice(0, -ext.length) : cleanName;

    const asciiBase =
        base
            .replace(/[^\x20-\x7e]/g, '_')
            .replace(/["\\;]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '') || 'file';
    const asciiExt = ext.replace(/[^\x20-\x7e]/g, '').replace(/["\\;]/g, '');
    const asciiFallback = `${asciiBase}${asciiExt}`;

    return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeRFC5987ValueChars(cleanName)}`;
}

/**
 * Resolves the target upload directory and creates it recursively if missing.
 */
export function resolveUploadDir(envKey: string | undefined, defaultDir: string): string {
    const rawDir = (envKey && process.env[envKey]) || defaultDir;
    const uploadDir = resolve(process.cwd(), rawDir);
    if (!existsSync(uploadDir)) {
        mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}

/**
 * Creates standardized Multer options with UTF-8 header decoding, mojibake recovery,
 * optional module `canUpload` authorization, extension/MIME validation, and UUID disk storage.
 */
export function createUploadMulterOptions(config: UploadMulterConfig): MulterOptions {
    const maxFileSize = config.maxFileSize ?? DEFAULT_MAX_FILE_SIZE_BYTES;
    const allowedExtensions = config.allowedExtensions ?? DEFAULT_ALLOWED_FILE_EXTENSIONS;
    const allowedMimeTypes = config.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES;
    const invalidFileTypeMessage = config.invalidFileTypeMessage ?? DEFAULT_INVALID_FILE_TYPE_MESSAGE;
    const prefix = config.filenamePrefix ?? '';

    const storage = diskStorage({
        destination: (_req, _file, cb) => {
            try {
                cb(null, resolveUploadDir(config.envKey, config.defaultDir));
            } catch (err) {
                cb(err as Error, '');
            }
        },
        filename: (_req, file, cb) => {
            const cleanName = decodeOriginalFilename(file.originalname);
            file.originalname = cleanName;
            const ext = extname(cleanName).toLowerCase();
            cb(null, `${prefix}${uuidv4()}${ext}`);
        },
    });

    const fileFilter: MulterOptions['fileFilter'] = (req, file, cb) => {
        file.originalname = decodeOriginalFilename(file.originalname);

        if (config.module && req.user) {
            if (!canAccessModule(req.user, config.module, 'canUpload')) {
                return cb(new ForbiddenException('ທ່ານບໍ່ມີສິດອັບໂຫຼດໄຟລ໌ແນບ'), false);
            }
        }

        if (!file.originalname.match(allowedExtensions) || !file.mimetype.match(allowedMimeTypes)) {
            return cb(new BadRequestException(invalidFileTypeMessage), false);
        }

        cb(null, true);
    };

    return {
        storage,
        fileFilter,
        defParamCharset: 'utf8',
        limits: { fileSize: maxFileSize },
    };
}

/**
 * Streams a stored file from disk with proper Content-Type and UTF-8 Content-Disposition headers.
 */
export function sendStoredFile(res: Response, options: SendStoredFileOptions) {
    const filePath = isAbsolute(options.storageKey)
        ? options.storageKey
        : resolve(process.cwd(), options.storageKey);

    if (!existsSync(filePath)) {
        return res.status(404).json({ message: 'Physical file not found on server' });
    }

    const ext = extname(options.fileName || filePath).toLowerCase();
    const mimeType = options.mimeType || MIME_BY_EXT[ext] || 'application/octet-stream';
    const contentDisposition = buildContentDisposition(options.disposition, options.fileName);

    return res.sendFile(
        filePath,
        {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': contentDisposition,
            },
        },
        (err) => {
            if (err && !res.headersSent) {
                const defaultErrMsg =
                    options.disposition === 'attachment' ? 'Error downloading file' : 'Error streaming file';
                res.status(500).json({ message: options.errorMessage ?? defaultErrMsg });
            }
        },
    );
}
