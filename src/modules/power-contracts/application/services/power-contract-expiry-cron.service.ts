import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as powerContractRepositoryInterface from '../../domain/repositories/power-contract.repository.interface.js';

@Injectable()
export class PowerContractExpiryCronService {
    private readonly logger = new Logger(PowerContractExpiryCronService.name);

    constructor(
        @Inject(powerContractRepositoryInterface.POWER_CONTRACT_REPOSITORY)
        private readonly powerContractRepository: powerContractRepositoryInterface.IPowerContractRepository,
    ) { }

    // ຕັ້ງເວລາໃຫ້ລັນທຸກໆມື້ ເວລາ 00:08 ໂມງ
    @Cron('8 0 * * *')
    async checkExpiringContracts() {
        this.logger.log('ເລີ່ມຕົ້ນກວດສອບສັນຍາຊື້-ຂາຍໄຟຟ້າໃກ້ໝົດອາຍຸ... (Checking expiring power contracts...)');

        try {
            // 1. ກວດສອບສັນຍາທີ່ໝົດອາຍຸແລ້ວ (expirationDate < today) ເພື່ອປ່ຽນສະຖານະເປັນ EXPIRED
            const expiredContracts = await this.powerContractRepository.findExpiredActiveContracts();
            if (expiredContracts.length > 0) {
                this.logger.log(`ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າໝົດອາຍຸ ${expiredContracts.length} ສະບັບ.`);
                for (const contract of expiredContracts) {
                    await this.powerContractRepository.markContractAsExpiredAndNotify(contract.id);
                    this.logger.log(`ປັບສະຖານະ EXPIRED ສຳລັບສັນຍາຊື້-ຂາຍໄຟຟ້າ ID: ${contract.id} ສຳເລັດ.`);
                }
            }

            // 2. ກວດສອບສັນຍາໃກ້ໝົດອາຍຸລ່ວງໜ້າ 60 ວັນ (ຕາມຂໍ້ກຳນົດ ຂໍ້ 1)
            const NOTIFY_DAYS = 60;
            const expiringContracts = await this.powerContractRepository.findContractsExpiringSoon(NOTIFY_DAYS);

            if (expiringContracts.length > 0) {
                this.logger.log(`ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າໃກ້ໝົດອາຍຸ ${expiringContracts.length} ສະບັບ.`);

                for (const contract of expiringContracts) {
                    const today = new Date();
                    const expireDate = new Date(contract.expirationDate!);
                    const daysDiff = Math.ceil((expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

                    await this.powerContractRepository.markContractAsExpiringAndNotify(contract.id, daysDiff);
                    this.logger.log(`ສ້າງແຈ້ງເຕືອນສຳລັບສັນຍາຊື້-ຂາຍໄຟຟ້າ ID: ${contract.id} (${daysDiff} ວັນ) ສຳເລັດ.`);
                }
            } else {
                this.logger.log('ບໍ່ພົບສັນຍາຊື້-ຂາຍໄຟຟ້າທີ່ໃກ້ໝົດອາຍຸໃນມື້ນີ້.');
            }
        } catch (error: any) {
            this.logger.error('ເກີດຂໍ້ຜິດພາດໃນການກວດສອບສັນຍາຊື້-ຂາຍໄຟຟ້າ: ', error.stack);
        }
    }
}

