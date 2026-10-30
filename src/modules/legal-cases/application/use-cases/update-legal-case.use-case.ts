import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UpdateLegalCaseDto } from '../dto/update-legal-case.dto.js';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { isDisputeResolutionDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class UpdateLegalCaseUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(idOrCode: string, dto: UpdateLegalCaseDto, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isDisputeDiv = isDisputeResolutionDivision(user.division);
            const canEdit =
                user.role === UserRole.ADMIN ||
                (isDisputeDiv && (user.role === UserRole.MAIN_USER || user.canEdit === true));
            if (!canEdit) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນຄະດີ');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existing = await this.caseRepo.findById(idOrCode);
        if (!existing) {
            throw new NotFoundException('ບໍ່ພົບຂໍ້ມູນຄະດີ');
        }

        if (dto.caseCode && dto.caseCode !== existing.caseCode) {
            const codeInUse = await this.caseRepo.findByCode(dto.caseCode, existing.internalId);
            if (codeInUse) {
                throw new BadRequestException(`ລະຫັດຄະດີ '${dto.caseCode}' ມີໃນລະບົບແລ້ວ`);
            }
        }

        if (dto.departmentId) {
            const departmentExists = await this.caseRepo.checkDepartmentExists(dto.departmentId);
            if (!departmentExists) {
                throw new BadRequestException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ລະບຸ');
            }
        }

        const updateData: any = { ...dto };

        if (dto.date) {
            updateData.date = new Date(dto.date);
        }

        // Recalculate totalDue if damage or fine is updated and totalDue is not explicitly provided
        const damageLak = dto.damageLak !== undefined ? dto.damageLak : Number(existing.damageLak);
        const fineLak = dto.fineLak !== undefined ? dto.fineLak : Number(existing.fineLak);
        if (dto.totalDueLak === undefined && (dto.damageLak !== undefined || dto.fineLak !== undefined)) {
            updateData.totalDueLak = Number(damageLak) + Number(fineLak);
        }

        const damageUsd = dto.damageUsd !== undefined ? dto.damageUsd : Number(existing.damageUsd);
        const fineUsd = dto.fineUsd !== undefined ? dto.fineUsd : Number(existing.fineUsd);
        if (dto.totalDueUsd === undefined && (dto.damageUsd !== undefined || dto.fineUsd !== undefined)) {
            updateData.totalDueUsd = Number(damageUsd) + Number(fineUsd);
        }

        const updated = await this.caseRepo.updateWithAudit(existing.internalId, updateData, userId);

        return {
            message: 'ແກ້ໄຂຂໍ້ມູນຄະດີສຳເລັດ',
            data: updated,
        };
    }
}
