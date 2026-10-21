import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as contractRepositoryInterface from '../../domain/repositories/contract.repository.interface.js';

@Injectable()
export class ContractExpiryCronService {
    private readonly logger = new Logger(ContractExpiryCronService.name);

    constructor(
        @Inject(contractRepositoryInterface.CONTRACT_REPOSITORY)
        private readonly contractRepository: contractRepositoryInterface.IContractRepository,
    ) { }

    // ຕັ້ງເວລາໃຫ້ລັນທຸກໆມື້ ເວລາ 00:05 ໂມງ
    @Cron('5 0 * * *')
    async checkExpiringContracts() {
        this.logger.log('ເລີ່ມຕົ້ນກວດສອບສັນຍາໃກ້ໝົດອາຍຸ... (Checking expiring contracts...)');

        try {
            const NOTIFY_DAYS = 60; // ແຈ້ງເຕືອນລ່ວງໜ້າ 60 ວັນ (ຕາມຂໍ້ກຳນົດໃນ Excel)
            const expiringContracts = await this.contractRepository.findContractsExpiringSoon(NOTIFY_DAYS);

            if (expiringContracts.length > 0) {
                this.logger.log(`ພົບສັນຍາໃກ້ໝົດອາຍຸ ${expiringContracts.length} ສະບັບ.`);

                for (const contract of expiringContracts) {
                    const today = new Date();
                    const expireDate = new Date(contract.expirationDate!);
                    const daysDiff = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    await this.contractRepository.markContractAsExpiringAndNotify(contract.id, daysDiff);
                    this.logger.log(`ສ້າງແຈ້ງເຕືອນສຳລັບສັນຍາ ID: ${contract.id} ສຳເລັດ.`);
                }
            } else {
                this.logger.log('ບໍ່ພົບສັນຍາທີ່ໃກ້ໝົດອາຍຸໃນມື້ນີ້.');
            }
        } catch (error: any) {
            this.logger.error('ເກີດຂໍ້ຜິດພາດໃນການກວດສອບສັນຍາ: ', error.stack);
        }
    }
}
