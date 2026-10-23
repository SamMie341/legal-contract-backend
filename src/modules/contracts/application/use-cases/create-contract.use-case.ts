import { Injectable, Inject, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateContractDto } from '../dto/create-contract.dto.js';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';
import { ContractStatus, UserRole } from '@prisma/client';

@Injectable()
export class CreateContractUseCase {
    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    async execute(dto: CreateContractDto, user: any) {
        // 0. ตรวจสอบสิทธิ์การสร้าง/อัปโหลดสัญญา (Admin, Main User หรือผู้มีสิทธิ์ canUpload)
        const isObjectUser = typeof user === 'object' && user !== null;
        if (isObjectUser) {
            const canUpload =
                user.role === UserRole.ADMIN ||
                user.role === UserRole.MAIN_USER ||
                user.canUpload === true;
            if (!canUpload) {
                throw new ForbiddenException('ທ່ານບໍ່ມີສິດສ້າງ ຫຼື ອັບໂຫຼດສັນຍາ (Permission Denied: canUpload required)');
            }
        }
        const userId = isObjectUser ? user.userId : user;

        // 1. ตรวจสอบประเภทสัญญา
        const contractType = await this.contractRepository.findContractTypeById(dto.contractTypeId);

        if (!contractType) {
            throw new BadRequestException('ບໍ່ພົບປະເພດສັນຍາທີ່ເລືອກ (Invalid Contract Type)');
        }

        // 2. Business Logic: คำนวณสถานะเริ่มต้น
        let initialStatus: ContractStatus = ContractStatus.ACTIVE;
        const now = new Date();

        if (dto.effectiveDate && new Date(dto.effectiveDate) > now) {
            initialStatus = ContractStatus.DRAFT;
        } else if (dto.expirationDate) {
            const expireDate = new Date(dto.expirationDate);
            const daysToExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysToExpiry <= 0) {
                initialStatus = ContractStatus.EXPIRED;
            } else if (daysToExpiry <= (dto.notifyDaysBefore || 60)) {
                initialStatus = ContractStatus.EXPIRING_SOON;
            }
        }

        // 3. สั่งให้ Repository บันทึกข้อมูลพร้อมสร้าง Audit Log
        const newContract = await this.contractRepository.createContractWithAudit(dto, initialStatus, userId);

        return {
            message: 'ບັນທຶກຂໍ້ມູນສັນຍາສຳເລັດ',
            data: newContract,
        };
    }
}
