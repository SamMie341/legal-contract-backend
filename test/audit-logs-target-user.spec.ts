import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditAction, UserRole } from '@prisma/client';
import { AuditLogRepository } from '../src/modules/audit-logs/infrastructure/repositories/audit-log.repository.js';
import { GetAuditLogsUseCase } from '../src/modules/audit-logs/application/use-cases/get-audit-logs.use-case.js';

describe('Audit Logs Target User Tracking', () => {
    let auditLogRepo: AuditLogRepository;
    let getAuditLogsUseCase: GetAuditLogsUseCase;
    let mockPrisma: any;

    const mockAdminUser = {
        id: 'admin-uuid-1',
        fullName: 'ທ້າວ ຜູ້ດູແລລະບົບ',
        employeeCode: 'ADMIN-01',
        department: 'ຝ່າຍໄອທີ',
    };

    const mockTargetUser = {
        id: 'target-uuid-44404',
        fullName: 'ພົງພະສິດ ສຸກໃສ',
        employeeCode: '44404',
        username: '44404',
        department: 'ຝ່າຍກົດໝາຍ-ສັນຍາ',
        division: 'ພະແນກສັນຍາທົ່ວໄປ',
        role: UserRole.MAIN_USER,
    };

    beforeEach(() => {
        mockPrisma = {
            $transaction: vi.fn(),
            auditLog: {
                findMany: vi.fn(),
                count: vi.fn(),
                groupBy: vi.fn(),
            },
        };
        auditLogRepo = new AuditLogRepository(mockPrisma as any);
        getAuditLogsUseCase = new GetAuditLogsUseCase(auditLogRepo);
    });

    it('should include targetUser and format targetUser correctly when querying audit logs', async () => {
        const rawLog = {
            id: 'log-1',
            userId: mockAdminUser.id,
            targetUserId: mockTargetUser.id,
            action: AuditAction.USER_PERMISSION_CHANGE,
            oldValues: {
                targetUser: {
                    id: mockTargetUser.id,
                    employeeCode: '44404',
                    fullName: 'ພົງພະສິດ ສຸກໃສ',
                },
                permissions: { canUpload: false },
            },
            newValues: {
                targetUser: {
                    id: mockTargetUser.id,
                    employeeCode: '44404',
                    fullName: 'ພົງພະສິດ ສຸກໃສ',
                },
                changes: { canUpload: true },
            },
            user: mockAdminUser,
            targetUser: mockTargetUser,
            createdAt: new Date(),
        };

        mockPrisma.$transaction.mockResolvedValue([[rawLog], 1]);

        const result = await auditLogRepo.findAll({
            skip: 0,
            take: 10,
        });

        expect(result.total).toBe(1);
        expect(result.data[0].targetUser).toBeDefined();
        expect(result.data[0].targetUser.id).toBe(mockTargetUser.id);
        expect(result.data[0].targetUser.employeeCode).toBe('44404');
        expect(result.data[0].targetUser.fullName).toBe('ພົງພະສິດ ສຸກໃສ');
        expect(result.data[0].user.fullName).toBe('ທ້າວ ຜູ້ດູແລລະບົບ');
    });

    it('should fallback to targetUser in oldValues/newValues if targetUser relation is null (backward-compatibility)', async () => {
        const legacyLogWithoutRelation = {
            id: 'log-legacy',
            userId: mockAdminUser.id,
            targetUserId: null,
            action: AuditAction.USER_PERMISSION_CHANGE,
            oldValues: {
                targetUser: {
                    id: 'target-uuid-44404',
                    employeeCode: '44404',
                    fullName: 'ພົງພະສິດ ສຸກໃສ',
                    department: 'ຝ່າຍກົດໝາຍ-ສັນຍາ',
                },
            },
            newValues: {
                targetUser: {
                    id: 'target-uuid-44404',
                    employeeCode: '44404',
                    fullName: 'ພົງພະສິດ ສຸກໃສ',
                },
            },
            user: mockAdminUser,
            targetUser: null, // Legacy log before column migration
            createdAt: new Date(),
        };

        mockPrisma.$transaction.mockResolvedValue([[legacyLogWithoutRelation], 1]);

        const result = await auditLogRepo.findAll({
            skip: 0,
            take: 10,
        });

        expect(result.data[0].targetUser).toBeDefined();
        expect(result.data[0].targetUser.employeeCode).toBe('44404');
        expect(result.data[0].targetUser.fullName).toBe('ພົງພະສິດ ສຸກໃສ');
    });

    it('should filter by targetUserId when passed in query', async () => {
        let capturedWhere: any = null;
        mockPrisma.$transaction.mockImplementation(([findManyPromise, countPromise]) => {
            return Promise.resolve([[], 0]);
        });
        mockPrisma.auditLog.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await auditLogRepo.findAll({
            skip: 0,
            take: 10,
            targetUserId: 'target-uuid-44404',
        });

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.targetUserId).toBe('target-uuid-44404');
    });

    it('should search across targetUser fields (fullName, employeeCode, username, department, division)', async () => {
        let capturedWhere: any = null;
        mockPrisma.$transaction.mockImplementation(([findManyPromise, countPromise]) => {
            return Promise.resolve([[], 0]);
        });
        mockPrisma.auditLog.findMany.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve([]);
        });

        await auditLogRepo.findAll({
            skip: 0,
            take: 10,
            search: '44404',
        });

        expect(capturedWhere).toBeDefined();
        expect(capturedWhere.OR).toBeDefined();
        const orClauses = JSON.stringify(capturedWhere.OR);
        expect(orClauses).toContain('targetUser');
        expect(orClauses).toContain('44404');
    });

    it('GetAuditLogsUseCase should pass targetUserId and return formatted response with targetUser', async () => {
        const rawLog = {
            id: 'log-2',
            userId: mockAdminUser.id,
            targetUserId: mockTargetUser.id,
            action: AuditAction.USER_PERMISSION_CHANGE,
            user: mockAdminUser,
            targetUser: mockTargetUser,
            createdAt: new Date(),
        };

        mockPrisma.$transaction.mockResolvedValue([[rawLog], 1]);

        const result = await getAuditLogsUseCase.execute({
            page: 1,
            limit: 20,
            targetUserId: 'target-uuid-44404',
        });

        expect(result.meta.total).toBe(1);
        expect(result.data[0].targetUser.employeeCode).toBe('44404');
        expect(result.data[0].targetUser.fullName).toBe('ພົງພະສິດ ສຸກໃສ');
    });
});
