import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatContractAuditLog } from '../src/modules/contracts/application/helpers/contract-history-formatter.helper.js';
import { GetContractHistoryUseCase } from '../src/modules/contracts/application/use-cases/get-contract-history.use-case.js';
import { UpdateContractUseCase } from '../src/modules/contracts/application/use-cases/update-contract.use-case.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('Contract History Formatter Helper', () => {
    it('should correctly format UPDATE_CONTRACT and detect changed fields', () => {
        const log = {
            id: 'log-1',
            action: 'UPDATE_CONTRACT',
            oldValues: {
                title: 'ສັນຍາເກົ່າ',
                contractValue: 1000000,
                status: 'ACTIVE',
                contractType: { id: 1, nameLo: 'ປະເພດ A' },
                updatedAt: '2026-01-01',
            },
            newValues: {
                title: 'ສັນຍາໃໝ່',
                contractValue: 2500000,
                status: 'ACTIVE', // same value
                contractType: { id: 2, nameLo: 'ປະເພດ B' },
                updatedAt: '2026-01-02', // ignored field
            },
            user: {
                id: 'user-1',
                fullName: 'สมชาย สุขใจ',
                employeeCode: 'EMP001',
                department: 'ฝ่ายไอที',
                role: 'ADMIN',
            },
            ipAddress: '127.0.0.1',
            createdAt: new Date('2026-01-02T10:00:00Z'),
        };

        const result = formatContractAuditLog(log);

        expect(result.id).toBe('log-1');
        expect(result.action).toBe('UPDATE_CONTRACT');
        expect(result.actionLabelLo).toBe('ແກ້ໄຂຂໍ້ມູນສັນຍາ');
        expect(result.user?.fullName).toBe('สมชาย สุขใจ');

        // Should ignore updatedAt, and ignore status because it did not change
        const changedFields = result.changes.map((c) => c.field);
        expect(changedFields).toContain('title');
        expect(changedFields).toContain('contractValue');
        expect(changedFields).toContain('contractType');
        expect(changedFields).not.toContain('status');
        expect(changedFields).not.toContain('updatedAt');

        const titleChange = result.changes.find((c) => c.field === 'title');
        expect(titleChange?.fieldNameLo).toBe('ຊື່ສັນຍາ');
        expect(titleChange?.oldValue).toBe('ສັນຍາເກົ່າ');
        expect(titleChange?.newValue).toBe('ສັນຍາໃໝ່');

        const typeChange = result.changes.find((c) => c.field === 'contractType');
        expect(typeChange?.fieldNameLo).toBe('ປະເພດສັນຍາ');
        expect(typeChange?.oldValue).toBe('ປະເພດ A');
        expect(typeChange?.newValue).toBe('ປະເພດ B');
    });

    it('should correctly format UPLOAD_ATTACHMENT', () => {
        const log = {
            id: 'log-2',
            action: 'UPLOAD_ATTACHMENT',
            newValues: { fileName: 'contract.pdf' },
            createdAt: new Date(),
        };

        const result = formatContractAuditLog(log);
        expect(result.actionLabelLo).toBe('ອັບໂຫລດໄຟລ໌ແນບ');
        expect(result.changes).toHaveLength(1);
        expect(result.changes[0].field).toBe('fileName');
        expect(result.changes[0].newValue).toBe('contract.pdf');
    });
});

describe('GetContractHistoryUseCase', () => {
    let mockRepo: any;
    let useCase: GetContractHistoryUseCase;

    beforeEach(() => {
        mockRepo = {
            findById: vi.fn(),
            getContractHistory: vi.fn(),
        };
        useCase = new GetContractHistoryUseCase(mockRepo);
    });

    it('should throw ForbiddenException if user has no view permission', async () => {
        const user = { role: UserRole.VIEWER, canView: false };
        await expect(useCase.execute('contract-id', {}, user)).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if contract does not exist', async () => {
        mockRepo.findById.mockResolvedValue(null);
        const user = { role: UserRole.ADMIN };
        await expect(useCase.execute('non-existent-id', {}, user)).rejects.toThrow(NotFoundException);
    });

    it('should return paginated and formatted history when contract exists', async () => {
        mockRepo.findById.mockResolvedValue({
            id: 'contract-123',
            title: 'ສັນຍາທົດສອບ',
            contractNumber: 'CNT-001',
            status: 'ACTIVE',
        });

        mockRepo.getContractHistory.mockResolvedValue({
            data: [
                {
                    id: 'log-1',
                    action: 'UPDATE_CONTRACT',
                    oldValues: { title: 'Old Title' },
                    newValues: { title: 'New Title' },
                    user: { id: 'u1', fullName: 'Tester', employeeCode: '001', department: 'IT', role: 'ADMIN' },
                    createdAt: new Date(),
                },
            ],
            total: 1,
        });

        const user = { role: UserRole.ADMIN };
        const result = await useCase.execute('contract-123', { page: 1, limit: 10 }, user);

        expect(result.message).toBe('ດຶງປະຫວັດການແກ້ໄຂສັນຍາສຳເລັດ');
        expect(result.contract.id).toBe('contract-123');
        expect(result.meta.total).toBe(1);
        expect(result.meta.page).toBe(1);
        expect(result.data).toHaveLength(1);
        expect(result.data[0].changes[0].field).toBe('title');
        expect(result.data[0].changes[0].oldValue).toBe('Old Title');
        expect(result.data[0].changes[0].newValue).toBe('New Title');
    });
});

describe('UpdateContractUseCase', () => {
    let mockRepo: any;
    let useCase: UpdateContractUseCase;

    beforeEach(() => {
        mockRepo = {
            findContractTypeById: vi.fn(),
            updateContractWithAudit: vi.fn(),
        };
        useCase = new UpdateContractUseCase(mockRepo);
    });

    it('should throw ForbiddenException if user lacks edit permission', async () => {
        const user = { role: UserRole.VIEWER, canEdit: false };
        await expect(useCase.execute('contract-id', { title: 'New' }, user)).rejects.toThrow(ForbiddenException);
    });

    it('should update contract when user has canEdit permission', async () => {
        const user = { userId: 'u1', role: UserRole.VIEWER, canEdit: true };
        mockRepo.updateContractWithAudit.mockResolvedValue({ id: 'c1', title: 'New' });

        const result = await useCase.execute('c1', { title: 'New' }, user);
        expect(result.message).toBe('ແກ້ໄຂຂໍ້ມູນສັນຍາສຳເລັດ');
        expect(mockRepo.updateContractWithAudit).toHaveBeenCalledWith('c1', { title: 'New' }, 'u1');
    });
});
