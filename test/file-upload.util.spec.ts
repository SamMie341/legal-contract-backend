import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '@prisma/client';
import { SystemModule } from '../src/core/constants/division.constant.js';
import {
    buildContentDisposition,
    createUploadMulterOptions,
    decodeOriginalFilename,
    DEFAULT_INVALID_FILE_TYPE_MESSAGE,
    DEFAULT_MAX_FILE_SIZE_BYTES,
    resolveUploadDir,
    sendStoredFile,
} from '../src/core/utils/file-upload.util.js';

const toLatin1Mojibake = (utf8Text: string): string =>
    Buffer.from(utf8Text, 'utf8').toString('latin1');

describe('file-upload.util', () => {
    const tempDirs: string[] = [];
    const envBackup: Record<string, string | undefined> = {};

    const createTempDir = (prefix = 'lcm-upload-test-'): string => {
        const dir = mkdtempSync(join(tmpdir(), prefix));
        tempDirs.push(dir);
        return dir;
    };

    const setEnv = (key: string, value: string | undefined) => {
        if (!(key in envBackup)) {
            envBackup[key] = process.env[key];
        }
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    };

    afterEach(() => {
        for (const [key, val] of Object.entries(envBackup)) {
            if (val === undefined) {
                delete process.env[key];
            } else {
                process.env[key] = val;
            }
            delete envBackup[key];
        }
        while (tempDirs.length > 0) {
            const dir = tempDirs.pop();
            if (dir && existsSync(dir)) {
                rmSync(dir, { recursive: true, force: true });
            }
        }
    });

    describe('decodeOriginalFilename', () => {
        it('recovers Lao UTF-8 filenames mangled as latin1 mojibake (including 0x80-0x9F bytes like ກ/ນ)', () => {
            const originalLao = 'ກົດໝາຍ ແລະ ສັນຍາເຊົ່າ-2026.pdf';
            const mojibake = toLatin1Mojibake(originalLao);

            expect(mojibake).not.toBe(originalLao);
            expect(decodeOriginalFilename(mojibake)).toBe(originalLao);
        });

        it('recovers Thai UTF-8 filenames mangled as latin1 mojibake (including 0x80-0x9F bytes like ญ)', () => {
            const originalThai = 'สัญญาเช่า_ผู้จัดการใหญ่.png';
            const mojibake = toLatin1Mojibake(originalThai);

            expect(mojibake).not.toBe(originalThai);
            expect(decodeOriginalFilename(mojibake)).toBe(originalThai);
        });

        it('preserves valid UTF-8 Lao, Thai, and ASCII filenames unchanged', () => {
            expect(decodeOriginalFilename('ເອກະສານສັນຍາ.pdf')).toBe('ເອກະສານສັນຍາ.pdf');
            expect(decodeOriginalFilename('เอกสารหลักฐาน.jpeg')).toBe('เอกสารหลักฐาน.jpeg');
            expect(decodeOriginalFilename('contract-v2_final.pdf')).toBe('contract-v2_final.pdf');
        });

        it('preserves genuine non-UTF-8 latin1 characters without corruption', () => {
            expect(decodeOriginalFilename('café_résumé.pdf')).toBe('café_résumé.pdf');
        });

        it('strips directory prefixes, ASCII control chars, and normalizes NFD to NFC', () => {
            const nfdLao = 'ສັນຍາ.pdf'.normalize('NFD');
            expect(decodeOriginalFilename(`C:\\fakepath\\${nfdLao}\x00\n\x7f`)).toBe('ສັນຍາ.pdf'.normalize('NFC'));
            expect(decodeOriginalFilename('../../uploads/sub/doc.pdf')).toBe('doc.pdf');
        });

        it('returns empty string for null, undefined, or empty input', () => {
            expect(decodeOriginalFilename(null)).toBe('');
            expect(decodeOriginalFilename(undefined)).toBe('');
            expect(decodeOriginalFilename('')).toBe('');
        });
    });

    describe('buildContentDisposition', () => {
        it('returns bare disposition when fileName is missing', () => {
            expect(buildContentDisposition('inline', null)).toBe('inline');
            expect(buildContentDisposition('attachment', undefined)).toBe('attachment');
            expect(buildContentDisposition('attachment', '')).toBe('attachment');
        });

        it('builds ASCII fallback and RFC 5987 filename* for UTF-8 Lao filenames', () => {
            const header = buildContentDisposition('attachment', 'ສັນຍາ_01.pdf');

            expect(header).toBe(
                `attachment; filename="01.pdf"; filename*=UTF-8''${encodeURIComponent('ສັນຍາ_01.pdf')}`,
            );
        });

        it('falls back to "file" basename when filename has no ASCII stem chars', () => {
            const header = buildContentDisposition('inline', 'ເອກະສານ.pdf');

            expect(header).toBe(
                `inline; filename="file.pdf"; filename*=UTF-8''${encodeURIComponent('ເອກະສານ.pdf')}`,
            );
        });

        it('recovers legacy mojibake fileName when building Content-Disposition', () => {
            const original = 'ກິດຈະກຳ(ໃໝ່)!.pdf';
            const mojibake = toLatin1Mojibake(original);
            const header = buildContentDisposition('attachment', mojibake);

            expect(header).toContain("filename*=UTF-8''");
            expect(header).toContain(encodeURIComponent('ກິດຈະກຳ').toUpperCase());
            expect(header).toContain('%28');
            expect(header).toContain('%29');
            expect(header).toContain('%21');
        });

        it('sanitizes quotes and semicolons in ASCII fallback and strips directory prefixes', () => {
            const header = buildContentDisposition('attachment', 'my"semi;doc.pdf');
            expect(header).toContain('filename="my_semi_doc.pdf"');

            const pathHeader = buildContentDisposition('attachment', 'folder\\sub/my"semi;doc.pdf');
            expect(pathHeader).toContain('filename="my_semi_doc.pdf"');
        });
    });

    describe('resolveUploadDir', () => {
        it('uses envKey override when defined and creates missing directory recursively', () => {
            const base = createTempDir();
            const target = join(base, 'nested', 'contracts');
            setEnv('TEST_UPLOAD_DIR_OVERRIDE', target);

            const resolved = resolveUploadDir('TEST_UPLOAD_DIR_OVERRIDE', './fallback');

            expect(resolved).toBe(resolve(process.cwd(), target));
            expect(existsSync(resolved)).toBe(true);
        });

        it('falls back to defaultDir when envKey is omitted or unset', () => {
            const base = createTempDir();
            const fallbackDir = join(base, 'default-dir');
            setEnv('TEST_UPLOAD_DIR_MISSING', undefined);

            const resolved = resolveUploadDir('TEST_UPLOAD_DIR_MISSING', fallbackDir);

            expect(resolved).toBe(resolve(process.cwd(), fallbackDir));
            expect(existsSync(resolved)).toBe(true);
        });
    });

    describe('createUploadMulterOptions', () => {
        const invokeFilter = (
            options: ReturnType<typeof createUploadMulterOptions>,
            req: any,
            file: { originalname: string; mimetype: string },
        ) =>
            new Promise<{ err: Error | null; accept?: boolean }>((resolvePromise) => {
                options.fileFilter!(req, file as any, (err, accept) => {
                    resolvePromise({ err, accept });
                });
            });

        it('sets defParamCharset to utf8 and defaults maxFileSize to 25 MB', () => {
            const base = createTempDir();
            const options = createUploadMulterOptions({ defaultDir: base });

            expect(options.defParamCharset).toBe('utf8');
            expect(options.limits?.fileSize).toBe(DEFAULT_MAX_FILE_SIZE_BYTES);
        });

        it('normalizes mojibake originalname in fileFilter and accepts valid PDF/image files', async () => {
            const base = createTempDir();
            const options = createUploadMulterOptions({
                defaultDir: base,
                module: SystemModule.CONTRACTS,
            });
            const req = {
                user: {
                    role: UserRole.ADMIN,
                },
            };
            const originalLao = 'ສັນຍາເຊົ່າ.pdf';
            const file = {
                originalname: toLatin1Mojibake(originalLao),
                mimetype: 'application/pdf',
            };

            const result = await invokeFilter(options, req, file);

            expect(result.err).toBeNull();
            expect(result.accept).toBe(true);
            expect(file.originalname).toBe(originalLao);
        });

        it('throws ForbiddenException when user lacks canUpload permission for the module', async () => {
            const base = createTempDir();
            const options = createUploadMulterOptions({
                defaultDir: base,
                module: SystemModule.CONTRACTS,
            });
            const req = {
                user: {
                    role: UserRole.STAFF,
                    modulePermissions: [{ module: SystemModule.CONTRACTS, canView: true, canUpload: false }],
                },
            };
            const file = {
                originalname: 'test.pdf',
                mimetype: 'application/pdf',
            };

            const result = await invokeFilter(options, req, file);

            expect(result.err).toBeInstanceOf(ForbiddenException);
            expect(result.accept).toBe(false);
        });

        it('skips module permission check when module is omitted', async () => {
            const base = createTempDir();
            const options = createUploadMulterOptions({
                defaultDir: base,
                maxFileSize: 10 * 1024 * 1024,
            });
            const req = {
                user: {
                    role: UserRole.STAFF,
                    modulePermissions: [],
                },
            };
            const file = {
                originalname: 'ticket.pdf',
                mimetype: 'application/pdf',
            };

            const result = await invokeFilter(options, req, file);

            expect(result.err).toBeNull();
            expect(result.accept).toBe(true);
            expect(options.limits?.fileSize).toBe(10 * 1024 * 1024);
        });

        it('rejects invalid extensions or MIME types with BadRequestException', async () => {
            const base = createTempDir();
            const customMessage = 'Custom invalid file message';
            const options = createUploadMulterOptions({
                defaultDir: base,
                invalidFileTypeMessage: customMessage,
            });

            const badExt = await invokeFilter(options, {}, { originalname: 'script.exe', mimetype: 'application/pdf' });
            expect(badExt.err).toBeInstanceOf(BadRequestException);
            expect(badExt.err?.message).toBe(customMessage);
            expect(badExt.accept).toBe(false);

            const defaultOpts = createUploadMulterOptions({ defaultDir: base });
            const badMime = await invokeFilter(
                defaultOpts,
                {},
                { originalname: 'document.pdf', mimetype: 'text/plain' },
            );
            expect(badMime.err).toBeInstanceOf(BadRequestException);
            expect(badMime.err?.message).toBe(DEFAULT_INVALID_FILE_TYPE_MESSAGE);
            expect(badMime.accept).toBe(false);

            const imageFile = await invokeFilter(
                defaultOpts,
                {},
                { originalname: 'photo.png', mimetype: 'image/png' },
            );
            expect(imageFile.err).toBeInstanceOf(BadRequestException);
            expect(imageFile.err?.message).toBe(DEFAULT_INVALID_FILE_TYPE_MESSAGE);
            expect(imageFile.accept).toBe(false);
        });

        it('lazily resolves envKey destination and generates prefixed UUID filenames in storage', async () => {
            const base = createTempDir();
            const options = createUploadMulterOptions({
                envKey: 'TEST_LAZY_TICKET_DIR',
                defaultDir: join(base, 'fallback'),
                filenamePrefix: 'ticket-',
            });

            // Change env var AFTER createUploadMulterOptions() was called to confirm lazy evaluation
            const lazyTarget = join(base, 'lazy-tickets');
            setEnv('TEST_LAZY_TICKET_DIR', lazyTarget);

            const storage = options.storage as unknown as {
                getDestination: (req: any, file: any, cb: (err: Error | null, dest: string) => void) => void;
                getFilename: (req: any, file: any, cb: (err: Error | null, name: string) => void) => void;
            };

            const dest = await new Promise<string>((resolvePromise, rejectPromise) => {
                storage.getDestination({}, {}, (err, dir) => (err ? rejectPromise(err) : resolvePromise(dir)));
            });
            expect(dest).toBe(resolve(process.cwd(), lazyTarget));
            expect(existsSync(dest)).toBe(true);

            const fileObj = { originalname: toLatin1Mojibake('ຮູບພາບ.PNG') };
            const storedName = await new Promise<string>((resolvePromise, rejectPromise) => {
                storage.getFilename({}, fileObj, (err, name) => (err ? rejectPromise(err) : resolvePromise(name)));
            });

            expect(fileObj.originalname).toBe('ຮູບພາບ.PNG');
            expect(storedName).toMatch(/^ticket-[0-9a-f-]{36}\.png$/);
        });
    });

    describe('sendStoredFile', () => {
        const createMockRes = (headersSent = false) => {
            const res: any = {
                headersSent,
                statusCode: 200,
                body: undefined as unknown,
                status: vi.fn((code: number) => {
                    res.statusCode = code;
                    return res;
                }),
                json: vi.fn((payload: unknown) => {
                    res.body = payload;
                    return res;
                }),
                sendFile: vi.fn(),
            };
            return res;
        };

        it('returns 404 JSON when file does not exist on disk', () => {
            const base = createTempDir();
            const missingPath = join(base, 'missing-file.pdf');
            const res = createMockRes();

            sendStoredFile(res, {
                storageKey: missingPath,
                fileName: 'missing-file.pdf',
                disposition: 'inline',
            });

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Physical file not found on server' });
            expect(res.sendFile).not.toHaveBeenCalled();
        });

        it('streams existing file with resolved MIME type and UTF-8 Content-Disposition', () => {
            const base = createTempDir();
            const storedPath = join(base, 'abc-123.pdf');
            writeFileSync(storedPath, Buffer.from('%PDF-1.4 mock'));
            const res = createMockRes();

            sendStoredFile(res, {
                storageKey: storedPath,
                fileName: 'ສັນຍາເຊົ່າ.pdf',
                mimeType: null,
                disposition: 'attachment',
            });

            expect(res.sendFile).toHaveBeenCalledTimes(1);
            const [sentPath, sentOpts] = res.sendFile.mock.calls[0];
            expect(sentPath).toBe(storedPath);
            expect(sentOpts.headers['Content-Type']).toBe('application/pdf');
            expect(sentOpts.headers['Content-Disposition']).toBe(
                `attachment; filename="file.pdf"; filename*=UTF-8''${encodeURIComponent('ສັນຍາເຊົ່າ.pdf')}`,
            );
        });

        it('respects explicit mimeType and falls back to application/octet-stream for unknown extensions', () => {
            const base = createTempDir();
            const storedPath = join(base, 'raw.bin');
            writeFileSync(storedPath, Buffer.from('binary'));
            const res1 = createMockRes();
            const res2 = createMockRes();

            sendStoredFile(res1, {
                storageKey: storedPath,
                fileName: 'preview.jpg',
                mimeType: 'image/webp',
                disposition: 'inline',
            });
            expect(res1.sendFile.mock.calls[0][1].headers['Content-Type']).toBe('image/webp');

            sendStoredFile(res2, {
                storageKey: storedPath,
                fileName: 'archive.xyz',
                mimeType: undefined,
                disposition: 'inline',
            });
            expect(res2.sendFile.mock.calls[0][1].headers['Content-Type']).toBe('application/octet-stream');
        });

        it('returns 500 JSON with default or custom errorMessage if sendFile callback errors before headersSent', () => {
            const base = createTempDir();
            const storedPath = join(base, 'doc.pdf');
            writeFileSync(storedPath, Buffer.from('%PDF'));
            const res = createMockRes(false);

            sendStoredFile(res, {
                storageKey: storedPath,
                fileName: 'doc.pdf',
                disposition: 'attachment',
                errorMessage: 'Custom stream error',
            });

            const callback = res.sendFile.mock.calls[0][2] as (err?: Error) => void;
            callback(new Error('EIO'));

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Custom stream error' });

            const resSent = createMockRes(true);
            sendStoredFile(resSent, {
                storageKey: storedPath,
                fileName: 'doc.pdf',
                disposition: 'inline',
            });
            const cbSent = resSent.sendFile.mock.calls[0][2] as (err?: Error) => void;
            cbSent(new Error('EPIPE'));
            expect(resSent.status).not.toHaveBeenCalled();
        });
    });
});
