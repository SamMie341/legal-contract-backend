import { Injectable } from '@nestjs/common';
import { POWER_PURCHASE_PROJECT_TYPES } from '../helpers/power-project-types.helper.js';

@Injectable()
export class GetPowerProjectTypesUseCase {
    execute() {
        return {
            message: 'ດຶງລາຍການ 5 ປະເພດໂຄງການສັນຍາຊື້ໄຟຟ້າສຳເລັດ',
            data: POWER_PURCHASE_PROJECT_TYPES,
        };
    }
}

