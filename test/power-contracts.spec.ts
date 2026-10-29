import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContractStatus, PowerContractType, UserRole } from '@prisma/client';
import { CreatePowerContractUseCase } from '../src/modules/power-contracts/application/use-cases/create-power-contract.use-case.js';
import { GetPowerProjectTypesUseCase } from '../src/modules/power-contracts/application/use-cases/get-power-project-types.use-case.js';
import { formatPowerContractAuditLog } from '../src/modules/power-contracts/application/helpers/power-contract-history-formatter.helper.js';
import { ForbiddenException } from '@nestjs/common';
import { Division } from '../src/core/constants/division.constant.js';

describe('Power Contracts Module Tests (ໂມດູນສັນຍາຊື້-ຂາຍໄຟຟ້າ)', () => {
    describe('GetPowerProjectTypesUseCase', () => {
        it('should return all 5 required project types for Power Purchase Agreements', () => {
            const useCase = new GetPowerProjectTypesUseCase();
            const result = useCase.execute();

            expect(result.data).toBeDefined();
            expect(result.data.length).toBeGreaterThanOrEqual(5);

            const ids = result.data.map((item) => item.id);
            expect(ids).toContain('HYDRO');
            expect(ids).toContain('SOLAR');
            expect(ids).toContain('WIND');
            expect(ids).toContain('THERMAL');
            expect(ids).toContain('BIOMASS');
        });
    });

    describe('CreatePowerContractUseCase', () => {
        let repoMock: any;
        let useCase: CreatePowerContractUseCase;

        beforeEach(() => {
            repoMock = {
                createContractWithAudit: vi.fn().mockImplementation((dto, status, userId) => ({
                    id: 'test-power-contract-uuid',
                    ...dto,
                    status,
                    createdById: userId,
                })),
            };
            useCase = new CreatePowerContractUseCase(repoMock);
        });

        it('should calculate initial status as ACTIVE when effectiveDate is in the past', async () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 20);

            const dto = {
                contractType: PowerContractType.PURCHASE,
                projectName: 'ໂຄງການເຂື່ອນນ້ຳອູ 1',
                projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
                effectiveDate: pastDate,
                expirationDate: futureDate,
                installedCapacity: '50 MW',
                capacityValue: 50,
            };

            const user = { userId: 'user-uuid', role: UserRole.MAIN_USER, division: Division.POWER_CONTRACTS };
            const result = await useCase.execute(dto as any, user);

            expect(result.data.status).toBe(ContractStatus.ACTIVE);
            expect(repoMock.createContractWithAudit).toHaveBeenCalledWith(
                dto,
                ContractStatus.ACTIVE,
                'user-uuid',
            );
        });

        it('should calculate initial status as DRAFT when effectiveDate is in the future', async () => {
            const futureEffectiveDate = new Date();
            futureEffectiveDate.setDate(futureEffectiveDate.getDate() + 30);

            const dto = {
                contractType: PowerContractType.PURCHASE,
                projectName: 'ໂຄງການໂຊລາຟາມ ໄຊທານີ',
                projectTypeOrCustomer: 'ພະລັງງານແສງຕາເວັນ',
                effectiveDate: futureEffectiveDate,
                installedCapacity: '10 MW',
            };

            const user = { userId: 'user-uuid', role: UserRole.ADMIN, division: 'IT' };
            const result = await useCase.execute(dto as any, user);

            expect(result.data.status).toBe(ContractStatus.DRAFT);
        });

        it('should calculate initial status as EXPIRING_SOON when expiration is <= 60 days', async () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            const expiringDate = new Date();
            expiringDate.setDate(expiringDate.getDate() + 30); // 30 days remaining

            const dto = {
                contractType: PowerContractType.SALE,
                projectName: 'ສັນຍາຂາຍໄຟຟ້າໃຫ້ໂຮງງານຊີມັງ',
                projectTypeOrCustomer: 'ບໍລິສັດ ຊີມັງລາວ ຈຳກັດ',
                effectiveDate: pastDate,
                expirationDate: expiringDate,
                notifyDaysBefore: 60,
            };

            const user = { userId: 'user-uuid', role: UserRole.ADMIN };
            const result = await useCase.execute(dto as any, user);

            expect(result.data.status).toBe(ContractStatus.EXPIRING_SOON);
        });

        it('should throw ForbiddenException if user belongs to another division without canUpload', async () => {
            const dto = {
                contractType: PowerContractType.PURCHASE,
                projectName: 'ໂຄງການເຂື່ອນໄຟຟ້າ',
                projectTypeOrCustomer: 'ໄຟຟ້ານໍ້າຕົກ',
            };

            const otherUser = {
                userId: 'user-other',
                role: UserRole.EDITOR,
                division: Division.GENERAL_CONTRACT,
                canUpload: false,
            };

            await expect(useCase.execute(dto as any, otherUser)).rejects.toThrow(ForbiddenException);
        });
    });

    describe('formatPowerContractAuditLog', () => {
        it('should format UPDATE_POWER_CONTRACT audit logs with changes and labels in Lao', () => {
            const log = {
                id: 'log-uuid',
                action: 'UPDATE_POWER_CONTRACT',
                oldValues: {
                    projectName: 'ໂຄງການເກົ່າ',
                    installedCapacity: '20 MW',
                },
                newValues: {
                    projectName: 'ໂຄງການໃໝ່',
                    installedCapacity: '50 MW',
                },
                user: {
                    id: 'user-uuid',
                    fullName: 'ສົມສັກ ສີສຸກ',
                    employeeCode: 'EDL-001',
                },
                createdAt: new Date(),
            };

            const formatted = formatPowerContractAuditLog(log);

            expect(formatted.actionLabelLo).toBe('ແກ້ໄຂຂໍ້ມູນສັນຍາຊື້-ຂາຍໄຟ');
            expect(formatted.changes.length).toBe(2);

            const projectChange = formatted.changes.find((c) => c.field === 'projectName');
            expect(projectChange).toBeDefined();
            expect(projectChange?.fieldNameLo).toBe('ຊື່ໂຄງການ');
            expect(projectChange?.oldValue).toBe('ໂຄງການເກົ່າ');
            expect(projectChange?.newValue).toBe('ໂຄງການໃໝ່');
        });
    });
});

