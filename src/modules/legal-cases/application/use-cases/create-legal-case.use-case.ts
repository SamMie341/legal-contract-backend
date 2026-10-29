import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CreateLegalCaseDto } from '../dto/create-legal-case.dto.js';
import * as repoInterface from '../../domain/repositories/legal-case.repository.interface.js';
import { isDisputeResolutionDivision } from '../../../../core/utils/division-helper.util.js';

@Injectable()
export class CreateLegalCaseUseCase {
    constructor(
        @Inject(repoInterface.LEGAL_CASE_REPOSITORY)
        private readonly caseRepo: repoInterface.ILegalCaseRepository,
    ) { }

    async execute(dto: CreateLegalCaseDto, user: any) {
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const isDisputeDiv = isDisputeResolutionDivision(user.division);
            const canUpload =
                user.role === UserRole.ADMIN ||
                (isDisputeDiv && (user.role === UserRole.MAIN_USER || user.canUpload === true));
            if (!canUpload) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດສ້າງບັນທຶກຄະດີ (ອະນຸຍາດສະເພາະ ພະແນກແກ້ໄຂຂໍ້ຂັດແຍ່ງ ແລະ ດຳເນີນຄະດີ)');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        const existingCode = await this.caseRepo.findByCode(dto.caseCode);
        if (existingCode) {
            throw new BadRequestException(`ລະຫັດຄະດີ '${dto.caseCode}' ມີໃນລະບົບແລ້ວ (Case code already exists)`);
        }

        if (dto.departmentId) {
            const departmentExists = await this.caseRepo.checkDepartmentExists(dto.departmentId);
            if (!departmentExists) {
                throw new BadRequestException('ບໍ່ພົບຫ້ອງການ/ຝ່າຍທີ່ລະບຸ (Department not found)');
            }
        }

        const damageLak = dto.damageLak !== undefined ? dto.damageLak : 0;
        const damageUsd = dto.damageUsd !== undefined ? dto.damageUsd : 0;
        const fineLak = dto.fineLak !== undefined ? dto.fineLak : 0;
        const fineUsd = dto.fineUsd !== undefined ? dto.fineUsd : 0;

        const totalDueLak = dto.totalDueLak !== undefined
            ? dto.totalDueLak
            : (Number(damageLak) + Number(fineLak));

        const totalDueUsd = dto.totalDueUsd !== undefined
            ? dto.totalDueUsd
            : (Number(damageUsd) + Number(fineUsd));

        const caseData = {
            ...dto,
            damageLak,
            damageUsd,
            fineLak,
            fineUsd,
            totalDueLak,
            totalDueUsd,
            date: new Date(dto.date),
        };

        const newCase = await this.caseRepo.createWithAudit(caseData, userId);

        return {
            message: 'ສ້າງຂໍ້ມູນຄະດີໃໝ່ສຳເລັດ',
            data: newCase,
        };
    }
}
